"""Render the weekly offers reel: shopfront intro → the offers in offers.json "reel" → address outro.

  python3 render_reel.py [offers.json] [--ids a,b,c] [--formats 1080x1350,1080x1920] [--stills 1,5,9]

Each offer gets 2 bars (124 BPM disco track, price lands on the downbeat of its second bar).
Outputs exports/m5-offers/coco-offers-reel-<n>-<WxH>.mp4 (+ -silent.mp4)."""
import argparse, base64, json, pathlib, subprocess
from PIL import Image
H = pathlib.Path(__file__).resolve().parent; K = H.parent; BPM = 124
def uri(p):
    p = pathlib.Path(p); m = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp", "svg": "image/svg+xml"}[p.suffix[1:]]
    return f"data:{m};base64," + base64.b64encode(p.read_bytes()).decode()
def panel_colour(p):
    im = Image.open(p).convert("RGB"); w, h = im.size
    px = [im.getpixel((x, y)) for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))]
    return "#%02X%02X%02X" % tuple(sum(c[i] for c in px) // 4 for i in range(3))
def sh(*a): subprocess.run(a, check=True)
ap = argparse.ArgumentParser(); ap.add_argument("file", nargs="?", default=str(H / "offers.json")); ap.add_argument("--ids")
ap.add_argument("--formats", default="1080x1350,1080x1920"); ap.add_argument("--stills"); ap.add_argument("--theme", default="navy-dark"); a = ap.parse_args()
data = json.loads(pathlib.Path(a.file).read_text()); by = {o["id"]: o for o in data["offers"]}
ids = a.ids.split(",") if a.ids else data["reel"]
if not 1 <= len(ids) <= 6: raise SystemExit("pick 1–6 offers for a reel")
offers = []
for i in ids:
    o = by[i]
    if o.get("status") != "live" or not o.get("price"): raise SystemExit(f"{i}: must be live and have a price")
    prods = o.get("products") or []
    if not prods: raise SystemExit(f"{i}: add cut-out products (run prep_cutouts.py) to use it in the reel")
    offers.append(dict(eyebrow=o.get("eyebrow"), headline_lines=o["headline_lines"], price=o["price"], unit=o.get("unit"), detail_line=o.get("detail_line"),
                       product_line=o.get("product_line"), spin=o.get("spin", "flask"), products=[uri(H / q) for q in prods]))
n = len(ids); bars = 2 + 2 * n + 2; dur = bars * 4 * 60 / BPM
# music: disco, crash on each offer's first bar; SFX on the beat grid
arr = [1, 2] + sum([[3, 2] for _ in range(n)], []) + [3, 2]
ev = [(0, "whoosh_s", .6), (0.25, "whoosh_s", .6), (0.5, "whoosh_s", .65), (1, "tick", .5), (2, "lever", .8), (3.5, "thunk", .7), (4, "whoosh", .8), (4, "hit", .7),
      (5, "snap", .8), (5, "thunk", .6), (5.5, "snap", .8), (5.5, "thunk", .6), (6, "tick", .6), (7.6, "whip", .8)]
for i in range(n):
    s = 8 + 8 * i; np_ = len(offers[i]["products"])
    ev += [(s + 0.5, "snap", .5), (s + 1, "snap", .5)]
    ev += [(s + 1.5 + (0.5 if np_ > 2 else 1) * j, "pop", .6) for j in range(np_)]
    ev += [(s + 4, "hit", .8), (s + 4, "till", .9), (s + 4.5, "tick", .5), (s + 7.6, "whip", .8)]
out = 8 + 8 * n; ev += [(out, "whoosh", .7), (out + 1, "chime", .85)]
work = K / "build"; work.mkdir(exist_ok=True)
evf = work / "reel-events.json"; evf.write_text(json.dumps([{"beat": b, "sound": s_, "gain": g} for b, s_, g in ev]))
wav = H / f"reel-{n}-offers.wav"
sh("python3", str(K / "tools/audio.py"), "synth", "--bpm", str(BPM), "--bars", str(bars), "--style", "disco", "--arr", ",".join(map(str, arr)),
   "--events", str(evf), "--out", str(wav), "--grid", str(work / "reel-grid.json"))
tpl = (H / "reel.html").read_text().replace("__REEL__", json.dumps(dict(bpm=BPM, offers=offers)))
tmp = H / "_reel.tmp.html"; tmp.write_text(tpl)
built = f"build/offers-reel-{n}-{a.theme}.built.html"
sh("python3", str(K / "tools/build_piece.py"), "--piece", str(tmp.relative_to(K)), "--theme", a.theme, "--out", built, "--img", f"IMG_SHOP={(H / 'shopfront.webp').relative_to(K)}")
tmp.unlink()
exp = K / "exports/m5-offers"; exp.mkdir(parents=True, exist_ok=True)
for wh in a.formats.split(","):
    w, h = wh.split("x"); base = exp / f"coco-offers-reel-{n}-{a.theme}-{wh}"
    if a.stills:
        sh("python3", str(K / "tools/render.py"), "stills", "--html", str(K / built), "--w", w, "--h", h, "--outdir", f"{base}-stills", *a.stills.split(",")); continue
    sh("python3", str(K / "tools/render.py"), "video", "--html", str(K / built), "--w", w, "--h", h, "--dur", f"{dur:.3f}", "--out", f"{base}.raw.mp4")
    sh("ffmpeg", "-v", "error", "-y", "-i", f"{base}.raw.mp4", "-i", str(wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", f"{base}.mp4")
    sh("ffmpeg", "-v", "error", "-y", "-i", f"{base}.raw.mp4", "-c:v", "copy", "-an", "-movflags", "+faststart", f"{base}-silent.mp4")
    pathlib.Path(f"{base}.raw.mp4").unlink(); print("done", base.name, f"{dur:.2f}s")
