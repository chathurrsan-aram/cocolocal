import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Photo from "./Photo";
import LoopVideo from "./LoopVideo";
import { standingPromos } from "@/data/offers";

export default function Slushies() {
  const friday = standingPromos.find(p => p.id === "slushie-friday");
  return (
    <section className="slushies" id="slushies" aria-labelledby="slushies-title">
      <div className="wrap slushies-grid">
        <div className="slushies-media">
          <div className="slushies-photo"><Photo name="slushie-03" sizes="(max-width: 899px) calc(100vw - 32px), 460px" /></div>
          <figure className="slushies-loop">
            <LoopVideo name="slushie-loop" width={540} height={676} />
            <figcaption>Illustration</figcaption>
          </figure>
        </div>
        <div className="slushies-copy">
          <h2 id="slushies-title">Coco’s slushies.</h2>
          <p>Poured from the machine by the door. Ask at the counter for today’s flavours.</p>
          {friday && <div className="slushies-friday">
            <p className="slushies-friday-title">{friday.title}</p>
            <p className="slushies-friday-headline">{friday.headline}</p>
            <p>{friday.detail}</p>
          </div>}
          <Link href="/products#slushies" className="text-link">Slushies & soft drinks <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
