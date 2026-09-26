import Link from "next/link";
import { Car, Phone, MapPin } from "lucide-react";
import Hours from "@/components/Hours";
import { shop } from "@/lib/shop";
import { standingPromos } from "@/data/offers";

const MAP = "https://www.google.com/maps?q=Coco+Local,+210+High+Road,+South+Benfleet,+SS7+5LD&output=embed";

export default function VisitUs() {
  const parking = standingPromos.find(p => p.id === "free-parking");
  return (
    <section className="wrap section visit" id="visit" aria-labelledby="visit-title">
      <div className="visit-info">
        <h2 id="visit-title">Pop in and say hello.</h2>
        <address><MapPin size={20} aria-hidden="true" /><span>{shop.address}</span></address>
        {parking && <p className="visit-line"><Car size={20} aria-hidden="true" /><span><strong>{parking.title}.</strong> {parking.detail}</span></p>}
        <p className="visit-line"><Phone size={20} aria-hidden="true" /><a href={shop.telephone}>{shop.phone}</a></p>
        <div className="visit-hours"><h3>Opening hours</h3><Hours /></div>
        <div className="actions">
          <a href={shop.directions} className="button">Get directions</a>
          <Link href="/contact" className="text-link">Parking and contact details</Link>
        </div>
      </div>
      <div className="visit-map">
        <iframe src={MAP} title="Map showing Coco Local at 210 High Road, South Benfleet" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
    </section>
  );
}
