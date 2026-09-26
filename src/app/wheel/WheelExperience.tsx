"use client";

// The live wheel. The server decides every outcome (POST /api/wheel/spin) before anything
// moves; this component only animates to the slice it is told.
//
// Motion (owner's brief, 26 Sep): Higgsfield-style chrome wheel with bulbs, pull lever or SPIN
// hub, wind-up → fast spin with motion blur and peg clacks → tense crawl → small bounce,
// then a gift-box reveal per outcome with confetti on wins. The spin is a pure function of
// time (src/lib/wheel/motion.ts). Mouse movement tilts the machine, moves the spotlight and
// the floating props. Reduced motion: no tilt, blur, confetti or bounce; results show at once.
import { FormEvent, useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { outcomes, segments, wheelConfig } from "@/data/wheel";
import { segmentAngle } from "@/lib/wheel/geometry";
import { spinPlan, blurFor, pointerKick, sliceUnder } from "@/lib/wheel/motion";
import { WheelDisc, WheelPointer, WheelRim, WheelShade, WheelStand } from "./WheelArt";
import Lever from "./Lever";
import Reveal from "./Reveal";
import { play, setSound, soundPreference } from "./sfx";
import { savePrizeImage, sendToWhatsApp, type PrizeCard } from "./share";

const MORPH_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const; // ζ ≈ 0.93
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
type Bulbs = "idle" | "chase" | "win" | "dim";
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
};
const looksLikeBonus = (v: string) => /^(bonus)?[\s-]*[2-9a-hjkmnp-z]{6}$/i.test(v.trim().replace(/[\s-]/g, ""));

