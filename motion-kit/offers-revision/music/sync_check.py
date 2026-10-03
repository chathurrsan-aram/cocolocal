"""Measure where the loudest transients actually are and compare them with the picture's key beats."""
import json, sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
wav, evs = sys.argv[1], json.load(open(sys.argv[2]))
sr, x = wavfile.read(wav); x = x.astype(float); x = (x.mean(axis=1) if x.ndim > 1 else x) / 32768
B = 60 / 124; hop = 128
# broadband spectral-flux onset envelope
n = len(x) // hop; frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, 1024)), 1024)[::hop][:n]
S = np.abs(np.fft.rfft(frames * np.hanning(1024), axis=1)); flux = np.maximum(0, np.diff(np.log1p(S * 50), axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux]); t = np.arange(len(flux)) * hop / sr
key = [e for e in evs if any(w in e['what'] for w in ['PRICE', 'enters', 'drop', 'slam', 'logo', 'button', 'lands'])]
rows = []
for e in key:
    m = (t > e['t'] - 0.06) & (t < e['t'] + 0.06)
    i = np.argmax(np.where(m, flux, -1)); loc = flux[max(0, i - 40):i + 40].max() if False else None
    # strength relative to the median onset strength of the whole track
    rows.append((e['what'], e['t'], round((t[i] - e['t']) * 1000, 1), round(flux[i] / np.median(flux[flux > 0]), 1)))
for r in rows: print(f"{r[0]:<22} t={r[1]:7.3f}s  onset offset {r[2]:+6.1f} ms  strength x{r[3]}")
# beat grid: kick energy (40-120 Hz) peaks relative to each beat
lo = sosfilt(butter(4, [40, 120], 'band', fs=sr, output='sos'), x); env = np.abs(lo)
offs = []
for b in range(4, 44):
    a = int((b * B - .03) * sr); z = int((b * B + .05) * sr); offs.append((a + np.argmax(env[a:z])) / sr - b * B)
print('kick peak vs beat grid: median %+.1f ms, spread %.1f ms' % (np.median(offs) * 1000, np.std(offs) * 1000))
