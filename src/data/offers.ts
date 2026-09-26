// All homepage offer and promo text lives here. Edit this file, not the components.
//
// - `starts` / `ends` are ISO timestamps. An offer shows from `starts` (inclusive)
//   until `ends` (exclusive). Leave them out for offers with no date limit.
//   Tip: "end of 6 October, UK time" in British Summer Time is "2026-10-06T23:00:00Z".
// - `image` is a file in public/images/offers/ (the Canva artwork), or leave it out.
// - Set `alcohol: true` on anything alcoholic — the 18+ line is added automatically.

export type Offer = {
  id: string;
  title: string;
  headline: string;
  detail: string;
  terms?: string;
  image?: string;
  alcohol?: boolean;
  starts?: string;
  ends?: string;
};

export const ALCOHOL_NOTE = "18+ · Please drink responsibly.";

// Weekly promos that run all the time.
export const standingPromos: Offer[] = [
  {
    id: "tuesday-10",
    title: "Tuesdays",
    headline: "10% off when you spend over £25",
    detail: "Every Tuesday, across the shop.",
    terms: "Excludes tobacco.",
  },
  {
    id: "slushie-friday",
    title: "Free Slushie Friday",
    headline: "A free Coco’s slushie with £3 spend",
    detail: "Every Friday. Ask at the counter.",
  },
  {
    id: "free-parking",
    title: "Free on-site parking",
    headline: "Park beside the shop",
    detail: "Access and car park are to the side of the building.",
  },
];

// "September Offers 2026" campaign — all confirmed live on 26 Sep 2026 and due to
// end 6 Oct 2026. Replace this list with the next campaign's offers.
const SEPTEMBER_END = "2026-10-06T23:00:00Z";

export const offers: Offer[] = [
  {
    id: "yazoo", image: "yazoo", title: "YAZOO Inspired", headline: "Buy one, get one free",
    detail: "300ml milkshakes · varieties as stocked.",
    terms: "9 September–6 October 2026. Subject to availability.",
    starts: "2026-09-08T23:00:00Z", ends: SEPTEMBER_END,
  },
  {
    id: "beer650", image: "beer650", title: "Selected four-can packs", headline: "£6.50 per pack", alcohol: true,
    detail: "Poretti, Guinness Draught, Red Stripe or Desperados Original.",
    terms: "Selected packs shown.", ends: SEPTEMBER_END,
  },
  {
    id: "beer750", image: "beer750", title: "Four pint cans", headline: "£7.50 per pack", alcohol: true,
    detail: "Heineken, Stella Artois, Budweiser or 1664 Bière.",
    terms: "Selected packs shown.", ends: SEPTEMBER_END,
  },
  {
    id: "wine849", image: "wine849", title: "La Vieille Ferme", headline: "£8.49 per bottle", alcohol: true,
    detail: "White or Rosé · 75cl.",
    terms: "Selected bottles shown.", ends: SEPTEMBER_END,
  },
  {
    id: "wine700", image: "wine700", title: "McGuigan Black Label", headline: "£7 per bottle", alcohol: true,
    detail: "Merlot or Red · 75cl.",
    terms: "Selected bottles shown.", ends: SEPTEMBER_END,
  },
  {
    id: "spirits", image: "spirits", title: "Familiar favourites", headline: "£9.49 each · 35cl", alcohol: true,
    detail: "Captain Morgan Spiced Gold or Gordon’s Gin. £1 below the £10.49 marked price.",
    terms: "Selected bottles shown.", ends: SEPTEMBER_END,
  },
];

export function activeOffers(list: Offer[], now: number): Offer[] {
  return list.filter(o => (!o.starts || now >= Date.parse(o.starts)) && (!o.ends || now < Date.parse(o.ends)));
}
