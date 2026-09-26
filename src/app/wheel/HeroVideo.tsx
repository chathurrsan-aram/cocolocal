"use client";

// Muted, looping hero clip (Higgsfield concept artwork, trimmed). Reduced motion or
// Save-Data: poster image only, and the video file is never requested.
import { useEffect, useState } from "react";

export default function HeroVideo() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setPlay(!reduce && !saveData);
  }, []);
  return (
    <div className="wheel-hero-media">
      {play ? (
        <video autoPlay muted loop playsInline poster="/wheel/hero-poster.webp" aria-hidden="true" width={540} height={840}>
          <source src="/wheel/hero.webm" type="video/webm" />
          <source src="/wheel/hero.mp4" type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/wheel/hero-poster.webp" alt="" width={540} height={840} />
      )}
      <span className="photo-tag">Illustration</span>
    </div>
  );
}
