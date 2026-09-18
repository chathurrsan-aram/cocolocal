"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ShopImage from "./ShopImage";

const areas = [
  { id: "front", label: "Front displays", number: "1", image: "snacks", x: 29, y: 56, title: "A little treat, right up front", description: "The two low displays near the entrance hold snacks and confectionery. Here’s the real view of those shelves.", range: "snacks" },
  { id: "middle", label: "Grocery aisles", number: "2", image: "grocery", x: 49, y: 27, title: "Explore the grocery aisles", description: "The taller middle rows bring together cupboard staples and everyday groceries. This photo gives you a closer look down the aisle.", range: "world-foods" },
  { id: "household", label: "Household shelves", number: "3", image: "household", x: 72, y: 17, title: "The useful little things", description: "Towards the back of the customer area, discover household supplies and the crockery end display shown in this real shop photograph.", range: "household" },
  { id: "chilled", label: "Chilled essentials", number: "4", image: "chilled", x: 24, y: 23, title: "A top-up for the fridge", description: "The long chiller run sits along the side of the shop. Find milk, chilled drinks and other everyday essentials here.", range: "groceries" },
  { id: "entrance", label: "Slushie stop", number: "5", image: "slush", x: 9, y: 47, title: "Take a little chill break", description: "The slushie machine is near the entrance. Pick up a Coco’s slushie while you’re having a look around.", range: "slushies" },
];

export default function ShopExplorer() {
  const [selected, setSelected] = useState(areas[0]);
  return (
    <section className="wrap section shop-explorer" id="look-around" aria-labelledby="explorer-title">
      <div className="section-heading"><div><p className="eyebrow">FROM THE PLAN TO THE REAL THING</p><h2 id="explorer-title">Get to know your local.</h2></div><p className="offers-intro">Choose an area. See it in real life.</p></div>
      <div className="explorer-controls" aria-label="Shop areas">{areas.map(area => <button key={area.id} aria-pressed={selected.id === area.id} aria-controls="explorer-photo" onClick={() => setSelected(area)}><span>{area.number}</span>{area.label}</button>)}</div>
      <div className="explorer-grid">
        <div className="explorer-plan"><p className="explorer-label">THE 3D PLAN</p><div className="plan-image"><Image src="/images/shop/layout.svg" alt="Illustrative shop layout: two low front displays, two taller middle units and a household unit towards the back" fill unoptimized/>{areas.map(area => <button key={area.id} className={`plan-hotspot ${selected.id === area.id ? "selected" : ""}`} style={{left:`${area.x}%`,top:`${area.y}%`}} aria-label={`Show ${area.label}`} aria-pressed={selected.id === area.id} onClick={() => setSelected(area)}>{area.number}</button>)}</div><p className="plan-note">Entrance on the left · Illustrative layout, not to scale. Stock and displays can change.</p></div>
        <div className="explorer-photo" id="explorer-photo" aria-live="polite"><p className="explorer-label">IN REAL LIFE · {selected.label}</p><ShopImage name={selected.image} alt={selected.description}/><div className="explorer-caption"><h3>{selected.title}</h3><p>{selected.description}</p><Link className="text-link" href={`/products#${selected.range}`}>Explore this range →</Link></div></div>
      </div>
    </section>
  );
}
