"""Render the weekly offer videos from offers.json.

  python3 render_offers.py offers.json [--formats 1080x1350,1080x1920] [--samples] [--only ID] [--theme navy|indigo]

Validates every offer first (price and status are required). Only status "live" renders unless --samples.
Outputs exports/m5-offers/coco-offer-<id>-<theme>-<WxH>.mp4 (+ -silent.mp4)."""
import argparse, base64, json, os, pathlib, subprocess, sys
H = pathlib.Path(__file__).resolve().parent; K = H.parent
THEMES = {"navy": ("#0F1A33", "#0A1226"), "indigo": ("#161A5C", "#0E1142")}
REQ = ["id", "headline_lines", "price", "status"]

def validate(offers):
    errs, warns = [], []
    for i, o in enumerate(offers):
        tag = o.get("id", f"#{i + 1}")
        for f in REQ:
            if not o.get(f): errs.append(f"{tag}: missing {f}")
        if o.get("status") not in ("live", "sample"): errs.append(f"{tag}: status must be live or sample")
        if o.get("image") and not (H / o["image"]).exists(): errs.append(f"{tag}: image not found: {o['image']}")
        if not o.get("image"): warns.append(f"{tag}: no pack shot, a neutral placeholder will show")
        if len(o.get("headline_lines", [])) > 2: errs.append(f"{tag}: headline_lines takes at most 2 lines")
    return errs, warns

def sh(*a): subprocess.run(a, check=True)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("file", nargs="?", default=str(H / "offers.json"))
    ap.add_argument("--formats", default="1080x1350,1080x1920"); ap.add_argument("--samples", action="store_true")
    ap.add_argument("--only"); ap.add_argument("--stills", help="comma-separated times: write review stills instead of video"); ap.add_argument("--theme", default="navy", choices=THEMES)
    a = ap.parse_args()
    data = json.loads(pathlib.Path(a.file).read_text()); offers = data["offers"]
    errs, warns = validate(offers)
    for w in warns: print("warning:", w)
    if errs: print("\n".join("error: " + e for e in errs)); sys.exit(1)
    todo = [o for o in offers if (o["status"] == "live" or a.samples) and (not a.only or o["id"] == a.only)]
    if not todo: print("Nothing to render (no live offers; use --samples to render samples)."); return
    navy, foot = THEMES[a.theme]
    lock = "data:image/svg+xml;base64," + base64.b64encode((K / "brand/logo-lockup-white.svg").read_bytes()).decode()
    out = K / "exports/m5-offers"; bd = K / "build"; out.mkdir(parents=True, exist_ok=True); bd.mkdir(exist_ok=True)
    tpl = (H / "piece.html").read_text()
    for o in todo:
        img = "data:image/png;base64," + base64.b64encode((H / o["image"]).read_bytes()).decode() if o.get("image") else ""
        s = (tpl.replace("__NAVY__", navy).replace("__FOOT__", foot).replace("__LOCKUP__", lock)
                .replace("__OFFER__", json.dumps(o)).replace("__IMG__", img))
        tmp = bd / f"offer-{o['id']}.html"; tmp.write_text(s); built = bd / f"offer-{o['id']}-{a.theme}.built.html"
        sh("python3", str(K / "tools/build.py"), "--template", str(tmp), "--out", str(built),
           "--font", f"Poppins={K}/brand/fonts/poppins-latin-500-normal.woff2:500",
           "--font", f"Poppins={K}/brand/fonts/poppins-latin-600-normal.woff2:600",
           "--font", f"Poppins={K}/brand/fonts/poppins-latin-700-normal.woff2:700")
        tmp.unlink()
        for wh in a.formats.split(","):
            w, h = wh.split("x"); base = out / f"coco-offer-{o['id']}-{a.theme}-{wh}"
            if a.stills:
                sh("python3", str(K / "tools/render.py"), "stills", "--html", str(built), "--w", w, "--h", h, "--outdir", f"{base}-stills", *a.stills.split(",")); continue
            sh("python3", str(K / "tools/render.py"), "video", "--html", str(built), "--w", w, "--h", h, "--dur", "8", "--out", f"{base}.raw.mp4")
            sh("ffmpeg", "-v", "error", "-y", "-i", f"{base}.raw.mp4", "-i", str(H / "m5-8s.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
               "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", f"{base}.mp4")
            sh("ffmpeg", "-v", "error", "-y", "-i", f"{base}.raw.mp4", "-c:v", "copy", "-an", "-movflags", "+faststart", f"{base}-silent.mp4")
            os.remove(f"{base}.raw.mp4"); print("done", base.name)

if __name__ == "__main__":
    main()
