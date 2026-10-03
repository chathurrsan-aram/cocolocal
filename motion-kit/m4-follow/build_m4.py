"""Fill M4 placeholders (theme + embedded images) and inline fonts.
  python3 build_m4.py --theme navy-dark|indigo-dark|light --out build/m4.built.html"""
import argparse, base64, pathlib, subprocess
H = pathlib.Path(__file__).parent; K = H.parent
THEMES = {"navy-dark": ("#0F1A33", "#0F1A33", "#FFFFFF", "#FEC091", "logo-lockup-white.svg"),
          "indigo-dark": ("#161A5C", "#161A5C", "#FFFFFF", "#FEC091", "logo-lockup-white.svg"),
          "light": ("#0F1A33", "#ECEAE7", "#0F1A33", "#E89A5C", "logo-lockup-navy.svg")}
def uri(p, mime): return f"data:{mime};base64," + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
ap = argparse.ArgumentParser(); ap.add_argument("--theme", default="navy-dark"); ap.add_argument("--out", required=True); a = ap.parse_args()
navy, fin, ink, peach, lock = THEMES[a.theme]
s = (H / "piece.html").read_text()
glyph = "ig-glyph-white.png" if a.theme != "light" else "ig-glyph-black.png"
rep = {"__BG__": "#ECEAE7", "__NAVY__": navy, "__FINAL__": fin, "__INK__": ink, "__PEACH__": peach,
       "__LOCKUP__": uri(K / "brand" / lock, "image/svg+xml"), "__GLYPH_IG__": uri(H / "assets" / glyph, "image/png"),
       "__LOGO_FB__": uri(H / "assets" / "fb-logo-primary.png", "image/png"),
       "__IMG_IG__": uri(H / "assets" / "ig.jpg", "image/jpeg"), "__IMG_FB__": uri(H / "assets" / "fb.jpg", "image/jpeg")}
for kk, v in rep.items(): s = s.replace(kk, v)
out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True); tmp = out.with_suffix(".tmp.html"); tmp.write_text(s)
subprocess.run(["python3", str(K / "tools" / "build.py"), "--template", str(tmp), "--out", str(out),
  "--font", f"Poppins={K}/brand/fonts/poppins-latin-600-normal.woff2:600",
  "--font", f"Poppins={K}/brand/fonts/poppins-latin-500-normal.woff2:500"], check=True)
tmp.unlink()
