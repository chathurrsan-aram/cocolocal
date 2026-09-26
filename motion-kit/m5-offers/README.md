# Weekly offers reel — how to make next week's

The reel is: shopfront shutter intro → 1–6 offers (2 bars each, price lands on the beat) → address outro. Music is original (124 BPM disco), so there's nothing to license.

## 1. Update the offers
Edit `offers.json`:
- Each offer needs `id`, `headline_lines` (1–2 short lines), `price`, `status: "live"`.
- `alcohol: true` adds "18+. Please drink responsibly." (it's always on the reel footer too).
- `products`: cut-out PNGs of the products (see step 2). `spin`: `can`, `bottle` or `flask`.
- `reel`: the offer ids to show, in order (3–5 works best).

## 2. Product cut-outs (only for new products)
1. Put the product photo panel in `packshots/<id>.jpg` (e.g. cropped from the Canva export on Drive: `05 — Marketing & Content / 03 — Campaigns & Exports`).
2. Add its column bands to `BANDS` in `prep_cutouts.py` (one band per product, left to right).
3. Run `python3 prep_cutouts.py <id>` → `cutouts/<id>-1.png`, `-2.png`, …

## 3. Render
```bash
python3 m5-offers/render_reel.py --formats 1080x1920,1080x1350,1080x1080
```
Outputs `exports/m5-offers/coco-offers-reel-<n>-<WxH>.mp4` (+ `-silent.mp4`). About 8 minutes per format.

## Easiest way
Open a Claude Code session on this repo and say: *"Update the weekly offers reel: these offers are live this week: … (prices), photos are in the Canva post …; render 9:16, 4:5 and 1:1 and put them in Drive."*

## Rules
- No AI-generated product images; use the shop's own photos or the brand's official pack shots.
- Alcohol offers always carry "18+. Please drink responsibly."
- Prices and dates must match what's on the shelf.
