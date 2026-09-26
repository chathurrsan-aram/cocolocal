import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { standingPromos } from "@/data/offers";

export default function Slushies() {
  const friday = standingPromos.find(p => p.id === "slushie-friday");
  return (
    <section className="slushies chill-break" id="slushies" aria-labelledby="slushies-title">
      <div className="wrap">
        <div className="chill-break-heading"><div><p className="eyebrow">A LITTLE COLOUR. A LITTLE COCO.</p><h2 id="slushies-title">Take a little chill break.</h2></div><Link href="/products#slushies" className="text-link">Slushies & soft drinks <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        <div className="chill-break-media">
          <figure className="chill-break-art"><Image src="/images/home/chill-break.webp" alt="Take a little chill break. Big colour. Ice-cold happiness. Coco’s red and blue slushie, available in store at 210 High Road, South Benfleet." width={1080} height={1350} sizes="(max-width: 700px) 90vw, 600px" /></figure>
          <figure className="chill-break-film"><video controls playsInline preload="none" poster="/video/slushie-counter-poster.webp" width={720} height={1280} aria-label="Coco’s slushie lands on the counter in a colourful short film"><source src="/video/slushie-counter.mp4" type="video/mp4" /><a href="/video/slushie-counter.mp4">Watch the slushie film</a></video><figcaption>Press play for a little colour. Promotional film.</figcaption></figure>
        </div>
        {friday && <div className="chill-break-promo"><strong>{friday.title} · {friday.headline}</strong><p>{friday.detail}</p></div>}
      </div>
    </section>
  );
}
