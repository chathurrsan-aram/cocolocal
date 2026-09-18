# Coco Local website improvement — 18 September 2026

Plan: https://docs.google.com/document/d/1gxkxKH7GgZGCCawkqauKr02oUEYTNkhiRGWxrjy0GBA/edit
Plan local source: /Users/chat/Documents/New project/Coco-Local-Website-Improvement-Plan.md
The plan was created in the property-photo task 01a0ab6c-653c-7182-990a-208fcb739f29.

## Implemented
- Shorter homepage with real frontage, visit essentials, six linked range cards, slushie feature, three shop images, short family introduction and contact/hours section.
- Category-led Our range page, with eight direct-link sections, separate soft drinks and alcohol, and stock-enquiry calls.
- Factual About page and six-photo gallery with keyboard-accessible native enlargement dialog.
- Working telephone/email, Facebook and Instagram links; shared hours/address data.
- Find us page with address-based Google Maps directions and side-parking guidance.
- Removed non-sending contact form and placeholder WhatsApp links.
- Removed unsupported hot-food and rapid/free delivery claims; retained a neutral enquiry page for old /delivery links and removed Delivery from navigation.
- Page titles/descriptions/canonicals, social image, GroceryStore structured data, sitemap, focus states, reduced-motion support, skip link and responsive image sizes.
- Property guide payload and source unchanged; noindex preserved; omitted from public navigation and sitemap.

## Confirmed facts used
The user confirmed the facts in “Execute Coco Local Facebook Plan”, task 01a0af89-0c1c-7ec0-9525-e96b100a68b7, on 17 September 2026:
- Mon–Thu 7am–10pm; Fri–Sat 7am–11pm; Sunday 8:30am–9pm.
- 07483 423869 and 210cocolocal@gmail.com are monitored customer contacts.
- Instagram @cocolocal_ and Facebook Page 61577283069366.
- On-site parking; property task clarified access and car park are beside the shop.
- Slushie wording “Only £1.20” was explicitly supplied in the Facebook task.

## Photo sources
Used existing local copies prepared during prior marketing/photo tasks; Drive metadata was checked against the plan. Raw Drive downloads returned HTTP 403, so existing copies were used.
- Front: 2026-09-17/loo-2/work/shopfront.webp.
- Grocery, drinks and pets: 2026-09-13/new-chat-2/work/store-posts (groceries.webp, wines.webp, pet-food.webp).
- Slush: 2026-09-13/new-chat-2/work/slushie-photo.webp.
- Interior: 2026-09-17/loo-2/work/reelInterior.jpg.
- Chilled and household: existing selected retail-floor photographs P06 and P07 in coco-letting-pack/outputs/selected-photos.
- Snacks: existing original IMG_9840.jpg.
All nine selected images visually reviewed; CCTV still rejected. Browser-format images resized and metadata stripped with Sharp. No property ancillary-room photos, plans or unencrypted guide included.

## Validation and limits
- Production build, TypeScript and lint passed on the original installed Next 14 dependencies before the dependency update.
- Rendered-page checks passed for all five public routes: no placeholder numbers, dummy social links or old unsupported delivery promises.
- Confirmed private payload SHA-256 unchanged, password form and noindex present, private guide absent from sitemap.
- Browser visual/interaction checks blocked by administrator-policy verification failure. Desktop/mobile rendering, gallery interaction and map destination still require visual review.
- Dependency audit found 27 advisories including a critical Next.js advisory. Manifest and lockfile upgraded to Next 15.5.24, React/React DOM 19.3.0, matching Next lint config, current PostCSS and Sharp 0.35.4. Lockfile resolution reports 7 remaining advisories (1 low, 1 moderate, 5 high), requiring follow-up applicability review.
- Full patched dependency installation could not complete locally because disk space is exhausted; temporary installation/cache removed. Patched build must pass remotely before publication.

## Pending business content
- Delivery operation, WhatsApp service and hot-food offering.
- Offer pack sizes, periods and stock; promotion cards remain absent until complete.
- Parking restrictions/free-parking terms/accessibility; no unsupported claims added.
- Verified Google business place ID and map embed/review link; directions currently use the confirmed street address.
- Family portrait/story and real tour video.

This is a review draft. Do not merge/publish until the patched build and visual checks are complete.
