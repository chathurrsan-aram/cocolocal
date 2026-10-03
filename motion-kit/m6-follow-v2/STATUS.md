# Follow Us v2 status (26 Sep 2026)
DRAFT 4:5 navy (12 s, pop 120 BPM): review-renders/coco-follow-v2-draft-navy-dark-1080x1350.mp4. Awaiting approval. v1 (m4-follow) kept as an alternative.
Flow: "Follow us" types on → browser window with cocolocal.co.uk/follow (rendered from src/app/follow/route.ts, now with the wheel button) → cursor clicks Instagram → real visitor capture, Follow Back → Following (the "after" capture replaces the button row on the click) → back → Facebook → Follow → Following → end card with official Meta logos, @cocolocal_, cocolocal.co.uk/follow.
Inputs: Drive folder 13Ubwk_gEo8-qE652SscjK24Si9jqCWSP (visitor before/after captures) → inputs/; render /follow at 1280x1000 @2x → inputs/follow-page.png; `python3 prep_assets.py` paints out the "Followed by <names>" row and a stray pointer.
Build: `m6-follow-v2/build.sh [theme]`; render 12 s; audio follow-v2-12s.wav (audio.py --style pop --arr 1,2,2,2,2,3, events.json).
