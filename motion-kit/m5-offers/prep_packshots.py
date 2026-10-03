"""Crop the product photo panels out of the September Canva exports (reference/, from Drive
03 — Campaigns & Exports/04 — September Offers 2026). Output: packshots/*.jpg (git-ignored)."""
from PIL import Image
import pathlib
H = pathlib.Path(__file__).parent; R = H / "reference"; O = H / "packshots"; O.mkdir(exist_ok=True)
CROPS = {"beer-4pack.jpg": ("Beer-Instagram-A-01.png", (0, 522, 1080, 1150)),
         "beer-4pints.jpg": ("Beer-Instagram-A-02.png", (0, 522, 1080, 1150)),
         "wine-lvf.jpg": ("Wine-Instagram-A-1.png", (56, 478, 1024, 1168)),
         "wine-mcguigan.jpg": ("Wine-Instagram-A-2.png", (56, 478, 1024, 1168)),
         "spirits-35cl.jpg": ("Spirits-InstagramA-01.png", (226, 540, 854, 1176))}
for out, (src, box) in CROPS.items():
    Image.open(R / src).convert("RGB").crop(box).save(O / out, quality=92); print(out, box)
