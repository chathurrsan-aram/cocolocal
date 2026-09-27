"""Build a self-contained Part 2 v3 piece.
    python3 build.py <offer-id | reel> <out.html>
Offer copy, colours, product sizes and hero actions live here; motion lives in template.html."""
import base64, json, math, os, pathlib, sys
import numpy as np
from PIL import Image
H = pathlib.Path(__file__).parent; A = H / 'assets'; F = pathlib.Path('/root/offers-revision/part2/outputs/coco-offers-part2-cream/assets')
sys.path.insert(0, '/root/offers-revision/music'); from p2_music import STYLES
M = json.load(open(A / 'meta.json'))
uri = lambda p: 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
lg = Image.open(F / 'logo-lockup-navy.png'); a = np.array(lg.convert('RGBA'))[:, :, 3]; ys, xs = np.nonzero(a > 20)
M['logoInk'] = dict(x=int(xs.min()), y=int(ys.min()), w=int(xs.max() - xs.min() + 1), h=int(ys.max() - ys.min() + 1))
G, K = 2600, 2.2; PLY = 1405 + 6          # physics constants and product baseline (match template)

def rise(th): return (G / K ** 2) * (math.exp(K * th) - 1) - G * th / K
def th_for(r):
    lo, hi = .05, .8
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if rise(mid) < r else (lo, mid)
    return (lo + hi) / 2

def bbox(o):
    P = M['products'][o['id']]; ws = [p['w'] / p['h'] * o['prodH'] for p in P]; tw = sum(ws) + o['gap'] * (len(P) - 1)
    return 540 - tw / 2, 540 + tw / 2, PLY - o['prodH']

