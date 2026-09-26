# Coco Wheel motions status (26 Sep 2026)
DRAFTS 4:5 navy, awaiting approval:
- Win (11.25 s, drive 128 BPM): lever drag → spin → drop on Free hot chocolate (slice 7) → the real win card (code, "show at the till by …") → 3 redeem steps → end card.
- Lose (10 s, playful 96 BPM): near miss just past Free slushie onto Not this time → womp → the real "Not this time" card → try again next week / £10+ bonus spin → end card.
- How to enter (15.3 s, light 110 BPM): Instagram bio link → /follow → Spin the Coco Wheel → /wheel → lever → entry form (name + email type in) → spin → real win screen → end card.
Everything is captured from the real /wheel page (branch claude/coco-wheel-us9rh2, run with `next dev`, visited on localhost): layers/ = stage, disc, rim, gloss, pointer, hub, lever parts (3x, transparent); flow/ = page screens and result cards (demo note hidden).
The real win came up as Free hot chocolate, so the Win motion lands there to match.
Build: `python3 m7-wheel/build.py win|lose [theme]`, `m7-wheel/build-howto.sh [theme]`. Audio: win-11.25s.wav, lose-10s.wav, howto-15.3s.wav (events-*.json).
Web: silent 720px loops + posters in the website repo public/video/wheel/ and src/components/WheelLoop.tsx.