export default function WheelExperience() {
  // The server can't know the visitor's motion setting, so apply it only after hydration.
  const prefersReduced = Boolean(useReducedMotion());
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const reduce = hydrated && prefersReduced;
  const formId = useId();
  const form = useRef<HTMLFormElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [card, setCard] = useState<Card | null>(null);
  const [bulbs, setBulbs] = useState<Bulbs>("idle");
  const [highlight, setHighlight] = useState<number | null>(null);
  const [landed, setLanded] = useState<{ text: string; win: boolean } | null>(null);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [details, setDetails] = useState({ firstName: "", contactType: "email" as "email" | "mobile", contact: "", marketingOptIn: false });
  const [bonusCode, setBonusCode] = useState("");
  const [bonusOpen, setBonusOpen] = useState(false);
  const [sound, setSoundState] = useState(false);
  const respinToken = useRef<string | null>(null);
  const lastSavedAt = useRef<string | null>(null);
  const bonusInput = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const wheelEl = useRef<HTMLDivElement>(null);
  const backCanvas = useRef<HTMLCanvasElement>(null);
  const frontCanvas = useRef<HTMLCanvasElement>(null);
  const confetti = useRef<{ back?: Confetti; front?: Confetti }>({});

  // Wheel motion values (written every frame while spinning).
  const rotation = useMotionValue(-SLICE / 2);
  const pointer = useMotionValue(0);
  const blurPx = useMotionValue(0);
  const blur = useTransform(blurPx, v => (v > 0.05 ? `blur(${v.toFixed(2)}px)` : "none"));

  // Mouse-reactive tilt, spotlight and parallax (springs so it feels weighty, not twitchy).
  const mx = useSpring(0, { stiffness: 90, damping: 16 });
  const my = useSpring(0, { stiffness: 90, damping: 16 });
  const tiltX = useTransform(my, v => v * -7);
  const tiltY = useTransform(mx, v => v * 9);
  const spotX = useTransform(mx, v => `${50 + v * 18}%`);
  const spotY = useTransform(my, v => `${38 + v * 14}%`);
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
      if (saved) setDetails(d => ({ ...d, firstName: saved.firstName ?? "", contactType: saved.contactType === "mobile" ? "mobile" : "email", contact: saved.contact ?? "" }));
    } catch { /* storage blocked */ }
    setSoundState(soundPreference()); // shown as on; audio itself starts on the next tap
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

  function track(e: ReactPointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !stage.current) return;
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

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setError("");
    const isRespin = phase === "respin" && respinToken.current;
    const body = isRespin ? { respinToken: respinToken.current } : { ...details, bonusCode: bonusCode.trim() || undefined };
    if (!isRespin) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstName: details.firstName, contactType: details.contactType, contact: details.contact })); } catch { /* ignore */ }
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
      setTimeout(() => bonusInput.current?.focus(), 50);
    }
  }

  async function toggleSound() {
    const next = !sound;
    setSoundState(next);
    await setSound(next);
    if (next) play("pop", 0.7);
  }

  function pullLever() {
    if (busy) return;
    const f = form.current;
    if (phase === "respin") { submit(); return; }
    if (f && !f.reportValidity()) return;
    f?.requestSubmit();
  }

  const unavailable = Boolean(status && !status.available);
  const leverLabel = phase === "respin" ? "Pull the lever to spin again" : "Pull the lever to spin the wheel";

  return (
    <section id="spin" className="wrap wheel-play" aria-labelledby="spin-heading">
      <div className="wheel-panel">
        <p className="eyebrow">YOUR SPIN</p>
        <h2 id="spin-heading">Pop in your details, then pull the lever.</h2>
        {status?.demo && <p className="wheel-demo">Preview demo: spins and codes here aren’t saved.</p>}
        {status?.freeSpinUsed && status.nextFreeSpinAt && (
          <p className="wheel-note">You’ve had this week’s free spin. Your next one unlocks on {dayText(status.nextFreeSpinAt)}. Got a bonus code from the till? Add it below.</p>
        )}
        {unavailable ? (
          <p className="wheel-note">{ERRORS.unavailable}</p>
        ) : (
          <form ref={form} id={formId} className="wheel-form" onSubmit={e => { submit(e); if (sound) setSound(true); }}>
            <label className="field">
              <span>First name</span>
              <input name="firstName" autoComplete="given-name" required maxLength={40} value={details.firstName}
                onChange={e => setDetails({ ...details, firstName: e.target.value })} />
            </label>
            <fieldset className="field">
              <legend>How can we recognise you?</legend>
              <div className="segmented" role="radiogroup" aria-label="Email or mobile">
                {(["email", "mobile"] as const).map(t => (
                  <label key={t} className={details.contactType === t ? "on" : ""}>
                    <input type="radio" name="contactType" value={t} checked={details.contactType === t}
                      onChange={() => setDetails({ ...details, contactType: t, contact: "" })} />
                    {t === "email" ? "Email" : "Mobile"}
                  </label>
                ))}
              </div>
              <input aria-label={details.contactType === "email" ? "Email address" : "UK mobile number"} required
                type={details.contactType === "email" ? "email" : "tel"} inputMode={details.contactType === "email" ? "email" : "tel"}
                autoComplete={details.contactType === "email" ? "email" : "tel"}
                placeholder={details.contactType === "email" ? "you@example.com" : "07… mobile number"}
                value={details.contact} onChange={e => setDetails({ ...details, contact: e.target.value })} />
              <small>We use this to keep it to one free spin a person each week. We won’t message you unless you tick the box below.</small>
            </fieldset>
            <label className="check">
              <input type="checkbox" checked={details.marketingOptIn} onChange={e => setDetails({ ...details, marketingOptIn: e.target.checked })} />
              <span>Send me Coco Local offers and news by {details.contactType === "email" ? "email" : "text"}. Optional. You can still spin without this, and you can stop them any time.</span>
            </label>
            <div className="bonus">
              <button type="button" className="bonus-toggle" aria-expanded={bonusOpen} onClick={() => setBonusOpen(o => !o)}>
                Got a bonus code from the till?
              </button>
              {bonusOpen && (
                <label className="field">
                  <span>Bonus code</span>
                  <input ref={bonusInput} value={bonusCode} autoCapitalize="characters" autoComplete="off" placeholder="BONUS-XXXXXX"
                    onChange={e => setBonusCode(e.target.value)} />
                  <small>Spend over {wheelConfig.bonusMinimumSpend} in store and ask for one. Each code gives one extra spin.</small>
                </label>
              )}
              <AnimatePresence>
                {bonusReady && (
                  <motion.span className="bonus-chip" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }} transition={CARD_POP}>Bonus spin ready</motion.span>
                )}
              </AnimatePresence>
            </div>
            {error && <p className="wheel-error" role="alert">{error}</p>}
            <p className="wheel-small">By spinning you confirm you’re {wheelConfig.minimumAge} or over and agree to the <Link href="/wheel/terms">terms (draft)</Link>. See our <Link href="/wheel/privacy">privacy notice (draft)</Link>.</p>
          </form>
        )}
      </div>

      <motion.div ref={stage} layout={!reduce} transition={reduce ? { duration: 0.2 } : MORPH_SPRING}
        className={`wheel-stage ${card ? "is-card" : ""}`} onPointerMove={track} onPointerLeave={untrack}>
        <motion.div className="wheel-spotlight" aria-hidden="true" style={{ ["--sx" as string]: spotX, ["--sy" as string]: spotY }} />
        <canvas ref={backCanvas} className="confetti-back" aria-hidden="true" />
        <button type="button" className="sound-toggle" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}>
          {sound ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
        </button>
        <AnimatePresence mode="popLayout" initial={false}>
          {!card ? (
            <motion.div key="wheel" className="wheel-body" layout={!reduce}
              exit={reduce ? { opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, scale: 0.86, y: 10, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}>
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
                <motion.div className="wheel-machine" style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY }}>
                  <div ref={wheelEl} className={`wheel-rotor-wrap bulbs-${bulbs}`}>
                    <WheelRim />
                    <motion.div className="wheel-rotor" style={{ rotate: rotation }}>
                      <WheelDisc blur={blur} highlight={highlight} />
                    </motion.div>
                    <WheelShade />
                    <motion.div className="wheel-pointer" style={{ rotate: pointer }}><WheelPointer /></motion.div>
                    <motion.button type="submit" form={formId} className={`wheel-hub ${phase}`} disabled={unavailable || busy}
                      aria-label={phase === "respin" ? "Spin again" : "Spin the wheel"}
                      whileHover={idle && !reduce ? { scale: 1.06 } : undefined}
                      whileTap={idle && !reduce ? { scale: 0.94 } : undefined}
                      animate={phase === "loading" ? { scale: 0.7 } : idle && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={phase === "loading" ? PRESS_SPRING : idle && !reduce ? { duration: 0.6, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" } : PRESS_SPRING}>
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
                <Lever disabled={unavailable || busy} reduce={reduce} onPull={pullLever} label={leverLabel} />
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={landed ? `l-${landed.text}` : phase} className={`wheel-caption ${landed?.win ? "is-win" : ""}`} aria-live="polite"
                  initial={reduce ? false : landed ? { opacity: 0, scale: 0.6, y: 6 } : { opacity: 0, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={landed ? { type: "spring", stiffness: 420, damping: 16 } : { duration: 0.2 }}>
                  {landed ? landed.text : slow ? "Still working on it…" : phase === "respin" ? "Spin again: you get one more go." : phase === "spinning" || phase === "loading" ? "Good luck…" : "Pull the lever or tap SPIN. One free spin a week."}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="card" className={`result-card ${card.kind}`} layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={reduce ? { duration: 0.2 } : { ...CARD_POP, delay: 0.12 }}>
              <ResultCard card={card} onBack={backToWheel} reduce={reduce} onOpen={onRevealOpen} />
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={frontCanvas} className="confetti-front" aria-hidden="true" />
        <p className="sr-only" aria-live="assertive">{announce}</p>
      </motion.div>
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
        <p className="eyebrow">THIS WEEK’S SPIN</p>
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
        <Stagger i={0} show={show} reduce={instant}><p className="eyebrow">NOT THIS TIME</p><h3>Not this time, {card.firstName}.</h3></Stagger>
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
      <Stagger i={0} show={show} reduce={instant}><p className="eyebrow win-eyebrow">YOU WON</p><h3 className="win-title">{card.prize.label}</h3></Stagger>
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
