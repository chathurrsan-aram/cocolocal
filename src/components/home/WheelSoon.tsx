import Link from "next/link";
import { ArrowRight } from "lucide-react";
// The Coco Wheel is live at /wheel (one free spin a week, no purchase needed).
export default function WheelSoon() {
  return (
    <section className="wrap wheel-soon" aria-labelledby="wheel-strip-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wheel/hero-poster.webp"
        width={540}
        height={840}
        loading="lazy"
        decoding="async"
        alt="The Coco Wheel: a prize wheel with coffee, slushie, hot chocolate and snack prizes"
      />
      <div>
        <span className="sticker">New</span>
        <h2 id="wheel-strip-title">Spin the Coco Wheel.</h2>
        <p>One free spin a week. Win a free coffee, slushie, hot chocolate or a little treat to collect in store. No purchase needed.</p>
      </div>
      <Link href="/wheel" className="button on-dark">Spin the wheel <ArrowRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}
