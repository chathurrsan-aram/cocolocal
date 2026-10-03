"use client";

import { useState } from "react";
import { shop } from "@/lib/shop";
import styles from "./FollowButtons.module.css";

// Instagram / Facebook buttons with the motion kit's "Follow → ✓" morph on tap.
// Uses Meta's official icons unchanged (public/brand, scaled only). The site can't
// know whether someone followed, so the second state says "See you there".
const LINKS = [
  { id: "instagram", href: shop.instagram, icon: "/brand/instagram-glyph-white-96.png", label: "Follow", handle: "@cocolocal_", name: "Instagram" },
  { id: "facebook", href: shop.facebook, icon: "/brand/facebook-logo-primary-96.png", label: "Follow", handle: "Coco Local", name: "Facebook" },
] as const;

export default function FollowButtons({ className = "" }: { className?: string }) {
  const [tapped, setTapped] = useState<string | null>(null);
  return (
    <div className={`${styles.row} ${className}`}>
      {LINKS.map(l => (
        <a
          key={l.id}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${tapped === l.id ? styles.done : ""}`}
          onClick={() => setTapped(l.id)}
          aria-label={`Follow Coco Local on ${l.name} (${l.handle}), opens in a new tab`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.icon} alt="" width={24} height={24} className={styles.icon} />
          <span className={styles.text}>
            <span className={styles.a}>{l.label} <strong>{l.handle}</strong></span>
            <span className={styles.b} aria-hidden="true">See you there
              <svg viewBox="0 0 24 24" className={styles.check}><path d="M5 12.5l4.2 4.2L19 7" pathLength={1} /></svg>
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
