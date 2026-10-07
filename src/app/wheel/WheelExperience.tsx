"use client";

// The live wheel. The server decides every outcome (POST /api/wheel/spin) before anything
// moves; this component only animates to the slice it is told.
//
// Motion (owner's brief, 26 Sep): Higgsfield-style chrome wheel with bulbs, pull lever or SPIN
// hub, wind-up → fast spin with motion blur and peg clacks → tense crawl → small bounce,
// then a gift-box reveal per outcome with confetti on wins. The spin is a pure function of
// time (src/lib/wheel/motion.ts). With a mouse, movement tilts the machine, moves the spotlight
// and the floating props. Reduced motion: no tilt, blur, confetti or bounce; results show at once.
//
// Performance (phones especially): everything that moves per frame is a transform or an opacity
// on its own layer. No filters are recomputed while the wheel turns, and the wheel and the result
// card share one grid cell, so swapping them never re-lays out or squashes the text.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowDown, Volume2, VolumeX } from "lucide-react";
import { outcomes, segments, wheelConfig } from "@/data/wheel";
import { segmentAngle } from "@/lib/wheel/geometry";
import { detectContact } from "@/lib/wheel/contact";
import { spinPlan, blurFor, pointerKick, sliceUnder } from "@/lib/wheel/motion";
import { WheelDisc, WheelLabels, WheelPointer, WheelRim, WheelShade, WheelStand } from "./WheelArt";
import Lever from "./Lever";
import Reveal from "./Reveal";
import EntrySheet, { type Details } from "./EntrySheet";
import { play, setSound, soundPreference } from "./sfx";
import { savePrizeImage, sendToWhatsApp, type PrizeCard } from "./share";

const MORPH_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const; // ζ ≈ 0.93
const MAX_BLUR = 3.2; // blurFor()'s ceiling
const CARD_POP = { type: "spring", stiffness: 320, damping: 22 } as const; // ζ ≈ 0.61: a lively pop
const PRESS_SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;
const SLICE = 360 / segments.length;
const STORAGE_KEY = "coco-wheel-details";
const BRAND_CONFETTI = ["#ffdf77", "#f5b48a", "#3f6fe0", "#ffffff", "#eee7db"];

type SpinResponse =
  | { ok: true; spinType: "free" | "bonus" | "respin"; outcome: string; segment: number; landing: number; firstName: string;
      prize?: { code: string; label: string; claim?: string; expiresAt: string }; respinToken?: string;
      bonusStillAvailable?: boolean; nextFreeSpinAt: string; at?: string; demo?: boolean }
  | { ok: false; error: string; nextFreeSpinAt?: string; demo?: boolean };

type Phase = "idle" | "loading" | "spinning" | "respin" | "result";
type Bulbs = "intro" | "idle" | "chase" | "win" | "dim";
type Saved = Extract<SpinResponse, { ok: true }> & { redeemed?: boolean };
type Status = { available: boolean; demo?: boolean; freeSpinUsed?: boolean; nextFreeSpinAt?: string; lastResult?: Saved | null };
type Card =
  | { kind: "win"; outcome: string; firstName: string; prize: NonNullable<Extract<SpinResponse, { ok: true }>["prize"]>; next: string; bonusStillAvailable?: boolean; fresh: boolean }
  | { kind: "lose"; firstName: string; next: string; bonusStillAvailable?: boolean; fresh: boolean }
  | { kind: "blocked"; reason: "already-spun" | "device-used"; next: string };

type Confetti = (opts: Record<string, unknown>) => void;

const tz = { timeZone: wheelConfig.timeZone } as const;
const dayText = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { ...tz, weekday: "long", day: "numeric", month: "long" });
const expiryText = (iso: string) =>
  `${new Date(iso).toLocaleDateString("en-GB", { ...tz, weekday: "short", day: "numeric", month: "short" })}, ${new Date(iso).toLocaleTimeString("en-GB", { ...tz, hour: "2-digit", minute: "2-digit" })}`;

