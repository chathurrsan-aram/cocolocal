# Offers revision (September 2026)

Two jobs, in order:

1. **Drinks reel: new soundtrack.** The restored original animation (`m5-offers/reel.html` at 5e296b8, plus the full-width detail line) is re-rendered unchanged. `music/old_reel_score.py` writes an original funk/house cue on the reel's own 124 BPM, 48-beat grid. Every accent is placed against the reel's `seek()` choreography: the drop on the camera push (beat 4), the headline slams (5, 5.5), each offer entering (8, 16, 24, 32), products landing on 8ths, price slams (12, 20, 28, 36), whips (+7.6), the logo (40) and a final button (44).
   - `music/groove.py` is the NumPy instrument kit: drum machine, funk bass, FM electric piano, brass and string sections, foley, bus reverb, sidechain and glue compression. It uses no samples and no third-party audio.
   - `music/master.sh` is a two-pass loudnorm to −14 LUFS / −1 dBTP.
   - `music/sync_check.py` and `music/accent_check.py` measure onset timing and accent loudness per event.

2. **Offers Part 2: motion rebuild (v3).** `part2-v3/` replaces the rejected v2 motion:
   - **Liquids** are poured along the splash's own path. `prep.py` computes a geodesic progress map over the ribbon, and droplets are flung from the ribbon as the pour front passes them. This replaces v2's `flow()`, which wobbled 48 slices of a still image.
   - **Crisps** fly on closed-form ballistic arcs with drag, reaching designed apex positions clear of labels and prices. A speed ramp slows them to 2% for the reading hold. This replaces v2's `flying()` ellipses.
   - **Products** land solid (no opacity ghosting) on one baseline. There are no cylindrical label spins; v2's `spinTube()` produced hollow tubes.

Inputs not in this repo: the product cut-outs, generated splash and crisp art, logo and fonts come from the Part 2 handoff archive (`part2-code.zip`, `work/part2-motion/assets`, `work/revision2/assets`, `outputs/coco-offers-part2-cream/assets`). Point `prep.py` / `build.py` at your extracted copy.

    python3 part2-v3/prep.py && python3 part2-v3/build.py coffee build/coffee.html
    python3 music/p2_short_score.py coffee coffee.wav && music/master.sh coffee.wav coffee.m4a

## v4 "simple" motion (prototype)

`part2-v3/template-simple.html` is a calmer take on the same scenes. Products glide up and settle with no drop and no bounce. Splashes and snacks ease in together and then float gently. Prices and headlines rise in on the beat. Scenes change with a soft dip through cream, and the header and footer hold still. Build it with:

    TEMPLATE=template-simple.html python3 part2-v3/build.py coffee build/coffee.html

`music/p2_music.py` has `SIMPLE = True`, which swaps the thuds, pours and crunches for soft swells to match. Set it to `False` to get the v3 sound design back.

## v5 motion (current)

`part2-v3/template-v5.html` keeps every v3 hero action: pours, bursts, price slams and whips. Three things changed:

- **Products** are set down naturally. Each one comes in from just above, slows into contact on its beat, and settles from a slight tilt with no bounce. Bags give once as they land.
- **The reel opens** on the "This week's deals" opener from the drinks reel, restyled in cream. The colour wipes run, "This week at Coco Local" types out, the shopfront rises and its shutter rolls up, the camera pushes through the door with a flash, and the headline slams in twice with a peach rule. Then the cover and the eight offers follow. The reel is 88 beats long.
- **Every video ends** on the approved lockup outro from `m2-outros`. Sky, peach and cream wipes run, the basket rides in and pops on the end beat, the letters rise, the rule zips across, then the tagline, address and pill appear.

Build it with:

    TEMPLATE=template-v5.html python3 part2-v3/build.py reel build/reel.html

In `music/p2_music.py`, `SIMPLE = False` restores the v3 sound effects. `opener()` ports the drinks reel's opener sounds, and `outro_fx()` scores the lockup.

## v6 reel (in review)

`part2-v3/template-v6.html` changes only the full reel. Everything else is as in v5.

- The price value is roughly twice as big, with a small qualifier line above it.
- Each offer keeps one headline and one detail line. The eyebrow and savings lines are gone.
- Products are 18% smaller.
- The "Big favourites. Little prices." slide now plays just before the outro.

Build it with:

    TEMPLATE=template-v6.html PRODSCALE=0.82 python3 part2-v3/build.py reel build/reel.html

The `reel()` cue in `music/p2_music.py` follows the new order: opener, then the offers, then the recap slide as a breakdown and drop, then the outro.
