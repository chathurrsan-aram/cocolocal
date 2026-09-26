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
    <WheelExperience />

    <section id="how-it-works" className="wrap section wheel-info" aria-labelledby="how-title">
      <div>
        <h2 id="how-title">Simple, fair, once a week.</h2>
        <ol className="wheel-steps">
          <li><span><strong>Tell us your first name and an email or mobile.</strong> It keeps it to one free spin per person each week (Monday to Sunday, UK time).</span></li>
          <li><span><strong>Pull the lever.</strong> The result is picked securely on our server before the wheel moves. Land on “Spin again” and you get one more go.</span></li>
          <li><span><strong>Won something?</strong> You’ll get a code like COCO-7K2P. Show it at the till within {wheelConfig.prizeValidDays} days. Save the image, send it to yourself on WhatsApp or take a screenshot.</span></li>
          <li><span><strong>Want another go?</strong> Spend over {wheelConfig.bonusMinimumSpend} in store and ask at the till for a bonus code. Each code gives one extra spin.</span></li>
        </ol>
      </div>
      <div className="wheel-video"><HeroVideo /></div>
    </section>

    <section className="wrap section wheel-odds" aria-labelledby="odds-title">
      <div>
        <h2 id="odds-title">Prizes and chances.</h2>
        <p>The chance on every spin, for everyone. Including the one extra go from “Spin again”, the chance of a prize on a turn is about 16.5%. No cash alternative.</p>
        <p className="wheel-small"><Link href="/wheel/terms">Full terms (draft)</Link> · <Link href="/wheel/privacy">Privacy notice (draft)</Link></p>
      </div>
      <div className="odds-card">
        <table>
          <caption className="sr-only">Prizes and the chance of each on one spin</caption>
          <tbody>
            {prizes.map(p => <tr key={p.id}><th scope="row">{p.label}</th><td>{p.percent}%</td></tr>)}
            <tr className="sum"><th scope="row">Any prize</th><td>{prizes.reduce((s, p) => s + p.percent, 0)}%</td></tr>
            <tr><th scope="row">Spin again</th><td>{outcomes.find(o => o.id === "spin-again")!.percent}%</td></tr>
            <tr><th scope="row">Not this time</th><td>{outcomes.find(o => o.id === "not-this-time")!.percent}%</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </>;
}