def burst(o, sheet, sprites, seed, n_back=7, sizes=(100, 125, 150, 175), launch_from=None):
    """Designed apex positions: an arc above the products, two side columns, two plinth-front corners. Front pieces stay outside the pack faces."""
    x0, x1, top = launch_from or bbox(o); r = np.random.default_rng(seed); out = []
    arc = [(lerp_, top - r.uniform(115, 195)) for lerp_ in np.linspace(max(150, x0 - 40), min(930, x1 + 40), n_back - 2)]
    back = arc + [(max(110, x0 - 70), top + 120), (min(970, x1 + 70), top + 140)]
    front = [(max(92, x0 - 110), top + 330), (min(988, x1 + 110), top + 380), (190, PLY + 85), (900, PLY + 100), (min(900, x1 - 20), top - 190)]
    for k, (tx, ty) in enumerate(back + front):
        isback = k < len(back); ty = max(ty, 720)
        lx = float(np.clip(tx + r.uniform(-60, 60), x0 + 40, x1 - 40)) if isback else float(np.clip(tx, x0 + 30, x1 - 30))
        ly = top + 90 if isback else (PLY - 90 if ty < PLY else ty + 100)
        th = th_for(max(40, ly - ty)) if ty < ly else .18
        out.append(dict(tx=float(tx), ty=float(ty), th=th, x0=lx, back=isback, sheet=sheet, sprite=int(sprites[k % len(sprites)]), mirror=[1, -1][(k // 2) % 2],
                        size=float(sizes[k % len(sizes)] * (.82 if isback else 1.05) * r.uniform(.9, 1.1)), rot=float(r.uniform(-1.2, 1.2)), flip=float(r.uniform(-.5, .5)),
                        wz=float(r.uniform(5, 11) * r.choice([-1, 1])), wf=float(r.uniform(6, 12) * r.choice([-1, 1])), delay=float(k % 4) * .03))
    return out

OFF = {
 'water': dict(eyebrow='THE EVERYDAY ESSENTIAL', headline='Water, sorted.', priceLead='12 bottles for', priceValue='£2.99', detail='Saka or Aqua Pura · 12 × 500ml · per pack',
               saving='', back=['#D6E8EC', '#EEF4F2'], prodH=380, gap=24, prodKind='pack', kind='pour', liquid='water-action', pour=dict(cx=540, cy=1060, s=.66, alpha=.95)),
 'coffee': dict(eyebrow='DOUBLE UP ON YOUR FAVOURITE', headline='A little coffee break.', priceLead='Buy 1, get 1', priceValue='FREE', detail='Starbucks Frappuccino · 250ml bottles',
               saving='', back=['#E7D2BC', '#F3E8DB'], prodH=640, gap=70, prodKind='bottle', kind='pour', liquid='coffee-action', pour=dict(cx=520, cy=1075, s=.66)),
 'thirsty': dict(eyebrow='SOMETHING TO SIP', headline='A colourful little pick-me-up.', priceLead='', priceValue='90p', detail='Thirsty still drinks · 90p each',
               saving='Varieties as stocked', back=['#F2D9C6', '#F8EEE6'], prodH=620, gap=40, prodKind='bottle', kind='burst'),
 'jacobs': dict(eyebrow='A LITTLE SAVOURY SOMETHING', headline='Pick your crunch.', priceLead='Any 2 for', priceValue='£2', detail='Jacob’s Mini Cheddars & Crinklys',
               saving='50p below two £1.25 price-marked packs', back=['#F0E2C0', '#F7F0E0'], prodH=380, gap=22, prodKind='bag', kind='burst'),
 'mccoys': dict(eyebrow='FAMILIAR FAVOURITES', headline='Big on crunch.', priceLead='Any 2 for', priceValue='£2.20', detail='McCoy’s Ridge Cut crisps · 65g',
               saving='50p below two £1.35 price-marked packs', back=['#EAE0CF', '#F5EEE3'], prodH=500, gap=34, prodKind='bag', kind='burst'),
 'pringles': dict(eyebrow='SNACKS WORTH POPPING IN FOR', headline='Made for sharing.', priceLead='Any 2 for', priceValue='£4', detail='Pringles · selected 165g tubes',
               saving='£1.98 below two £2.99 price-marked tubes', back=['#F0D9CF', '#F8EEEA'], prodH=600, gap=40, prodKind='tube', kind='burst'),
 'barefoot': dict(eyebrow='SOMETHING FOR THE WINE RACK', headline='Find your favourite Barefoot.', priceLead='', priceValue='£8.99', detail='Barefoot · 75cl · per bottle',
               saving='Selected varieties', back=['#E2DAE8', '#F3F0F4'], prodH=690, gap=96, prodKind='bottle', kind='pour', liquid='wine-action', pour=dict(cx=540, cy=1020, s=.85), alcohol=True),
 'yellow-tail': dict(eyebrow='SOMETHING FOR THE WINE RACK', headline='Find your favourite Yellow Tail.', priceLead='', priceValue='£8.49', detail='Yellow Tail · 75cl · per bottle',
               saving='Selected varieties', back=['#EFE2C3', '#F8F2E4'], prodH=690, gap=96, prodKind='bottle', kind='pour', liquid='wine-action', pour=dict(cx=540, cy=1000, s=.82, mirror=True), alcohol=True),
}
for k, o in OFF.items(): o.update(id=k, priceSize=108)
# snack and fruit bursts: different pieces for each offer
OFF['mccoys']['crisps'] = None   # keep the approved prototype layout
OFF['jacobs']['crisps'] = burst(OFF['jacobs'], 'crisps', [0, 3, 1, 5, 2, 0, 3], 11, sizes=(92, 110, 128, 140))
OFF['pringles']['crisps'] = burst(OFF['pringles'], 'crisps', [4], 21, sizes=(110, 130, 150, 170))
OFF['thirsty']['crisps'] = burst(OFF['thirsty'], 'fruit', [0, 1, 2, 3, 4], 31, sizes=(96, 118, 132, 150))

def mccoys_crisps():   # the approved prototype, unchanged
    spec = [(230, 770, 118, .42, 300, 1), (440, 725, 104, .45, 420, 1), (650, 740, 110, .44, 690, 1), (860, 780, 122, .41, 790, 1),
            (548, 860, 96, .36, 545, 1), (135, 990, 108, .34, 250, 1), (955, 1010, 112, .35, 840, 1),
            (96, 1180, 150, .30, 205, 0), (988, 1230, 158, .31, 880, 0), (205, 1488, 150, .18, 250, 0), (905, 1505, 146, .18, 850, 0), (835, 735, 150, .40, 760, 0)]
    out = []
    for k, (tx, ty, sz, th, x0, back) in enumerate(spec):
        r = np.random.default_rng(k + 3)
        out.append(dict(tx=tx, ty=ty, size=sz, th=th, x0=x0, back=bool(back), sheet='crisps', sprite=[3, 5][k % 2], mirror=[1, -1][(k // 2) % 2],
                        rot=float(r.uniform(-1.2, 1.2)), flip=float(r.uniform(-.5, .5)), wz=float(r.uniform(5, 11) * r.choice([-1, 1])),
                        wf=float(r.uniform(6, 12) * r.choice([-1, 1])), delay=float(k % 4) * .03))
    return out
OFF['mccoys']['crisps'] = mccoys_crisps()

INTRO = dict(id='intro', eyebrow='A LITTLE LOCAL VALUE', lines=['Big favourites.', 'Little prices.'], caption='Eight offers, one local stop.', pill='SEPTEMBER OFFERS · PART 2',
             back=['#EFE3D2', '#F6EFE5'], prodH=480, gap=16,
             items=[dict(M['products']['coffee'][0], kind='bottle'), dict(M['products']['pringles'][1], kind='bottle'),
                    dict(M['products']['jacobs'][0], kind='bag'), dict(M['products']['thirsty'][1], kind='bottle')])
INTRO['crisps'] = burst(dict(id='intro', prodH=560, gap=18), 'crisps', [3, 0, 4, 5, 1], 41, n_back=5, sizes=(90, 110, 124, 136),
                        launch_from=(170, 910, PLY - 560)) if False else []

play = sys.argv[1]
order = ['water', 'coffee', 'thirsty', 'jacobs', 'mccoys', 'pringles', 'barefoot', 'yellow-tail']
ids = order if play == 'reel' else [play]
need = set()
for i in ids + (['coffee', 'pringles', 'jacobs', 'thirsty'] if play == 'reel' else []):
    for p in M['products'][i]: need.add(p['src'])
    o = OFF[i]
    if o['kind'] == 'pour':
        L = M['liquids'][o['liquid']]; need |= {L['ribbon'], L['umap']} | {d['src'] for d in L['drops']}
    for c in (o.get('crisps') or []): need.add(M[c['sheet']][c['sprite']]['src'])
M2 = dict(M); M2['liquids'] = {k: v for k, v in M['liquids'].items() if v['ribbon'] in need}
cfg = dict(play=play, bpm=STYLES[play]['bpm'], order=order, offers={i: OFF[i] for i in ids}, intro=INTRO, uri={s: uri(A / s) for s in need})
fonts = ''.join('@font-face{font-family:Poppins;src:url(data:font/woff2;base64,' + base64.b64encode((F / f'poppins-latin-{w}-normal.woff2').read_bytes()).decode() + ') format("woff2");font-weight:' + str(w) + ';}' for w in (500, 600, 700))
s = (H / os.environ.get('TEMPLATE', 'template.html')).read_text().replace('__FONTS__', fonts).replace('__CFG__', json.dumps(cfg)).replace('__META__', json.dumps(M2)).replace('__LOGO__', uri(F / 'logo-lockup-navy.png'))
pathlib.Path(sys.argv[2]).write_text(s); print('built', sys.argv[2], len(s) // 1024, 'KB', 'bpm', cfg['bpm'])
