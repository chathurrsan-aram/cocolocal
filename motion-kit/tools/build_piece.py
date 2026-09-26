"""Fill a piece's theme placeholders, embed images as data URIs, inline fonts.
  python3 tools/build_piece.py --piece m6-follow-v2/piece.html --theme navy-dark --img IMG_IG_BEFORE=m6-follow-v2/assets/ig-before.jpg ... --out build/x.built.html
Placeholders: __BG__ __NAVY__ __FINAL__ __INK__ __PEACH__ __LOCKUP__ __FONTFACES__ and __<KEY>__ for each --img."""
import argparse, base64, mimetypes, pathlib, subprocess
K = pathlib.Path(__file__).resolve().parent.parent
THEMES = {"navy-dark": ("#0F1A33", "#0F1A33", "#FFFFFF", "#FEC091", "logo-lockup-white.svg"),
          "indigo-dark": ("#161A5C", "#161A5C", "#FFFFFF", "#FEC091", "logo-lockup-white.svg"),
          "light": ("#0F1A33", "#ECEAE7", "#0F1A33", "#E89A5C", "logo-lockup-navy.svg")}
def uri(p):
    p = pathlib.Path(p); m = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{m};base64," + base64.b64encode(p.read_bytes()).decode()
ap = argparse.ArgumentParser(); ap.add_argument("--piece", required=True); ap.add_argument("--theme", default="navy-dark")
ap.add_argument("--img", action="append", default=[]); ap.add_argument("--out", required=True); a = ap.parse_args()
navy, fin, ink, peach, lock = THEMES[a.theme]
s = (K / a.piece).read_text()
for k, v in {"__BG__": "#ECEAE7", "__NAVY__": navy, "__FINAL__": fin, "__INK__": ink, "__PEACH__": peach, "__LOCKUP__": uri(K / "brand" / lock)}.items():
    s = s.replace(k, v)
for spec in a.img:
    key, path = spec.split("=", 1); s = s.replace(f"__{key}__", uri(K / path))
out = K / a.out; out.parent.mkdir(parents=True, exist_ok=True); tmp = out.with_suffix(".tmp.html"); tmp.write_text(s)
subprocess.run(["python3", str(K / "tools/build.py"), "--template", str(tmp), "--out", str(out)] +
               sum([["--font", f"Poppins={K}/brand/fonts/poppins-latin-{w}-normal.woff2:{w}"] for w in (500, 600, 700)], []), check=True)
tmp.unlink()
