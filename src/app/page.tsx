import Hero from "@/components/home/Hero";
import ShopWalk from "@/components/home/ShopWalk";
import Offers from "@/components/Offers";
import Slushies from "@/components/home/Slushies";
import VisitUs from "@/components/home/VisitUs";
import FollowUs from "@/components/home/FollowUs";
import WheelSoon from "@/components/home/WheelSoon";

export const revalidate = 3600;
export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <>
    <Hero />
    <ShopWalk />
    <Offers />
    <Slushies />
    <VisitUs />
    <FollowUs />
    <WheelSoon />
  </>;
    <section className="wrap section"><div className="section-heading"><div><p className="eyebrow">A LITTLE OF WHAT YOU NEED</p><h2>Small shop. Plenty to discover.</h2></div><Link href="/products" className="text-link">See the full range ↗</Link></div><div className="range-grid">{[categories[0], { ...categories[2], title: "Snacks, slushies & soft drinks" }, categories[3], categories[4], categories[5], categories[7]].map(c => <Link href={`/products#${c.id}`} className="range-card" key={c.id}><ShopImage name={c.image} alt={c.alt} sizes="(max-width: 700px) 45vw, 33vw"/><div><h3>{c.title}</h3><ArrowUpRight aria-hidden="true"/></div></Link>)}</div></section>
    <section className="feature-band"><div className="wrap feature-grid"><ShopImage name="slush" alt="Coco’s red and blue slushie beside the machine"/><div><p className="eyebrow">SOMETHING FOR YOUR BREAK</p><h2>A little chill.<br />A lot of colour.</h2><p>Pick up a Coco’s slushie while you’re in store. Just £1.20 — ask us for the flavours and sizes available today.</p><Link href="/products#slushies" className="button">Take a look <ArrowUpRight size={18}/></Link></div></div></section>
    <section className="wrap section"><div className="section-heading"><div><p className="eyebrow">STEP INSIDE</p><h2>More than a quick top-up.</h2></div><Link href="/about#gallery" className="text-link">Explore the gallery ↗</Link></div><div className="inside-grid">{[{ name: "interior", caption: "Take a look around" }, { name: "grocery", caption: "Find your cupboard favourites" }, { name: "household", caption: "Pick up the useful little things" }].map(p => <figure key={p.name}><ShopImage name={p.name} alt={p.caption}/><figcaption>{p.caption}</figcaption></figure>)}</div></section>
    <ShopExplorer />
    <section className="wrap wheel-teaser"><div><p className="eyebrow">SOMETHING NEW · TRY THE DEMO</p><h2>A little spin. A little treat.</h2><p>Take a first look at our daily prize-wheel demo.</p></div><Link href="/spin" className="button">Try the prize wheel ↗</Link></section>
    <section className="wrap family-strip"><p className="eyebrow">A FAMILY-RUN LOCAL</p><h2>On your High Road.<br />Part of your everyday.</h2><p>We’re Coco Local, a family-run neighbourhood shop in South Benfleet. From groceries and world foods to pet food and household essentials, there’s plenty to explore on your next visit.</p><Link href="/about" className="text-link">A little about us ↗</Link></section>
    <section className="wrap section visit-grid"><div><p className="eyebrow">WE’RE JUST AROUND THE CORNER</p><h2>Pop in and say hello.</h2><p>{shop.address}</p><p>Customer parking is available on site. The access and car park are beside the shop.</p><div className="actions"><a href={shop.directions} className="button">Get directions ↗</a><a href={shop.telephone} className="button secondary">Call the shop</a></div></div><div className="hours-card"><h3>Open seven days a week</h3><Hours /><Link href="/contact" className="text-link">All visit & contact details →</Link></div></section>
    </>;
}
