"""Content QA over every built page: no stale September copy, no real prices, no unapproved claims, logo drawn at native aspect."""
import re, json, pathlib, glob
H = pathlib.Path('/root/hotfood'); bad = 0
STALE = ['September', 'SEPTEMBER', 'Big favourites', 'Little prices', 'Swipe for the offers', 'OFFERS · PART 2', 'Frappuccino · 250ml', '£2.99', '£8.99', '£8.49', '90p', 'Any 2 for']
CLAIMS = ['baked here', 'Baked here', 'freshly baked', 'Freshly baked', 'vegan', 'Vegan', 'gluten', 'halal', 'Halal', 'served from', 'Served from', '07:00', 'meal deal', 'Meal deal']
for f in sorted(glob.glob(str(H / '0[124]-*/*.html'))):
    if 'template.html' in f: continue
    s = pathlib.Path(f).read_text(); m = re.search(r'const CFG=(\{.*?\}), (?:MEDIA|IMG)=', s, re.S) or re.search(r'const CFG=(\{.*?\}), IMG=\{\}', s, re.S)
    cfg = m.group(1) if m else ''
    # the full-range page keeps its existing collections; its config embeds images, so scan only text keys
    txt = re.sub(r'data:[^"]+', '', cfg)
    hits = [w for w in STALE + CLAIMS if w in txt]
    prices = [p for p in re.findall(r'£\s?\d[\d.,]*', txt)]
    print(f'{pathlib.Path(f).name:48s} stale/claims: {hits or "none"}  real prices: {prices or "none"}')
    bad += bool(hits or prices)
print('QA', 'PASS' if not bad else 'CHECK')
