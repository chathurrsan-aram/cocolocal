import Link from "next/link";

export default function Delivery() {
  return (
    <section className="wrap page-intro delivery-intro">
      <p className="eyebrow">WHAT’S NEXT FOR COCO LOCAL</p>
      <h1>Delivery is on its way.</h1>
      <p className="intro">
        We’re planning to join Deliveroo and Just Eat. Delivery isn’t available
        yet, but we’ll add the ordering links here when it launches.
      </p>
      <p>In the meantime, pop in and see us at 210 High Road, South Benfleet.</p>
      <div className="actions">
        <Link className="button" href="/contact">Plan your visit ↗</Link>
        <Link className="button secondary" href="/products">Explore our range</Link>
      </div>
    </section>
  );
}
