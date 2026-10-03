"""Split delivery/manifest.json into download pages (≤ 245 MB each). Videos with sound first, silent copies on their own pages.
Writes delivery/page-<n>/index.html + files/ (hard links; copy them before publishing). Nav links come from delivery/page-urls.json when present."""
import json, os, pathlib, shutil
K = pathlib.Path(__file__).resolve().parent.parent; D = K / "delivery"; LIMIT = 245
NAMES = {"1h06lXaj_iE_FEwC_uUWskjgVuQwqkOXm": "01 — Signature Reveal", "1QUyNksH4dYjCZbGhq95Ur_7LaJbFp_Gd": "01 — Signature Reveal / Silent copies",
 "136OpXk2gsXaUsS-BXKR9SIUQp_5dU1Cg": "02 — Outros", "1Owc_oGJ37rOLrBFLQwg9kZloUFKuIZGH": "02 — Outros / Silent copies",
 "1oJuKwz33COS0N2AdbmpltELAf0I2_hcl": "03 — Intro Sting", "1A0JDB-EpGn3LyeiWC-QTUzk-bj3HcXax": "03 — Intro Sting / Silent copies",
 "1XqOaJozQJ54uD0mbR0cwSfhackWY9jjO": "04 — Follow Us", "1NxpEc14BI5E-PlSOgPPlDSULHyw8W6kK": "04 — Follow Us / Light", "1l14q9zE5pw6-x6T0dE-UBFrBG2pkHZH0": "04 — Follow Us / Indigo",
 "1KE8TomciFsda8w7OMYrzRYF8eTiSMhTT": "05 — Weekly Offers", "1hHY3dLtjQo6PAUkJeV7YFuNf2_xqeq0_": "05 — Weekly Offers / Light", "1GrkMTob_mq-9WzU1V7drpCh5C3rnrIST": "05 — Weekly Offers / Indigo",
 "12QoeTvLudy6P-jzIdunFTntYkBFDieP6": "06 — Coco Wheel", "1_ZuWYbGv2sIKJNoq8mYNl9Fz4iTWjC-t": "06 — Coco Wheel / Light", "19LMV_kKwkDZK54G2y7vVdRcejDip3xYf": "06 — Coco Wheel / Indigo"}
man = json.load(open(D / "manifest.json")); tpl = (K / "tools/send_page.tpl.html").read_text()
for m in man: m["folderName"] = NAMES[m["folder"]]
def pack(items):
    pages, cur, size = [], [], 0.0
    for m in items:
        if size + m["mb"] > LIMIT and cur: pages.append(cur); cur, size = [], 0.0
        cur.append(m); size += m["mb"]
    if cur: pages.append(cur)
    return pages
key = lambda m: (m["folderName"], m["title"])
pages = [("Videos", p) for p in pack(sorted([m for m in man if not m["silent"]], key=key))] + [("Silent copies", p) for p in pack(sorted([m for m in man if m["silent"]], key=key))]
urls = json.load(open(D / "page-urls.json")) if (D / "page-urls.json").exists() else {}
for d in D.glob("page-*/"): shutil.rmtree(d)
for i, (kind, files) in enumerate(pages, 1):
    p = D / f"page-{i}"; (p / "files").mkdir(parents=True)
    for m in files:
        for part in m["parts"]: os.link(D / part, p / part)
    gs = []; [gs.append(m["group"]) for m in files if m["group"] not in gs]
    nav = " ".join((f'<a href="{urls[str(j)]}" target="_blank" rel="noopener"' if str(j) in urls else '<a href="#"') + (' aria-current="page"' if j == i else "") + f'>{j}. {k}{"" if k == "Videos" else ""}</a>' for j, (k, _) in enumerate(pages, 1))
    html = (tpl.replace("__TITLE__", f"Coco Motion Downloads {i}").replace("__N__", str(i)).replace("__TOTAL__", str(len(pages)))
               .replace("__HEADING__", ("Silent copies: " if kind != "Videos" else "") + ", ".join(gs)).replace("__NAV__", nav).replace("/*FILES*/[]", json.dumps(files)))
    (p / "index.html").write_text(html)
    print(i, kind, len(files), round(sum(m["mb"] for m in files)), "MB", gs)
