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
# Drive destinations (folders created in "05 — Marketing & Content / 05 — Brand Motion Kit")
DRIVE = {"m1-signature": ("1h06lXaj_iE_FEwC_uUWskjgVuQwqkOXm", "1QUyNksH4dYjCZbGhq95Ur_7LaJbFp_Gd"),
         "m2-outros": ("136OpXk2gsXaUsS-BXKR9SIUQp_5dU1Cg", "1Owc_oGJ37rOLrBFLQwg9kZloUFKuIZGH"),
         "m3-sting": ("1oJuKwz33COS0N2AdbmpltELAf0I2_hcl", "1A0JDB-EpGn3LyeiWC-QTUzk-bj3HcXax")}
M4, M5 = "1XqOaJozQJ54uD0mbR0cwSfhackWY9jjO", "1KE8TomciFsda8w7OMYrzRYF8eTiSMhTT"
up = []
for d, (label, desc, folder) in {"drafts/coco-follow-draft-navy-dark-1080x1350.mp4": ("M4 Follow us", "9.5 s, 4:5 navy. Instagram → Facebook → Coco Wheel → /follow.", M4),
                                  "drafts/coco-offer-yazoo-draft-navy-1080x1350.mp4": ("M5 Weekly offer", "8 s, 4:5 navy. Yazoo BOGOF sample from offers.json.", M5)}.items():
    up.append({"src": d, "folder": folder, "mime": "video/mp4"})
    sh = d.replace("-navy-dark-1080x1350.mp4", "-contact-sheet.png").replace("-navy-1080x1350.mp4", "-contact-sheet.png")
    up.append({"src": sh, "folder": folder, "mime": "image/png"})
drafts = [{"file": "drafts/coco-follow-draft-navy-dark-1080x1350.mp4", "sheet": "drafts/coco-follow-draft-contact-sheet.png", "title": "M4 Follow us", "desc": "9.5 s · 4:5 navy. Instagram → Facebook → Coco Wheel → cocolocal.co.uk/follow."},
          {"file": "drafts/coco-offer-yazoo-draft-navy-1080x1350.mp4", "sheet": "drafts/coco-offer-yazoo-draft-contact-sheet.png", "title": "M5 Weekly offer", "desc": "8 s · 4:5 navy. Yazoo BOGOF sample, driven by offers.json."}]
for sh, piece in [("coco-signature", "m1-signature"), ("coco-outros", "m2-outros"), ("coco-outro-tails", "m2-outros"), ("coco-sting", "m3-sting")]:
    up.append({"src": f"sheets/{sh}-contact-sheet-1080x1350.png", "folder": DRIVE[piece][0], "mime": "image/png"})
for it in items:
    up.append({"src": it["file"], "folder": DRIVE[it["piece"]][0], "mime": "video/mp4"})
for it in items:
    up.append({"src": it["silent"], "folder": DRIVE[it["piece"]][1], "mime": "video/mp4"})
for u in up: u["title"] = u["src"].split("/")[-1]
print(tpl.replace("/*MANIFEST*/null", json.dumps({"pieces": PIECES, "items": items})).replace("/*UPLOADS*/null", json.dumps(up)).replace("/*DRAFTS*/null", json.dumps(drafts)))
