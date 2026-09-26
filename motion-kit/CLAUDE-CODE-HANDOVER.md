# Coco Local Motion Kit — Claude Code handover
Handed over from a claude.ai chat session on Sat 26 Sep 2026. This is the master brief. Read it fully, then KIT.md and ANALYSIS.md, before doing anything. HANDOVER.md and PROMPTS.md are older and shorter; where they disagree with this file, THIS FILE WINS.

---
## 0. TL;DR for the first 5 minutes
1. Unzip this kit to `~/coco-motion-kit/` (if Chat hasn't already). Work only inside it.
2. Set up the render environment (section 4) and run the smoke test (section 4.4).
3. Ask Chat the open questions in section 9 in ONE message.
4. Do the work in order: M4 draft → (approvals) → M5 draft → remaining formats for M1–M3 → M4/M5 formats → M6 (website repo).
5. Golden rule: draft ONE format (1080×1350, dark, navy #0F1A33) per piece, show it, WAIT for approval, and only then render the other formats and variants. Never batch-render everything up front (Chat explicitly asked for this after a full batch was started too early).

---
## 1. Context
- **Client:** Chat (Chathurrsan) is doing a marketing and website push for **Coco Local**, his dad's convenience shop at **210 High Road, South Benfleet SS7 5LD**. Website: cocolocal.co.uk (Next.js on Vercel; the repo is separate).
- **Socials:** Instagram **@cocolocal_** (NOT @coco.local, which was wrong in earlier prompts). There is also a Facebook page (name: ask Chat or read it from facebook-page.png), and **https://cocolocal.co.uk/follow** is the three-button socials page linked from the IG bio.
- **Overall plan (Sep 2026):**
  1. Asset audit + homepage refresh — Claude Code prompts written in chat, not run yet.
  2. Coco Wheel giveaway page (/wheel) — prompt written, not run yet.
  3. **Brand motion kit — this handover.**
  4. Click and collect — not planned yet.
- **Working style:** Chat wants clarifying questions before long answers, is watching token/usage cost, and prefers short, specific updates. View contact sheets (tiled thumbnails), not individual frames. Don't re-analyse the source videos (the contact sheets and ANALYSIS.md already cover them).

---
## 2. Hard rules
- **Google Drive is READ-ONLY.** Root: `~/Library/CloudStorage/GoogleDrive-chathurrsan@aram.org.uk/My Drive/`. Never move, rename, edit or delete anything there. Copy inputs into the kit. Write outputs only under `~/coco-motion-kit/`. Only put deliverables back on Drive if Chat asks, and then into a NEW folder.
- **One-format-first:** see TL;DR 5. The review format is 1080×1350, dark theme, navy #0F1A33 and the "Proudly serving South Benfleet" tagline where a tagline applies.
- **Beat plan before code** for any new piece (code-motion-design skill workflow). Show a table, get approval, then build.
- **Meta logos:** use ONLY the official files Chat downloaded (section 6), unchanged: no recolouring, redrawing, cropping, animating the glyph's shape, or effects. Clear space around them. Facebook logo complete, in an approved colour, ≥ 16 px wide. Nothing that implies Meta endorses the shop. Instagram needs separate permission for broadcast/outdoor/large print; social and web use is fine. Never draw platform logos in code.
- **No AI-generated product images.** Higgsfield/Canva AI visuals are "concept, not proof of stock".
- **No identifiable customers**; photos of Chat's dad or staff only with confirmed consent.
- **Banned in motion:** particle bursts/dot rings, glows, gradients on UI chrome, bouncy easing (springs ζ ≥ 0.8 except the explicit `pop` preset), mid-word clipping glitches, animated progress bars, stock-template looks, `will-change` on camera-scaled elements.
- **Alcohol offers** always carry "18+. Please drink responsibly."

---
## 3. What's in this kit
| path | what |
|---|---|
| KIT.md | palette, type, logo rules, timing grid, formats, naming, banned list |
| ANALYSIS.md | review of the original Basket Reveal + 4 outros; the signature moves kept and dropped |
| brand/ | logo-lockup-{white,navy}.svg (Poppins 600 embedded, viewBox `0 200 2150 330`), basket-{white,navy}.svg, fonts/ Poppins 500/600/700 woff2 |
| audio/ | sonic-logo-2bar.wav, bed-soft / bed-house 4-bar loops, beatgrid.json |
| style-frames/ | end-state lockups (dark/light × 1:1, 4:5, 9:16) + frame.html |
| reference-sheets/ | contact sheets of the source videos; SVG vs approved-PNG overlay check |
| tools/ | copy of the code-motion-design skill scripts: engine.js, build.py, render.py, audio.py, contact_sheet.py, get_font.py |
| m1-signature/ m2-outros/ m3-sting/ | piece.html (template), events.json, audio WAV, STATUS.md; m1 also has render-all-example.sh (a batch queue with paths from the chat sandbox — adapt before use) |
| review-renders/ | the approved or awaiting-approval 4:5 dark drafts (MP4 with sound) |

If the code-motion-design skill is installed in Claude Code, also read its SKILL.md, references/engine.md, references/concepts.md and references/pitfalls.md. If it isn't, tools/ has everything needed to build and render; follow the workflow in this file.

---
## 4. Environment
### 4.1 Install (macOS)
```bash
brew install ffmpeg
python3 -m pip install --user playwright numpy pillow scipy soundfile   # audio.py needs numpy (+ scipy/soundfile if it errors)
python3 -m playwright install chromium
```
### 4.2 Paths
```bash
K=~/coco-motion-kit; T=$K/tools
FONT="Poppins=$K/brand/fonts/poppins-latin-600-normal.woff2:600"
```
### 4.3 Pipeline (per piece)
```bash
# 1) fill placeholders → variant HTML (see 5.1)
sed -e "s/__BG__/#ECEAE7/; s/__NAVY__/#0F1A33/; s/__FINAL__/#0F1A33/; s/__INK__/#FFFFFF/; s/__PEACH__/#FEC091/; s/__TAGLINE__/Proudly serving South Benfleet/; s/__TAGSIZE__/128/; s/__GCY__/560/; s/__RULEW__/470/g" piece.html > v.html
# 2) inline engine + fonts
python3 $T/build.py --template v.html --out v.built.html --font "$FONT"
# 3) review stills (always check transitions before a full render)
python3 $T/render.py stills --html v.built.html --w 1080 --h 1350 --outdir stills 0.3 0.8 1.5 2.2 3.0 4.9
# 4) render video (60 fps, motion blur via subframes). ~1 min of wall time per second of video; run long jobs in the background and poll
python3 $T/render.py video --html v.built.html --w 1080 --h 1350 --dur 5 --out raw.mp4
# 5) audio: events in BEATS (120 BPM → 0.5 s per beat); synth, then trim to length
python3 $T/audio.py synth --bpm 120 --bars 3 --style house --events events.json --out a.wav
ffmpeg -y -i a.wav -t 5 -af "afade=t=out:st=4.2:d=0.8" a5.wav
# 6) mux (with sound + silent)
ffmpeg -y -i raw.mp4 -i a5.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out.mp4
ffmpeg -y -i raw.mp4 -c:v copy -an -movflags +faststart out-silent.mp4
# 7) contact sheet for review
ffmpeg -y -i raw.mp4 -vf "fps=4,scale=216:-2,tile=5x4:padding=3" -frames:v 1 sheet.png
```
Sound names available in audio.py events: click, tick, pop, chime, whoosh, whoosh_s, stretch (see audio.py). Styles: `soft`, `house` (Chat liked house: it's more exciting).
### 4.3b Linux cloud session
`pip install playwright numpy pillow scipy soundfile imageio-ffmpeg`, link ffmpeg from imageio-ffmpeg to /usr/local/bin/ffmpeg, `export CHROMIUM_PATH=/opt/pw-browsers/chromium` (render.py reads it). Drive files come through the Google Drive connector (downloads land on disk); it cannot upload videos, so renders go out via the artifact download page. Canva export URLs are blocked by the network policy.
### 4.4 Smoke test
Build and render m3-sting (2 s) in 4:5 and compare it against review-renders/coco-sting-dark-1080x1350.mp4. They should match.

---
## 5. Architecture of the pieces
### 5.1 piece.html template (shared by M1–M3)
- Full-frame SVG, sized from the viewport (`W=innerWidth, H=innerHeight`), so the same file renders any format via `--w/--h`.
- `window.seek(t)` computes EVERYTHING from t using closed-form springs `S(e, {w, z})`. No timers or CSS transitions. The page sets `window.READY = true` after `document.fonts.ready`.
- **Placeholders:** `__BG__` (canvas under the wipes, cream #ECEAE7), `__NAVY__`, `__FINAL__` (final background: navy for dark, #ECEAE7 for light), `__INK__` (logo/text: #FFFFFF dark, the navy for light), `__PEACH__` (#FEC091 dark, #E89A5C light), `__TAGLINE__`, `__TAGSIZE__` (128 "Proudly serving…", 150 "A little more local.", M2: A 112 / B 150 / C 118), `__GCY__` = 560 (group centre in lockup units), `__RULEW__` = 470 (peach rule width in lockup units; 0 hides it).
- **Structure:** `#w1/#w2/#w3` wipe rects (sky #8EA9DC, peach #FEC091, final colour) → `#cam` (camera group) → `#lock` (lockup, transformed `translate(tx,ty) scale(s)` where s = lockup width / 2150; lockup width = 62% W, or 74% W when H/W > 1.5) → `#basket` (paths hl, hr, rim, body, slots s1–s3; stroke 24, pathLength=1 for draw-on), `#word` (per-letter <text>, built after fonts load from `getStartPositionOfChar` on hidden `#meas`), `#rule`, `#tag` (clipped rise).
- **Gotcha (fixed):** letters MUST be built inside `document.fonts.ready`, or the positions are measured with the fallback font and the letters overlap.
- **Gotcha (fixed):** an unused `#rule` with round caps renders as a dot; hide it (`display:none`) when not used.
- **Gotcha:** the chat sandbox killed any single command over 300 s. On the Mac, still run long renders in the background and poll the log.

### 5.2 Palette & type (KIT.md has the full rules)
navy #0F1A33 · indigo variant #161A5C (**approximate**, estimated from the Canva carousel; get the exact hex from Chat/Canva) · cream #ECEAE7 · white · sky #8EA9DC · peach #FEC091 (#E89A5C on cream). Poppins 600 for the wordmark/headlines, 500 for supporting text. 120 BPM; beat = 0.5 s; letters on 16ths or faster.

---
## 6. Inputs on Drive (read-only)
Base: `My Drive/Coco Local/05 — Marketing & Content/`
- `01 — Photos & Brand/Social Profiles & Official Meta Icons — 2026-09-26/` ← **M4 inputs**
  - `instagram-profile.png` (full profile, all 5 posts, updated bio: "Your friendly local 🥥 / Groceries, snacks & everyday essentials / 📍210 High Road, South Benfleet / Offers, socials & shop info ↓")
  - `instagram-links.png` (link list showing the cocolocal.co.uk/follow page)
  - `facebook-page.png` (long screenshot: cover, profile, details, featured post, photos; admin view)
  - `Instagram_Glyph_White.png`, `Instagram_Glyph_Black.png`, `Instagram_Glyph_Gradient.png`, `Facebook_Logo_Primary.png`, `Facebook_Logo_Secondary.png`, the brand-asset ZIPs, `Coco-Social-Assets.zip`, README.md (usage rules)
  - NOTE: the screenshots are JPEG data with .png names. Load them by content, not extension.
- `04 — Higgsfield & Canva Library/02 — Spin the Wheel/Introducing-wheel-poster.png` — the Coco Wheel segments/look (for the M4 ending).
- `04 — Higgsfield & Canva Library/03 — Logo & Outros/` — approved logo PNG, Basket Reveal, outros (already analysed; don't redo).
- Canva design **DAHVlO88seg** "Coco Local | September Offers Part 1 | Carousel Draft" (7 pages) — M5 inspiration (Canva MCP: `claude mcp add --transport http canva https://mcp.canva.com/mcp`).
- Offer artwork: `03 — Campaigns & Exports/04 — September Offers 2026/`.

---
## 7. Status of each piece
Updated 26 Sep 2026 (cloud session). Renders: private download page https://claude.ai/artifact/EQyCpQRm36mvqnxeLWgk5M → Chat saves the zip into Drive `05 — Marketing & Content / 05 — Brand Motion Kit` (README there). Sources: repo chathurrsan-aram/cocolocal, `motion-kit/`.
| id | piece | status | next action |
|---|---|---|---|
| M0 | Foundation | DONE | — |
| M1 | Signature reveal, 5 s | DONE: proud/more × navy, indigo, light × 1:1, 4:5, 9:16, sound + silent | — |
| M2 | Outro family, 3 s | DONE: A address, B website, C wheel, D follow × 3 themes × 3 formats + 1.5 s tails | — |
| M3 | Intro sting, 2 s | DONE: 3 themes × 3 formats | — |
| M4 | Follow-us, 9.5 s | 4:5 navy draft rendered, awaiting approval (see m4-follow/STATUS.md) | On approval: indigo + light, 9:16 + 1:1 |
| M5 | Weekly offer template | Template + render_offers.py + Yazoo 4:5 draft, awaiting approval | Chat says which offers are live; cover + reel builder |
| M6 | Website pieces | NOT STARTED | Work on the session branch; note the wheel branch (claude/coco-wheel-us9rh2) redesigns the site palette/type |
Decisions this session: indigo stays at the #161A5C estimate (Canva background samples as #0D0D43); light theme = cream + navy ink only; M4 end line uses /follow.

What was built for M1 v2 (for reference when extending): sky → peach → navy wipes on 8ths (0, 0.25, 0.5 s); the basket arrives big (1.9×) and tilted −14° and draws fast; three peach slots drop in on 16ths (1.25/1.375/1.5 s) then flip to ink at 1.9 s; the camera pulls back from 1.25× and the basket slides left at 2.0 s; letters rise from 2.3 s (0.08 s stagger); the peach rule streaks in with lead/trail edges at 3.0 s; the tagline rises and tightens its letter-spacing at 3.25 s; slow camera drift to the end. Audio: house bed, whooshes on the wipes, pops on the slots, whoosh on the pull-back, tick on the rule, chime on the tagline.

---
## 8. Remaining work — specs
### 8.1 M4 — Follow-us (≈ 9 s, ending) — Chat's concept: "logos of insta/meta, screenshots of our pages, scrolling through them, pressing Follow, then the Coco Wheel spinning"
Draft beat plan (show it to Chat, adjust, get approval):
| time | state | finger / sound |
|---|---|---|
| 0.0–0.5 | M3-style wipes into navy; lockup appears | whoosh |
| 0.5–1.0 | lockup shrinks to the top; the official Instagram glyph pops in beside the "@cocolocal_" label | pop |
| 1.0–1.5 | a generic phone frame (our own rounded rect, NOT a replica of a real phone) rises holding instagram-profile.png | whoosh |
| 1.5–2.5 | the finger scrolls the screenshot (translateY, eased, slight momentum) through the bio and posts | tick per flick |
| 2.5–3.0 | the finger taps Follow → our OWN overlay pill (not the IG UI) morphs "Follow" → "Following ✓", peach accent | click + chime |
| 3.0–3.5 | the phone swipes horizontally to facebook-page.png; the official Facebook logo swaps in at the top | whoosh |
| 3.5–4.5 | scroll the FB page (cover → details → featured post) | ticks |
| 4.5–5.0 | tap → the overlay pill "Follow" → "Following ✓" | click + chime |
| 5.0–5.5 | the phone screen morphs (one shape, never cut) into the Coco Wheel, rebuilt as our own SVG from Introducing-wheel-poster.png segments | stretch |
| 5.5–7.5 | the finger taps Spin; the wheel spins with closed-form deceleration (3–5 turns) and lands on **Free slushie**; the pointer ticks on slice boundaries; the prize card lifts | click, ticks, chime |
| 7.5–9.0 | back to the lockup + "New offers every week · cocolocal.co.uk/follow" (or "/wheel" — ask Chat), held ≥ 1 s | chime |
Notes: screenshots scale to the phone-screen width; crop to hide any admin-only UI (the FB shot is an admin view) and anything that looks like personal data or notifications. Keep the Meta icons unchanged and outside the phone UI (as labels), with clear space. Wheel segments (from the poster): £1 off £10 · Free slushie · 50p off snacks · Free coffee · Free hot chocolate · Sweet treat · Spin again · Not this time (several slices). The finger: a simple rounded fingertip shape or the skill's cursor, with a shadow.
Deliver the 4:5 dark draft first. After approval: indigo + light, 9:16 (primary for Stories/Reels) and 1:1.

### 8.2 M5 — Weekly offer template (data-driven)
- Inspiration: Canva DAHVlO88seg. KEEP: navy background; tracked-caps eyebrow "SPECIAL OFFERS AT COCO LOCAL"; heavy two-line headline (e.g. "BIG BEER DEALS." / "WINE DEALS. WORTH A LOOK."); big yellow price; lavender detail line; dates + "subject to availability"; footer strip with the basket lockup + "210 High Road, South Benfleet SS7 5LD • Parking on site". DROP: autumn leaves, splash/AI backgrounds, the cramped shopfront cover photo. Sample the exact yellow/lavender from Canva and confirm with Chat; otherwise stay on the KIT palette.
- `offers.json` per offer: id, eyebrow, headline_lines[], product_line, price, unit, detail_line, dates|null, alcohol (bool → auto "18+. Please drink responsibly."), image (cut-out pack shot or null → neutral placeholder, flagged), status (live|sample). The validator refuses an offer with no price or status; only `live` renders unless `--samples`.
- Beat plan (8 s, 16 beats): footer strip up · eyebrow types on 16ths · headline lines rise, clipped · pack shot slides in on a spring · price drops in ON the beat (yellow + pop) · detail line · dates chip · hold with ≤ 2% camera drift · slide off. Plus a 3 s "Offers Part N" cover, and a reel builder chaining cover + offers + M2 variant A (15–30 s).
- `render_offers.py offers.json [--formats 1080x1350,1080x1920] [--reel] [--samples]` + a README ("edit offers.json, run this").
- Known offer data (status unknown unless noted; Chat confirms with the shop): Yazoo Inspired 300ml milkshakes BOGOF, **9 Sep – 6 Oct 2026**, subject to availability (the only one with printed dates → use as the SAMPLE); beer 4-packs £6.50 (Poretti, Guinness Draught, Red Stripe, Desperados); 4 pint cans £7.50 (Heineken, Stella, Budweiser, 1664); La Vieille Ferme White/Rosé 75cl £8.49; McGuigan Black Label Merlot/Red 75cl £7; Captain Morgan Spiced Gold / Gordon's Gin 35cl £9.49 (£1 below the £10.49 marked price).

### 8.3 M6 — Website pieces (in the website repo, branch `motion-kit-web` off `homepage-refresh`; Vercel preview only, never production)
1. Footer logo: the M1 reveal as live SVG/JS (reuse piece.html logic, shortened to ≤ 2 s), played once on scroll into view (IntersectionObserver).
2. Follow block: Instagram/Facebook buttons using the official icons, with the M4 "Follow → Following" morph on tap; links go to the real profiles and /follow.
3. Offer cards: the price drops in with the M5 timing and yellow accent (data from src/data/offers.ts).
4. Optional hero accent from M1 only if Lighthouse mobile performance stays ≥ 90 (the transparent WebM was NOT made; render.py has no alpha output, so prefer live SVG).
Rules: transform/opacity only, springs ζ ≥ 0.8, prefers-reduced-motion shows final states, no layout shift, keyboard accessible. Deliver: preview URL, screenshots (desktop, mobile, reduced motion), Lighthouse scores.

---
## 9. Open questions for Chat (ask in ONE message at the start)
1. Exact indigo hex from Canva (currently #161A5C, estimated).
2. M2: is "keep going" approval of all three outros? Add a /follow variant?
3. M3 sting approved?
4. M4 end line: cocolocal.co.uk/follow or /wheel? Prize shown on the wheel: Free slushie OK?
5. Facebook page name (or confirm it's read from the screenshot).
6. M5: which offers are live this week?
7. Delivery: keep outputs in ~/coco-motion-kit/exports/, or copy to a NEW Drive folder?

---
## 10. Deliverable conventions
- Folder per piece: `~/coco-motion-kit/<mN-name>/` for sources; renders in `~/coco-motion-kit/exports/<mN-name>/`.
- Naming: `coco-<piece>-<variant>-<theme>-<WxH>.mp4` plus `-silent.mp4`. Example: `coco-signature-proud-navy-dark-1080x1350.mp4`.
- H.264, 60 fps, AAC 256k, `+faststart`. Each piece gets a contact sheet PNG and an updated STATUS.md.
- End every piece by updating this file's section 7 table so the next session can resume.
