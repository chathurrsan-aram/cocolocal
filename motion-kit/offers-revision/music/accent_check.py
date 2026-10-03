import json, sys, numpy as np
from scipy.io import wavfile
wav, evs = sys.argv[1], json.load(open(sys.argv[2]))
sr, x = wavfile.read(wav); x = x.astype(float); x = (x.mean(axis=1) if x.ndim > 1 else x) / 32768
def rms(a, b): seg = x[max(0, int(a * sr)):int(b * sr)]; return 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)
base = np.median([rms(t, t + .08) for t in np.arange(2, 21, .121)])
out = {}
for e in evs:
    if any(w in e['what'] for w in ['PRICE', 'lands', 'enters', 'drop', 'slam', 'logo', 'button']):
        k = e['what'].split(' lands')[0] if 'product' in e['what'] else ('PRICE' if 'PRICE' in e['what'] else ('enters' if 'enters' in e['what'] else e['what']))
        out.setdefault(k, []).append(rms(e['t'], e['t'] + .08) - base)
for k, v in out.items(): print(f"{k:<24} {np.mean(v):+5.1f} dB over median  ({', '.join(f'{a:+.1f}' for a in v)})")
