# Full Range: 13 collections (code motion piece)

A 52-second 9:16 video in the style of the cream offers carousel. It plays like an app.

- **Shopfront opener:** the real shopfront photo rises in as a card under "Come on in.", with the address pill. The camera pushes through the door, a door chime plays, and an iris opens out of the doorway into the cover.
- **Opening:** the "Discover more at Coco Local." cover folds into a 13-tile grid (plus a "+ lots more in store" tile), and a finger taps Slushies. The tile grows into the collection card.
- **The thirteen collections:** the finger moves along the tab bar through all thirteen. Each tap swipes in the next photo, and the tab's highlight slides across with a stretch.
- **Find it in store:** for each collection, an isometric map of the shop lights the shelves where it really is, draws a dotted route from the door, drops in a polaroid of the actual shelf, and shows a location pill.
- **Ending:** a "See you in store." finale lights the whole shop and drops a polaroid of the shopfront beside the address, then the approved lockup outro plays.

## Where each collection lives

The map is built from the owner's customer-area layout and 3D cutaway. Shelf placement comes from the annotated CCTV and aisle photos (P1–P4), and the owner confirmed it.

| Collection | Shelves lit |
|---|---|
| Slushies | Machine table by the entrance |
| Hot coffee | Machine table by the entrance (coffee machine) |
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

The Hot coffee product photo was generated (Nano Banana Pro on OpenArt) in the same cream stone-plinth style as the other twelve, with plain unbranded cups. Its polaroid ("Made fresh in store") is a crop of the owner's coffee reference image. The shopfront is the straight-on shopfront photo from the same Drive folder.

    python3 build.py full-range.html && python3 music.py full-range.wav
