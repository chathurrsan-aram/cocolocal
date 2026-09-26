"use client";

// The live wheel. The server decides every outcome (POST /api/wheel/spin) before anything
// moves; this component only animates to the slice it is told.
//
// Motion (approved beat plan): springs with ζ ≥ 0.8, transform/opacity only, one accent
// (gold) used only on wins and the bonus chip. Reduced motion: no idle loop, no spin —
// the wheel jumps to the result and the card cross-fades in 200 ms.
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { outcomes, segments, wheelConfig } from "@/data/wheel";
import { segmentAngle } from "@/lib/wheel/geometry";
import { WheelFace, WheelPointer } from "./WheelArt";
import { savePrizeImage, sendToWhatsApp, type PrizeCard } from "./share";

// ζ = damping / (2·√(stiffness·mass))
const SPIN_SPRING = { type: "spring", stiffness: 8.4, damping: 5.5, mass: 1, restDelta: 0.05, restSpeed: 0.3 } as const; // ζ ≈ 0.95, settles in ~4 s
const MORPH_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const; // ζ ≈ 0.93
const TICK_SPRING = { type: "spring", stiffness: 520, damping: 40 } as const; // ζ ≈ 0.88
const PRESS_SPRING = { type: "spring", stiffness: 500, damping: 40 } as const; // ζ ≈ 0.89
const SLICE = 360 / segments.length;
const STORAGE_KEY = "coco-wheel-details";

type SpinResponse =
  | { ok: true; spinType: "free" | "bonus" | "respin"; outcome: string; segment: number; landing: number; firstName: string;
      prize?: { code: string; label: string; claim?: string; expiresAt: string }; respinToken?: string;
      bonusStillAvailable?: boolean; nextFreeSpinAt: string; at?: string; demo?: boolean }
  | { ok: false; error: string; nextFreeSpinAt?: string; demo?: boolean };

