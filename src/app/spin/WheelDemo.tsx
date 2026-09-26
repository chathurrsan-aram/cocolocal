"use client";

import { useState, useEffect, useRef } from "react";
export default function WheelDemo() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1000);
  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "coco-wheel-size") return;
      const next = Number(event.data.height);
      if (Number.isFinite(next) && next >= 400 && next <= 2400) setHeight(next + 10);
    };
    window.addEventListener("message", resize);
    return () => window.removeEventListener("message", resize);
  }, []);
  return <section className="wheel-unlocked"><h1 className="sr-only">Coco Local daily spin</h1><div className="wrap wheel-toolbar"><span>Wheel demo · results are not redeemable</span></div><iframe ref={frame} style={{height}} title="Coco Local daily spin demo" src="/wheel-demo.html" sandbox="allow-scripts allow-same-origin" className="wheel-frame"/></section>;
}
