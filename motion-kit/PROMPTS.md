# NOTE: CLAUDE-CODE-HANDOVER.md supersedes this file (esp. M4 concept, @cocolocal_ handle, one-format-first rule).

# Motion kit prompts (M1–M6). Run M1 first; M2–M4 start from M1's end state. M5 can run any time; M6 runs last in Claude Code.
In a chat session, the kit is the uploaded coco-motion-kit.zip (unzip to /home/claude/coco-motion-kit). In Claude Code, use ~/coco-motion-kit/. Always read KIT.md + ANALYSIS.md first.

---
## M1 — Signature logo reveal (5 s, ending, 120 BPM)
Use code-motion-design (full workflow: show the beat plan, WAIT for approval, review contact sheet + transition stills before the full render). Use brand/logo-lockup-*.svg, basket parts, Poppins, KIT palette, audio/sonic-logo-2bar.wav (or re-synth with events on the final beats). Output m1-signature/.
Draft beat plan (continuity element = the navy container, then the basket stroke):
| bar.beat | time | state | sound |
| 1.1 | 0.0 | small navy dot centred (dark: dot is peach on navy) | — |
| 1.2 | 0.5 | dot stretches into the rounded container / frame | whoosh_s |
| 1.3 | 1.0 | handles draw | — |
| 1.4 | 1.5 | rim + body draw, slots on 16ths | tick ×3 |
| 2.1 | 2.0 | basket settles (spring), then slides left | pop |
| 2.2 | 2.5 | "coco" rises per letter (16ths), fully opaque, clipped from below | — |
| 2.3 | 3.0 | "local" rises per letter | — |
| 2.4 | 3.5 | peach rule draws from centre | — |
| 3.1 | 4.0 | tagline rises (use the tagline Chat confirms) | chime |
| 3.2 | 4.5 | hold ≥ 1 s | — |
Deliver: dark + light × 1080×1080, 1080×1350, 1080×1920 (with and silent), plus a 1200×1200 transparent WebM for the web, built HTML and contact sheet. Say what changed from the plan.

---
## M2 — Outro family (3 s each, ending)
Start from M1's end state. Variants: A "210 High Road, South Benfleet · Parking on site"; B "cocolocal.co.uk"; C "Spin the Coco Wheel · cocolocal.co.uk/wheel".
Beat plan: 1 (0.0) sky → navy wipe carries the basket in (short form of the M1 draw) · 2 (0.5) wordmark rises · 3 (1.0) variant line rises, clipped · 4 (1.5) peach rule + sonic chime · 5–6 (2.0–3.0) hold.
Also make a 1 s "tail" of each (lockup already on screen, line rises, hold) for appending to Higgsfield reels.
Deliver: dark + light, 1080×1350 + 1080×1920, with and silent, built HTML, one contact sheet.

---
## M3 — Intro sting (2 s, start of reels)
Beat plan: 1 (0.0) sky → peach → navy full-frame wipes (from the outros) with the basket popping in on a spring (pop) · 2 (0.5) wordmark rises out from behind the basket · 3 (1.0) hold, chime · 4 (1.5) the lockup container expands to fill the frame in navy → clean cut point at 2.0.
Deliver: dark + light, 1080×1350 + 1080×1920, with and silent, built HTML, contact sheet, and the exact frame number to cut on.

---
## M4 — Follow-us end card (4 s, UI-morph, a finger drives it)
Use ui-morph-reel style (the pill-on-cream look from the Basket Reveal fits here). ASK for the Facebook page name first. Instagram @coco.local. Use platform glyphs per each platform's brand guidelines, else text only.
Beat plan: 1 (0.0) lockup centred, finger enters · 2 (0.5) lockup shrinks to top third · 3 (1.0) Instagram pill rises · 4 (1.5) Facebook pill rises · 5 (2.0) finger taps Follow (click) · 6 (2.5) the pill morphs to "Following" with a tick, peach accent (chime) · 7 (3.0) "New offers every week" · 8 (3.5) hold, finger exits.
Deliver: dark + light, 1080×1350 + 1080×1920, with and silent, built HTML, contact sheet.

---
## M5 — Weekly offer template (data-driven)
Read Canva DAHVlO88seg (read-design with thumbnails) and sample the exact yellow/lavender hexes (confirm with Chat). Keep its structure; drop leaves, splash/AI backgrounds and the cramped cover photo. No AI product images: use cut-out pack shots if Chat provides them, else a neutral placeholder flagged in the summary.
offers.json per offer: id, eyebrow, headline_lines[], product_line, price, unit, detail_line, dates|null, alcohol (bool → auto "18+. Please drink responsibly."), image, status (live|sample). The validator refuses an offer missing price or status; only "live" renders unless --samples.
Sample (status sample): Yazoo Inspired 300ml milkshakes, "BUY ONE. GET ONE FREE.", 9 Sep – 6 Oct 2026, subject to availability.
Beat plan (8 s, 16 beats): 1 footer strip slides up · 2 eyebrow types on 16ths · 3–4 headline lines rise, clipped · 5 pack shot slides in on a spring · 6 price drops in ON the beat (yellow, pop) · 7 detail line · 8 dates chip · 9–14 hold with ≤ 2% camera drift · 15–16 card slides off / loops.
Plus: a 3 s "Offers Part N" cover card, and a reel builder chaining cover + offers + M2 variant A (15–30 s).
Tools: render_offers.py offers.json [--formats 1080x1350,1080x1920] [--reel] [--samples]; README "edit offers.json, run this".

---
## M6 — Website pieces (Claude Code in the website repo, branch motion-kit-web off homepage-refresh; preview only, no production deploy)
1. Footer logo: the M1 reveal as live SVG, played once on scroll into view, ≤ 2 s.
2. Follow-us block with the M4 Follow → Following morph (real profile links).
3. Offer cards: price drops in with the M5 timing and yellow accent (data from src/data/offers.ts).
4. Optional M1 transparent WebM hero accent — only if Lighthouse mobile performance stays ≥ 90.
Rules: transform/opacity only, springs ζ ≥ 0.8, prefers-reduced-motion shows final states, no layout shift, keyboard accessible. Deliver: preview URL, before/after screenshots (desktop, mobile, reduced motion), Lighthouse scores, summary under 150 words.
