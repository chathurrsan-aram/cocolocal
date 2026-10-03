"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Phone, RotateCw, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Photo from "./Photo";
import Hours from "@/components/Hours";
import { shop } from "@/lib/shop";

const slides = ["Inside your local", "Coco Local", "Everyday favourites"];
export default function Hero() {
  const [version, setVersion] = useState("split");
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    setVersion(new URLSearchParams(window.location.search).get("hero") === "wide" ? "wide" : "split");
    setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => setSlide(n => (n + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [playing, hovered]);
  function chooseVersion(next: string) {
    setVersion(next);
    const url = new URL(window.location.href);
    url.searchParams.set("hero", next);
    window.history.replaceState(null, "", url);
  }
  function chooseSlide(next: number) { setSlide((next + slides.length) % slides.length); setPlaying(false); }
  return <>
    <Link href="/contact#parking" className="parking-banner"><div className="wrap parking-banner-inner"><span className="parking-symbol" aria-hidden="true">P</span><span><strong>Free parking on site</strong><span>Customer car park and access beside the shop</span></span><span className="parking-banner-link">Plan your visit <ArrowUpRight size={18} aria-hidden="true" /></span></div></Link>
    <div className="wrap hero-preview-switch" role="group" aria-label="Compare homepage hero designs"><span>Compare the hero</span><button aria-pressed={version === "split"} onClick={() => chooseVersion("split")}>A · Split layout</button><button aria-pressed={version === "wide"} onClick={() => chooseVersion("wide")}>B · Bigger picture</button></div>
    <section className={`wrap home-hero hero-choice hero-choice-${version}`} aria-labelledby="hero-title">
      <div className="home-hero-copy">
        <p className="eyebrow">South Benfleet · 210 High Road</p>
        <h1 id="hero-title">Your local.</h1>
        <p className="home-hero-sub">Groceries, drinks and everyday essentials on High Road. Open seven days, with free parking on site.</p>
        <div className="home-hero-hours"><Hours /></div>
        <div className="actions"><a href={shop.directions} className="button"><MapPin size={18} aria-hidden="true" />Get directions</a><Link href="/wheel" className="button secondary"><RotateCw size={18} aria-hidden="true" />Spin the Coco Wheel</Link><a href={shop.telephone} className="text-link"><Phone size={16} aria-hidden="true" />Call the shop</a></div>
      </div>
      <div className="hero-slideshow" role="region" aria-roledescription="carousel" aria-label="A look at Coco Local" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setPlaying(false)}>
        <div className="hero-slide-stage">
          <div className="hero-slide" hidden={slide !== 0} role="group" aria-roledescription="slide" aria-label="1 of 3: Inside your local"><Photo name="chillers-03" sizes="(max-width: 899px) 100vw, 90vw" priority /></div>
          <div className="hero-slide hero-logo-slide" hidden={slide !== 1} role="group" aria-roledescription="slide" aria-label="2 of 3: Coco Local"><Image src="/images/home/logo-ink-1200.webp" alt="Coco Local basket and wordmark" width={1200} height={300} sizes="(max-width: 899px) 85vw, 720px" /><p>Your High Road. Your everyday.</p></div>
          <div className="hero-slide" hidden={slide !== 2} role="group" aria-roledescription="slide" aria-label="3 of 3: Everyday favourites"><Photo name="chillers-02" sizes="(max-width: 899px) 100vw, 90vw" /></div>
        </div>
        <div className="hero-slide-controls"><span aria-live={playing ? "off" : "polite"}>{slides[slide]} <small>{slide + 1} / 3</small></span><div><button onClick={() => chooseSlide(slide - 1)} aria-label="Previous slide"><ChevronLeft size={20}/></button><button onClick={() => chooseSlide(slide + 1)} aria-label="Next slide"><ChevronRight size={20}/></button><button onClick={() => setPlaying(p => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button></div></div>
      </div>
    </section>
  </>;
}
