import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { wheelConfig } from "@/data/wheel";

// The Coco Wheel strip on the homepage. While the wheel is coming soon (wheelConfig.comingSoon)
// the poster sits under a see-through "Coming soon" layer and nothing links to /wheel.
export default function WheelSoon() {
  const soon = wheelConfig.comingSoon;
  return (
    <section className={`wrap wheel-soon ${soon ? "is-soon" : ""}`} aria-labelledby="wheel-strip-title">
      <div className="wheel-soon-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wheel/hero-poster.webp"
          width={540}
          height={840}
          loading="lazy"
          decoding="async"
          alt="The Coco Wheel: a prize wheel with coffee, slushie, hot chocolate and snack prizes"
        />
        {soon && <span className="wheel-soon-tag" aria-hidden="true">Soon</span>}
      </div>
      <div>
        <span className="sticker">{soon ? "Coming soon" : "New"}</span>
        <h2 id="wheel-strip-title">{soon ? "The Coco Wheel is coming." : "Spin the Coco Wheel."}</h2>
        <p>{soon
          ? "One free spin a week to win a free coffee, slushie, hot chocolate or a little treat. Opening soon at Coco Local."
          : "One free spin a week. Win a free coffee, slushie, hot chocolate or a little treat to collect in store. No purchase needed."}</p>
      </div>
      {!soon && <Link href="/wheel" className="button on-dark">Spin the wheel <ArrowRight size={18} aria-hidden="true" /></Link>}
    </section>
  );
}
