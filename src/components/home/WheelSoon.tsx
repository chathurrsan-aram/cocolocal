import Link from "next/link";
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
        <p className="eyebrow">New · one free spin a week</p>
        <h2 id="wheel-strip-title">Spin the Coco Wheel.</h2>
        <p>Win a free coffee, slushie, hot chocolate or a little treat to collect in store. No purchase needed.</p>
        <Link href="/wheel" className="text-link">Spin the Coco Wheel →</Link>
      </div>
    </section>
  );
}
