# M5 status (26 Sep 2026)
DRAFT 4:5 navy rendered: review-renders/coco-offer-yazoo-draft-navy-1080x1350.mp4 (Yazoo BOGOF sample). Awaiting approval.
Edit offers.json, then: `python3 render_offers.py offers.json [--formats 1080x1350,1080x1920] [--samples] [--only ID] [--theme navy|indigo] [--stills 1,4.5]`.
Validator refuses offers without id/headline/price/status; only status "live" renders unless --samples; alcohol:true adds "18+. Please drink responsibly." in the footer.
Colours sampled from the September artwork on Drive: price yellow #FFE36B, lavender #B2C1EE (Canva background is #0D0D43; we stay on #0F1A33).
Pack shot: packshots/yazoo-inspired-300ml.png is keyed out of "YAZOO - Option 1.png" (git-ignored; swap for a clean pack shot). Offers without an image show a flagged placeholder.
All offer statuses are "sample" until Chat confirms which are live.
TODO after approval: 3 s "Offers Part N" cover, reel builder (cover + offers + M2 A, 15–30 s), 9:16 pass.
