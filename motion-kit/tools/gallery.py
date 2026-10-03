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
M4, M5, WH = "1XqOaJozQJ54uD0mbR0cwSfhackWY9jjO", "1KE8TomciFsda8w7OMYrzRYF8eTiSMhTT", "12QoeTvLudy6P-jzIdunFTntYkBFDieP6"
DR = [  # file stem, title, description, Drive folder — newest first
    ("coco-follow-v2-draft-r2-navy-dark-1080x1350", "Follow Us v2", "12 s · pop 120 BPM. Cursor clicks through /follow, then the real Follow buttons on Instagram and Facebook.", M4),
    ("coco-wheel-win-v2-draft-navy-dark-1080x1350", "Coco Wheel: Win v2", "13 s · drive 128 BPM. Lever, spin, hit + confetti on Free hot chocolate, YOU WON! + fanfare, mug drops on the beat, code and redeem steps.", WH),
    ("coco-wheel-lose-v2-draft-navy-dark-1080x1350", "Coco Wheel: Lose v2", "12.5 s · playful 96 BPM. Teeters on the slushie line, SO CLOSE!, basket tips over, bounces back: try again next week.", WH),
    ("coco-wheel-howto-draft-r2-navy-dark-1080x1350", "Coco Wheel: How to enter", "15 s · light 110 BPM. Bio link → /follow → wheel → name and email → spin → code.", WH),
    ("coco-offers-reel-v2-draft-navy-1080x1350", "Drinks offers reel v2", "23 s · disco 124 BPM. Shutter up, clean cut-out cans spin in with light behind, prices slam on the beat, address outro.", M5),
    ("coco-follow-v2-navy-dark-1080x1920", "Follow Us v2 · 9:16", "Reels/Stories version.", M4),
    ("coco-wheel-win-v2-navy-dark-1080x1920", "Coco Wheel: Win v2 · 9:16", "Reels/Stories version.", WH),
    ("coco-wheel-lose-v2-navy-dark-1080x1920", "Coco Wheel: Lose v2 · 9:16", "Reels/Stories version.", WH),
    ("coco-wheel-howto-navy-dark-1080x1920", "Coco Wheel: How to enter · 9:16", "Reels/Stories version.", WH),
    ("coco-offers-reel-v2-navy-1080x1920", "Drinks offers reel v2 · 9:16", "Reels/Stories version.", M5),
    ("coco-follow-v2-navy-dark-1080x1080", "Follow Us v2 · 1:1", "Square version.", M4),
    ("coco-wheel-win-v2-navy-dark-1080x1080", "Coco Wheel: Win v2 · 1:1", "Square version.", WH),
    ("coco-wheel-lose-v2-navy-dark-1080x1080", "Coco Wheel: Lose v2 · 1:1", "Square version.", WH),
    ("coco-wheel-howto-navy-dark-1080x1080", "Coco Wheel: How to enter · 1:1", "Square version.", WH),
    ("coco-offers-reel-v2-navy-1080x1080", "Drinks offers reel v2 · 1:1", "Square version.", M5),
    ("coco-follow-draft-navy-dark-1080x1350", "Follow Us v1 (alternative)", "9.5 s. The first version with the Follow pill and wheel ending.", M4),
    ("coco-offer-yazoo-draft-navy-1080x1350", "Weekly offer v1 (Yazoo)", "8 s. Single-offer card from offers.json.", M5)]
up = []; drafts = []
for stem, title, desc, folder in DR:
    sheet = f"drafts/{stem}-contact-sheet.png" if stem.endswith(("1080x1920", "1080x1080")) else "drafts/" + stem.replace("-navy-dark-1080x1350", "").replace("-navy-1080x1350", "") + "-contact-sheet.png"
    up += [{"src": f"drafts/{stem}.mp4", "folder": folder, "mime": "video/mp4"}, {"src": sheet, "folder": folder, "mime": "image/png"}]
    drafts.append({"file": f"drafts/{stem}.mp4", "sheet": sheet, "title": title, "desc": desc})
for sh, piece in [("coco-signature", "m1-signature"), ("coco-outros", "m2-outros"), ("coco-outro-tails", "m2-outros"), ("coco-sting", "m3-sting")]:
    up.append({"src": f"sheets/{sh}-contact-sheet-1080x1350.png", "folder": DRIVE[piece][0], "mime": "image/png"})
for it in items:
    up.append({"src": it["file"], "folder": DRIVE[it["piece"]][0], "mime": "video/mp4"})
for it in items:
    up.append({"src": it["silent"], "folder": DRIVE[it["piece"]][1], "mime": "video/mp4"})
for u in up: u["title"] = u["src"].split("/")[-1]
print(tpl.replace("/*MANIFEST*/null", json.dumps({"pieces": PIECES, "items": items})).replace("/*UPLOADS*/null", json.dumps(up)).replace("/*DRAFTS*/null", json.dumps(drafts)))
