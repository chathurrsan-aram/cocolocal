"""Build the review/download gallery page from exports/.  python3 tools/gallery.py > site/index.html
Makes a poster JPG per video (end-state frame) and a manifest embedded in the page."""
import json, pathlib, re, subprocess, sys
K = pathlib.Path(__file__).resolve().parent.parent
EX = K / "exports"; SITE = K / "site"; (SITE / "posters").mkdir(parents=True, exist_ok=True)
PIECES = {"m1-signature": ("Signature reveal", "5 s. The main logo reveal. Use at the start or end of reels, on the website and in stories."),
          "m2-outros": ("Outros", "3 s end cards with one line: address, website, wheel or follow. Tails are 1.5 s versions for adding to the end of an existing clip."),
          "m3-sting": ("Intro sting", "2 s opener. Cut on the last frame straight into your footage.")}
items = []
for p in PIECES:
    for f in sorted((EX / p).glob("coco-*.mp4")):
        if f.stem.endswith("-silent"): continue
        m = re.match(r"coco-(.+)-(\d+x\d+)$", f.stem); name, wh = m.group(1), m.group(2)
        theme = "light" if name.endswith("-light") else ("indigo" if "indigo" in name else "navy")
        base = re.sub(r"-(navy-dark|indigo-dark|light)$", "", name)
        post = SITE / "posters" / f"{f.stem}.jpg"
        dur = {"m1-signature": 5, "m2-outros": 1.5 if "-tail" in name else 3, "m3-sting": 2}[p]
        at = {"m3-sting": 1.2}.get(p, dur - 0.3)
        if not post.exists():
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(at), "-i", str(f), "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "5", str(post)], check=True)
        items.append({"piece": p, "file": f"{p}/{f.name}", "silent": f"{p}/{f.stem}-silent.mp4", "poster": f"posters/{f.stem}.jpg",
                      "variant": base, "theme": theme, "wh": wh, "mb": round(f.stat().st_size / 1e6, 1)})
ORD = {"navy": 0, "indigo": 1, "light": 2}
items.sort(key=lambda i: (list(PIECES).index(i["piece"]), i["variant"], ORD[i["theme"]], i["wh"]))
tpl = (K / "tools" / "gallery.tpl.html").read_text()
print(tpl.replace("/*MANIFEST*/null", json.dumps({"pieces": PIECES, "items": items})))
