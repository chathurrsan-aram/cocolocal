import type { Metadata } from "next";
import Link from "next/link";
import { outcomes, wheelConfig } from "@/data/wheel";
import { shop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Coco Wheel terms (draft)",
  robots: { index: false, follow: true },
  alternates: { canonical: "/wheel/terms" },
};

const prizes = outcomes.filter(o => o.kind === "prize");
const pct = (id: string) => outcomes.find(o => o.id === id)!.percent;

export default function WheelTerms() {
  return (
    <article className="wrap legal-draft">
      <p className="eyebrow">COCO WHEEL</p>
      <h1>Terms and conditions</h1>
      <p className="draft-banner">DRAFT for review, not yet in force. For the owner to check against the CAP Code, section 8 (promotional marketing), especially 8.17 (significant conditions), 8.18 to 8.20 (prize promotions and winners) and 8.28 (prize draws and instant wins). Items in [square brackets] need confirming.</p>

      <h2>1. Promoter</h2>
      <p>The promoter is {shop.name}, {shop.address}. Contact: <a href={`mailto:${shop.email}`}>{shop.email}</a> or <a href={shop.telephone}>{shop.phone}</a>.</p>

      <h2>2. Who can take part</h2>
      <p>UK residents aged {wheelConfig.minimumAge} or over. [Confirm whether staff and their immediate families are excluded.] We may ask for proof of age before handing over a prize.</p>

      <h2>3. How to enter (no purchase needed)</h2>
      <ul>
        <li>Go to <Link href="/wheel">cocolocal.co.uk/wheel</Link>, enter your first name and either your email address or your UK mobile number, and spin. This is online only.</li>
        <li><strong>Free entry:</strong> everyone gets one free spin per person each week, with no purchase needed. A week runs from Monday 00:00 to Sunday 23:59, UK time. The weekly limit applies per email address or mobile number, and we may also limit free spins to one per device each week.</li>
        <li><strong>Bonus spins:</strong> spend over {wheelConfig.bonusMinimumSpend} in one transaction in store and ask at the till for a bonus code. Each code gives one extra spin, can be used once and lasts {wheelConfig.bonusValidDays} days. [Confirm what counts towards the {wheelConfig.bonusMinimumSpend} spend.] Your chances are the same on a free spin and a bonus spin.</li>
        <li><strong>Spin again:</strong> if the wheel lands on “Spin again”, you get one more spin straight away. That second spin can’t land on “Spin again”.</li>
        <li>One entry per spin. Entries made using false details, several email addresses or numbers, automated means or tampering will not count, and any prize may be withheld.</li>
      </ul>

      <h2>4. Prizes and chances</h2>
      <p>The result of each spin is chosen at random by our server before the wheel moves. The animation only shows that result. The chances on each spin are:</p>
      <ul>
        {prizes.map(p => <li key={p.id}><strong>{p.label}</strong> ({p.percent}%): {p.claim} {p.conditions}</li>)}
        <li><strong>Spin again</strong> ({pct("spin-again")}%): one extra spin.</li>
        <li><strong>Not this time</strong> ({pct("not-this-time")}%): no prize.</li>
      </ul>
      <p>The overall chance of a prize on a single spin is {prizes.reduce((s, p) => s + p.percent, 0)}%. Including the extra “Spin again” spin, it is about 16.5% per turn. There is no limit on the total number of prizes. [Confirm, or set a weekly cap and say what happens once it is reached.] No prize involves alcohol, tobacco, vapes or any age-restricted product.</p>

      <h2>5. Claiming a prize</h2>
      <ul>
        <li>Winners see a prize code on screen (for example COCO-7K2P). Save it: download the image, send it to yourself on WhatsApp or take a screenshot. We do not email or text codes.</li>
        <li>Show the code at the till at {shop.address} within {wheelConfig.prizeValidDays} days (the exact time is shown with your code), during opening hours. Each code can be used once.</li>
        <li>Prizes are subject to availability. If a prize item is unavailable, we will offer a similar item of equal or greater value.</li>
        <li>There is no cash alternative. Prizes can’t be exchanged, transferred or used with other offers [confirm], and they can’t be replaced if the code is lost or expires.</li>
      </ul>

      <h2>6. General</h2>
      <ul>
        <li>We may change, suspend or end the promotion at any time if we need to, for reasons outside our reasonable control or to stop misuse. Any valid prize codes already issued will be honoured until they expire. [Confirm the end date or say that it is ongoing.]</li>
        <li>We are not responsible for entries that fail because of technical problems, but we will act fairly if something goes wrong.</li>
        <li>Nothing in these terms affects your statutory rights.</li>
        <li>How we use your details is explained in the <Link href="/wheel/privacy">Coco Wheel privacy notice</Link>.</li>
        <li>These terms are governed by the law of England and Wales.</li>
      </ul>
    </article>
  );
}
