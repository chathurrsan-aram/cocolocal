"use client";

// The result "opening": a Coco gift box drops in, shakes, the lid flies off and the prize
// pops out with a sunburst (win), or the lid lifts a little and the basket peeks out (lose).
// What pops out is set per outcome in src/data/wheel.ts (`reveal.art`), so each prize can
// get its own picture later without touching this file.
import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import type { RevealArt } from "@/data/wheel";

const POP = { type: "spring", stiffness: 380, damping: 16 } as const; // ζ ≈ 0.41: lively pop
const DROP = { type: "spring", stiffness: 300, damping: 18 } as const;

export const REVEAL_OPENS_AT = 0.9; // seconds after mount that the lid comes off (confetti fires here)

const PHOTO: Partial<Record<RevealArt, string[]>> = {
  slushie: ["/wheel/props/slushie.webp"],
  coffee: ["/wheel/props/coffee.webp"],
  "hot-chocolate": ["/wheel/props/hot-chocolate.webp"],
  sweets: ["/wheel/props/sweet.webp", "/wheel/props/cookie.webp", "/wheel/props/sweet-blue.webp"],
};

function DrawnArt({ art }: { art: RevealArt }) {
  if (art === "pound-coin" || art === "fifty-coin") {
    const gold = art === "pound-coin";
    const sides = gold ? 12 : 7;
    const pts = Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      return `${60 + 52 * Math.cos(a)},${60 + 52 * Math.sin(a)}`;
    }).join(" ");
    return (
      <svg viewBox="0 0 120 120" className="reveal-drawn">
        <defs>
          <radialGradient id={`coin-${art}`} cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor={gold ? "#fff6c8" : "#ffffff"} />
            <stop offset=".45" stopColor={gold ? "#f2c23d" : "#cfd3dc"} />
            <stop offset="1" stopColor={gold ? "#a86d0d" : "#7b8292"} />
          </radialGradient>
        </defs>
        <polygon points={pts} fill={`url(#coin-${art})`} stroke={gold ? "#8a5a0a" : "#5f6678"} strokeWidth="2.5" />
        <polygon points={pts} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.2" transform="translate(60 60) scale(.84) translate(-60 -60)" />
        <text x="60" y="63" textAnchor="middle" dominantBaseline="central" fontSize={gold ? 40 : 34} fontWeight={900}
          fill={gold ? "#7a4b05" : "#4b5060"} style={{ fontFamily: "Arial, sans-serif" }}>{gold ? "£1" : "50p"}</text>
      </svg>
    );
  }
  if (art === "crisps") {
    return (
      <svg viewBox="0 0 120 150" className="reveal-drawn">
        <defs>
          <linearGradient id="bag" x1="0" x2="1">
            <stop offset="0" stopColor="#2c56c4" /><stop offset=".45" stopColor="#5b86f0" /><stop offset="1" stopColor="#2447a8" />
          </linearGradient>
        </defs>
        <path d="M14 18 L106 18 L100 132 L20 132 Z" fill="url(#bag)" />
        <path d="M12 10 L108 10 L106 22 L14 22 Z M18 128 L102 128 L104 140 L16 140 Z" fill="#1f3f96" />
        <path d="M14 10 l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 4-4" stroke="#8fb0ff" strokeWidth="2" fill="none" />
        <circle cx="60" cy="72" r="30" fill="#ffd35c" />
        <ellipse cx="52" cy="70" rx="13" ry="9" fill="#f2b33a" transform="rotate(-18 52 70)" />
        <ellipse cx="68" cy="78" rx="12" ry="8" fill="#e9a42c" transform="rotate(14 68 78)" />
        <text x="60" y="118" textAnchor="middle" fontSize="15" fontWeight={900} fill="#fff" letterSpacing="2" style={{ fontFamily: "Arial, sans-serif" }}>CRISPS</text>
        <path d="M26 30 Q34 70 26 120" stroke="#fff" strokeOpacity=".25" strokeWidth="5" fill="none" />
      </svg>
    );
  }
  // basket (Coco Local mark) for "not this time"
  return (
    <svg viewBox="0 0 120 110" className="reveal-drawn basket">
      <path d="M34 40 L50 12 M86 40 L70 12" stroke="#c0c0db" strokeWidth="8" strokeLinecap="round" />
      <rect x="10" y="38" width="100" height="16" rx="8" fill="#c0c0db" />
      <path d="M18 56 L102 56 L92 98 Q90 104 84 104 L36 104 Q30 104 28 98 Z" fill="none" stroke="#c0c0db" strokeWidth="8" strokeLinejoin="round" />
      <path d="M44 70 V88 M60 70 V88 M76 70 V88" stroke="#c0c0db" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

function Box({ lid }: { lid: ReturnType<typeof useAnimationControls> }) {
  return (
    <div className="reveal-box" aria-hidden="true">
      <motion.svg viewBox="0 0 160 50" className="reveal-lid" animate={lid} initial={{ y: 0, rotate: 0, opacity: 1 }}>
        <defs>
          <linearGradient id="lidg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b86f0" /><stop offset="1" stopColor="#2c56c4" /></linearGradient>
        </defs>
        <path d="M80 18 C60 -6 40 6 62 20 M80 18 C100 -6 120 6 98 20" stroke="#ffdf77" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="4" y="18" width="152" height="30" rx="6" fill="url(#lidg)" />
        <rect x="70" y="18" width="20" height="30" fill="#ffdf77" />
      </motion.svg>
      <svg viewBox="0 0 160 110" className="reveal-body">
        <defs>
          <linearGradient id="boxg" x1="0" x2="1"><stop offset="0" stopColor="#2447a8" /><stop offset=".5" stopColor="#3f6fe0" /><stop offset="1" stopColor="#1f3f96" /></linearGradient>
        </defs>
        <rect x="12" y="0" width="136" height="106" rx="6" fill="url(#boxg)" />
        <rect x="70" y="0" width="20" height="106" fill="#ffdf77" />
        <rect x="12" y="0" width="136" height="8" fill="#000" opacity=".18" />
      </svg>
    </div>
  );
}

export default function Reveal({ art, tone, reduce, onOpen }: { art: RevealArt; tone: "win" | "lose"; reduce: boolean; onOpen?: () => void }) {
  const lid = useAnimationControls();
  const box = useAnimationControls();
  const prize = useAnimationControls();
  const photos = PHOTO[art];

  useEffect(() => {
    let alive = true;
    const wait = (s: number) => new Promise(r => setTimeout(r, s * 1000));
    (async () => {
      if (reduce) { onOpen?.(); return; }
      await box.start({ y: 0, opacity: 1, transition: DROP });
      await box.start({ rotate: [0, -7, 6, -5, 4, 0], transition: { duration: tone === "win" ? 0.45 : 0.35, ease: "easeInOut" } });
      if (!alive) return;
      if (tone === "win") {
        lid.start({ y: -150, x: 40, rotate: 38, opacity: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.3, 1] } });
        onOpen?.();
        prize.start({ y: 0, scale: 1, opacity: 1, transition: { ...POP, delay: 0.05 } });
        await wait(0.45);
        box.start({ y: 60, opacity: 0, transition: { duration: 0.45, ease: "easeIn" } });
      } else {
        // The lid lifts, the basket peeks out of the box, then the box drops away.
        await lid.start({ y: -34, rotate: -10, transition: { duration: 0.35, ease: "easeOut" } });
        onOpen?.();
        await prize.start({ y: -44, scale: 0.9, opacity: 1, transition: { type: "spring", stiffness: 170, damping: 16 } });
        await wait(0.35);
        box.start({ y: 70, opacity: 0, transition: { duration: 0.45, ease: "easeIn" } });
        lid.start({ y: 40, opacity: 0, transition: { duration: 0.4, ease: "easeIn" } });
        prize.start({ y: 0, scale: 1, transition: { type: "spring", stiffness: 140, damping: 14 } });
      }
    })();
    return () => { alive = false; };
  }, [box, lid, prize, reduce, tone, onOpen]);

  return (
    <div className={`reveal ${tone}`}>
      {tone === "win" && <motion.div className="reveal-rays" aria-hidden="true" initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : REVEAL_OPENS_AT, duration: 0.5 }} />}
      {!reduce && <motion.div className="reveal-box-wrap" initial={{ y: -80, opacity: 0 }} animate={box}><Box lid={lid} /></motion.div>}
      <motion.div className={`reveal-prize ${tone} ${photos && photos.length > 1 ? "group" : ""}`}
        initial={reduce ? { opacity: 1, y: 0, scale: 1 } : tone === "win" ? { y: 70, scale: 0.3, opacity: 0 } : { y: 40, scale: 0.9, opacity: 0 }} animate={prize}>
        <motion.div className="reveal-float" animate={reduce ? undefined : tone === "win" ? { y: [0, -6, 0], rotate: [-2, 2, -2] } : { rotate: [-6, 6, -6] }}
          transition={{ duration: tone === "win" ? 2.4 : 3, repeat: Infinity, ease: "easeInOut", delay: REVEAL_OPENS_AT + 0.5 }}>
          {photos
            // eslint-disable-next-line @next/next/no-img-element
            ? photos.map((src, i) => <img key={src} src={src} alt="" className={`reveal-photo p${i}`} draggable={false} />)
            : <DrawnArt art={art} />}
        </motion.div>
      </motion.div>
      {tone === "win" && !reduce && Array.from({ length: 7 }, (_, i) => (
        <motion.span key={i} className="reveal-sparkle" aria-hidden="true" style={{ ["--a" as string]: `${i * 51}deg` }}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.4] }}
          transition={{ delay: REVEAL_OPENS_AT + 0.1 + i * 0.07, duration: 0.9, repeat: Infinity, repeatDelay: 1.6 + i * 0.2 }} />
      ))}
    </div>
  );
}
