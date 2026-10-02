# Full Range: 12 collections (code motion piece)

A 47-second 9:16 video in the style of the cream offers carousel. It plays like an app.

- **Opening:** the "Discover more at Coco Local." cover folds into a 12-tile grid, and a finger taps Slushies. The tile grows into the collection card.
- **The twelve collections:** the finger moves along the tab bar through all twelve. Each tap swipes in the next photo, and the tab's highlight slides across with a stretch.
- **Find it in store:** for each collection, an isometric map of the shop lights the shelves where it really is, draws a dotted route from the door, drops in a polaroid of the actual shelf, and shows a location pill.
- **Ending:** a "See you in store." finale lights the whole shop, then the approved lockup outro plays.

## Where each collection lives

The map is built from the owner's customer-area layout and 3D cutaway. Shelf placement comes from the annotated CCTV and aisle photos (P1–P4), and the owner confirmed it.

| Collection | Shelves lit |
|---|---|
| Slushies | Machine table by the entrance |
| Chilled coffee, Chilled drinks | Soft drinks and milk chiller wall |
| Sweets | Low front units A and B, plus the counter |
| Crisps & snacks | Low front units A and B |
| DIY, Stationery | Back wall shelving (W) |
| Household | Middle unit D and rear unit E |
| Pet food | Rear unit E, by the freezer |
| Personal care | Rear unit E, toiletries side |
| Groceries | Units C and D, plus E's grocery side |
| Beer & wine | Wine shelves and beer fridges (18+) |

## Files

- `build.py` holds the copy, the shelves each collection lights and the walking routes.
- `template.html` holds the motion.
- `music.py` holds the original soundtrack: 120 BPM, B♭ major, with every tap, swipe and light-up on the beat grid.

The images come from the owner's Drive folder "05 — Product Range Reels / 04 — Editable Source & Product Assets". The crisps shelf photo is the F04 front low shelves shot, because the source's "snacks-photo" was actually the chiller aisle.

    python3 build.py full-range.html && python3 music.py full-range.wav
