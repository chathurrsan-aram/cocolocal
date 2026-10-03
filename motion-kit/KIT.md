# Coco Local Motion Kit — rules (v1, 26 Sep 2026)

## Palette (sampled from the approved videos — CONFIRM with Chat)
| token | hex | use |
|---|---|---|
| navy | #0F1A33 | primary background, logo on light |
| cream | #ECEAE7 | light background |
| white | #FFFFFF | logo/text on navy |
| sky | #8EA9DC | wipe colour 1, secondary accent |
| peach | #FEC091 | rule, baseline, the ONE accent on navy |
| peach-deep | #E89A5C | rule/accent on cream (peach is too pale on cream) |
Offer template only (from Canva "September Offers Part 1", sample exact hexes in M5 and confirm): price yellow, lavender detail text. The Canva navy is more indigo than #0F1A33 — unify on #0F1A33 unless Chat says otherwise.

## Type
Poppins (Fontsource): 600 = wordmark + headlines, 500 = supporting text. Files in brand/fonts/. Sentence case copy. Tagline: "A little more local." (the Canva carousel used "A little local value." — confirm which is the brand line).

## Logo
- brand/logo-lockup-white.svg / logo-lockup-navy.svg — rebuilt SVG (stroke basket + Poppins 600 text, font embedded), viewBox 0 200 2150 330. Matches the approved PNG within a few px (reference-sheets/logo-svg-vs-approved-png.png). Use the approved PNG for static print/social; use the SVG for animation.
- brand/basket-white.svg / basket-navy.svg — icon only. Stroke 24, round caps. Parts (in order of drawing): handle-l, handle-r, rim, body, slot-1..3.
- Clear space = basket height on all sides. Lockup width: 60–65% of frame on 1:1 and 4:5, 70–75% on 9:16 (never > 80%). Minimum on-screen height of the basket: 40 px.

## Timing
120 BPM, beat = 0.5 s, bar = 2 s. Clicks, hits and state changes land on beats; letters/typing on 16ths (0.125 s). Every ending piece holds the final lockup ≥ 1 s.
Springs: closed-form, ζ ≥ 0.8 for geometry, tiny overshoot at most. No bouncy easing.

## Audio (audio/)
- sonic-logo-2bar.wav — pop (beat 0, basket lands) → tick, tick (beats 1.5, 2: letters) → chime (beat 3: lockup). 4 s.
- bed-soft-4bar-loop.wav, bed-house-4bar-loop.wav — 8 s original loops (no licensing).
- beatgrid.json — period ≈ 0.5 s.

## Banned
Particle bursts / dot rings, glows, gradients on UI chrome, bouncy easing, mid-word clipping glitches, animated progress bars, stock-template looks, `will-change` on anything the camera scales, AI-generated product imagery.

## Formats
1080×1080, 1080×1350, 1080×1920 (60 fps MP4, H.264 + AAC), website 1200×1200 transparent WebM (VP9 alpha). Dark (navy) + light (cream) versions of each.
Naming: coco-<piece>-<variant>-<theme>-<WxH>.mp4 (e.g. coco-signature-main-dark-1080x1350.mp4).

## Style frames
style-frames/coco-style-{dark,light}-{1080x1080,1080x1350,1080x1920}.png — the approved end state all pieces resolve to.
