"""Build a self-contained Part 2 v3 piece: python3 build.py <play-id> <out.html>"""
import base64, json, pathlib, sys
from PIL import Image
import numpy as np
H = pathlib.Path(__file__).parent; A = H / 'assets'; F = pathlib.Path('/root/offers-revision/part2/outputs/coco-offers-part2-cream/assets')
M = json.load(open(A / 'meta.json'))
uri = lambda p: 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
lg = Image.open(F / 'logo-lockup-navy.png'); a = np.array(lg.convert('RGBA'))[:, :, 3]; ys, xs = np.nonzero(a > 20)
M['logoInk'] = dict(x=int(xs.min()), y=int(ys.min()), w=int(xs.max() - xs.min() + 1), h=int(ys.max() - ys.min() + 1))

def crisps():
    # (target x, y, size, th, launch x, back?) — targets keep clear of the pack labels and the price block
    spec = [(230, 770, 118, .42, 300, 1), (440, 725, 104, .45, 420, 1), (650, 740, 110, .44, 690, 1), (860, 780, 122, .41, 790, 1),
            (548, 860, 96, .36, 545, 1), (135, 990, 108, .34, 250, 1), (955, 1010, 112, .35, 840, 1),
            (96, 1180, 150, .30, 205, 0), (988, 1230, 158, .31, 880, 0), (205, 1488, 150, .18, 250, 0), (905, 1505, 146, .18, 850, 0), (835, 735, 150, .40, 760, 0)]
    out = []
    for k, (tx, ty, sz, th, x0, back) in enumerate(spec):
        r = np.random.default_rng(k + 3)
        out.append(dict(tx=tx, ty=ty, size=sz, th=th, x0=x0, back=bool(back), sprite=[3, 5][k % 2], mirror=[1, -1][(k // 2) % 2],
                        rot=float(r.uniform(-1.2, 1.2)), flip=float(r.uniform(-.5, .5)), wz=float(r.uniform(5, 11) * r.choice([-1, 1])),
                        wf=float(r.uniform(6, 12) * r.choice([-1, 1])), delay=float(k % 4) * .03))
    return out

offers = {
 'coffee': dict(id='coffee', eyebrow='DOUBLE UP ON YOUR FAVOURITE', headline='A little coffee break.', priceLead='Buy 1, get 1', priceValue='FREE', priceSize=108,
                detail='Starbucks Frappuccino · 250ml bottles', saving='', back=['#E7D2BC', '#F3E8DB'], prodH=640, gap=70),
 'mccoys': dict(id='mccoys', eyebrow='FAMILIAR FAVOURITES', headline='Big on crunch.', priceLead='Any 2 for', priceValue='£2.20', priceSize=108,
                detail='McCoy’s Ridge Cut crisps · 65g', saving='50p below two £1.35 price-marked packs', back=['#EAE0CF', '#F5EEE3'], prodH=500, gap=34, crisps=crisps()),
}
play = sys.argv[1]
need = set()
for p in M['products'][play]: need.add(p['src'])
if play == 'coffee':
    L = M['liquids']['coffee-action']; need |= {L['ribbon'], L['umap']} | {d['src'] for d in L['drops']}
if play == 'mccoys':
    need |= {c['src'] for c in M['crisps']}
M2 = dict(M); M2['liquids'] = {k: v for k, v in M['liquids'].items() if v['ribbon'] in need}
cfg = dict(play=play, offers=offers, uri={s: uri(A / s) for s in need})
fonts = ''.join('@font-face{font-family:Poppins;src:url(data:font/woff2;base64,' + base64.b64encode((F / f'poppins-latin-{w}-normal.woff2').read_bytes()).decode() + ') format("woff2");font-weight:' + str(w) + ';}' for w in (500, 600, 700))
s = (H / 'template.html').read_text().replace('__FONTS__', fonts).replace('__CFG__', json.dumps(cfg)).replace('__META__', json.dumps(M2)).replace('__LOGO__', uri(F / 'logo-lockup-navy.png'))
pathlib.Path(sys.argv[2]).write_text(s); print('built', sys.argv[2], len(s) // 1024, 'KB')
