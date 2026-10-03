"""Build the hot food carousel motion pages from hot-food-carousel.config.json.
    python3 build.py            -> builds all four: {feed,reel} × {public COMING-SOON, full DRAFT-TEMPLATE}
Public = cover + closing only (no product or menu pages until every product is confirmed with a price).
Full   = all six pages in the Canva order; it is a DRAFT TEMPLATE while any product is unconfirmed or unpriced."""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'common'))
from build_html import build
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parent; A = ROOT / 'assets'
cfg = json.loads((H / 'hot-food-carousel.config.json').read_text())
ready = all(p.get('confirmed') and p.get('price') not in (None, '') for p in cfg['products'])
def pages(full, fmt):
    cov = dict(type='cover', beats=9, eyebrow=cfg['cover']['eyebrow'], line1=cfg['cover']['line1'], line2=cfg['cover']['line2'],
               status=cfg['copy']['status'], cta=cfg['cover']['cta_' + fmt], image='cover')
    clo = dict(type='closing', beats=11 if not full else 9, **{k: cfg['closing'][k] for k in ('eyebrow', 'line1', 'line2', 'body1', 'body2', 'footnote')}, status=cfg['copy']['status'])
    if not full: return [cov, clo]
    prods = [dict(type='product', beats=7, product=i) for i in range(len(cfg['products']))]
    return [cov] + prods + [dict(type='menu', beats=8, footnote=cfg['closing']['footnote'], **cfg['menu'])] + [clo]
outs = {}
for fmt in ('feed', 'reel'):
    for full in (False, True):
        tag = ('MENU' if ready else 'DRAFT-TEMPLATE') if full else 'COMING-SOON'
        prods = [dict(p, image=f'prod{i}' if p.get('image') else None) for i, p in enumerate(cfg['products'])]
        c = dict(format=fmt, bpm=cfg['bpm'], copy=cfg['copy'], products=prods, pages=pages(full, fmt), counter=True)
        media = dict(logo=A / 'logo-navy.png', steam=A / 'steam.png', cover=ROOT / cfg['cover']['image'])
        for i, p in enumerate(cfg['products']):
            if p.get('image'): media[f'prod{i}'] = ROOT / p['image']
        name = f"carousel-{fmt}-{tag}.html"; build(H / 'template.html', c, media, H / name)
        outs[name] = sum(p['beats'] for p in c['pages']) * 60 / cfg['bpm']
(H / 'durations.json').write_text(json.dumps(outs, indent=1)); print(outs)
