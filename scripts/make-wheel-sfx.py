"""Builds the Coco Wheel UI sounds (public/wheel/sfx/*.mp3) from the code-motion-design
synthesiser, so there are no licensing questions. Re-run: python3 scripts/make-wheel-sfx.py <skill scripts dir>"""
import sys, subprocess, numpy as np
sys.path.insert(0, sys.argv[1])
import audio as A

SR = A.SR
def clack():                      # pointer hitting a peg: short woody tick
    t = A.tt(0.045)
    body = np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 260) * 0.45
    noise = A.bp(A.rng.standard_normal(len(t)), 2500, 7000) * np.exp(-t * 900) * 0.35
    return body + noise
def ratchet():                    # lever pull: five quick ratchet clicks
    out = np.zeros(int(0.36 * SR))
    for i in range(5):
        s = clack() * (0.6 + 0.1 * i); o = int((0.02 + i * 0.065) * SR); out[o:o + len(s)] += s[:len(out) - o]
    return out
def launch():                     # lever release: thunk + whoosh
    w = A.ui_whoosh(0.5, 1.0); th = A.ui_thunk()
    out = np.zeros(len(w)); out[:len(th)] += th * 0.9; out += w * 0.8
    return out
def win():                        # rising arpeggio + sparkle chime
    t = A.tt(1.4); x = np.zeros_like(t)
    for i, m in enumerate((72, 76, 79, 84)):     # C E G C
        e = np.clip(t - i * 0.085, 0, None)
        f = A.mtof(m)
        x += (t >= i * 0.085) * (np.sin(2 * np.pi * f * e) * 0.6 + np.sin(4 * np.pi * f * e) * 0.15) * np.exp(-e * 4.5) * np.minimum(e / 0.003, 1)
    ch = A.ui_chime(); x[int(0.34 * SR):int(0.34 * SR) + len(ch)] += ch * 2.2
    return x * 0.28
def lose():                       # soft two-note fall
    t = A.tt(0.7); x = np.zeros_like(t)
    for i, m in enumerate((67, 62)):
        e = np.clip(t - i * 0.16, 0, None)
        x += (t >= i * 0.16) * np.sin(2 * np.pi * A.mtof(m) * e) * np.exp(-e * 6) * np.minimum(e / 0.004, 1)
    return x * 0.22
def pop(): return A.ui_pop() * 1.3
SOUNDS = dict(clack=clack, ratchet=ratchet, launch=launch, win=win, lose=lose, pop=pop)

for name, fn in SOUNDS.items():
    x = fn(); x = x / max(1e-9, np.max(np.abs(x))) * 0.8
    wav = f"/tmp/{name}.wav"; A.write_wav(wav, np.vstack([x, x]))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", "44100", "-b:a", "64k", f"public/wheel/sfx/{name}.mp3"], check=True)
    print(name, round(len(x) / SR, 2), "s")
