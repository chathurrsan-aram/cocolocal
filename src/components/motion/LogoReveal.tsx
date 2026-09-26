"use client";

import localFont from "next/font/local";
import { useInViewOnce } from "./useInViewOnce";
import styles from "./LogoReveal.module.css";

const poppins = localFont({ src: "../../fonts/poppins-latin-600-normal.woff2", weight: "600", display: "swap" });

// The motion kit's signature reveal as live SVG: the basket draws on
// (handles, rim, body, then the slots on 16ths) and the letters rise.
// Plays once when scrolled into view; reduced motion shows the finished logo.
const LETTERS = "coco local".split("");

export default function LogoReveal({ className = "" }: { className?: string }) {
  const { ref, armed, inView } = useInViewOnce<HTMLDivElement>(0.5);
  const state = armed && !inView ? styles.armed : armed && inView ? styles.play : "";
  return (
    <div ref={ref} className={`${styles.logo} ${poppins.className} ${state} ${className}`} role="img" aria-label="Coco Local">
      <svg className={styles.basket} viewBox="14 212 340 298" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round">
          <path className={styles.p1} pathLength={1} d="M120 232 L73 312" />
          <path className={styles.p2} pathLength={1} d="M246 232 L293 312" />
          <rect className={styles.p3} pathLength={1} x="26" y="324" width="314" height="38" rx="19" />
          <path className={styles.p4} pathLength={1} d="M45 362 L67 470 Q73 498 102 498 L264 498 Q293 498 299 470 L321 362" />
          <path className={styles.p5} pathLength={1} d="M120 411 V452" strokeWidth="26" />
          <path className={styles.p6} pathLength={1} d="M183 411 V452" strokeWidth="26" />
          <path className={styles.p7} pathLength={1} d="M246 411 V452" strokeWidth="26" />
        </g>
      </svg>
      <span className={styles.word} aria-hidden="true">
        {LETTERS.map((ch, i) => (
          <span key={i} className={styles.letter} style={{ animationDelay: `${0.62 + i * 0.055}s` }}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </div>
  );
}
