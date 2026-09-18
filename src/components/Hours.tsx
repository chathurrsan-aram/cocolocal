import { shop } from "@/lib/shop";
export default function Hours() { return <dl className="hours">{shop.hours.map(h => <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>)}</dl>; }
