"use client";

// Muted, looping hero clip (Higgsfield concept artwork, trimmed). Reduced motion or
// Save-Data: poster image only, and the video file is never requested. With a mouse, the
// card tilts towards the pointer and a soft sheen follows it.
import { useEffect, useRef, useState } from "react";

export default function HeroVideo() {
  const [play, setPlay] = useState(false);
  const [tilt, setTilt] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setPlay(!reduce && !saveData);
    setTilt(!reduce && window.matchMedia("(pointer: fine)").matches);
  }, []);
  const move = (e: React.PointerEvent) => {
    if (!tilt || !el.current) return;
    const r = el.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.current.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.current.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    el.current.style.setProperty("--mx", `${x * 100}%`);
    el.current.style.setProperty("--my", `${y * 100}%`);
  };
  const leave = () => { el.current?.style.setProperty("--ry", "0deg"); el.current?.style.setProperty("--rx", "0deg"); };
  return (
    <div className="wheel-hero-frame">
      <div ref={el} className={`wheel-hero-media ${tilt ? "can-tilt" : ""}`} onPointerMove={move} onPointerLeave={leave}>
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
    </div>
  );
}
