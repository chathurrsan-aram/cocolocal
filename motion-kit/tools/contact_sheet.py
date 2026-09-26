"""Tile stills into one labelled contact sheet for review.

  python3 contact_sheet.py stills sheet.png [--cols 7] [--beat 0.5]
With --beat, labels read bar.beat (e.g. 3.2) as well as seconds.
Also prints how much of the frame the content fills (bbox vs canvas colour).
"""
import argparse, glob
import numpy as np
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("dir"); ap.add_argument("out")
ap.add_argument("--cols", type=int, default=7); ap.add_argument("--size", type=int, default=300)
ap.add_argument("--beat", type=float)
a = ap.parse_args()
fs = sorted(glob.glob(f"{a.dir}/t_*.png"))
ims = [Image.open(f).convert("RGB") for f in fs]
W0, H0 = ims[0].size
S = a.size; Sh = int(S * H0 / W0)
rows = (len(ims) + a.cols - 1) // a.cols
sheet = Image.new("RGB", (a.cols * S, rows * Sh), "white"); d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    t = int(f[-9:-4]) / 1000
    arr = np.asarray(im).astype(int); bg = arr[2, 2]
    m = np.abs(arr - bg).sum(2) > 30
    fill = ""
    if m.any():
        ys, xs = np.where(m); fill = f"{(xs.max() - xs.min()) / W0:.0%}w {(ys.max() - ys.min()) / H0:.0%}h"
    x0, y0 = (i % a.cols) * S, (i // a.cols) * Sh
    sheet.paste(im.resize((S, Sh)), (x0, y0))
    lab = f"{t:.2f}s"
    if a.beat:
        n = int(t // a.beat); lab = f"{n // 4 + 1}.{n % 4 + 1}  " + lab
    d.text((x0 + 6, y0 + 4), f"{lab}  {fill}", fill=(200, 0, 0))
sheet.save(a.out); print("sheet ->", a.out)
