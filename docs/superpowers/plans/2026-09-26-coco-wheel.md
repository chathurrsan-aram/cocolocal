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

## Motion upgrade (owner's follow-up, 26 Sep 2026)

The owner asked for a much livelier wheel, closer to the Higgsfield artwork. This overrides the earlier "no confetti, glows or bouncy easing" direction. Their choices: a big win celebration, a close-to-Higgsfield look, a punchy spin, sound off by default with a toggle, a pull lever, a reveal picture per outcome, and mouse-reactive motion.

| beat | time | what happens |
|---|---|---|
| idle | loop | Bulbs twinkle, props float, and the machine tilts towards the mouse with a following spotlight. The SPIN hub pulses and the lever hint bobs |
| pull | 0 | Drag the lever knob down, or tap it: it ratchets down, then springs back with a bounce. The SPIN hub does the same job |
| wind-up | +0.1–0.4 s | Wheel pulls back 14°; bulbs chase |
| spin | → 4.7 s | Fast launch with motion blur on the labels, and the pointer clacks on every peg (tick sound). A cubic ease-out gives a slow, tense crawl over the last slices |
| land | ~4.7 s | 2.6° overshoot, then a bounce (spring ζ 0.42). The winning slice glows gold, the result pops up under the wheel, bulbs flash (win) or dim (lose), and confetti fires from behind the wheel on a win |
| reveal | +0.45 s | The wheel shrinks away. A gift box drops in and shakes. On a win the lid flies off with star confetti and the prize pops out over a sunburst; on a loss the basket peeks out. The copy and code chip then stagger in |

- The spin is a pure function of time (`src/lib/wheel/motion.ts`, tested in `scripts/wheel-motion.test.mjs`), sampled every frame.
- Sounds are synthesised with the code-motion-design audio module (`scripts/make-wheel-sfx.py` → `public/wheel/sfx/`, 28 KB).
- Prize props are cut from `Introducing-wheel-poster.png` with rembg (u2net) into `public/wheel/props/`. Coins and crisps are drawn in SVG.
- Each outcome's `reveal` in `src/data/wheel.ts` picks its picture and line.
- Reduced motion turns off tilt, blur, confetti, bounce and floats, and results appear at once.

## Warm daylight redesign (owner's follow-up, 26 Sep 2026)

The owner felt the site had "so much dark blue" and looked AI-generated. Their choices: warm shop daylight look, whole site, wheel first then a quick pop-up, one smart contact box.

- **Site-wide:** cream paper (`--paper`) and ink text, one cobalt accent (`--accent`), and peach from the logo for highlights (a marker stroke under the key heading phrase, the parking band and callouts). Gold appears only on wheel wins. Navy is kept for the wheel stage, the homepage wheel strip and the footer. Type is Bricolage Grotesque for headings and Figtree for body text. Shapes: pills for buttons, chips and tags; 16px for cards and media; 12px for inputs. There are fewer eyebrows, the ink logo sits in the header and the white logo in the footer. Motion: the hero settles in, cards lift on hover, and cards rise into place as they scroll into view (movement only, no fade; CSS scroll timelines, no JS). Reduced motion switches all of it off.
- **/wheel:** the opening screen is just the headline and the machine. On arrival the stage lifts in, the wheel coasts round, the bulbs light in turn and the lever drops in and gives a small tug (CSS, so it runs before hydration). The lever, the SPIN hub or the button opens a short pop-up (`EntrySheet.tsx`, a bottom sheet on phones) the first time. After that the wheel spins straight away, with a "Spinning as Sam · Not you?" line. Once the free spin is used, the pop-up asks only for a bonus code. The Higgsfield clip moved down to "How it works".
- **One contact box:** `src/lib/wheel/contact.ts` works out email or UK mobile as you type, using the same normalisers the server uses (core.ts re-exports them). It ticks the value when it is valid and tidies the format on blur (`07700 900123`). Tested in `scripts/wheel-contact.test.mjs`.
