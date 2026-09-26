"""Prepare Follow Us v2 assets from inputs/ (git-ignored, from Drive "Coco-Visitor-Follow").
- follow.png: the /follow card, rendered from src/app/follow/route.ts at 2x (follow-page.png)
- ig-before/after.jpg, fb-before/after.jpg: page column crops. The "Followed by <names>" row and
  photos are painted out (identifiable people); the stray pointer in the Facebook capture is removed.
Prints the click targets in crop pixels."""
from PIL import Image, ImageDraw
import numpy as np, pathlib, json
H = pathlib.Path(__file__).parent; I = H / "inputs"; O = H / "assets"; O.mkdir(exist_ok=True)

fp = Image.open(I / "follow-page.png").convert("RGB"); a = np.asarray(fp).astype(int)
bg = a[5, 5]; diff = np.abs(a - bg).sum(-1) > 12
ys, xs = np.where(diff); box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
card = fp.crop(box); card.save(O / "follow.png")
# button centres (CSS px from the render, x2, minus crop offset)
btn = {k: ((429 + 211) * 2 - box[0], (y + 39.3) * 2 - box[1]) for k, y in (("facebook", 430.27), ("instagram", 519.95), ("wheel", 609.64))}

def blend(im, b):
    """Fill box b by interpolating each row between the pixels just left and right of it."""
    a = np.asarray(im).astype(float).copy(); x0, y0, x1, y1 = b
    for y in range(y0, y1):
        l, r = a[y, x0 - 1], a[y, x1]; w = np.linspace(0, 1, x1 - x0)[:, None]; a[y, x0:x1] = l * (1 - w) + r * w
    im.paste(Image.fromarray(a.astype("uint8")))

def fill(im, b, col=None):
    c = col or im.getpixel((b[0] - 6, b[1] + 4)); ImageDraw.Draw(im).rectangle(b, fill=c)

for s in ("before", "after"):
    ig = Image.open(I / f"instagram-{s}-follow.jpg").convert("RGB")
    fill(ig, (548, 256, 990, 300))            # "Followed by ..." names + photos
    ig.crop((180, 0, 1000, 765)).save(O / f"ig-{s}.jpg", quality=92)
    fb = Image.open(I / f"facebook-{s}-follow.jpg").convert("RGB")
    blend(fb, (290, 60, 356, 108) if s == "before" else (1118, 378, 1160, 418))   # stray pointer
    fb.crop((170, 56, 1270, 710)).save(O / f"fb-{s}.jpg", quality=92)
meta = dict(follow=dict(size=card.size, buttons=btn), ig=dict(size=(820, 765), button=(364, 344), row=(0, 314, 820, 374)),
            fb=dict(size=(1100, 654), button=(910, 460), row=(690, 432, 1100, 494)))
json.dump(meta, open(O / "meta.json", "w"), indent=1); print(json.dumps(meta))
