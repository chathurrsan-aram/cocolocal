# Coco Local — Hot food: motion videos (Coming soon)

Three motion projects for the hot food launch. Nothing here has been posted or sent anywhere. The product range, prices and launch date are not confirmed yet, so every public-facing video says **Coming soon** and shows no product names, prices, dates or serving hours.

| Folder | What it is | Ready to post? |
|---|---|---|
| 01 — Hot food intro | 15 s teaser, 1080×1920. **a** = steam and warm light, typography only. **b** = the same piece with a generated, empty kitchen / oven-glow visual (no food) | **a: yes** (COMING-SOON). **b: yes once you approve the visual** |
| 02 — Full range with hot food (14 collections) | The 13-collection reel plus a Hot food "Coming soon" beat, 55 s, 1080×1920. The 13-collection video is unchanged and stays in its own folder | Yes (COMING-SOON) |
| 04 — Hot food carousel motion | The cream Canva carousel (DAHW-UOG9ZM) animated. Public teaser = cover + closing page, 10 s. Full six-page preview = 23.5 s. Each in 1080×1350 (feed) and a recomposed 1080×1920 (reel) | **COMING-SOON files: yes. DRAFT-TEMPLATE files: no**, they show £[0.00] placeholders |

Each folder has the videos with sound, a **Silent copies** folder, a storyboard / contact sheet, a caption, and **Editable source**.

## File names

- **COMING-SOON** — public teaser, no unconfirmed product, price or date. Safe to post once you're happy with it.
- **DRAFT-TEMPLATE** — shows where the confirmed menu will go, with placeholder names and £[0.00] prices. **Not for posting.**

## Outstanding inputs (needed before the menu versions can go public)

1. **Confirmed product list.** The carousel's three product pages use the Canva template's examples: *Sausage roll*, *Four cheese & onion toastie*, *Cheeseburger*. These are placeholders, not an approved range.
2. **Prices** for each product (currently £[0.00]).
3. **Unit** for each price: each, portion, or something else (currently "[each / portion]").
4. **Short descriptions** if wanted (optional field, empty now).
5. **Real product photos.** The current photos come from the Canva template and are illustrative ("Product images are illustrative" stays in the footer until real photos replace them).
6. **Launch date.** Not shown anywhere yet.
7. Serving hours, meal deals, dietary or allergen claims: **none are shown**, and none should be added until confirmed.
8. **Approval of the teaser visual** for intro version b (generated empty-kitchen image, no food).
9. Hot food location in store: shown on the full-range map as **near the slush and coffee machines** (your note). Tell me if it moves.

## How to fill in the menu later

Carousel: edit `04 — Hot food carousel motion/Editable source/hot-food-carousel.config.json`. For each product, set `name`, `price` (e.g. `"3.50"`), `unit` (e.g. `"each"`), `description`, `image` (path to the photo) and `confirmed: true`. Then run `python3 build.py`. When every product is confirmed and priced, the full build is named **MENU** instead of DRAFT-TEMPLATE. Public COMING-SOON builds never include product or menu pages.

Teaser: copy and the media slot are in `01 — Hot food intro/Editable source/config.json`. Full range: the Hot food entry is in `02 — …/Editable source/build.py` (look for `id='hotfood'`). When hot food launches, change its eyebrow/sub and the `soon` field there.

To render: `python3 build.py`, `python3 music.py …`, then `common/render.sh page.html W H seconds out.mp4 audio.m4a` (Playwright + Chromium + ffmpeg; 60 fps).

## Checks done

- Phone legibility: smallest essential text is 26–28 px on 1080-wide frames (footer small print 19–21 px, non-essential).
- Platform-safe: headline, Coming soon, follow line, handle and address sit between y≈300 and y≈1400 on 9:16; only the repeated footer sits in the bottom UI zone.
- Logo: the original Coco basket + wordmark artwork, drawn at its native aspect ratio, never clipped.
- No invented prices (only £[0.00] placeholders in DRAFT-TEMPLATE files), no product availability claims, no dates, no serving hours, no "baked here" or dietary claims, no September copy.
- Endings hold for at least 2.5 s of reading time.
- Audio: original soundtracks composed in code for these videos, so there are no licensing issues.
