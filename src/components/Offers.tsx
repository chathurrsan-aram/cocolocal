"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { offers, standingPromos, activeOffers, ALCOHOL_NOTE, type Offer } from "@/data/offers";

const terms = (o: Offer) => [o.terms, o.alcohol && ALCOHOL_NOTE].filter(Boolean).join(" ");

export default function Offers() {
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<Offer | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const active = activeOffers(offers, now);
  const standing = activeOffers(standingPromos, now);
  return (
    <section id="offers" className="offers-section" aria-labelledby="offers-title">
      <div className="wrap section">
        <div className="section-heading">
          <div><p className="eyebrow">This week at Coco Local</p><h2 id="offers-title">Offers worth popping in for.</h2></div>
          <p className="offers-intro">All offers are in store only.</p>
        </div>
        <ul className="promo-row" aria-label="Every week">
          {standing.map(p => (
            <li key={p.id} className={`promo`}>
              <p className="promo-title">{p.title}</p>
              <p className="promo-headline">{p.headline}</p>
              <p className="promo-detail">{p.detail}{p.terms && <> {p.terms}</>}</p>
            </li>
          ))}
        </ul>
        {active.length > 0 && <>
          <h3 className="offers-subhead">Current deals</h3>
          <div className="offers-grid">
            {active.map(offer => (
              <article className="offer-card" key={offer.id}>
                {offer.image && <button className="offer-art" aria-label={`Enlarge ${offer.title} offer artwork`} onClick={() => {setSelected(offer); dialog.current?.showModal();}}>
                  <Image src={`/images/offers/${offer.image}.webp`} alt={`${offer.title}: ${offer.headline}`} fill sizes="(max-width: 700px) 44vw, (max-width: 1000px) 30vw, 200px"/>
                </button>}
                <div className="offer-copy"><h4>{offer.title}</h4><p className="offer-price">{offer.headline}</p><p>{offer.detail}</p>{terms(offer) && <p className="offer-terms">{terms(offer)}</p>}</div>
              </article>
            ))}
          </div>
        </>}
        <p className="offers-footnote">Offers are subject to availability. Please check in store for current stock and prices.</p>
      </div>
      <dialog ref={dialog} className="photo-dialog offer-dialog" aria-label={selected ? `${selected.title} offer` : "Offer details"} onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}>
        <button className="dialog-close" autoFocus onClick={() => dialog.current?.close()}>Close ×</button>
        {selected?.image && <><div className="offer-full"><Image src={`/images/offers/${selected.image}.webp`} alt={`${selected.title}: ${selected.headline}. ${selected.detail} ${terms(selected)}`} fill sizes="(max-width: 960px) 90vw, 860px"/></div><p>{selected.title} · {selected.headline}</p></>}
      </dialog>
    </section>
  );
}