type Phase = "idle" | "loading" | "spinning" | "respin" | "result";
type Saved = Extract<SpinResponse, { ok: true }> & { redeemed?: boolean };
type Status = { available: boolean; demo?: boolean; freeSpinUsed?: boolean; nextFreeSpinAt?: string; lastResult?: Saved | null };
type Card =
  | { kind: "win"; firstName: string; prize: NonNullable<Extract<SpinResponse, { ok: true }>["prize"]>; next: string; bonusStillAvailable?: boolean }
  | { kind: "lose"; firstName: string; next: string; bonusStillAvailable?: boolean }
  | { kind: "blocked"; reason: "already-spun" | "device-used"; next: string };

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
  const reduce = useReducedMotion();
  const formId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [details, setDetails] = useState({ firstName: "", contactType: "email" as "email" | "mobile", contact: "", marketingOptIn: false });
  const [bonusCode, setBonusCode] = useState("");
  const [bonusOpen, setBonusOpen] = useState(false);
  const respinToken = useRef<string | null>(null);
  const rotation = useMotionValue(-SLICE / 2);
  const pointer = useMotionValue(0);
  const lastSlice = useRef(0);
  const lastSavedAt = useRef<string | null>(null);
  const bonusInput = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reveal = () => {
    const box = stage.current?.getBoundingClientRect();
    if (box && (box.top < 70 || box.bottom > window.innerHeight)) stage.current!.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  };

  // Returning visitors: remember their details on this device (convenience only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) setDetails(d => ({ ...d, firstName: saved.firstName ?? "", contactType: saved.contactType === "mobile" ? "mobile" : "email", contact: saved.contact ?? "" }));
    } catch { /* storage blocked */ }
    // Also sets the device cookie, and brings back a prize or re-spin from an earlier visit
    // (or from a spin whose response never arrived).
    fetch("/api/wheel/status", { cache: "no-store" }).then(r => r.json()).then((s: Status) => {
      setStatus(s);
      const last = s.lastResult;
      lastSavedAt.current = last?.at ?? null;
      if (last?.prize && !last.redeemed && Date.parse(last.prize.expiresAt) > Date.now()) {
        setCard({ kind: "win", firstName: last.firstName, prize: last.prize, next: last.nextFreeSpinAt });
        setPhase("result");
      } else if (last?.respinToken) {
        respinToken.current = last.respinToken;
        setPhase("respin");
      }
    }).catch(() => setStatus({ available: true }));
  }, []);

  /** After a network error: if the server did spin, its result is waiting in the status call. */
  async function recover(): Promise<SpinResponse> {
    try {
      const s: Status = await (await fetch("/api/wheel/status", { cache: "no-store" })).json();
      if (s.lastResult && s.lastResult.at !== lastSavedAt.current) return s.lastResult;
    } catch { /* still offline */ }
    return { ok: false, error: "network" };
  }

  // Pointer nudges as each slice boundary passes it.
  useMotionValueEvent(rotation, "change", value => {
    if (phase !== "spinning") return;
    const under = Math.floor((((-value % 360) + 360) % 360) / SLICE);
    if (under !== lastSlice.current) {
      lastSlice.current = under;
      pointer.set(-14);
      animate(pointer, 0, TICK_SPRING);
    }
  });

  const idle = phase === "idle" || phase === "respin";
  const bonusReady = looksLikeBonus(bonusCode);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (phase === "loading" || phase === "spinning") return;
    setError("");
    const isRespin = phase === "respin" && respinToken.current;
    const body = isRespin
      ? { respinToken: respinToken.current }
      : { ...details, bonusCode: bonusCode.trim() || undefined };
    if (!isRespin) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstName: details.firstName, contactType: details.contactType, contact: details.contact })); } catch { /* ignore */ }
    }
    setPhase("loading");
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
    const label = outcomes.find(o => o.id === data.outcome)!.label;
    if (reduce) {
      rotation.set(target);
    } else {
      setPhase("spinning");
      lastSlice.current = Math.floor((((-current % 360) + 360) % 360) / SLICE);
      await animate(rotation, target, SPIN_SPRING);
      await new Promise(r => setTimeout(r, 300));
    }

    if (data.respinToken) {
      respinToken.current = data.respinToken;
      setAnnounce("Spin again. You get one more go.");
      setPhase("respin");
      return;
    }
    setAnnounce(data.prize ? `You won: ${label}. Your code is ${data.prize.code}.` : "Not this time.");
    setCard(data.prize
      ? { kind: "win", firstName: data.firstName, prize: data.prize, next: data.nextFreeSpinAt, bonusStillAvailable: data.bonusStillAvailable }
      : { kind: "lose", firstName: data.firstName, next: data.nextFreeSpinAt, bonusStillAvailable: data.bonusStillAvailable });
    if (data.spinType === "free") setStatus(s => ({ ...(s ?? { available: true }), freeSpinUsed: true, nextFreeSpinAt: data.nextFreeSpinAt }));
    setPhase("result");
    setTimeout(reveal, reduce ? 0 : 450);
  }

  function backToWheel(openBonus = false) {
    setCard(null);
    setPhase("idle");
    if (openBonus) {
      setBonusOpen(true);
      setTimeout(() => bonusInput.current?.focus(), 50);
    }
  }

  const fade = reduce ? { duration: 0.2 } : MORPH_SPRING;
  const unavailable = status && !status.available;

  return (
    <section id="spin" className="wrap wheel-play" aria-labelledby="spin-heading">
      <div className="wheel-panel">
        <p className="eyebrow">YOUR SPIN</p>
        <h2 id="spin-heading">Pop in your details, then spin.</h2>
        {status?.demo && <p className="wheel-demo">Preview demo: spins and codes here aren’t saved.</p>}
        {status?.freeSpinUsed && status.nextFreeSpinAt && (
          <p className="wheel-note">You’ve had this week’s free spin. Your next one unlocks on {dayText(status.nextFreeSpinAt)}. Got a bonus code from the till? Add it below.</p>
        )}
        {unavailable ? (
          <p className="wheel-note">{ERRORS.unavailable}</p>
        ) : (
          <form id={formId} className="wheel-form" onSubmit={submit} noValidate={false}>
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
              {bonusReady && <span className="bonus-chip">Bonus spin ready</span>}
            </div>
            {error && <p className="wheel-error" role="alert">{error}</p>}
            <p className="wheel-small">By spinning you confirm you’re {wheelConfig.minimumAge} or over and agree to the <Link href="/wheel/terms">terms (draft)</Link>. See our <Link href="/wheel/privacy">privacy notice (draft)</Link>.</p>
          </form>
        )}
      </div>

      <motion.div ref={stage} layout={!reduce} transition={fade} className={`wheel-stage ${card ? "is-card" : ""}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          {!card ? (
            <motion.div key="wheel" className="wheel-body" layout={!reduce}
              exit={reduce ? { opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, scale: 0.9, transition: MORPH_SPRING }}>
              <motion.div className="wheel-rotor-wrap"
                animate={idle && !reduce ? { scale: [1, 1.01, 1, 0.99, 1] } : { scale: 1 }}
                transition={idle && !reduce ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : MORPH_SPRING}>
                <motion.div className="wheel-rotor" style={{ rotate: rotation }}>
                  <WheelFace />
                </motion.div>
                <motion.div className="wheel-pointer" style={{ rotate: pointer }}><WheelPointer /></motion.div>
                <motion.button type="submit" form={formId} className={`wheel-hub ${phase}`} disabled={!!unavailable || phase === "loading" || phase === "spinning"}
                  aria-label={phase === "respin" ? "Spin again" : "Spin the wheel"}
                  whileTap={idle && !reduce ? { scale: 0.97 } : undefined}
                  animate={phase === "loading" ? { scale: 0.62 } : idle && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={phase === "loading" ? PRESS_SPRING : idle && !reduce ? { duration: 0.6, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" } : PRESS_SPRING}>
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === "loading" ? (
                      <motion.span key="ring" className="hub-ring" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />
                    ) : (
                      <motion.span key={phase === "respin" ? "again" : phase === "spinning" ? "luck" : "spin"} className="hub-label"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                        {phase === "respin" ? "Spin again" : phase === "spinning" ? "Good luck" : "Spin"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
              <p className="wheel-caption" aria-live="polite">
                {slow ? "Still working on it…" : phase === "respin" ? "Spin again: you get one more go." : phase === "spinning" ? " " : "One free spin a week. Tap the middle to spin."}
              </p>
            </motion.div>
          ) : (
            <motion.div key="card" className={`result-card ${card.kind}`} layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0.2 } : { ...MORPH_SPRING, delay: 0.3 }}>
              <ResultCard card={card} onBack={backToWheel} />
            </motion.div>
          )}
        </AnimatePresence>
        <p className="sr-only" aria-live="assertive">{announce}</p>
      </motion.div>
    </section>
  );
}

function ResultCard({ card, onBack }: { card: Card; onBack: (openBonus?: boolean) => void }) {
  const [busy, setBusy] = useState(false);
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
  const bonusLine = card.bonusStillAvailable && (
    <div className="actions"><button className="button" onClick={() => onBack(true)}>Use my bonus code now</button></div>
  );
  if (card.kind === "lose") {
    return (
      <>
        <p className="eyebrow">NOT THIS TIME</p>
        <h3>Not this time, {card.firstName}.</h3>
        <p>Thanks for playing. Your next free spin unlocks on <strong>{dayText(card.next)}</strong>.</p>
        {card.bonusStillAvailable
          ? <p>Your bonus code hasn’t been used yet. It’s still good for one more spin.</p>
          : <p>Spent over {wheelConfig.bonusMinimumSpend} in store? Ask at the till for a bonus code for an extra spin.</p>}
        {bonusLine || <div className="actions"><button className="button secondary" onClick={() => onBack(true)}>I have a bonus code</button></div>}
      </>
    );
  }
  const share: PrizeCard = { label: card.prize.label, code: card.prize.code, expiresText: expiryText(card.prize.expiresAt), firstName: card.firstName };
  const run = async (fn: (c: PrizeCard) => Promise<void>) => { setBusy(true); try { await fn(share); } finally { setBusy(false); } };
  return (
    <>
      <p className="eyebrow win-eyebrow">YOU WON</p>
      <h3 className="win-title">{card.prize.label}</h3>
      {card.prize.claim && <p>{card.prize.claim}</p>}
      <p className="prize-code" aria-label={`Prize code ${card.prize.code.split("").join(" ")}`}>{card.prize.code}</p>
      <p>Show this code at the till by <strong>{expiryText(card.prize.expiresAt)}</strong>. One use only.</p>
      <div className="actions">
        <button className="button" disabled={busy} onClick={() => run(savePrizeImage)}>Save image</button>
        <button className="button secondary" disabled={busy} onClick={() => run(sendToWhatsApp)}>Send to WhatsApp</button>
      </div>
      <p className="wheel-small">Or just take a screenshot. Next free spin: {dayText(card.next)}.</p>
      {bonusLine || <button className="bonus-toggle" onClick={() => onBack(true)}>Back to the wheel (bonus code)</button>}
    </>
  );
}