const ERRORS: Record<string, string> = {
  "invalid-name": "Please add your first name.",
  "invalid-contact": "Please check your email address or UK mobile number.",
  "bonus-invalid": "That bonus code doesn’t look right, or it has expired. Please check it and try again.",
  "bonus-used": "That bonus code has already been used.",
  "respin-invalid": "That extra spin has already been used.",
  "rate-limited": "That’s a lot of spins in a minute. Please wait a moment and try again.",
  unavailable: "The Coco Wheel isn’t open just now. Please try again later.",
  "coming-soon": "The Coco Wheel is coming soon. Follow us to hear when it opens.",
};
// Problems with what was typed in the pop-up reopen it; anything else shows beside the wheel.
const SHEET_ERRORS = new Set(["invalid-name", "invalid-contact", "bonus-invalid", "bonus-used"]);
const looksLikeBonus = (v: string) => /^(bonus)?[\s-]*[2-9a-hjkmnp-z]{6}$/i.test(v.trim().replace(/[\s-]/g, ""));

// Not open yet: the wheel shows behind a see-through "Coming soon" layer and can't be spun.
const SOON = wheelConfig.comingSoon;

export default function WheelExperience() {
  // The server can't know the visitor's motion setting, so apply it only after hydration.
  const prefersReduced = Boolean(useReducedMotion());
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const reduce = hydrated && prefersReduced;
  // Tilt, parallax and motion blur only with a mouse: on touch screens they cost frames and
  // nobody hovers anyway.
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setFine(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  const rich = fine && !reduce;
  const [phase, setPhase] = useState<Phase>("idle");
  const [card, setCard] = useState<Card | null>(null);
  const [bulbs, setBulbs] = useState<Bulbs>("intro"); // bulbs light up in turn on arrival (CSS)
  const [highlight, setHighlight] = useState<number | null>(null);
  const [landed, setLanded] = useState<{ text: string; win: boolean } | null>(null);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [details, setDetails] = useState<Details>({ firstName: "", contact: "", marketingOptIn: false });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bonusCode, setBonusCode] = useState("");
  const [bonusOpen, setBonusOpen] = useState(false);
  const [sound, setSoundState] = useState(false);
  const respinToken = useRef<string | null>(null);
  const lastSavedAt = useRef<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const wheelEl = useRef<HTMLDivElement>(null);
  const backCanvas = useRef<HTMLCanvasElement>(null);
  const frontCanvas = useRef<HTMLCanvasElement>(null);
  const confetti = useRef<{ back?: Confetti; front?: Confetti }>({});

  // Wheel motion values (written every frame while spinning).
  const rotation = useMotionValue(-SLICE / 2);
  const pointer = useMotionValue(0);
  const blurPx = useMotionValue(0);
  // Motion blur as a cross-fade between sharp labels and a copy blurred once (see WheelLabels).
  const blurMix = useTransform(blurPx, v => Math.min(1, v / MAX_BLUR));
  const sharpOpacity = useTransform(blurMix, k => 1 - 0.8 * k);

  // Mouse-reactive tilt, spotlight and parallax (springs so it feels weighty, not twitchy).
  const mx = useSpring(0, { stiffness: 90, damping: 16 });
  const my = useSpring(0, { stiffness: 90, damping: 16 });
  const tiltX = useTransform(my, v => v * -7);
  const tiltY = useTransform(mx, v => v * 9);
  // The spotlight glow moves by transform (18% / 14% of the stage), not by repainting a gradient.
  const spotX = useTransform(mx, v => `${v * 28.6}%`);
  const spotY = useTransform(my, v => `${v * 25}%`);
  const near = useTransform(mx, v => v * 14);
  const nearY = useTransform(my, v => v * 10);
  const far = useTransform(mx, v => v * -8);
  const farY = useTransform(my, v => v * -6);

  const reveal = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    if (box && (box.top < 70 || box.bottom > window.innerHeight)) stage.current!.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) setDetails(d => ({ ...d, firstName: saved.firstName ?? "", contact: saved.contact ?? "" }));
    } catch { /* storage blocked */ }
    setSoundState(soundPreference()); // shown as on; audio itself starts on the next tap
    const settle = setTimeout(() => setBulbs(b => (b === "intro" ? "idle" : b)), 1900);
    if (SOON) { setStatus({ available: false }); return () => clearTimeout(settle); }
    // Sets the device cookie, and brings back a prize or re-spin from an earlier visit
    // (or from a spin whose response never arrived).
    fetch("/api/wheel/status", { cache: "no-store" }).then(r => r.json()).then((s: Status) => {
      setStatus(s);
      const last = s.lastResult;
      lastSavedAt.current = last?.at ?? null;
      if (last?.prize && !last.redeemed && Date.parse(last.prize.expiresAt) > Date.now()) {
        setCard({ kind: "win", outcome: last.outcome, firstName: last.firstName, prize: last.prize, next: last.nextFreeSpinAt, fresh: false });
        setPhase("result");
      } else if (last?.respinToken) {
        respinToken.current = last.respinToken;
        setPhase("respin");
      }
    }).catch(() => setStatus({ available: true }));
    return () => clearTimeout(settle);
  }, []);

  // Confetti on two canvases: one behind the wheel, one in front of the result card.
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: c }) => {
      if (cancelled) return;
      if (backCanvas.current) confetti.current.back = c.create(backCanvas.current, { resize: true, useWorker: true }) as unknown as Confetti;
      if (frontCanvas.current) confetti.current.front = c.create(frontCanvas.current, { resize: true, useWorker: true }) as unknown as Confetti;
    });
    return () => { cancelled = true; };
  }, [reduce]);

  const burst = useCallback((where: "back" | "front", big = false) => {
    const fire = confetti.current[where];
    if (!fire || reduce) return;
    const base = { colors: BRAND_CONFETTI, ticks: 260, gravity: 0.9, scalar: 0.95, disableForReducedMotion: true };
    if (where === "back") {
      fire({ ...base, particleCount: 140, spread: 360, startVelocity: 34, origin: { x: 0.5, y: 0.45 } });
    } else {
      fire({ ...base, particleCount: big ? 90 : 50, angle: 60, spread: 55, startVelocity: 48, origin: { x: 0, y: 0.75 } });
      fire({ ...base, particleCount: big ? 90 : 50, angle: 120, spread: 55, startVelocity: 48, origin: { x: 1, y: 0.75 } });
      fire({ ...base, particleCount: 40, spread: 100, startVelocity: 30, shapes: ["star"], scalar: 1.2, origin: { x: 0.5, y: 0.3 } });
    }
  }, [reduce]);

  const onRevealOpen = useCallback(() => {
    play("pop");
    burst("front", true);
  }, [burst]);

  // The wheel and the result card share one grid cell; the stack's height eases between them.
  const stackH = useMotionValue(0);
  const [stackMeasured, setStackMeasured] = useState(false);
  useLayoutEffect(() => {
    const el = stack.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (first || reduce) { stackH.set(h); first = false; setStackMeasured(true); }
      else animate(stackH, h, MORPH_SPRING);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduce, stackH]);

  function track(e: ReactPointerEvent) {
    // Not while a button is held (pulling the lever): the machine stays still under your hand.
    if (!rich || e.pointerType !== "mouse" || e.buttons !== 0 || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    mx.set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)));
    my.set(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)));
  }
  function untrack() { mx.set(0); my.set(0); }

  /** Plays the choreographed spin (motion.ts) from the current angle to `to`. */
  function runSpin(to: number, onLand: () => void) {
    const from = rotation.get();
    const plan = spinPlan(from, to);
    return new Promise<void>(resolve => {
      const t0 = performance.now();
      let prevA = from, prevT = 0, slice = sliceUnder(from), clackAt = -1, landed = false;
      const frame = (now: number) => {
        const t = (now - t0) / 1000;
        const a = plan.at(t);
        rotation.set(a);
        const speed = (a - prevA) / Math.max(1 / 240, t - prevT);
        prevA = a; prevT = t;
        blurPx.set(blurFor(speed));
        const under = sliceUnder(a);
        if (under !== slice) { slice = under; clackAt = t; play("clack", Math.min(1, 0.35 + Math.abs(speed) / 1600)); }
        pointer.set(clackAt >= 0 ? pointerKick(t - clackAt) : 0);
        if (!landed && t >= plan.landsAt) { landed = true; onLand(); }
        if (t < plan.duration) requestAnimationFrame(frame);
        else { blurPx.set(0); pointer.set(0); resolve(); }
      };
      requestAnimationFrame(frame);
    });
  }

  /** After a network error: if the server did spin, its result is waiting in the status call. */
  async function recover(): Promise<SpinResponse> {
    try {
      const s: Status = await (await fetch("/api/wheel/status", { cache: "no-store" })).json();
      if (s.lastResult && s.lastResult.at !== lastSavedAt.current) return s.lastResult;
    } catch { /* still offline */ }
    return { ok: false, error: "network" };
  }

  const idle = phase === "idle" || phase === "respin";
  const busy = phase === "loading" || phase === "spinning";
  const bonusReady = looksLikeBonus(bonusCode);

  async function submit() {
    if (busy) return;
    setError("");
    setSheetOpen(false);
    if (sound) setSound(true); // resume audio inside the tap
    const isRespin = phase === "respin" && respinToken.current;
    const contact = detectContact(details.contact);
    const body = isRespin ? { respinToken: respinToken.current } : {
      firstName: details.firstName.trim(), contactType: contact.kind ?? "email", contact: contact.value ?? details.contact,
      marketingOptIn: details.marketingOptIn, bonusCode: bonusCode.trim() || undefined,
    };
    if (!isRespin) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstName: details.firstName.trim(), contact: contact.display ?? details.contact })); } catch { /* ignore */ }
    }
    setPhase("loading");
    setHighlight(null);
    setLanded(null);
    reveal();
    const slowTimer = setTimeout(() => setSlow(true), 3000);
    let data: SpinResponse;
    try {
      const res = await fetch("/api/wheel/spin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      data = await res.json();
    } catch {
      data = await recover();
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
    }
    // Keep a re-spin token through retryable errors; drop it once used or refused as used.
    if (isRespin && (data.ok || data.error === "respin-invalid")) respinToken.current = null;
    if (data.ok) lastSavedAt.current = data.at ?? lastSavedAt.current;

    if (!data.ok) {
      if (data.error === "already-spun" || data.error === "device-used") {
        setCard({ kind: "blocked", reason: data.error, next: data.nextFreeSpinAt! });
        setStatus(s => ({ ...(s ?? { available: true }), freeSpinUsed: true, nextFreeSpinAt: data.nextFreeSpinAt }));
        setPhase("result");
        setTimeout(reveal, reduce ? 0 : 450);
        return;
      }
      setError(ERRORS[data.error] ?? "Something went wrong. Please try again.");
      setPhase(respinToken.current ? "respin" : "idle");
      if (SHEET_ERRORS.has(data.error)) {
        if (data.error.startsWith("bonus")) setBonusOpen(true);
        setSheetOpen(true);
      }
      return;
    }

    if (data.spinType === "bonus") setBonusCode("");
    const current = rotation.get();
    const base = current - (((current % 360) + 360) % 360);
    const target = base + 360 * 5 + segmentAngle(data.segment, data.landing);
    const info = outcomes.find(o => o.id === data.outcome)!;
    const land = () => {
      setHighlight(data.segment);
      setLanded({ text: info.kind === "prize" ? `${info.label}!` : info.kind === "spin-again" ? "Spin again!" : "Not this time", win: info.kind === "prize" });
      if (info.kind === "prize") { setBulbs("win"); play("win"); burst("back"); }
      else if (info.kind === "spin-again") { setBulbs("chase"); play("pop"); }
      else { setBulbs("dim"); play("lose"); }
    };
    if (reduce) {
      rotation.set(target);
      land();
    } else {
      setPhase("spinning");
      setBulbs("chase");
      await runSpin(target, land);
      await new Promise(r => setTimeout(r, info.kind === "prize" ? 450 : 300));
    }

    if (data.respinToken) {
      respinToken.current = data.respinToken;
      setAnnounce("Spin again. You get one more go.");
      setPhase("respin");
      setTimeout(() => setBulbs("idle"), 1200);
      return;
    }
    setAnnounce(data.prize ? `You won: ${info.label}. Your code is ${data.prize.code}.` : "Not this time.");
    setCard(data.prize
      ? { kind: "win", outcome: data.outcome, firstName: data.firstName, prize: data.prize, next: data.nextFreeSpinAt, bonusStillAvailable: data.bonusStillAvailable, fresh: true }
      : { kind: "lose", firstName: data.firstName, next: data.nextFreeSpinAt, bonusStillAvailable: data.bonusStillAvailable, fresh: true });
    if (data.spinType === "free") setStatus(s => ({ ...(s ?? { available: true }), freeSpinUsed: true, nextFreeSpinAt: data.nextFreeSpinAt }));
    setPhase("result");
    setTimeout(reveal, reduce ? 0 : 450);
  }

  function backToWheel(openBonus = false) {
    setCard(null);
    setPhase("idle");
    setBulbs("idle");
    setHighlight(null);
    setLanded(null);
    if (openBonus) {
      setBonusOpen(true);
      setSheetOpen(true);
    }
  }

  async function toggleSound() {
    const next = !sound;
    setSoundState(next);
    await setSound(next);
    if (next) play("pop", 0.7);
  }

  const unavailable = SOON || Boolean(status && !status.available);
  const known = Boolean(details.firstName.trim() && detectContact(details.contact).value);
  const needsBonus = Boolean(status?.freeSpinUsed) && !bonusReady;

  /** Lever, SPIN hub or the big button: spin straight away if we know who you are, otherwise ask first. */
  function start() {
    if (busy || unavailable) return;
    if (phase === "respin") { submit(); return; }
    if (card) backToWheel();
    if (!known || needsBonus) {
      setError("");
      if (needsBonus) setBonusOpen(true);
      setSheetOpen(true);
      return;
    }
    submit();
  }

  function notYou() {
    setDetails({ firstName: "", contact: "", marketingOptIn: false });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setError("");
    setSheetOpen(true);
  }

  const leverLabel = phase === "respin" ? "Pull the lever to spin again" : "Pull the lever to spin the wheel";
  const cta = phase === "respin" ? "Spin again" : status?.freeSpinUsed ? "Spin with a bonus code" : "Spin the wheel";

  return (
    <section id="spin" className="wrap wheel-open" aria-labelledby="wheel-title">
      <div className="wheel-open-copy">
        <h1 id="wheel-title">Spin the <span>Coco Wheel</span></h1>
        <p className="wheel-open-sub">One free spin every week. Win a coffee, a slushie or a little treat, then collect it in store.</p>
        {SOON ? (
          <p className="wheel-note"><strong>Coming soon.</strong> Follow us on <a href="https://www.instagram.com/cocolocal_/">Instagram</a> or <a href="https://www.facebook.com/profile.php?id=61577283069366">Facebook</a> to hear when it opens.</p>
        ) : unavailable ? <p className="wheel-note">{ERRORS.unavailable}</p> : (
          <div className="actions">
            <button type="button" className="button" onClick={start} disabled={busy}>{cta}</button>
            <a href="#how-it-works" className="text-link">How it works <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        )}
        {known && !unavailable && phase !== "respin" && (
          <p className="wheel-who">Spinning as <strong>{details.firstName.trim()}</strong> <button type="button" className="link-button" onClick={notYou}>Not you?</button></p>
        )}
        {status?.freeSpinUsed && status.nextFreeSpinAt && !card && (
          <p className="wheel-note">You’ve had this week’s free spin. The next one unlocks on {dayText(status.nextFreeSpinAt)}. Spent over {wheelConfig.bonusMinimumSpend}? Ask at the till for a bonus code.</p>
        )}
        {error && !sheetOpen && <p className="wheel-error" role="alert">{error}</p>}
        {status?.demo && !SOON && <p className="wheel-demo">Preview demo: spins and codes here aren’t saved.</p>}
        <p className="wheel-small">{wheelConfig.minimumAge}+. No purchase needed. Online only. Prizes are collected at 210 High Road within {wheelConfig.prizeValidDays} days. <Link href="/wheel/terms">Terms (draft)</Link> · <Link href="/wheel/privacy">Privacy (draft)</Link></p>
      </div>

      <div ref={stage} className={`wheel-stage ${card ? "is-card" : ""} ${phase === "spinning" ? "is-spinning" : ""}`}
        onPointerMove={track} onPointerLeave={untrack}>
        <div className="wheel-spotlight" aria-hidden="true"><motion.div className="wheel-spotlight-glow" style={{ x: spotX, y: spotY }} /></div>
        <canvas ref={backCanvas} className="confetti-back" aria-hidden="true" />
        <button type="button" className="sound-toggle" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}>
          {sound ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
        </button>
        <motion.div className="wheel-stack-frame" style={stackMeasured ? { height: stackH } : undefined}>
          <div ref={stack} className="wheel-stack">
            <motion.div className="wheel-body" inert={Boolean(card)} initial={false}
              animate={card ? { opacity: 0, scale: reduce ? 1 : 0.9, transitionEnd: { visibility: "hidden" } } : { opacity: 1, scale: 1, visibility: "visible" }}
              transition={reduce ? { duration: 0.2 } : { duration: card ? 0.3 : 0.45, ease: card ? [0.4, 0, 1, 1] : [0.22, 1, 0.36, 1] }}>
              <div className="wheel-scene">
                {!reduce && <>
                  {/* eslint-disable @next/next/no-img-element */}
                  <motion.img src="/wheel/props/slushie.webp" alt="" className="float-prop p-slushie" style={{ x: near, y: nearY }} draggable={false} />
                  <motion.img src="/wheel/props/coffee.webp" alt="" className="float-prop p-coffee" style={{ x: far, y: farY }} draggable={false} />
                  <motion.img src="/wheel/props/hot-chocolate.webp" alt="" className="float-prop p-choc" style={{ x: near, y: nearY }} draggable={false} />
                  <motion.img src="/wheel/props/sweet.webp" alt="" className="float-prop p-sweet" style={{ x: far, y: farY }} draggable={false} />
                  <motion.img src="/wheel/props/cookie.webp" alt="" className="float-prop p-cookie" style={{ x: near, y: nearY }} draggable={false} />
                  {/* eslint-enable @next/next/no-img-element */}
                </>}
                <motion.div className={`wheel-machine ${rich ? "is-tilting" : ""}`} style={rich ? { rotateX: tiltX, rotateY: tiltY } : undefined}>
                  <div ref={wheelEl} className={`wheel-rotor-wrap bulbs-${bulbs}`}>
                    <WheelRim />
                    <motion.div className="wheel-rotor" style={{ rotate: rotation }}>
                      <div className="wheel-spin-in">
                        <WheelDisc highlight={highlight} />
                        <motion.div className="wheel-labels-layer" style={rich ? { opacity: sharpOpacity } : undefined}><WheelLabels /></motion.div>
                        {rich && <motion.div className="wheel-labels-layer" style={{ opacity: blurMix }}><WheelLabels blurred /></motion.div>}
                      </div>
                    </motion.div>
                    <WheelShade />
                    <motion.div className="wheel-pointer" style={{ rotate: pointer }}><WheelPointer /></motion.div>
                    <motion.button type="button" onClick={start} className={`wheel-hub ${phase}`} disabled={unavailable || busy}
                      aria-label={phase === "respin" ? "Spin again" : "Spin the wheel"}
                      whileHover={idle && !reduce ? { scale: 1.06 } : undefined}
                      whileTap={idle && !reduce ? { scale: 0.94 } : undefined}
                      animate={phase === "loading" ? { scale: 0.7 } : idle && !reduce && !card ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={phase === "loading" ? PRESS_SPRING : idle && !reduce && !card ? { duration: 0.6, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" } : PRESS_SPRING}>
                      <AnimatePresence mode="wait" initial={false}>
                        {phase === "loading" ? (
                          <motion.span key="ring" className="hub-ring" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />
                        ) : (
                          <motion.span key={phase === "respin" ? "again" : "spin"} className="hub-label"
                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.16 }}>
                            {phase === "respin" ? "AGAIN" : "SPIN"}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                  <WheelStand />
                </motion.div>
                <Lever disabled={unavailable || busy || Boolean(card)} reduce={reduce} onPull={start} label={leverLabel} />
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={landed ? `l-${landed.text}` : phase} className={`wheel-caption ${landed?.win ? "is-win" : ""}`} aria-live="polite"
                  initial={reduce ? false : landed ? { opacity: 0, scale: 0.6, y: 6 } : { opacity: 0, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={landed ? { type: "spring", stiffness: 420, damping: 16 } : { duration: 0.2 }}>
                  {SOON ? "Coming soon." : landed ? landed.text : slow ? "Still working on it…" : phase === "respin" ? "Spin again: you get one more go." : phase === "spinning" || phase === "loading" ? "Good luck…" : "Pull the lever or tap SPIN."}
                </motion.p>
              </AnimatePresence>
            </motion.div>
            <AnimatePresence initial={false}>
              {card && (
                <motion.div key="card" className={`result-card ${card.kind}`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: reduce ? 0.15 : 0.22 } }}
                  transition={reduce ? { duration: 0.2 } : { ...CARD_POP, delay: 0.18 }}>
                  <ResultCard card={card} onBack={backToWheel} reduce={reduce} onOpen={onRevealOpen} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <canvas ref={frontCanvas} className="confetti-front" aria-hidden="true" />
        {SOON && (
          <div className="wheel-soon-veil" role="status">
            <span className="wheel-soon-label">Coming soon</span>
            <p>The Coco Wheel opens soon. One free spin every week.</p>
          </div>
        )}
        <p className="sr-only" aria-live="assertive">{announce}</p>
      </div>

      <EntrySheet open={sheetOpen} reduce={reduce} details={details} onChange={setDetails}
        bonusCode={bonusCode} onBonusChange={setBonusCode} bonusOpen={bonusOpen} onBonusOpen={setBonusOpen} bonusReady={bonusReady}
        freeSpinUsedUntil={status?.freeSpinUsed && status.nextFreeSpinAt ? dayText(status.nextFreeSpinAt) : undefined} known={known}
        error={error} onSubmit={submit} onClose={() => setSheetOpen(false)} />
    </section>
  );
}

function Stagger({ i, show, reduce, children }: { i: number; show: number; reduce: boolean; children: React.ReactNode }) {
  return (
    <motion.div className="stagger" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : show + i * 0.08, type: "spring", stiffness: 260, damping: 24 }}>{children}</motion.div>
  );
}

function ResultCard({ card, onBack, reduce, onOpen }: { card: Card; onBack: (openBonus?: boolean) => void; reduce: boolean; onOpen: () => void }) {
  const [busy, setBusy] = useState(false);
  const chip = useRef<HTMLParagraphElement>(null);
  if (card.kind === "blocked") {
    return (
      <>
        <span className="result-badge">This week’s spin</span>
        <h3>{card.reason === "device-used" ? "This device has had this week’s free spin." : "You’ve had this week’s free spin."}</h3>
        <p>Your next free spin unlocks on <strong>{dayText(card.next)}</strong>.</p>
        <p>Spent over {wheelConfig.bonusMinimumSpend} in store? Ask at the till for a bonus code for an extra spin.</p>
        <div className="actions"><button className="button" onClick={() => onBack(true)}>I have a bonus code</button></div>
      </>
    );
  }
  const instant = reduce || !card.fresh;
  const outcome = outcomes.find(o => o.id === (card.kind === "win" ? card.outcome : "not-this-time"));
  const art = outcome?.reveal?.art ?? (card.kind === "win" ? "sweets" : "basket");
  const show = instant ? 0 : card.kind === "win" ? 1.25 : 0.95;
  const bonusLine = card.bonusStillAvailable && (
    <div className="actions"><button className="button" onClick={() => onBack(true)}>Use my bonus code now</button></div>
  );
  if (card.kind === "lose") {
    return (
      <>
        <Reveal art={art} tone="lose" reduce={instant} />
        <Stagger i={0} show={show} reduce={instant}><span className="result-badge">Not this time</span><h3>Not this time, {card.firstName}.</h3></Stagger>
        <Stagger i={1} show={show} reduce={instant}><p>{outcome?.reveal?.line} Your next free spin unlocks on <strong>{dayText(card.next)}</strong>.</p></Stagger>
        <Stagger i={2} show={show} reduce={instant}>
          {card.bonusStillAvailable
            ? <p>Your bonus code hasn’t been used yet. It’s still good for one more spin.</p>
            : <p>Spent over {wheelConfig.bonusMinimumSpend} in store? Ask at the till for a bonus code for an extra spin.</p>}
          {bonusLine || <div className="actions"><button className="button secondary" onClick={() => onBack(true)}>I have a bonus code</button></div>}
        </Stagger>
      </>
    );
  }
  const share: PrizeCard = { label: card.prize.label, code: card.prize.code, expiresText: expiryText(card.prize.expiresAt), firstName: card.firstName };
  const run = async (fn: (c: PrizeCard) => Promise<void>) => { setBusy(true); try { await fn(share); } finally { setBusy(false); } };
  return (
    <>
      <Reveal art={art} tone="win" reduce={instant} onOpen={instant ? undefined : onOpen} />
      <Stagger i={0} show={show} reduce={instant}><span className="result-badge">You won</span><h3 className="win-title">{card.prize.label}</h3></Stagger>
      <Stagger i={1} show={show} reduce={instant}><p>{outcome?.reveal?.line} {card.prize.claim}</p></Stagger>
      <Stagger i={2} show={show} reduce={instant}>
        <motion.p ref={chip} className="prize-code" aria-label={`Prize code ${card.prize.code.split("").join(" ")}`}
          initial={instant ? false : { scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: instant ? 0 : show + 0.2, type: "spring", stiffness: 420, damping: 15 }}
          onPointerMove={e => {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
          }}>{card.prize.code}</motion.p>
      </Stagger>
      <Stagger i={3} show={show} reduce={instant}><p>Show this code at the till by <strong>{expiryText(card.prize.expiresAt)}</strong>. One use only.</p></Stagger>
      <Stagger i={4} show={show} reduce={instant}>
        <div className="actions">
          <button className="button" disabled={busy} onClick={() => run(savePrizeImage)}>Save image</button>
          <button className="button secondary" disabled={busy} onClick={() => run(sendToWhatsApp)}>Send to WhatsApp</button>
        </div>
        <p className="wheel-small">Or just take a screenshot. Next free spin: {dayText(card.next)}.</p>
        {bonusLine || <button className="bonus-toggle" onClick={() => onBack(true)}>Back to the wheel (bonus code)</button>}
      </Stagger>
    </>
  );
}
