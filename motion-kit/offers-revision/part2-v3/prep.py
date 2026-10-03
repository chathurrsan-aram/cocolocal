"""Prepare Part 2 v3 motion assets from the archive (no generation, no edits to originals).

Liquids: for a splash/ribbon PNG, split the main ribbon from its loose droplets, and compute a
geodesic 'progress' map u(x,y) along the ribbon from a chosen source point, so the liquid can be
poured along its own path instead of wobbling.  Droplets get a spawn point on the ribbon and the
moment (u) the pour front reaches it, so each one is flung out as the liquid passes.

Snacks: extract individual crisp sprites.  Products: crop each pack/bottle from the panel cut-outs.

    python3 prep.py   ->  assets/*.png + assets/meta.json
"""
import json, pathlib, numpy as np
from PIL import Image
from scipy import ndimage
from skimage.graph import MCP_Geometric

A = pathlib.Path('/root/offers-revision/part2/work')
OUT = pathlib.Path(__file__).parent / 'assets'; OUT.mkdir(exist_ok=True)
man = {o['id']: o for o in json.load(open(A / 'revision2/offers-manifest.json'))}
meta = {'products': {}, 'liquids': {}, 'crisps': []}

def crop_products(oid, key):
    im = Image.open(A / f'part2-motion/assets/{key}.png').convert('RGBA')
    out = []
    for j, (x, y, w, h) in enumerate(man[oid]['boxes']):
        c = im.crop((x, y, x + w, y + h)); p = f'{oid}-{j}.png'; c.save(OUT / p); out.append({'src': p, 'w': w, 'h': h})
    meta['products'][oid] = out

for oid, key in [('water', 'water'), ('coffee', 'coffee'), ('thirsty', 'thirsty'), ('jacobs', 'jacobs'), ('mccoys', 'mccoys'),
                 ('pringles', 'pringles'), ('barefoot', 'wine'), ('yellow-tail', 'wine')]:
    crop_products(oid, key)

def liquid(name, source_xy, ds=2):
    im = Image.open(A / f'revision2/assets/{name}.png').convert('RGBA'); arr = np.array(im)
    a = arr[:, :, 3].astype(float) / 255
    solid = a > 0.12
    lab, n = ndimage.label(solid)
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    main_id = 1 + int(np.argmax(sizes))
    # the ribbon = biggest blob plus anything large attached to it after a small closing
    main = lab == main_id
    big = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 0.004 * solid.sum()])
    ribbon = ndimage.binary_closing(main | big, iterations=3)
    # droplets = remaining small blobs
    drops = []
    for i, s in enumerate(sizes):
        if i + 1 == main_id or s <= 6: continue
        m = lab == i + 1
        if (m & ribbon).any(): continue
        ys, xs = np.nonzero(m)
        drops.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, xs.mean(), ys.mean(), s))
    # geodesic distance along the ribbon (downsampled)
    small = ribbon[::ds, ::ds]
    cost = np.where(small, 1.0, 1e6)
    sx, sy = source_xy[0] // ds, source_xy[1] // ds
    ys, xs = np.nonzero(small); k = np.argmin((xs - sx) ** 2 + (ys - sy) ** 2); start = (ys[k], xs[k])
    dist, _ = MCP_Geometric(cost).find_costs([start])
    dist[~small] = np.nan
    u = dist / np.nanmax(dist)
    # fill u outside the ribbon with the nearest ribbon value (so feathered edges reveal smoothly)
    idx = ndimage.distance_transform_edt(~small, return_distances=False, return_indices=True)
    ufull = u[idx[0], idx[1]]
    umap = (np.clip(ufull, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(umap, 'L').save(OUT / f'{name}-u.png')
    # ribbon-only RGBA (droplets removed; alpha kept soft)
    keep = ndimage.binary_dilation(ribbon, iterations=2)
    rib = arr.copy(); rib[:, :, 3] = (rib[:, :, 3] * keep).astype(np.uint8)
    Image.fromarray(rib).save(OUT / f'{name}-ribbon.png')
    # droplet sprites: spawn on the nearest ribbon pixel, at the moment the pour front gets there
    rys, rxs = np.nonzero(small)
    dl = []
    for j, (x0, y0, x1, y1, cx, cy, s) in enumerate(drops):
        pad = 2; x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(arr.shape[1], x1 + pad), min(arr.shape[0], y1 + pad)
        spr = arr[y0:y1, x0:x1].copy(); p = f'{name}-d{j}.png'; Image.fromarray(spr).save(OUT / p)
        k = np.argmin((rxs * ds - cx) ** 2 + (rys * ds - cy) ** 2)
        dl.append({'src': p, 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                   'sx': int(rxs[k] * ds), 'sy': int(rys[k] * ds), 'u': float(u[rys[k], rxs[k]]), 'area': int(s)})
    meta['liquids'][name] = {'w': im.width, 'h': im.height, 'ribbon': f'{name}-ribbon.png', 'umap': f'{name}-u.png', 'ds': ds, 'drops': dl}
    print(name, 'drops', len(dl), 'ribbon px', int(ribbon.sum()))

liquid('coffee-action', (1120, 333))     # pour starts at the top-right curl and ends in the bottom-right crown
liquid('water-action', (1400, 120))
liquid('wine-action', (80, 120))

# crisp sprites from the generated snack sheet (2 rows x 3): 0 cracker, 1 cracker, 2 cheese-cracker piece, 3 ridge crisp, 4 plain crisp, 5 ridge crisp
im = Image.open(A / 'revision2/assets/crisps-action.png').convert('RGBA'); arr = np.array(im)[:, :, 3]; w, h = im.size
for row in range(2):
    for col in range(3):
        l, r, t, b = col * w // 3, (col + 1) * w // 3, row * h // 2, (row + 1) * h // 2
        ys, xs = np.nonzero(arr[t:b, l:r] > 64)
        box = (l + xs.min(), t + ys.min(), l + xs.max() + 1, t + ys.max() + 1)
        p = f'crisp-{row * 3 + col}.png'; im.crop(box).save(OUT / p); meta['crisps'].append({'src': p, 'w': int(box[2] - box[0]), 'h': int(box[3] - box[1])})
meta['fruit'] = []
im = Image.open(A / 'revision2/assets/fruit-action.png').convert('RGBA'); arr = np.array(im)[:, :, 3]; w, h = im.size
for row in range(2):
    for col in range(3):
        l, r, t, b = col * w // 3, (col + 1) * w // 3, row * h // 2, (row + 1) * h // 2
        ys, xs = np.nonzero(arr[t:b, l:r] > 64)
        box = (l + xs.min(), t + ys.min(), l + xs.max() + 1, t + ys.max() + 1)
        p = f'fruit-{row * 3 + col}.png'; im.crop(box).save(OUT / p); meta['fruit'].append({'src': p, 'w': int(box[2] - box[0]), 'h': int(box[3] - box[1])})
json.dump(meta, open(OUT / 'meta.json', 'w'), indent=1)
print('products', {k: len(v) for k, v in meta['products'].items()})
