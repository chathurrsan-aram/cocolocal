// Pull-to-spin lever beside the wheel, seen from the front like a slot machine: pulling
// brings the knob down towards you (the rod foreshortens, the knob grows a little).
// Grab it anywhere and drag down: the moment it passes the catch it clunks home and fires onPull
// (no need to let go first). A tap, click or Enter pulls it for you. It springs back with a bounce.
import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { play } from "./sfx";

const CATCH = 0.5;
const SNAP_HOME = { duration: 0.12, ease: [0.5, 0, 0.75, 0] } as const; // the last bit of travel after the catch
const SNAP_BACK = { type: "spring", stiffness: 380, damping: 14 } as const; // ζ ≈ 0.36: springy return
const FOLLOW = { type: "spring", stiffness: 1400, damping: 60, restDelta: 0.001 } as const; // tracks the hand, smooths jitter

export default function Lever({ disabled, reduce, onPull, label }: { disabled: boolean; reduce: boolean; onPull: () => void; label: string }) {
  const pull = useMotionValue(0); // 0 = up, 1 = fully pulled
  const travel = useRef(100);
  const box = useRef<HTMLDivElement>(null);
  const rodScale = useTransform(pull, [0, 1], [1, 0.22]);
  const knobY = useTransform(pull, p => p * travel.current);
  const knobScale = useTransform(pull, [0, 1], [1, 1.16]);
  const glow = useTransform(pull, [0, 1], [0.35, 0.9]);
  const drag = useRef<{ y: number; start: number; notch: number; id: number; el: HTMLElement } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => { travel.current = el.clientHeight * 0.48; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function endDrag() {
    const d = drag.current;
    drag.current = null;
    if (d?.el.hasPointerCapture(d.id)) d.el.releasePointerCapture(d.id);
  }

  async function fire() {
    endDrag();
    busy.current = true;
    play("launch");
    onPull();
    if (!reduce) await animate(pull, 1, SNAP_HOME);
    await animate(pull, 0, reduce ? { duration: 0 } : SNAP_BACK);
    busy.current = false;
  }

  async function letGo() {
    endDrag();
    await animate(pull, 0, reduce ? { duration: 0 } : SNAP_BACK);
  }

  async function pullByTap() {
    if (disabled || busy.current) return;
    busy.current = true;
    if (!reduce) {
      play("ratchet", 0.8);
      await animate(pull, CATCH, { duration: 0.22, ease: [0.5, 0, 0.75, 0] });
    }
    await fire();
  }

  return (
    <div ref={box} className={`lever ${disabled ? "is-disabled" : ""}`}>
      <div className="lever-slot" aria-hidden="true" />
      <motion.button
        type="button"
        className="lever-arm"
        aria-label={label}
        disabled={disabled}
        onClick={e => { if (e.detail === 0) pullByTap(); }} // keyboard (Enter/Space)
        onPointerDown={e => {
          if (disabled || busy.current || (e.pointerType === "mouse" && e.button !== 0)) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, start: pull.get(), notch: 0, id: e.pointerId, el: e.currentTarget };
        }}
        onPointerMove={e => {
          const d = drag.current;
          if (!d || e.pointerId !== d.id) return;
          const p = Math.max(0, Math.min(1, d.start + (e.clientY - d.y) / travel.current));
          animate(pull, p, FOLLOW);
          const notch = Math.floor(p * 6);
          if (notch > d.notch) { d.notch = notch; play("clack", 0.6); }
          if (p >= CATCH) fire(); // clunk: past the catch it goes the rest of the way by itself
        }}
        onPointerUp={e => {
          const d = drag.current;
          if (!d || e.pointerId !== d.id) return;
          if (Math.abs(e.clientY - d.y) < 6) { endDrag(); pullByTap(); return; } // a tap or click
          letGo(); // let go before the catch: no spin
        }}
        onPointerCancel={() => { if (drag.current) letGo(); }}
        onLostPointerCapture={() => { if (drag.current) letGo(); }}
      >
        <motion.span className="lever-rod" style={{ scaleY: rodScale }} />
        <motion.span className="lever-knob" style={{ y: knobY, scale: knobScale }}>
          <motion.span className="lever-knob-glow" style={{ opacity: glow }} />
        </motion.span>
      </motion.button>
      <span className="lever-hint" aria-hidden="true">Pull</span>
    </div>
  );
}
