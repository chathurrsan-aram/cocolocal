"use client";

import { useEffect, useRef, useState } from "react";

// True once the element has scrolled into view (never flips back).
// `armed` is false until the component has mounted, so the server render and
// visitors without JavaScript always see the finished state.
export function useInViewOnce<T extends Element>(threshold = 0.4) {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    setArmed(true);
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, armed, inView };
}
