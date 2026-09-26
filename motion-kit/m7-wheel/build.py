"""Build the Coco Wheel Win / Lose motions.  python3 m7-wheel/build.py win|lose [theme]
Beat plans (all times on the beat grid):
  WIN  128 BPM, 7 bars (13.1 s): lever b5–6 · spin b6–12 · LAND b12 (hit, flash, confetti) · dim + "YOU WON!" slam + fanfare b13 ·
       mug drops slowly b13→b15, lands with a squash + confetti rain · "Free hot chocolate" b15.5 · code card b18.5 · steps b19.5–21.5 · end b24
  LOSE 96 BPM, 5 bars (12.5 s): lever b3.5–4 · spin b4–8 (teeters on the slushie line) · LAND b8 womp · "SO CLOSE!" slam b9 ·
       basket drops b9.5→b10.5, tips over b11 · bounces back b12 with "Try again next week" · bonus-spin line b13 · end b16"""
import base64, json, pathlib, subprocess, sys
H = pathlib.Path(__file__).resolve().parent; K = H.parent
mode = sys.argv[1]; theme = sys.argv[2] if len(sys.argv) > 2 else "navy-dark"
def uri(p): p = pathlib.Path(p); m = {"webp": "image/webp", "png": "image/png", "svg": "image/svg+xml"}[p.suffix[1:]]; return f"data:{m};base64," + base64.b64encode(p.read_bytes()).decode()
geo = json.loads((H / "layers/props.json").read_text())
PROPS = [dict(id=k, href=uri(H / "props" / pathlib.Path(v["src"]).name), x=v["x"], y=v["y"], w=v["w"], h=v["h"]) for k, v in geo.items()]
if mode == "win":
    B = 60 / 128; b = lambda v: v * B
    C = dict(mode="win", beat=B, press=b(5), release=b(6), land=b(12), thetaF=4 * 360 + 150, dim=b(13), badge=b(13), heroDrop=b(13), heroLand=b(15),
             title=b(15.5), shrink=b(18), code=b(18.5), tip=99, end=b(24), kicks=[3, 6, 16, 20, 24], confetti=[[b(12), "burst"], [b(15), "rain"]],
             badgeText="YOU WON!", heroTitle="Free hot chocolate", heroAR=326 / 310, winProp="p-choc",
             steps=[[b(19.5), "Show your code at the till"], [b(20.5), "Within 7 days"], [b(21.5), "Screenshot it or send it to yourself"]])
    C["code"] = b(18.5); C["codeText"] = "COCO-EVNK"; hero = H / "props/hot-chocolate.webp"
else:
    B = 60 / 96; b = lambda v: v * B
    C = dict(mode="lose", beat=B, press=b(3.5), release=b(4), land=b(8), thetaF=3 * 360 - 10, dim=b(9), badge=b(9), heroDrop=b(9.5), heroLand=b(10.5),
             title=b(10.5), shrink=99, code=99, tip=b(11), end=b(16), kicks=[2, 4, 12, 16], confetti=[],
             badgeText="SO CLOSE!", heroTitle="Not this time", heroAR=310 / 366, winProp="",
             steps=[[b(12), "Try again next week"], [b(13), "Spent £10+? Ask at the till for a bonus spin."]])
    hero = K / ("brand/basket-navy.svg" if theme == "light" else "brand/basket-white.svg")
cfg = json.dumps(C).replace('"codeText": "COCO-EVNK"', '"codeText": "COCO-EVNK"')
s = (H / "piece.html").read_text().replace("__CONFIG__", cfg).replace("__PROPS__", json.dumps(PROPS)).replace("$('codeT').textContent=C.code||'';", "$('codeT').textContent=C.codeText||'';")
tmp = H / f"_piece-{mode}.html"; tmp.write_text(s)
L = "m7-wheel/layers"
subprocess.run(["python3", str(K / "tools/build_piece.py"), "--piece", str(tmp.relative_to(K)), "--theme", theme, "--out", f"build/wheel-{mode}-{theme}.built.html",
    "--img", f"L_BG={L}/stage-bg-noprops.png", "--img", f"L_RIMB={L}/rim-back.png", "--img", f"L_DISC={L}/disc.png", "--img", f"L_RIMF={L}/rim-front.png",
    "--img", f"L_PTR={L}/pointer.png", "--img", f"L_HUB={L}/hub.png", "--img", f"L_ROD={L}/lever-rod.png", "--img", f"L_SLOT={L}/lever-slot.png",
    "--img", f"L_KNOB={L}/lever-knob.png", "--img", f"HERO={hero.relative_to(K)}"], check=True)
tmp.unlink(); print(json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in C.items() if k != "steps"}))
