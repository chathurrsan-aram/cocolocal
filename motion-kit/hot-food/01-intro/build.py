"""Build the hot food teaser pages.  python3 build.py [version ...]   (default: every version whose media exists)
Copy lives in config.json; media slots are listed under "versions"."""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'common'))
from build_html import build
H = pathlib.Path(__file__).resolve().parent; A = H.parent / 'assets'
cfg = json.loads((H / 'config.json').read_text())
want = sys.argv[1:] or list(cfg['versions'])
for v in want:
    opt = cfg['versions'][v]; hero = opt.get('hero')
    if hero and not (H.parent / hero).exists(): print('skip', v, '(missing', hero + ')'); continue
    c = dict(copy=cfg['copy'], hero_focus_y=opt.get('hero_focus_y', .55), steam_from=opt.get('steam_from'))
    build(H / 'template.html', c, dict(logo=A / 'logo-navy.png', steam=A / 'steam.png', hero=(H.parent / hero) if hero else None), H / f'teaser-{v}.html')
