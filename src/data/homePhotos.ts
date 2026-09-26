// Real shop photos used on the homepage. All come from the asset-audit shortlist
// (~/coco-assets-audit/shortlist) and are prepared by scripts/prepare-homepage-assets.mjs
// as public/images/home/<name>-{800,1200,2400}.webp. `w`/`h` are the largest file's size.
export const homePhotos = {
  "hero-shopfront-02": { w: 2400, h: 1800, alt: "Coco Local’s shopfront on High Road: a navy sign with the basket logo above glass doors and window posters" },
  "hero-shopfront-01": { w: 2400, h: 1800, alt: "The open glass entrance doors of Coco Local, with a “We’re now open” poster and chillers visible inside" },
  "chillers-03": { w: 2048, h: 1536, alt: "Inside Coco Local: bright aisles of snacks and drinks under hexagon ceiling lights, with chillers along the far wall" },
  "aisle-01": { w: 2400, h: 1350, alt: "A low front display packed with crisps and snacks, with drinks fridges behind it" },
  "chillers-02": { w: 2400, h: 1350, alt: "A long run of glass-door chillers stocked with soft drinks, energy drinks and water" },
  "chillers-04": { w: 2400, h: 1350, alt: "Chiller doors filled with bottled beer, cans and white and rosé wine" },
  "groceries-02": { w: 1600, h: 900, alt: "A grocery aisle lined with sauces, tins and cupboard staples, with gift bags on the end display" },
  "household-04": { w: 2400, h: 1800, alt: "Household shelves with cleaning sprays, laundry products and kitchen roll" },
  "slushie-01": { w: 2048, h: 1536, alt: "The Coco’s slushie machine beside the entrance, next to the chillers and front shelves" },
  "slushie-03": { w: 1800, h: 2400, alt: "A red and blue Coco’s slushie with a striped straw, in front of the Coco’s slush machine" },
} as const;

export type PhotoName = keyof typeof homePhotos;

const SIZES = [800, 1200, 2400];

export function photoSources(name: PhotoName) {
  const { w, h } = homePhotos[name];
  const long = Math.max(w, h);
  const srcSet = SIZES.map(size => {
    const width = Math.round(Math.min(size, long) * w / long);
    return `/images/home/${name}-${size}.webp ${width}w`;
  }).join(", ");
  return { src: `/images/home/${name}-1200.webp`, srcSet };
}
