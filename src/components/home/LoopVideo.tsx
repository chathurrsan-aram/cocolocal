"use client";

import { useEffect, useRef } from "react";

type LoopVideoProps = {
  name: string;
  width: number;
  height: number;
  loop?: boolean;
  className?: string;
};

// Muted decorative clip from public/video/. Nothing downloads until it is on screen;
// it pauses off screen and never plays when the visitor prefers reduced motion
// (the poster frame shows instead).
export default function LoopVideo({ name, width, height, loop = true, className }: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!loop && video.ended) return;
        video.play().catch(() => {});
      } else video.pause();
    }, { threshold: 0.4 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [loop]);
  return (
    <video
      ref={ref}
      className={className}
      width={width}
      height={height}
      poster={`/video/${name}-poster.webp`}
      muted
      loop={loop}
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={`/video/${name}.webm`} type="video/webm" />
      <source src={`/video/${name}.mp4`} type="video/mp4" />
    </video>
  );
}
