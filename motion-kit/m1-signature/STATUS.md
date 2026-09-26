# M1 status (26 Sep 2026)
APPROVED v2. Full set NOT rendered yet (stopped at Chat's request — render the other formats only when asked). Review renders v2 done (energetic: sky/peach/navy wipes, tilted basket arrival, peach slots drop in then flip white, camera pull-back, rule streak, tagline tightens; house bed). Chat prefers "Proudly serving South Benfleet" but wants ALL variants kept. Variants: {navy #0F1A33, indigo #161A5C (approximate)} x {"A little more local.", "Proudly serving South Benfleet"}.
piece.html placeholders: __BG__ __NAVY__ __TAGLINE__ __TAGSIZE__ (150 for "more local", 128 for "proudly serving") __GCY__=560 __RULEW__=470.
Build: python3 $S/build.py --template v.html --out v.built.html --font "Poppins=../brand/fonts/poppins-latin-600-normal.woff2:600"
Render: render.py video --w W --h H --dur 5; mux with m1-5s.wav (events.json, soft synth, 3 bars trimmed to 5 s with a fade).
NEXT: Chat picks navy/indigo + tagline -> render the full set: dark (+ light: cream container, navy ink) x 1080x1080 / 1080x1350 / 1080x1920, with + silent, plus a 1200x1200 transparent WebM (drop the bg + dot, VP9 alpha).
