import { preload } from "react-dom";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, RotateCw } from "lucide-react";
import Photo from "./Photo";
import Hours from "@/components/Hours";
import { photoSources } from "@/data/homePhotos";
import { shop } from "@/lib/shop";

const HERO = "chillers-03" as const;
const HERO_SIZES = "(max-width: 899px) calc(100vw - 32px), 50vw";

export default function Hero() {
  const { src, srcSet } = photoSources(HERO);
  preload(src, { as: "image", imageSrcSet: srcSet, imageSizes: HERO_SIZES, fetchPriority: "high" });
  return (
    <>
    <Link href="/contact#parking" className="parking-banner"><div className="wrap parking-banner-inner"><span className="parking-symbol" aria-hidden="true">P</span><span><strong>Free parking on site</strong><span>Customer car park and access beside the shop</span></span><span className="parking-banner-link">Plan your visit <ArrowUpRight size={18} aria-hidden="true" /></span></div></Link>
    <section className="wrap home-hero" aria-labelledby="hero-title">
      <div className="home-hero-copy">
        <h1 id="hero-title">Your local.</h1>
        <p className="home-hero-sub">Your local in South Benfleet. Groceries, drinks and everyday essentials on High Road, open seven days.</p>
        <div className="home-hero-hours"><Hours /></div>
        <div className="actions">
          <Link href="/spin" className="button hero-spin"><RotateCw size={18} aria-hidden="true" />Spin the wheel</Link>
          <a href={shop.directions} className="button"><MapPin size={18} aria-hidden="true" />Get directions</a>
          <a href={shop.telephone} className="button secondary"><Phone size={18} aria-hidden="true" />Call {shop.phone}</a>
        </div>
      </div>
      <div className="home-hero-photo"><Photo name={HERO} sizes={HERO_SIZES} priority /></div>
    </section>
    </>
  );
}
