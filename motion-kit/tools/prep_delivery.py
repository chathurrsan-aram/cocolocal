"""Gather every final motion file, copy byte-for-byte (no re-encoding), make lossless silent copies where missing,
and write delivery/manifest.json with the Drive folder for each file."""
import json, pathlib, subprocess, concurrent.futures as cf
K = pathlib.Path(__file__).resolve().parent.parent; OUT = K / "delivery/files"; OUT.mkdir(parents=True, exist_ok=True)
DRIVE = {  # piece: {theme: (folder, silent_folder)}
 "signature": {"*": ("1h06lXaj_iE_FEwC_uUWskjgVuQwqkOXm", "1QUyNksH4dYjCZbGhq95Ur_7LaJbFp_Gd")},
 "outro": {"*": ("136OpXk2gsXaUsS-BXKR9SIUQp_5dU1Cg", "1Owc_oGJ37rOLrBFLQwg9kZloUFKuIZGH")},
 "sting": {"*": ("1oJuKwz33COS0N2AdbmpltELAf0I2_hcl", "1A0JDB-EpGn3LyeiWC-QTUzk-bj3HcXax")},
 "follow-us": {"navy": ("1XqOaJozQJ54uD0mbR0cwSfhackWY9jjO",) * 2, "light": ("1NxpEc14BI5E-PlSOgPPlDSULHyw8W6kK",) * 2, "indigo": ("1l14q9zE5pw6-x6T0dE-UBFrBG2pkHZH0",) * 2},
 "offers-reel-drinks": {"navy": ("1KE8TomciFsda8w7OMYrzRYF8eTiSMhTT",) * 2, "light": ("1hHY3dLtjQo6PAUkJeV7YFuNf2_xqeq0_",) * 2, "indigo": ("1GrkMTob_mq-9WzU1V7drpCh5C3rnrIST",) * 2},
 "wheel": {"navy": ("12QoeTvLudy6P-jzIdunFTntYkBFDieP6",) * 2, "light": ("1_ZuWYbGv2sIKJNoq8mYNl9Fz4iTWjC-t",) * 2, "indigo": ("19LMV_kKwkDZK54G2y7vVdRcejDip3xYf",) * 2}}
E = K / "exports"; R = K / "review-renders"
items = []   # (group, final name, source, drive key, theme)
# approved M1–M3: copy as-is (already small), with their silent copies
for sub, key in (("m1-signature", "signature"), ("m2-outros", "outro"), ("m3-sting", "sting")):
    for f in sorted((E / sub).glob("coco-*.mp4")):
        items.append(("Logo, outros & sting", f.name, f, key, "*", "copy"))
NEW = {"follow-us": ("coco-follow-v2", "Follow Us"), "wheel-win": ("coco-wheel-win-v2", "Coco Wheel: Win"), "wheel-lose": ("coco-wheel-lose-v2", "Coco Wheel: Lose"),
       "wheel-how-to-enter": ("coco-wheel-howto", "Coco Wheel: How to enter")}
TH = {"navy": "navy-dark", "light": "light", "indigo": "indigo-dark"}
for piece, (stem, group) in NEW.items():
    key = "wheel" if piece.startswith("wheel") else piece
    for th, tf in TH.items():
        for wh in ("1080x1920", "1080x1350", "1080x1080"):
            if th == "navy":
                src = {"1080x1920": E / "drafts-916" / f"{stem}-navy-dark-1080x1920.mp4", "1080x1080": E / "drafts-11" / f"{stem}-navy-dark-1080x1080.mp4",
                       "1080x1350": R / (f"{stem.replace('-v2', '')}-v2-draft-navy-dark-1080x1350.mp4" if piece.startswith("wheel-") and piece != "wheel-how-to-enter" else f"{stem}-draft-navy-dark-1080x1350.mp4")}[wh]
            else:
                src = E / "colours" / f"{stem}-{tf}-{wh}.mp4"
            items.append((group, f"coco-{piece}-{th}-{wh}.mp4", src, key, th, "enc"))
for th, tf in TH.items():
    for wh in ("1080x1920", "1080x1350", "1080x1080"):
        src = E / "m5-offers" / (f"coco-offers-reel-4-{wh}.mp4" if th == "navy" and wh == "1080x1350" else f"coco-offers-reel-4-{tf}-{wh}.mp4")
        if th == "navy" and wh != "1080x1350": src = E / ("drafts-916" if wh == "1080x1920" else "drafts-11") / f"coco-offers-reel-v2-navy-{wh}.mp4"
        items.append(("Weekly offers reel (drinks)", f"coco-offers-reel-drinks-{th}-{wh}.mp4", src, "offers-reel-drinks", th, "enc"))
missing = [str(i[2]) for i in items if not i[2].exists()]
if missing: raise SystemExit("missing:\n" + "\n".join(missing))
PART = 14_500_000   # the page host takes files up to 15 MB; bigger files ship in parts the page joins back byte-for-byte
def ship(path, name):
    data = path.read_bytes()
    if len(data) <= PART:
        (OUT / name).write_bytes(data); return [f"files/{name}"]
    parts = []
    for k in range(0, len(data), PART):
        pn = f"{name}.part{k // PART + 1}"; (OUT / pn).write_bytes(data[k:k + PART]); parts.append(f"files/{pn}")
    return parts
def work(it):
    group, name, src, key, th, mode = it
    out = []
    if mode == "copy":
        folder = DRIVE[key]["*"][1 if name.endswith("-silent.mp4") else 0]
        return [dict(group=group, title=name, parts=ship(src, name), folder=folder, silent=name.endswith("-silent.mp4"), mb=round(src.stat().st_size / 1e6, 2))]
    f0, f1 = DRIVE[key][th]
    out.append(dict(group=group, title=name, parts=ship(src, name), folder=f0, silent=False, mb=round(src.stat().st_size / 1e6, 2)))
    sil_src = src.with_name(src.stem + "-silent.mp4"); sil = name.replace(".mp4", "-silent.mp4")
    if not sil_src.exists():   # lossless: drop the audio track, keep the video stream untouched
        sil_src = K / "delivery" / "tmp" / sil; sil_src.parent.mkdir(exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:v", "copy", "-an", "-movflags", "+faststart", str(sil_src)], check=True)
    out.append(dict(group=group, title=sil, parts=ship(sil_src, sil), folder=f1, silent=True, mb=round(sil_src.stat().st_size / 1e6, 2)))
    return out
with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(work, items))
man = [x for r in res for x in r]
json.dump(man, open(K / "delivery/manifest.json", "w"), indent=1)
print(len(man), "files", round(sum(m["mb"] for m in man)), "MB")
