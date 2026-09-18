"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { navigation, shop } from "@/lib/shop";
export default function Navbar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    useEffect(() => setOpen(false), [pathname]);
    return <header className="site-header"><nav className="wrap nav" aria-label="Main navigation" onKeyDown={e => { if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
    } }}>
 <Link href="/" aria-label="Coco Local home"><Image src="/images/logo.png" alt="Coco Local" width={190} height={50} priority className="site-logo"/></Link>
 <div className="desktop-nav">{navigation.map(l => <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>{l.label}</Link>)}<a className="button small" href={shop.directions}>Get directions <ArrowUpRight size={16}/></a></div>
 <button ref={trigger} className="menu-toggle" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
 <div id="mobile-nav" className="mobile-nav" hidden={!open}>{navigation.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={pathname === l.href ? "page" : undefined}>{l.label}</Link>)}<a href={shop.telephone}>Call {shop.phone}</a></div>
 </nav></header>;
}
