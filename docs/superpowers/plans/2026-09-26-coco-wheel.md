# Coco Wheel Implementation Plan

**Goal:** A live, online-only prize wheel at `/wheel`: one free spin per person per ISO week, extra spins from single-use till BONUS codes, server-decided outcomes, 7-day prize codes redeemed at the till, and a staff page.

**Architecture:** Next.js 15 App Router. Pure logic (odds, ISO week, normalisation, codes) in `src/lib/wheel/*.ts`, the editable config in `src/data/wheel.ts`, and a storage-agnostic service (`service.ts`) that talks to a tiny `WheelStore` interface. There are two store implementations: Upstash Redis (production) and in-memory (tests plus a labelled preview demo mode). Route handlers under `src/app/api/wheel/*` are thin wrappers. The client (`WheelExperience.tsx`) only animates to the segment the server returns.

**Storage: Upstash Redis via the Vercel Marketplace.** The repo has no database. Every record is keyed and short-lived: weekly claims (8 days), prize codes (7 days plus a buffer), bonus codes (30 days) and entrant details (12 months). Redis handles these with TTLs. Single use is atomic: `SET NX` claims a week or a redemption, and `DEL` consumes a bonus code. The same counters give fixed-window rate limits, so no schema or migrations are needed.

**Owner decisions (26 Sep 2026):** age 16+. No prize emails: wins are stored in Redis, and customers save the code with a screenshot, "Save image" or "Send to WhatsApp" (Web Share with the PNG, falling back to wa.me text). `/spin` redirects to `/wheel` and the encrypted preview is deleted. Staff sign in with a PIN (env `WHEEL_STAFF_PIN`) that sets a signed cookie, with a lockout after 5 wrong tries. The wins CSV has no personal data. Motion beat table approved as proposed.

**Poster discrepancy:** the poster (source of truth) has 12 slices, including **Free crisps**, which the brief's odds omit. It stays as a real prize. 50p off snacks goes from 3% to 2% and free crisps gets 1%, so real prizes still total 15%. This is flagged to the owner.

## Tasks

1. [ ] Branch `claude/coco-wheel-us9rh2` from `origin/homepage-refresh`.
2. [ ] TDD `src/lib/wheel/core.ts`: odds validation (sum 100%, real prizes 15%), `pickOutcome` (crypto RNG in basis points, re-spin never lands on "Spin again"), segment choice for multi-slice outcomes, ISO week and next unlock in Europe/London across DST, email and UK mobile normalisation to E.164, code formats and generation.
3. [ ] TDD `src/lib/wheel/service.ts` against the memory store: weekly limit, device check, bonus codes (single use, unknown, expired), free spin before bonus, re-spin token (single use), prize code issue, lookup, redeem once, expiry, weekly summary, wins CSV, rate limits.
4. [ ] Odds simulation script (1,000,000 spins), with output recorded in the final report.
5. [ ] Upstash store and API routes: spin, status, staff login and logout, bonus batch, prize lookup and redeem, summary, wins CSV.
6. [ ] Assets: approved logo, SVG wheel rebuilt from the poster, hero video (Winner, 0–4.5 s, footer cropped) as H.264 and WebM under 2 MB, poster frame and OG image into `public/wheel/`.
7. [ ] `/wheel` page: hero video (reduced motion or Save-Data shows the poster only), entry form, wheel with beat-plan motion, result card, save and share.
8. [ ] `/wheel/staff`: PIN gate, printable bonus sheet, lookup and redeem, weekly summary, CSV.
9. [ ] `/wheel/terms` and `/wheel/privacy`, marked DRAFT and noindex.
10. [ ] Homepage strip and hero button point to `/wheel`; `/spin` redirects; site check and sitemap updated.
11. [ ] Verify: `npm test`, `npm run build` (includes site checks), lint, desktop, mobile and reduced-motion screenshots, push, Vercel preview.

## Out of scope

Click-and-collect, the motion kit, rendered videos, SMS and email, customer-list export, production deploy and merge.
