import type { Metadata } from "next";
import Link from "next/link";
import { outcomes, wheelConfig } from "@/data/wheel";
import HeroVideo from "./HeroVideo";
import WheelExperience from "./WheelExperience";

export const metadata: Metadata = {
  title: "Spin the Coco Wheel",
  description: "One free spin every week at Coco Local, South Benfleet. Win a free coffee, slushie, hot chocolate or a little treat. No purchase needed.",
  alternates: { canonical: "/wheel" },
  openGraph: { title: "Spin the Coco Wheel", description: "One free spin every week. No purchase needed.", url: "/wheel", images: [{ url: "/wheel/og.jpg", width: 1200, height: 630, alt: "The Coco Wheel" }] },
  twitter: { card: "summary_large_image", images: ["/wheel/og.jpg"] },
};

const prizes = outcomes.filter(o => o.kind === "prize");

export default function WheelPage() {
  return <>
    <section className="wrap wheel-hero">
      <div className="wheel-hero-copy">
        <p className="eyebrow">NEW AT COCO LOCAL</p>
        <h1>Spin the <span>Coco Wheel</span></h1>
        <p className="intro">One free spin every week. No purchase needed. Win a free coffee, slushie, hot chocolate or a little treat, then collect it in store.</p>
        <div className="actions"><a href="#spin" className="button">Spin now ↓</a><a href="#how-it-works" className="button secondary">How it works</a></div>
        <p className="wheel-small">{wheelConfig.minimumAge}+. Online only. Prizes are collected at 210 High Road within {wheelConfig.prizeValidDays} days.</p>
      </div>
      <HeroVideo />
    </section>

    <WheelExperience />

    <section id="how-it-works" className="wrap section wheel-info">
      <div>
        <p className="eyebrow">HOW IT WORKS</p>
        <h2>Simple, fair, once a week.</h2>
        <ol className="wheel-steps">
          <li><strong>Enter your first name and email or mobile.</strong> We use it to keep it to one free spin per person each week (Monday to Sunday, UK time).</li>
          <li><strong>Spin.</strong> The result is picked securely on our server before the wheel moves. Land on “Spin again” and you get one more go.</li>
          <li><strong>Won something?</strong> You’ll get a code like COCO-7K2P. Show it at the till within {wheelConfig.prizeValidDays} days. Save the image, send it to yourself on WhatsApp or take a screenshot.</li>
          <li><strong>Want another go?</strong> Spend over {wheelConfig.bonusMinimumSpend} in store and ask at the till for a bonus code. Each code gives one extra spin.</li>
        </ol>
      </div>
      <div className="odds-card">
        <h3>Prizes and chances on each spin</h3>
        <table>
          <tbody>
            {prizes.map(p => <tr key={p.id}><th scope="row">{p.label}</th><td>{p.percent}%</td></tr>)}
            <tr className="sum"><th scope="row">Any prize</th><td>{prizes.reduce((s, p) => s + p.percent, 0)}%</td></tr>
            <tr><th scope="row">Spin again</th><td>{outcomes.find(o => o.id === "spin-again")!.percent}%</td></tr>
            <tr><th scope="row">Not this time</th><td>{outcomes.find(o => o.id === "not-this-time")!.percent}%</td></tr>
          </tbody>
        </table>
        <p className="wheel-small">Including the one extra go from “Spin again”, the chance of winning a prize on a turn is about 16.5%. No cash alternative. <Link href="/wheel/terms">Full terms (draft)</Link> · <Link href="/wheel/privacy">Privacy (draft)</Link></p>
      </div>
    </section>
  </>;
}
