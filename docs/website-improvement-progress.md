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
- Full patched dependency installation could not complete locally because disk space is exhausted; temporary installation/cache removed. Patched Next/React build subsequently passed on Vercel (deployment 2SvSkx57isvSmsUhhZHiN6Zut6av).

## Pending business content
- Owner confirmed 18 September: no delivery currently; Deliveroo and Just Eat planned. Delivery page now states this explicitly. WhatsApp service and hot-food offering remain unconfirmed.
- Offer pack sizes, periods and stock; promotion cards remain absent until complete.
- Parking restrictions/free-parking terms/accessibility; no unsupported claims added.
- Verified Google business place ID and map embed/review link; directions currently use the confirmed street address.
- Family portrait/story and real tour video.

Preview: https://cocolocal-git-website-improvements-chathurrsan-arams-projects.vercel.app
Draft review: https://github.com/chathurrsan-aram/cocolocal/pull/6

This is a review draft. The patched remote build passed. Do not merge/publish until visual checks are complete.

## Follow-up batch — 18 September
- Dependency remediation now reports **0 known vulnerabilities**. Next resolved to 15.5.25; vulnerable transitive build dependencies updated, with PostCSS consistently using patched 8.5.28 through an override.
- Added production-output validation to every build: six routes, internal navigation/anchor targets, image existence, canonical URLs, contact links, and private-guide/noindex/sitemap safeguards. Passed against the existing local output; fresh output will be checked by the remote build.
- Fixed the mobile menu remaining visible after widening to desktop. Improved gallery enlargement resolution and reduced unnecessary card-image downloads. Made the skip-link target explicitly focusable.
- Delivery page now clearly states no current delivery and planned Deliveroo/Just Eat launch, based on the owner’s response in this task. No unverified ordering links or launch dates.
- Browser review retried but remains blocked by administrator-policy verification. No visual-review claim is made.

## Parking and offers — 18 September
- Added a full-width cyan customer-parking banner directly beneath homepage navigation, linking to side-access guidance. It does not add a free-parking claim.
- Added an in-store-offers section below visit essentials, plus a hero jump link. Five intact recent Canva exports: YAZOO Inspired 300ml BOGOF, £6.50 four-can packs, £7.50 four pint cans, selected wine offers, £9.49 35cl spirits.
- Text content checked live against Canva designs DAHVGTo-2SM, DAHVMOvvTC8, DAHVMa895NQ and DAHVMiglpuQ; saved exports visually compared. No changes made to original Canva designs.
- Prices, product choices and terms repeated as accessible webpage text; full designs enlarge in a native dialog without cropping.
- YAZOO artwork's 9 Sep–6 Oct 2026 period is enforced with Europe/London-equivalent timestamps, hourly page revalidation and minute-by-minute client expiry checks. Undated offers remain subject to availability and require normal shop price review.
- Original YAZOO artwork retains its existing free-parking line; website parking text makes only the confirmed on-site-parking statement.
