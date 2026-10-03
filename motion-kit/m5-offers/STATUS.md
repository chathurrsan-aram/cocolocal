# M5 status (26 Sep 2026)
DRAFT 4:5 navy rendered: review-renders/coco-offer-yazoo-draft-navy-1080x1350.mp4 (Yazoo BOGOF sample). Awaiting approval.
Edit offers.json, then: `python3 render_offers.py offers.json [--formats 1080x1350,1080x1920] [--samples] [--only ID] [--theme navy|indigo] [--stills 1,4.5]`.
Validator refuses offers without id/headline/price/status; only status "live" renders unless --samples; alcohol:true adds "18+. Please drink responsibly." in the footer.
Colours sampled from the September artwork on Drive: price yellow #FFE36B, lavender #B2C1EE (Canva background is #0D0D43; we stay on #0F1A33).
Pack shot: packshots/yazoo-inspired-300ml.png is keyed out of "YAZOO - Option 1.png" (git-ignored; swap for a clean pack shot). Offers without an image show a flagged placeholder.
All offer statuses are "sample" until Chat confirms which are live.
TODO after approval: 3 s "Offers Part N" cover, reel builder (cover + offers + M2 A, 15–30 s), 9:16 pass.

## Drinks offers reel (26 Sep 2026)
DRAFT 4:5 navy (23.2 s, disco 124 BPM): review-renders/coco-offers-reel-draft-navy-1080x1350.mp4. Awaiting approval.
`python3 render_reel.py [offers.json] [--ids a,b,c] [--formats 1080x1350,1080x1920]` — shopfront shutter intro (2 bars) → 2 bars per offer from offers.json "reel" (price lands on the downbeat of each offer's second bar with a till ding) → address outro (2 bars). 1–6 offers.
Photo panels: `python3 prep_packshots.py` crops them out of the September Canva exports (reference/, git-ignored). All offers set live (Chat, 26 Sep).

## Reel v2 (26 Sep 2026)
- Clean cut-outs: `python3 prep_cutouts.py <panel>` (one panel per process; rembg BiRefNet from GitHub releases, ~1 GB RAM) → cutouts/<panel>-<n>.png. offers.json gains "products" (cut-outs) and "spin" (can | bottle | flask).
- reel.html draws products on a canvas between two SVG layers: cans spin in as real cylinders (label unwrapped from the photo, rims and silhouette kept), then face front for the price and rock gently; bottles and flasks sway. Warm glow + rotating rays behind (Chat asked for the luminous light). Price slams on each offer's beat 4 with a flash, shake, till ding and a row hop; whip transitions on the bar line.
