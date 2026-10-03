"use client";

// The quick pop-up before a first spin: first name, then one "email or mobile" box that
// works out which it is as you type (src/lib/wheel/contact.ts, the same rules as the server),
// ticks it when it's complete and tidies the format when you leave the box.
// A centred card on larger screens, a bottom sheet on phones. Esc or the backdrop closes it.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Link from "next/link";
import { Check, Mail, Smartphone, X } from "lucide-react";
import { detectContact } from "@/lib/wheel/contact";
import { wheelConfig } from "@/data/wheel";

export type Details = { firstName: string; contact: string; marketingOptIn: boolean };

const SHEET = { type: "spring", stiffness: 380, damping: 36 } as const; // ζ ≈ 0.92: quick, no wobble
const POP = { type: "spring", stiffness: 520, damping: 22 } as const;

type Props = {
  open: boolean;
  reduce: boolean;
  details: Details;
  onChange: (next: Details) => void;
  bonusCode: string;
  onBonusChange: (v: string) => void;
  bonusOpen: boolean;
  onBonusOpen: (open: boolean) => void;
  bonusReady: boolean;
  /** This week's free spin is used, so a bonus code is needed. Holds the unlock day text. */
  freeSpinUsedUntil?: string;
  /** Name and contact were already given on this device: show them as one line, not the fields. */
  known: boolean;
  error: string;
  onSubmit: () => void;
  onClose: () => void;
};

