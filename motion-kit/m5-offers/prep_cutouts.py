"""Cut each product out of the photo panels (packshots/*.jpg) with rembg (BiRefNet, whole panel), split into
single products at fixed column bands (touching cans are upright, so a straight cut is clean), then strip thin
splash strands from the wine bottles with a morphological opening. Output: cutouts/<panel>-<n>.png (git-ignored)."""
import pathlib, numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter
from rembg import new_session, remove
H = pathlib.Path(__file__).parent; S = new_session("birefnet-general"); O = H / "cutouts"; O.mkdir(exist_ok=True)
# column bands (fractions of panel width) for each product, left to right
BANDS = {"beer-4pack": [(0, .25), (.25, .5), (.5, .75), (.75, 1)], "beer-4pints": [(0, .255), (.255, .5), (.5, .745), (.745, 1)],
         "spirits-35cl": [(0, .5), (.5, 1)], "wine-lvf": [(.18, .5), (.5, .82)], "wine-mcguigan": [(.2, .5), (.5, .8)]}
OPEN = {"wine-lvf": 21, "wine-mcguigan": 21}          # opening size (px) to strip splash
import sys
ONLY = sys.argv[1:]  # optional: panel names to process (run one per process; BiRefNet is memory hungry)
for p in sorted((H / "packshots").glob("*.jpg")):
    if ONLY and p.stem not in ONLY: continue
    im = Image.open(p).convert("RGB"); W = im.width; full = remove(im, session=S)
    for i, (f0, f1) in enumerate(BANDS[p.stem]):
        cut = full.crop((int(f0 * W), 0, int(f1 * W), im.height)); a = cut.split()[3]
        if p.stem in OPEN:   # erode then dilate: thin splash disappears, the bottle stays
            k = OPEN[p.stem]; core = a.point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k + 6))
            core = core.filter(ImageFilter.GaussianBlur(1.5)); a = Image.fromarray(np.minimum(np.asarray(a), np.asarray(core)))
        a = a.point(lambda v: 0 if v < 30 else v)
        lab, n = ndimage.label(np.asarray(a) > 60)            # keep the main product only (drops slivers of neighbours)
        if n > 1:
            sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); keep = lab == (1 + int(np.argmax(sizes)))
            keep = ndimage.binary_dilation(keep, iterations=3); a = Image.fromarray((np.asarray(a) * keep).astype("uint8"))
        cut.putalpha(a)
        cut = cut.crop(cut.getbbox()); cut.save(O / f"{p.stem}-{i + 1}.png"); print(p.stem, i + 1, cut.size)
