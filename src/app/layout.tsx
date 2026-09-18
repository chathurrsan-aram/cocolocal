import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { shop } from "@/lib/shop";
export const metadata: Metadata = { metadataBase: new URL(shop.url), title: { default: "Coco Local — Your neighbourhood shop in South Benfleet", template: "%s | Coco Local" }, description: "Your family-run neighbourhood shop at 210 High Road, South Benfleet. Groceries, world foods, snacks, drinks and household essentials. Open seven days.", openGraph: { type: "website", locale: "en_GB", siteName: "Coco Local", images: [{ url: "/images/shop/front.webp", width: 1360, height: 1020, alt: "Coco Local on High Road" }] }, twitter: { card: "summary_large_image", images: ["/images/shop/front.webp"] } };
const business = { "@context": "https://schema.org", "@type": "GroceryStore", name: shop.name, url: shop.url, image: shop.url + "/images/shop/front.webp", telephone: "+447483423869", email: shop.email, address: { "@type": "PostalAddress", streetAddress: "210 High Road", addressLocality: "South Benfleet", postalCode: "SS7 5LD", addressCountry: "GB" }, sameAs: [shop.facebook, shop.instagram], openingHoursSpecification: shop.hours.map(h => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.schema, opens: h.opens, closes: h.closes })) };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en-GB"><body><a href="#main-content" className="skip-link">Skip to content</a><Navbar /><main id="main-content" tabIndex={-1}>{children}</main><Footer /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business).replace(/</g, "\u003c") }}/></body></html>; }