export default function EntrySheet(props: Props) {
  const { open, reduce, details, onChange, bonusCode, onBonusChange, bonusOpen, onBonusOpen, bonusReady, freeSpinUsedUntil, known, error, onSubmit, onClose } = props;
  const sheet = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const contactInput = useRef<HTMLInputElement>(null);
  const bonusInput = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [asSheet, setAsSheet] = useState(false);
  const [touched, setTouched] = useState(false);
  const [tried, setTried] = useState(false);
  const [localError, setLocalError] = useState("");
  const drag = useDragControls();
  const [editWho, setEditWho] = useState(false);

  const guess = detectContact(details.contact);
  const nameMissing = tried && !details.firstName.trim();
  const contactBad = (touched || tried) && !guess.value && (tried || details.contact.trim() !== "");
  const needsBonus = Boolean(freeSpinUsedUntil);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const set = () => setAsSheet(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Open: remember focus, lock the page scroll, focus the first thing that needs filling in.
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    setTried(false);
    setTouched(false);
    setLocalError("");
    setEditWho(false);
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const t = setTimeout(() => {
      if (sheet.current?.contains(document.activeElement)) return; // already typing: don't jump fields
      const target = !details.firstName.trim() ? nameInput.current
        : !detectContact(details.contact).value ? contactInput.current
        : needsBonus ? bonusInput.current : nameInput.current;
      target?.focus({ preventScroll: true });
    }, reduce ? 0 : 120);
    return () => { clearTimeout(t); root.style.overflow = before; returnFocus.current?.focus?.({ preventScroll: true }); };
    // Only when it opens; the focus choice reads the details at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function keys(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
    if (e.key !== "Tab" || !sheet.current) return;
    const items = sheet.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href]");
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!details.firstName.trim()) { setLocalError(""); nameInput.current?.focus(); return; }
    if (!guess.value) { setLocalError(""); contactInput.current?.focus(); return; }
    if (needsBonus && !bonusCode.trim()) {
      onBonusOpen(true);
      setLocalError("Add the bonus code from your receipt to spin again this week.");
      setTimeout(() => bonusInput.current?.focus(), 0);
      return;
    }
    setLocalError("");
    if (guess.display && guess.display !== details.contact) onChange({ ...details, contact: guess.display });
    onSubmit();
  }

  const channel = guess.kind === "mobile" ? "text" : guess.kind === "email" ? "email" : "email or text";
  const hint = guess.value
    ? { tone: "ok", text: guess.kind === "mobile" ? `UK mobile: ${guess.display}` : "Email looks good" }
    : contactBad
      ? { tone: "bad", text: !details.contact.trim() ? "Add an email address or a UK mobile number."
          : guess.kind === "mobile" ? "That doesn’t look like a UK mobile. It starts 07 and has 11 digits."
          : "That email doesn’t look quite right. Check for a typo." }
      : { tone: "", text: "Whichever’s easier. It keeps it to one free spin a person each week." };
  const shownError = localError || error;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" className="entry-backdrop" onClick={onClose} aria-hidden="true"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} />
          <div key="layer" className="entry-layer">
            <motion.div ref={sheet} className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title" aria-describedby="entry-lede" onKeyDown={keys}
              initial={reduce ? { opacity: 0 } : asSheet ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.96 }}
              animate={reduce ? { opacity: 1 } : asSheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : asSheet ? { y: "100%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } } : { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16 } }}
              transition={reduce ? { duration: 0 } : SHEET}
              drag={asSheet && !reduce ? "y" : false} dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}>
              <div className="entry-grab-zone" aria-hidden="true" onPointerDown={e => { if (asSheet && !reduce) drag.start(e); }}><span className="entry-grab" /></div>
              <button type="button" className="entry-close" onClick={onClose} aria-label="Close"><X size={20} aria-hidden="true" /></button>
              <h2 id="entry-title">{needsBonus ? "Got a bonus code?" : "Quick one before you spin"}</h2>
              <p id="entry-lede" className="entry-lede">
                {needsBonus
                  ? `You’ve had this week’s free spin. The next one unlocks on ${freeSpinUsedUntil}. A bonus code from the till gives you an extra go.`
                  : "Your first name, and an email or mobile so we know it’s your one free spin this week."}
              </p>
              <form className="entry-form" onSubmit={submit} noValidate>
                {known && needsBonus && !editWho ? (
                  <p className="entry-who">
                    <span>Spinning as <strong>{details.firstName.trim()}</strong> · {guess.display}</span>
                    <button type="button" className="link-button" onClick={() => setEditWho(true)}>Change</button>
                  </p>
                ) : <>
                <div className="entry-field">
                  <label htmlFor="entry-name">First name</label>
                  <input ref={nameInput} id="entry-name" name="firstName" type="text" autoComplete="given-name" autoCapitalize="words" maxLength={40}
                    placeholder="e.g. Sam" value={details.firstName} aria-invalid={nameMissing || undefined} aria-describedby={nameMissing ? "entry-name-hint" : undefined}
                    onChange={e => onChange({ ...details, firstName: e.target.value })} />
                  {nameMissing && <p id="entry-name-hint" className="field-hint bad">Please add your first name.</p>}
                </div>
                <div className="entry-field">
                  <label htmlFor="entry-contact">Email or mobile</label>
                  <div className="entry-input">
                    <input ref={contactInput} id="entry-contact" name="contact" type="text"
                      inputMode={guess.kind === "mobile" ? "tel" : "email"} autoComplete={guess.kind === "mobile" ? "tel" : "email"}
                      autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={254}
                      placeholder="you@example.com or 07…" value={details.contact}
                      aria-invalid={contactBad || undefined} aria-describedby="entry-contact-hint"
                      onChange={e => onChange({ ...details, contact: e.target.value })}
                      onBlur={() => {
                        setTouched(true);
                        if (guess.display && guess.display !== details.contact.trim()) onChange({ ...details, contact: guess.display });
                      }} />
                    <AnimatePresence mode="wait" initial={false}>
                      {guess.kind && (
                        <motion.span key={`${guess.kind}-${Boolean(guess.value)}`} className={`entry-kind ${guess.value ? "valid" : ""}`} aria-hidden="true"
                          initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.1 } }}
                          transition={POP}>
                          {guess.value ? <Check size={17} strokeWidth={3} /> : guess.kind === "mobile" ? <Smartphone size={17} /> : <Mail size={17} />}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p id="entry-contact-hint" className={`field-hint ${hint.tone}`} aria-live="polite">{hint.text}</p>
                </div>
                <label className="check">
                  <input type="checkbox" checked={details.marketingOptIn} onChange={e => onChange({ ...details, marketingOptIn: e.target.checked })} />
                  <span>Send me Coco Local offers by {channel}. Optional: you can spin without it and stop any time.</span>
                </label>
                </>}
                <div className="bonus">
                  {!bonusOpen && !needsBonus ? (
                    <button type="button" className="bonus-toggle" aria-expanded="false"
                      onClick={() => { onBonusOpen(true); setTimeout(() => bonusInput.current?.focus(), 0); }}>
                      Got a bonus code from the till?
                    </button>
                  ) : (
                    <div className="entry-field">
                      <label htmlFor="entry-bonus">Bonus code</label>
                      <input ref={bonusInput} id="entry-bonus" type="text" value={bonusCode} autoCapitalize="characters" autoComplete="off" spellCheck={false}
                        placeholder="BONUS-XXXXXX" onChange={e => onBonusChange(e.target.value)} />
                      <small>Spend over {wheelConfig.bonusMinimumSpend} in store and ask at the till. Each code gives one extra spin.</small>
                    </div>
                  )}
                  <AnimatePresence>
                    {bonusReady && (
                      <motion.span className="bonus-chip" initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }} transition={POP}>Bonus spin ready</motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {shownError && <p className="wheel-error" role="alert">{shownError}</p>}
                <button type="submit" className="button entry-submit">{bonusReady ? "Spin with my bonus code" : "Spin the wheel"}</button>
                <p className="wheel-small">You must be {wheelConfig.minimumAge} or over. By spinning you agree to the <Link href="/wheel/terms">terms (draft)</Link>. See the <Link href="/wheel/privacy">privacy notice (draft)</Link>.</p>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
