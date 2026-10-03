"""Render a seek(t) HTML piece with Playwright.

  python3 render.py stills --html piece.html --w 1440 --h 1440 0 0.5 1.0 ...   -> stills/t_XXXXX.png
  python3 render.py beats  --html piece.html --beat 0.5 --count 28 [--offset 0.32]
  python3 render.py video  --html piece.html --w 1440 --h 1440 --dur 14 --out video.mp4 [--fps 60 --sub 4]

The page must define window.seek(t) and set window.READY = true after fonts load.
Video: SUB subframes per frame across a 270deg shutter, blended with ffmpeg tmix,
every SUB-th blended frame kept. Run long renders detached:
  setsid nohup python3 render.py video ... > render.log 2>&1 < /dev/null &
"""
import argparse, os, pathlib, subprocess, sys
from playwright.sync_api import sync_playwright

def open_page(p, html, w, h):
    b = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None, args=["--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none"])
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(pathlib.Path(html).resolve().as_uri() + "?render")
    pg.wait_for_function("window.READY === true", timeout=30000)
    if errs:
        raise SystemExit("page errors: " + "; ".join(errs))
    return b, pg, errs

def shot(pg, t, w, h, fmt="png"):
    pg.evaluate(f"seek({t!r})")
    kw = dict(type=fmt, clip={"x": 0, "y": 0, "width": w, "height": h}, animations="disabled", caret="hide")
    if fmt == "jpeg":
        kw["quality"] = 94
    return pg.screenshot(**kw)

def stills(a, times):
    out = pathlib.Path(a.outdir); out.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b, pg, errs = open_page(p, a.html, a.w, a.h)
        for t in times:
            (out / f"t_{int(round(t * 1000)):05d}.png").write_bytes(shot(pg, t, a.w, a.h))
        b.close()
    if errs:
        print("ERRORS", errs)
    print(f"{len(times)} stills -> {out}/")

def video(a):
    frames = int(round(a.dur * a.fps))
    start, end = a.start or 0, a.end or frames
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", str(a.fps * a.sub), "-c:v", "mjpeg", "-i", "-",
        "-vf", f"tmix=frames={a.sub},select='not(mod(n+1\\,{a.sub}))',setpts=N/({a.fps}*TB),format=yuv420p",
        "-r", str(a.fps), "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-tune", "animation", a.out,
    ], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, pg, errs = open_page(p, a.html, a.w, a.h)
        for f in range(start, end):
            for k in range(a.sub):
                off = (k / (a.sub - 1) - 0.5) * a.shutter if a.sub > 1 else 0
                t = (f + off) / a.fps
                t = t % a.dur if a.loop else min(max(t, 0), a.dur)
                ff.stdin.write(shot(pg, t, a.w, a.h, "jpeg"))
            if f % 60 == 0:
                print(f"frame {f}/{end}", flush=True)
        b.close()
    ff.stdin.close(); ff.wait()
    print("done", a.out, flush=True)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["stills", "beats", "video"])
    ap.add_argument("times", nargs="*", type=float)
    ap.add_argument("--html", required=True)
    ap.add_argument("--w", type=int, default=1440); ap.add_argument("--h", type=int, default=1440)
    ap.add_argument("--outdir", default="stills")
    ap.add_argument("--beat", type=float, default=0.5); ap.add_argument("--count", type=int, default=28)
    ap.add_argument("--offset", type=float, default=0.32, help="seconds after each beat (0 = on the beat)")
    ap.add_argument("--dur", type=float, default=14); ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--sub", type=int, default=4); ap.add_argument("--shutter", type=float, default=0.75)
    ap.add_argument("--loop", action="store_true", help="wrap subframe times (looping piece)")
    ap.add_argument("--start", type=int); ap.add_argument("--end", type=int)
    ap.add_argument("--out", default="video.mp4")
    a = ap.parse_intermixed_args()
    if a.mode == "stills":
        stills(a, a.times)
    elif a.mode == "beats":
        stills(a, [round(i * a.beat + a.offset, 4) for i in range(a.count)])
    else:
        video(a)
