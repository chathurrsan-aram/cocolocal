"use client";

// Pull-to-spin lever beside the wheel, seen from the front like a slot machine: pulling
// brings the knob down towards you (the rod foreshortens, the knob grows a little).
// Drag it down past the catch, or tap/click/Enter it; it snaps back with a bounce and fires onPull.
import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { play } from "./sfx";

const CATCH = 0.55;
const SNAP_BACK = { type: "spring", stiffness: 380, damping: 12 } as const; // ζ ≈ 0.31: springy return

export default function Lever({ disabled, reduce, onPull, label }: { disabled: boolean; reduce: boolean; onPull: () => void; label: string }) {
  const pull = useMotionValue(0); // 0 = up, 1 = fully pulled
  const travel = useRef(120);
  const box = useRef<HTMLDivElement>(null);
  const rodScale = useTransform(pull, [0, 1], [1, 0.22]);
  const knobY = useTransform(pull, p => p * travel.current);
  const knobScale = useTransform(pull, [0, 1], [1, 1.16]);
  const glow = useTransform(pull, [0, 1], [0.35, 0.9]);
  const drag = useRef<{ y: number; notch: number } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => { travel.current = el.clientHeight * 0.58; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function release(fire: boolean) {
    drag.current = null;
    if (fire) {
      busy.current = true;
      play("launch");
      onPull();
    }
    await animate(pull, 0, reduce ? { duration: 0 } : SNAP_BACK);
    busy.current = false;
  }

  async function pullByTap() {
    if (disabled || busy.current) return;
    busy.current = true;
    if (!reduce) {
      play("ratchet", 0.8);
      await animate(pull, 1, { duration: 0.34, ease: [0.5, 0, 0.75, 0] });
    }
    await release(true);
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
          if (disabled || busy.current) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, notch: 0 };
        }}
        onPointerMove={e => {
          const d = drag.current;
          if (!d) return;
          const p = Math.max(0, Math.min(1, (e.clientY - d.y) / travel.current));
          pull.set(p);
          const notch = Math.floor(p * 5);
          if (notch > d.notch) { d.notch = notch; play("clack", 0.6); }
        }}
        onPointerUp={e => {
          const d = drag.current;
          if (!d) return;
          if (Math.abs(e.clientY - d.y) < 6) { drag.current = null; pullByTap(); return; } // a tap
          release(pull.get() >= CATCH);
        }}
        onPointerCancel={() => { if (drag.current) release(false); }}
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
