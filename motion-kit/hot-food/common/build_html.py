"""Shared builder: inlines fonts, the motion library, the config and every media file into one HTML page.
    build(template_path, cfg_dict, media_dict{name: path or None}, out_path)"""
import base64, json, pathlib
F = pathlib.Path('/root/offers-revision/part2/outputs/coco-offers-part2-cream/assets')
LIB = pathlib.Path(__file__).with_name('lib.js')
def uri(p):
    p = pathlib.Path(p); mt = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}[p.suffix.lower()]
    return f'data:{mt};base64,' + base64.b64encode(p.read_bytes()).decode()
def fonts():
    return ''.join('@font-face{font-family:Poppins;src:url(data:font/woff2;base64,' + base64.b64encode((F / f'poppins-latin-{w}-normal.woff2').read_bytes()).decode() + ') format("woff2");font-weight:' + str(w) + ';}' for w in (500, 600, 700))
def build(template, cfg, media, out):
    s = pathlib.Path(template).read_text()
    s = s.replace('__FONTS__', fonts()).replace('__LIB__', LIB.read_text()).replace('__CFG__', json.dumps(cfg))
    s = s.replace('__MEDIA__', json.dumps({k: (uri(v) if v else None) for k, v in media.items()}))
    pathlib.Path(out).write_text(s); print('built', out, len(s) // 1024, 'KB')
