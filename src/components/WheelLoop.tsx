"use client";

import { useEffect, useRef, useState } from "react";

// Silent looping Coco Wheel clips from the motion kit (public/video/wheel/).
// Plays only while on screen; people who prefer reduced motion get the still poster instead.
const CLIPS = {
  "how-to-enter": {
    src: "/video/wheel/how-to-enter.mp4",
    poster: "/video/wheel/how-to-enter-poster.webp",
    label: "How to spin the Coco Wheel: tap the link in our bio, choose Spin the Coco Wheel, pull the lever and add your name, then show your code at the till.",
  },
  win: {
    src: "/video/wheel/win.mp4",
    poster: "/video/wheel/win-poster.webp",
    label: "The Coco Wheel lever is pulled, the wheel spins and lands on Free hot chocolate, with a code to show at the till within 7 days.",
  },
} as const;

interface WheelLoopProps {
  clip: keyof typeof CLIPS;
  className?: string;
}

export default function WheelLoop({ clip, className = "" }: WheelLoopProps) {
  const { src, poster, label } = CLIPS[clip];
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.35 });
    io.observe(video);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <figure className={className} style={{ margin: 0, aspectRatio: "4 / 5", maxWidth: "100%" }}>
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={label} width={720} height={900} style={{ width: "100%", height: "auto", borderRadius: 20 }} />
      ) : (
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          width={720}
          height={900}
          aria-label={label}
          style={{ width: "100%", height: "auto", borderRadius: 20, display: "block" }}
        />
      )}
    </figure>
  );
}
