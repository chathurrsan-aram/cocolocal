"""Turn the Nano Banana Pro generations into motion-ready assets (run when the PNGs are available locally).

    python3 gen_ingest.py sheet  fruit-sheet.png   fruitgen     # 4x3 sprite sheet on white -> fruitgen-0..11.png (+meta)
    python3 gen_ingest.py dark   water-wave.png    water-wave   # liquid shot on black -> RGBA via luminance key
    python3 gen_ingest.py light  wine-wave.png     wine-wave    # liquid shot on white -> RGBA via BiRefNet matte

Sheets and light liquids are matted with BiRefNet (rembg 'birefnet-general', local model), processed at 2400 px wide to keep
memory in check. Liquids then go through prep.liquid() to get their pour progress map and flung droplets.
"""
import json, sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage
H = pathlib.Path(__file__).parent; OUT = H / 'assets'; META = OUT / 'meta.json'

def matte(im):
    from rembg import remove, new_session
    s = new_session('birefnet-general')
    return remove(im.convert('RGB'), session=s, post_process_mask=True)

def load(p, width=2400):
    im = Image.open(p); r = width / im.width
    return im.resize((width, round(im.height * r)), Image.LANCZOS) if r < 1 else im

def sheet(src, name):
    im = load(src); rgba = np.array(matte(im)); a = rgba[:, :, 3] > 40
    lab, n = ndimage.label(ndimage.binary_opening(a, iterations=2))
    sizes = ndimage.sum(a, lab, range(1, n + 1)); keep = [i + 1 for i in np.argsort(sizes)[::-1][:12] if sizes[i] > 0.0015 * a.size]
    boxes = []
    for i in keep:
        ys, xs = np.nonzero(lab == i); boxes.append((ys.min(), xs.min(), ys.max() + 1, xs.max() + 1, i))
    rowh = rgba.shape[0] / 3
    boxes.sort(key=lambda b: (int(((b[0] + b[2]) / 2) // rowh), b[1]))
    meta = json.load(open(META)); meta[name] = []
    for k, (y0, x0, y1, x1, i) in enumerate(boxes):
        pad = 6; y0, x0, y1, x1 = max(0, y0 - pad), max(0, x0 - pad), min(rgba.shape[0], y1 + pad), min(rgba.shape[1], x1 + pad)
        spr = rgba[y0:y1, x0:x1].copy(); spr[:, :, 3] = (spr[:, :, 3] * (lab[y0:y1, x0:x1] == i)).astype(np.uint8)
        p = f'{name}-{k}.png'; Image.fromarray(spr).save(OUT / p); meta[name].append({'src': p, 'w': int(x1 - x0), 'h': int(y1 - y0)})
    json.dump(meta, open(META, 'w'), indent=1); print(name, len(boxes), 'sprites')

def dark_liquid(src, name):
    im = np.array(load(src, 2048).convert('RGB')).astype(float) / 255
    lum = im.max(axis=2); a = np.clip((lum - 0.035) / 0.55, 0, 1) ** 0.9
    rgb = np.clip(im / np.maximum(a[..., None], 1e-3), 0, 1)
    out = np.dstack([rgb, a]); Image.fromarray((out * 255).astype(np.uint8)).save(H / 'gen' / f'{name}.png'); print(name, 'keyed from black')

def light_liquid(src, name):
    (H / 'gen').mkdir(exist_ok=True); matte(load(src, 2048)).save(H / 'gen' / f'{name}.png'); print(name, 'matted')

if __name__ == '__main__':
    kind, src, name = sys.argv[1:4]; (H / 'gen').mkdir(exist_ok=True)
    {'sheet': sheet, 'dark': dark_liquid, 'light': light_liquid}[kind](src, name)
