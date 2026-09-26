"""Build the Coco Wheel Win / Lose motions.  python3 m7-wheel/build.py win|lose [theme]"""
import json, pathlib, subprocess, sys
H = pathlib.Path(__file__).resolve().parent; K = H.parent
mode = sys.argv[1]; theme = sys.argv[2] if len(sys.argv) > 2 else "navy-dark"
if mode == "win":   # 128 BPM, 6 bars (11.25 s). Lands on Free hot chocolate (slice 7, clockwise from the top) on the bar-4 downbeat.
    B = 60 / 128
    C = dict(mode="win", beat=B, press=5 * B, release=6 * B, land=12 * B, thetaF=4 * 360 + 150, card=13 * B, end=20 * B, cardH=709,
             steps=[[16 * B, "Show your code at the till"], [17 * B, "Within 7 days"], [18 * B, "Screenshot it or send it to yourself"]])
else:               # 96 BPM, 4 bars (10 s). Just past Free slushie onto Not this time.
    B = 60 / 96
    C = dict(mode="lose", beat=B, press=3.5 * B, release=4 * B, land=8 * B, thetaF=3 * 360 - 10, card=9 * B, end=12 * B, cardH=532,
             steps=[[10 * B, "Try again next week"], [11 * B, "Spent £10+? Ask at the till for a bonus spin."]])
tmp = H / f"_piece-{mode}.html"; tmp.write_text((H / "piece.html").read_text().replace("__CONFIG__", json.dumps(C)))
L = "m7-wheel/layers"; F = "m7-wheel/flow"
subprocess.run(["python3", str(K / "tools/build_piece.py"), "--piece", str(tmp.relative_to(K)), "--theme", theme, "--out", f"build/wheel-{mode}-{theme}.built.html",
    "--img", f"L_BG={L}/stage-bg.png", "--img", f"L_RIMB={L}/rim-back.png", "--img", f"L_DISC={L}/disc.png", "--img", f"L_RIMF={L}/rim-front.png",
    "--img", f"L_PTR={L}/pointer.png", "--img", f"L_HUB={L}/hub.png", "--img", f"L_ROD={L}/lever-rod.png", "--img", f"L_SLOT={L}/lever-slot.png",
    "--img", f"L_KNOB={L}/lever-knob.png", "--img", f"CARD={F}/card-{mode}.png"], check=True)
tmp.unlink(); print(json.dumps(C))
