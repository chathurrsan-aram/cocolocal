import type { Metadata } from "next";
import Link from "next/link";
import { wheelConfig } from "@/data/wheel";
import { shop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Coco Wheel privacy notice (draft)",
  robots: { index: false, follow: true },
  alternates: { canonical: "/wheel/privacy" },
};

export default function WheelPrivacy() {
  return (
    <article className="wrap legal-draft">
      <p className="eyebrow">COCO WHEEL</p>
      <h1>Privacy notice</h1>
      <p className="draft-banner">DRAFT for review, not yet in force. Items in [square brackets] need confirming.</p>

      <h2>Who we are</h2>
      <p>{shop.name}, {shop.address}, is responsible for the details you give us on the Coco Wheel. Contact: <a href={`mailto:${shop.email}`}>{shop.email}</a> or <a href={shop.telephone}>{shop.phone}</a>.</p>

      <h2>What we collect and why</h2>
      <ul>
        <li><strong>Your first name and your email address or mobile number.</strong> We use these to run the promotion: to keep it to one free spin per person each week and to link any prize code to a person. Lawful basis: our legitimate interest in running a fair promotion, and taking steps at your request.</li>
        <li><strong>A random device ID in a cookie and your IP address.</strong> We use these for the one-free-spin-per-device check and to stop misuse (rate limiting). The cookie is strictly necessary for the promotion to work. Lawful basis: legitimate interests.</li>
        <li><strong>Spin results and prize codes.</strong> We use these to check and redeem prizes at the till and to count totals for each week.</li>
        <li><strong>Marketing (only if you tick the box).</strong> We may send you Coco Local offers and news by the method you chose. This is optional and separate: you can spin without it. Lawful basis: your consent. You can withdraw it at any time by replying STOP, using the unsubscribe link or contacting us.</li>
      </ul>
      <p>Your email address and number are not stored as keys in our database. We store them only in your entrant record, and we use a one-way code (a hash) to recognise repeat entries. We don’t sell your details or share them for other companies’ marketing.</p>

      <h2>Where it’s stored</h2>
      <p>On our website host (Vercel) and our database provider (Upstash). [Confirm the regions and add any other processors.] Prize codes are not emailed or texted: winners save them on their own device.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Your entrant details: {wheelConfig.retentionMonths} months after your latest spin, then deleted automatically.</li>
        <li>Weekly spin records: about 8 days. Prize codes: {wheelConfig.prizeValidDays + wheelConfig.prizeRecordGraceDays} days after they are issued. Weekly totals (no personal details) and a list of winning codes, prizes and dates (no names or contact details) may be kept longer for our records.</li>
      </ul>

      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete your details, or object to how we use them, by emailing <a href={`mailto:${shop.email}`}>{shop.email}</a> or asking in store. Tell us the email address or mobile number you used. If you’re unhappy with how we handle your details you can complain to the Information Commissioner’s Office (ico.org.uk).</p>
      <p>See also the <Link href="/wheel/terms">Coco Wheel terms</Link>.</p>
    </article>
  );
}
