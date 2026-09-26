import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Photo from "./Photo";
import type { PhotoName } from "@/data/homePhotos";
import { ALCOHOL_NOTE } from "@/data/offers";

// "Walk through the shop": the order you meet things walking in from High Road.
// Desktop with scroll-driven animation support: a pinned stage that zooms through
// the door, then cross-fades along the aisles (pure CSS, see .walk in globals.css).
// Phones: a simpler stacked walk with gentle reveals. Reduced motion or older
// browsers: a static stacked gallery. Same markup for all three.
const scenes: { photo: PhotoName; title: string; text: string; kind?: "door" | "inside" }[] = [
  { photo: "hero-shopfront-01", kind: "door", title: "Come on in", text: "Through the front doors on High Road." },
  { photo: "chillers-03", kind: "inside", title: "Step inside", text: "One bright, open floor. Everything is a few steps away." },
  { photo: "aisle-01", title: "Snacks & sweets", text: "Crisps, chocolate and sweets on the low displays by the door." },
  { photo: "chillers-02", title: "Chillers & drinks", text: "Cold drinks, milk and chilled essentials along the side wall." },
  { photo: "chillers-04", title: "Wine, beer & spirits", text: `Beer, cider and wine in the chillers, spirits behind the counter. ${ALCOHOL_NOTE}` },
  { photo: "groceries-02", title: "Groceries & world foods", text: "Cupboard staples, sauces and world foods down the middle aisles." },
  { photo: "household-04", title: "Household & pet", text: "Cleaning, laundry, toiletries and pet food towards the back." },
  { photo: "slushie-01", title: "Coco’s slushies", text: "And on your way out, the slushie machine by the door." },
];

// Scroll ranges (percent of the pinned section) for each scene after the door.
const START = 26, STEP = 11.6, LENGTH = 16;
const range = (i: number): CSSProperties => {
  if (i === 0) return { "--a": "0%", "--b": "18%" } as CSSProperties;
  if (i === 1) return { "--a": "14%", "--b": "30%" } as CSSProperties;
  const a = START + (i - 2) * STEP;
  return { "--a": `${a.toFixed(1)}%`, "--b": `${Math.min(a + LENGTH, 100).toFixed(1)}%` } as CSSProperties;
};

export default function ShopWalk() {
  const stops = scenes.slice(2);
  return <>
    <section id="walk" className="walk" aria-labelledby="walk-title">
      <div className="walk-stage">
        <div className="walk-intro">
          <h2 id="walk-title">Walk through the shop.</h2>
          <p>From the front door to the back shelves, in photos taken in store.</p>
        </div>
        {scenes.map((s, i) => (
          <figure key={s.photo} className={`walk-scene${s.kind ? ` walk-${s.kind}` : ""}${i === scenes.length - 1 ? " walk-last" : ""}`} style={range(i)}>
            <div className="walk-photo"><Photo name={s.photo} sizes="(max-width: 899px) calc(100vw - 32px), (max-width: 1500px) 80vw, 100vw" lowPriority /></div>
            <figcaption className="walk-caption"><h3>{s.title}</h3><p>{s.text}</p></figcaption>
          </figure>
        ))}
        <ol className="walk-rail" aria-hidden="true">
          {stops.map((s, i) => <li key={s.photo} style={range(i + 2)}>{s.title}</li>)}
        </ol>
      </div>
    </section>
    <div className="wrap walk-after">
      <Link href="/products" className="text-link">See everything we stock <ArrowUpRight size={16} aria-hidden="true" /></Link>
    </div>
  </>;
}
