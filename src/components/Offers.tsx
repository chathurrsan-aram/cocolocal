"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const offers = [
  {
    id: "yazoo", title: "YAZOO Inspired", price: "Buy one, get one free",
    detail: "300ml milkshakes · varieties as stocked.",
    terms: "9 September–6 October 2026. Subject to availability.",
    starts: "2026-09-08T23:00:00Z", ends: "2026-10-06T23:00:00Z",
  },
  {
    id: "beer650", title: "Selected four-can packs", price: "£6.50 per pack",
    detail: "Poretti, Guinness Draught, Red Stripe or Desperados Original.",
    terms: "Selected packs shown. 18+ · Please drink responsibly.",
  },
  {
    id: "beer750", title: "Four pint cans", price: "£7.50 per pack",
    detail: "Heineken, Stella Artois, Budweiser or 1664 Bière.",
    terms: "Selected packs shown. 18+ · Please drink responsibly.",
  },
  {
    id: "wine849", title: "La Vieille Ferme", price: "£8.49 per bottle",
    detail: "White or Rosé · 75cl.",
    terms: "Selected bottles shown. 18+ · Please drink responsibly.",
  },
  {
    id: "wine700", title: "McGuigan Black Label", price: "£7 per bottle",
    detail: "Merlot or Red · 75cl.",
    terms: "Selected bottles shown. 18+ · Please drink responsibly.",
  },
  {
    id: "spirits", title: "Familiar favourites", price: "£9.49 each · 35cl",
    detail: "Captain Morgan Spiced Gold or Gordon’s Gin. £1 below the £10.49 marked price.",
    terms: "Selected bottles shown. 18+ · Please drink responsibly.",
  },
];

export default function Offers() {
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<(typeof offers)[number] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const active = offers.filter(offer => (!offer.starts || now >= Date.parse(offer.starts)) && (!offer.ends || now < Date.parse(offer.ends)));
  return (
    <section id="offers" className="offers-section">
      <div className="wrap section">
        <div className="section-heading">
          <div><p className="eyebrow">A LITTLE LOCAL VALUE</p><h2>Offers worth popping in for.</h2></div>
          <p className="offers-intro">Find these offers in store.<br/>Select a design for a closer look.</p>
        </div>
        <div className="offers-grid">
          {active.map(offer => (
            <article className="offer-card" key={offer.id}>
              <button className="offer-art" aria-label={`Enlarge ${offer.title} offer`} onClick={() => {setSelected(offer); dialog.current?.showModal();}}>
                <Image src={`/images/offers/${offer.id}.webp`} alt={`${offer.title}: ${offer.price}`} fill sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 380px"/>
              </button>
              <div className="offer-copy"><h3>{offer.title}</h3><p className="offer-price">{offer.price}</p><p>{offer.detail}</p><p className="offer-terms">{offer.terms}</p></div>
            </article>
          ))}
        </div>
        <p className="offers-footnote">Offers are subject to availability. Please check in store for current stock and prices.</p>
      </div>
      <dialog ref={dialog} className="photo-dialog offer-dialog" aria-label={selected ? `${selected.title} offer` : "Offer details"} onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}>
        <button className="dialog-close" autoFocus onClick={() => dialog.current?.close()}>Close ×</button>
        {selected && <><div className="offer-full"><Image src={`/images/offers/${selected.id}.webp`} alt={`${selected.title}: ${selected.price}. ${selected.detail} ${selected.terms}`} fill sizes="(max-width: 960px) 90vw, 860px"/></div><p>{selected.title} · {selected.price}</p></>}
      </dialog>
    </section>
  );
}
