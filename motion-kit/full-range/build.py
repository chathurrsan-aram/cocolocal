"""Build the Full Range piece into one self-contained HTML file.
    python3 build.py out.html
Collection copy, the shelves each one lights and the walking route from the door live here; motion lives in template.html.
Shelf ids follow the owner's layout: tables (machine table), chill (soft drinks + milk chillers), A/B (low front units),
C (cakes/sauces), D (cereal/household), E (rear household unit), W (back wall shelving), counter, wine, beer, frozen."""
import base64, json, pathlib, sys
H = pathlib.Path(__file__).parent; I = H / 'img'
F = pathlib.Path('/root/offers-revision/part2/outputs/coco-offers-part2-cream/assets')
uri = lambda p, mt: f'data:{mt};base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()

DOOR = [100, 385]
COLS = [
 dict(id='slushies', tab='Slushies', eyebrow='ICE-COLD TREATS', headline='Ice-cold slushies.', sub='Red, blue or a colourful mix.',
      lit=['tables'], where='By the entrance · slush machine', path=[DOOR, [150, 330], [152, 248]]),
 dict(id='coffee', tab='Chilled coffee', eyebrow='READY WHEN YOU ARE', headline='Chilled coffee.', sub='Iced coffee and Frappuccino, ready to go.',
      lit=['chill'], where='Chiller wall · on your left', path=[DOOR, [200, 300], [430, 266]]),
 dict(id='sweets', tab='Sweets', eyebrow='A LITTLE TREAT', headline='Sweet discoveries.', sub='Sweets, chocolate and sharing favourites.',
      lit=['A', 'B', 'counter'], where='Front displays and the counter', path=[DOOR, [240, 392], [350, 392]]),
 dict(id='snacks', tab='Crisps & snacks', eyebrow='SOMETHING SAVOURY', headline='Crisps & snacks.', sub='Sharing bags, classics and something new.',
      lit=['A', 'B'], where='Front low shelves', path=[DOOR, [240, 392], [350, 392]]),
 dict(id='diy', tab='DIY', eyebrow='HANDY TO HAVE', headline='DIY & hardware.', sub='Drill bits, hex keys, brushes and more.',
      lit=['W'], where='Back wall shelving', path=[DOOR, [230, 288], [470, 284], [760, 290], [880, 292]]),
 dict(id='household', tab='Household', eyebrow='EVERYDAY ESSENTIALS', headline='Home, sorted.', sub='Cleaning, laundry and everyday essentials.',
      lit=['D', 'E'], where='Middle and rear household shelves', path=[DOOR, [240, 392], [460, 392], [765, 392], [780, 452], [880, 452]]),
 dict(id='pets', tab='Pet food', eyebrow='FOR THE FAMILY PET', headline='Pet food & treats.', sub='Cat food, dog food and biscuit treats.',
      lit=['E'], where='Rear household unit · by the freezer', path=[DOOR, [240, 392], [460, 392], [460, 500], [860, 500], [960, 470]]),
 dict(id='stationery', tab='Stationery', eyebrow='SCHOOL, HOME, OFFICE', headline='Stationery & supplies.', sub='Pens, pads, glue, tape and envelopes.',
      lit=['W'], where='Back wall shelving', path=[DOOR, [230, 288], [470, 284], [760, 290], [960, 294]]),
 dict(id='care', tab='Personal care', eyebrow='LOOK AFTER YOURSELF', headline='Personal care.', sub='Skin care, shower gel and deodorant.',
      lit=['E'], where='Rear unit · toiletries side', path=[DOOR, [240, 392], [460, 392], [765, 392], [780, 452], [900, 452]]),
 dict(id='groceries', tab='Groceries', eyebrow='CUPBOARD FAVOURITES', headline='Groceries.', sub='Pasta, sauces and everyday meal ideas.',
      lit=['C', 'D', 'E'], where='Middle grocery shelves', path=[DOOR, [240, 392], [460, 392], [620, 392]]),
 dict(id='drinks', tab='Chilled drinks', eyebrow='GRAB ONE COLD', headline='Chilled drinks.', sub='Energy drinks, juices and fizzy favourites.',
      lit=['chill'], where='Chiller wall · on your left', path=[DOOR, [200, 300], [520, 272]]),
 dict(id='alcohol', tab='Beer & wine', eyebrow='FOR THE WEEKEND · 18+', headline='Beer & wine.', sub='Lagers, wines and ciders. Please drink responsibly.',
      lit=['wine', 'beer'], where='Wine shelves and beer fridges', path=[DOOR, [240, 392], [460, 392], [460, 515], [720, 522]], alcohol=True),
]
img = {}
for c in COLS:
    img[c['id']] = uri(I / f"{c['id']}.jpg", 'image/jpeg'); img['shelf-' + c['id']] = uri(I / f"shelf-{c['id']}.jpg", 'image/jpeg')
cfg = dict(collections=COLS, img=img)
fonts = ''.join('@font-face{font-family:Poppins;src:url(data:font/woff2;base64,' + base64.b64encode((F / f'poppins-latin-{w}-normal.woff2').read_bytes()).decode() + ') format("woff2");font-weight:' + str(w) + ';}' for w in (500, 600, 700))
s = (H / 'template.html').read_text().replace('__FONTS__', fonts).replace('__CFG__', json.dumps(cfg)).replace('__LOGO__', uri(I / 'logo.png', 'image/png'))
pathlib.Path(sys.argv[1]).write_text(s); print('built', sys.argv[1], len(s) // 1024, 'KB')
