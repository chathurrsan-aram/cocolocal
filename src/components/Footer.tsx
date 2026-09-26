import Link from "next/link";
import { shop, navigation } from "@/lib/shop";
import Hours from "./Hours";
import LogoReveal from "./motion/LogoReveal";
import FollowButtons from "./motion/FollowButtons";
export default function Footer() { return <footer className="site-footer"><div className="wrap footer-grid"><div><LogoReveal /><p>Your neighbourhood shop on High Road.<br />Everyday essentials, a little closer to home.</p><FollowButtons /></div><div><h2>Pop in</h2><p>{shop.address}</p><a href={shop.telephone}>{shop.phone}</a><br /><a className="email" href={`mailto:${shop.email}`}>{shop.email}</a></div><div><h2>Open seven days</h2><Hours /></div></div><div className="wrap footer-bottom"><p>© {new Date().getFullYear()} Coco Local</p><nav aria-label="Footer navigation">{navigation.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav></div></footer>; }
