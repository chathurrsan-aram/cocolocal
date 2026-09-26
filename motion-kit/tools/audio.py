"""Soundtrack + beat grid for a motion piece.

Two modes. Both write track.wav and beatgrid.json (period, bars, duration, events).

  # 1) Original music, synthesized (no licensing, loops perfectly)
  python3 audio.py synth --bpm 120 --bars 7 --events events.json [--style house|soft] [--loop]

  # 2) The user's own track (mp3/wav/m4a). Measures tempo + downbeat, cuts bars from a downbeat.
  python3 audio.py song --in song.mp3 --bars 7 --events events.json [--start-bar 8] [--loop | --fade 0.6]

events.json lists UI sounds in BEATS (so they follow the measured grid, not nominal seconds):
  [{"beat": 2, "sound": "click"}, {"beat": 4, "sound": "chime", "gain": 0.9}, ...]
Sounds: click tick whoosh whoosh_s chime pop key enter thunk stretch riser impact
Each sound is placed so its MEASURED envelope peak lands on the beat.

After running, set BEAT in the HTML to beatgrid.json["period"].
"""
import argparse, json, subprocess, wave
import numpy as np
import scipy.signal as ss

SR = 48000
rng = np.random.default_rng(11)

def tt(sec): return np.arange(int(sec * SR)) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def bp(x, lo, hi, o=2): b, a = ss.butter(o, [lo / (SR / 2), hi / (SR / 2)], "band"); return ss.lfilter(b, a, x)
def hp(x, f, o=2): b, a = ss.butter(o, f / (SR / 2), "high"); return ss.lfilter(b, a, x)
def lp(x, f, o=2): b, a = ss.butter(o, f / (SR / 2), "low"); return ss.lfilter(b, a, x)

# ------------------------------------------------------------------ instruments
def kick():
    t = tt(0.5); f = 46 + 104 * np.exp(-t * 32); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 6.5) + 0.18 * np.sin(2 * ph) * np.exp(-t * 26)
    x += hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 700) * 0.22
    return np.tanh(x * 1.7) / np.tanh(1.7)

def clap():
    t = tt(0.4); nb = bp(rng.standard_normal(len(t)), 950, 3400); env = np.zeros_like(t)
    for d in (0.0, 0.010, 0.021):
        e = t - d; env += np.where(e >= 0, np.exp(-np.clip(e, 0, None) * 170), 0)
    e = t - 0.03; env += np.where(e >= 0, 0.55 * np.exp(-np.clip(e, 0, None) * 13), 0)
    return nb * env * 0.9

def hat(decay=60, gain=1.0):
    t = tt(0.16); return hp(rng.standard_normal(len(t)), 7500, 3) * np.exp(-t * decay) * gain

def bass(m, dur=0.24):
    t = tt(dur + 0.03); f = mtof(m)
    env = np.minimum(t / 0.004, 1) * np.exp(-t * 5.5) * np.clip((dur + 0.03 - t) / 0.03, 0, 1)
    return np.tanh((np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * env * 1.4)

def pad_note(m, dur, cents):
    t = tt(dur); f = mtof(m) * 2 ** (cents / 1200); x = np.zeros_like(t)
    for k in range(1, 11): x += (1 / k) * np.exp(-k * f / 1800) * np.sin(2 * np.pi * f * k * t + k * 0.7)
    return x * np.minimum(t / 0.06, 1) * np.clip((dur - t) / 0.12, 0, 1)

def pluck(m):
    t = tt(0.5); f = mtof(m); x = np.zeros_like(t)
    for k in range(1, 7): x += (0.6 ** k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (7 + k * 5))
    return x * np.minimum(t / 0.002, 1)


# ---- extra instruments for the per-piece styles
def snare():
    t = tt(0.3); n = bp(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t * 28)
    return (n * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5) * 0.8

def openhat():
    t = tt(0.35); return hp(rng.standard_normal(len(t)), 6500, 3) * np.exp(-t * 11) * 0.5

def crash():
    t = tt(1.6); return hp(rng.standard_normal(len(t)), 4000, 2) * np.exp(-t * 2.4) * 0.45

def shaker():
    t = tt(0.09); return bp(rng.standard_normal(len(t)), 5000, 11000) * np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2 * 0.35

def marimba(m, dec=9):
    t = tt(0.6); f = mtof(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * dec) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * dec * 4)
    return x * np.minimum(t / 0.0015, 1)

def keys(m, dur):   # soft electric-piano tone
    t = tt(dur); f = mtof(m)
    x = np.sin(2 * np.pi * f * t + 0.8 * np.sin(2 * np.pi * f * t) * np.exp(-t * 4)) * np.exp(-t * 2.2)
    return x * np.minimum(t / 0.004, 1) * np.clip((dur - t) / 0.05, 0, 1)

def stab(ms, dur=0.16):   # short filtered saw chord (disco/funk offbeats)
    t = tt(dur + 0.04); x = np.zeros_like(t)
    for m in ms:
        f = mtof(m)
        for c in (-6, 6): x += ss.sawtooth(2 * np.pi * f * 2 ** (c / 1200) * t)
    x = lp(x, 2600) * np.minimum(t / 0.003, 1) * np.exp(-t * 9) * np.clip((dur + 0.04 - t) / 0.03, 0, 1)
    return x / max(1, len(ms))

def obass(m, dur=0.2):   # plucky octave bass
    t = tt(dur + 0.02); f = mtof(m); env = np.minimum(t / 0.003, 1) * np.exp(-t * 9)
    return np.tanh((ss.sawtooth(2 * np.pi * f * t) * 0.6 + np.sin(2 * np.pi * f * t)) * env * 1.3) * np.clip((dur + 0.02 - t) / 0.02, 0, 1)

STYLES = {
    # chords (MIDI), bass roots, per style; arrangement per bar comes from --arr
    "pop":     dict(ch=[[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]], root=[36, 43, 45, 41]),
    "drive":   dict(ch=[[52, 55, 59, 64], [48, 52, 55, 60], [55, 59, 62, 67], [50, 54, 57, 62]], root=[40, 36, 43, 38]),
    "playful": dict(ch=[[62, 66, 69, 74], [67, 71, 74, 79], [64, 67, 71, 76], [69, 73, 76, 81]], root=[38, 43, 40, 45]),
    "light":   dict(ch=[[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], root=[41, 40, 38, 36]),
    "disco":   dict(ch=[[57, 60, 64, 67], [50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59]], root=[45, 38, 43, 36]),
}

def synth_style(bpm, bars, style, arr):
    """Arrangement per bar: 0 = breakdown (chords only), 1 = light groove, 2 = full, 3 = full + crash/extra energy."""
    st = STYLES[style]; beat = 60 / bpm; T = bars * 4 * beat; N = int(round(T * SR)); total = N + 2 * SR
    L = np.zeros(total); R = np.zeros(total)
    def add(sig, t0, g, pan=0.0):
        i = int(round(t0 * SR))
        if i < 0: sig = sig[-i:]; i = 0
        j = min(total, i + len(sig)); x = sig[: j - i] * g
        L[i:j] += x * np.sqrt(1 - pan); R[i:j] += x * np.sqrt(1 + pan)
    K = kick(); arr = (arr + [arr[-1]] * bars)[:bars] if arr else [2] * bars
    for bar in range(bars):
        lv = arr[bar]; b0 = bar * 4 * beat; ch = st["ch"][bar % 4]; rt = st["root"][bar % 4]
        if lv >= 3: add(crash(), b0, 0.5, 0.2)
        for bt in range(4):
            tb = b0 + bt * beat
            if style == "pop":
                if lv >= 1: add(K, tb, 0.8)
                if lv >= 2 and bt in (1, 3): add(clap(), tb, 0.4, 0.05); add(snare(), tb, 0.25)
                if lv >= 1: add(hat(60, 0.14), tb + beat / 2, 1.0, 0.25)
                if lv >= 2: add(bass(rt, 0.18), tb + beat / 2, 0.4); add(bass(rt + 12, 0.1), tb + 0.75 * beat, 0.18)
                for k, m in enumerate([ch[0] + 12, ch[2] + 12]):   # 8th-note pluck arp
                    add(pluck(m), tb + k * beat / 2, 0.08, -0.3 if k else 0.3)
            elif style == "drive":
                if lv >= 1: add(K, tb, 0.95)
                if lv >= 2 and bt in (1, 3): add(clap(), tb, 0.45)
                if lv >= 1:
                    for s16 in range(4): add(hat(90, 0.12 if s16 % 2 else 0.07), tb + s16 * beat / 4, 1.0, 0.3)
                if lv >= 2:
                    for e in (0, 0.5): add(obass(rt, 0.18), tb + e * beat, 0.35)
                if lv == 0:   # tension: pulsing high note on 16ths
                    for s16 in range(4): add(pluck(ch[3] + 12), tb + s16 * beat / 4, 0.05 + 0.05 * (bt / 4))
            elif style == "playful":
                if lv >= 1 and bt in (0, 2): add(K, tb, 0.7)
                if lv >= 1 and bt == 2: add(K, tb + 0.75 * beat, 0.4)
                if lv >= 1 and bt in (1, 3): add(clap(), tb, 0.3)
                if lv >= 2: add(bass(rt, 0.12), tb, 0.4); add(bass(rt + 7, 0.1), tb + beat / 2, 0.3)
                add(marimba(ch[(bt * 2) % 4] + 12), tb, 0.12, 0.3); add(marimba(ch[(bt * 2 + 1) % 4] + 12), tb + beat / 2, 0.09, -0.3)
            elif style == "light":
                if lv >= 1 and bt in (0, 2): add(K, tb, 0.55)
                if lv >= 1:
                    for s16 in range(4): add(shaker(), tb + s16 * beat / 4, 0.5 if s16 % 2 else 0.3, 0.2)
                if lv >= 2 and bt in (1, 3): add(clap(), tb, 0.22)
                if lv >= 2 and bt in (0, 2): add(bass(rt, 0.4), tb, 0.35)
                if bt in (0, 2): add(marimba(ch[3] + 12, 6), tb + beat * 0.5, 0.06, 0.4)
            elif style == "disco":
                if lv >= 1: add(K, tb, 0.9)
                if lv >= 2 and bt in (1, 3): add(clap(), tb, 0.42); add(snare(), tb, 0.2)
                if lv >= 1: add(openhat(), tb + beat / 2, 0.35, 0.3)
                if lv >= 2:
                    for e, m in ((0, rt), (0.5, rt + 12)): add(obass(m, 0.16), tb + e * beat, 0.38)
                if lv >= 1: add(stab([m + 12 for m in ch[1:]]), tb + beat / 2, 0.18, -0.25)
        # chord bed per bar
        for m in ch:
            add(keys(m, 4 * beat), b0, 0.05 if lv else 0.2, -0.4 if m % 2 else 0.4)
    ph = np.mod(np.arange(total) / SR, beat)
    x = np.stack([L[:N], R[:N]])
    f = np.ones(N); nf = int(0.35 * SR); f[-nf:] = np.linspace(1, 0, nf) ** 2; x *= f
    return x, beat, T

CHORDS = [[53, 57, 60, 64], [55, 57, 60, 64], [53, 57, 60, 62], [52, 55, 59, 60],
          [53, 57, 60, 64], [55, 57, 60, 64], [55, 59, 62, 64], [52, 55, 59, 62]]
ROOTS = [41, 45, 38, 40, 41, 43, 43, 40]

def synth_music(bpm, bars, style, loop):
    beat = 60 / bpm; T = bars * 4 * beat; N = int(round(T * SR))
    reps = 3 if loop else 1
    total = reps * N + 2 * SR
    L = np.zeros(total); R = np.zeros(total); PL = np.zeros(total); PR = np.zeros(total)
    def add(bl, br, sig, t0, g, pan=0.0):
        i = int(round(t0 * SR))
        if i < 0: sig = sig[-i:]; i = 0
        j = min(total, i + len(sig)); s = sig[: j - i] * g
        bl[i:j] += s * np.sqrt(1 - pan); br[i:j] += s * np.sqrt(1 + pan)
    K = kick()
    for rep in range(reps):
        for bar in range(bars):
            b0 = rep * T + bar * 4 * beat; ch = CHORDS[bar % 8]
            for bt in range(4):
                tb = b0 + bt * beat
                if style == "house":
                    add(L, R, K, tb, 0.95)
                    if bt in (1, 3): add(L, R, clap(), tb, 0.42, 0.05)
                    add(L, R, hat(38, 0.22), tb + beat / 2, 1.0, 0.25)
                    for s16 in (0.25, 0.75): add(L, R, hat(95, 0.07), tb + s16 * beat, 1.0, -0.3)
                    add(L, R, bass(ROOTS[bar % 8]), tb + beat / 2, 0.42)
                else:  # soft: kick on 1 and 3, shaker, no clap
                    if bt in (0, 2): add(L, R, K, tb, 0.7)
                    add(L, R, hat(70, 0.1), tb + beat / 2, 1.0, 0.2)
            for m in ch:
                for c, pan in ((-7, -0.6), (7, 0.6)):
                    add(PL, PR, pad_note(m, 4 * beat + 0.12, c), b0 - 0.02, 0.10, pan)
            for pos, m in zip((0.75, 1.5, 2.75, 3.5), [ch[3] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 12]):
                add(L, R, pluck(m), b0 + pos * beat, 0.055, 0.35 if pos % 1 else -0.35)
    ph = np.mod(np.arange(total) / SR, beat)
    duck = 1 - 0.62 * np.exp(-ph * 8.5) * np.minimum(ph / 0.004, 1) if style == "house" else 1
    L += lp(PL, 3200) * duck; R += lp(PR, 3200) * duck
    a = N if loop else 0
    x = np.stack([L[a:a + N], R[a:a + N]])
    if not loop:  # let the last chord ring out a touch, then fade
        f = np.ones(N); nf = int(0.5 * SR); f[-nf:] = np.linspace(1, 0, nf) ** 2; x *= f
    return x, beat, T

# ------------------------------------------------------------------ analysis
def analyze(x, periodic):
    mono = x.mean(0); hop, nfft = 240, 2048; T = len(mono) / SR
    pad = np.concatenate([mono[-nfft:] if periodic else np.zeros(nfft), mono, mono[:nfft] if periodic else np.zeros(nfft)])
    frames = 1 + (len(pad) - nfft) // hop
    idx = np.arange(nfft)[None, :] + hop * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(pad[idx] * np.hanning(nfft), axis=1)); freqs = np.fft.rfftfreq(nfft, 1 / SR)
    dpos = np.maximum(np.diff(np.log1p(spec * 10), axis=0), 0)
    flux = np.concatenate([[0], dpos.sum(1)])                                  # full band -> tempo
    low = np.concatenate([[0], dpos[:, (freqs > 20) & (freqs < 65)].sum(1)])   # kick band -> phase
    times = (np.arange(frames) * hop + nfft / 2) / SR - nfft / SR
    fps = SR / hop
    o = flux - flux.mean(); ac = np.correlate(o, o, "full")[len(o) - 1:]
    lags = np.arange(len(ac)) / fps; ok = (lags > 60 / 170) & (lags < 60 / 75)
    i = np.where(ok)[0][np.argmax(ac[ok])]; y0, y1, y2 = ac[i - 1], ac[i], ac[i + 1]
    period = (i + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) / fps
    if low.sum() < 1e-6: low = flux                                           # no kick: fall back
    phases = np.linspace(0, period, 400, endpoint=False)
    nb = int(T / period)
    phase = phases[np.argmax([np.interp(p + period * np.arange(nb), times, low).sum() for p in phases])]
    # downbeat = beat phase (mod 4) with the largest harmonic change (chords change on bar lines)
    band = (freqs > 100) & (freqs < 1200); beats = phase + period * np.arange(nb)
    def hs(t0, t1):
        m = (times >= t0) & (times < t1)
        if not m.any(): return None
        v = spec[m][:, band].mean(0); return v / (np.linalg.norm(v) + 1e-9)
    ch = []
    for bt in beats:
        a_, b_ = hs(bt - 0.4, bt - 0.05), hs(bt + 0.05, bt + 0.4)
        ch.append(np.nan if a_ is None or b_ is None else 1 - a_ @ b_)
    ch = np.array(ch); per = [np.nanmean(ch[k::4]) for k in range(4)]
    k = int(np.nanargmax(per))
    # refine phase with the folded full-band transient envelope (window bias is ~10 ms)
    env = np.convolve(np.abs(ss.hilbert(mono)), np.ones(48) / 48, "same")
    P = int(round(period * SR)); fold = np.zeros(P)
    for j in range(len(mono) // P): fold += env[j * P:(j + 1) * P]
    fold = np.roll(fold, P // 2); lag = (np.arange(P) - P // 2) / SR
    near = np.abs(((lag - phase + period / 2) % period) - period / 2) < 0.06
    peak = lag[near][np.argmax(fold[near])]
    beat0 = peak % period
    down0 = beat0 + ((k * period + phase - beat0 + period / 2) // period) * period
    down0 = down0 % (4 * period)
    return dict(bpm=round(60 / period, 3), period=float(period), first_beat=float(beat0), first_downbeat=float(down0))

# ------------------------------------------------------------------ UI sounds
def ui_click():
    t = tt(0.08)
    return (hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 1800) * 0.5 + np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 150) * 0.45
            + np.sin(2 * np.pi * 1150 * t) * np.exp(-t * 95) * 0.35)
def ui_tick():
    t = tt(0.05)
    return np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 230) * 0.4 + hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 2500) * 0.25
def ui_whoosh(dur=0.34, g=1.0):
    t = tt(dur); x = bp(rng.standard_normal(len(t)), 500, 5000)
    sh = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * np.exp(-3 * np.clip(t / dur - 0.55, 0, None))
    return lp(x * sh, 2800) * 0.55 * g
def ui_chime():
    t = tt(0.9); x = np.zeros_like(t)
    for f, d in ((1318.5, 0.0), (1975.5, 0.075)):
        e = np.clip(t - d, 0, None)
        x += (t >= d) * (np.sin(2 * np.pi * f * e) + 0.2 * np.sin(4 * np.pi * f * e)) * np.exp(-e * 7) * np.minimum(e / 0.002, 1)
    return x * 0.2
def ui_pop():
    t = tt(0.1); ph = 2 * np.pi * np.cumsum(700 + 700 * (1 - np.exp(-t * 60))) / SR
    return np.sin(ph) * np.exp(-t * 55) * np.minimum(t / 0.002, 1) * 0.35
def ui_key(g=1.0):
    t = tt(0.06)
    return (bp(rng.standard_normal(len(t)), 1800, 6500) * np.exp(-t * 520) * 0.5 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 70) * 0.35) * g
def ui_thunk():
    t = tt(0.14); ph = 2 * np.pi * np.cumsum(260 * np.exp(-t * 8) + 120) / SR
    return np.sin(ph) * np.exp(-t * 32) * 0.45
def ui_stretch():
    t = tt(0.4); ph = 2 * np.pi * np.cumsum(180 + 160 * (1 - np.exp(-t * 6))) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.sin(np.pi * t / 0.4) ** 2 * 0.12
def ui_riser(dur=1.0):   # peak at the END: lands on the hit
    t = tt(dur); x = bp(rng.standard_normal(len(t)), 800, 7000)
    return x * (t / dur) ** 3 * np.minimum((dur - t) / 0.01, 1) * 0.35
def ui_impact():
    t = tt(1.2); ph = 2 * np.pi * np.cumsum(40 + 80 * np.exp(-t * 20)) / SR
    x = np.sin(ph) * np.exp(-t * 3.5) + lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 25) * 0.5
    return np.tanh(x * 1.5) * 0.5

def ui_lever():   # ratchet: quick clicks over 0.3 s, peak on the last (release) click
    t = tt(0.36); x = np.zeros_like(t)
    for k, d in enumerate(np.linspace(0, 0.3, 7)):
        e = np.clip(t - d, 0, None); x += (t >= d) * hp(rng.standard_normal(len(t)), 2500) * np.exp(-e * 900) * (0.3 + 0.1 * k)
    return x * 0.6
def ui_womp():    # descending "womp womp", peak at its start
    t = tt(0.9); f = np.where(t < 0.4, 330 - 60 * t / 0.4, 250 - 90 * np.clip((t - 0.42) / 0.45, 0, 1)) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; env = np.where(t < 0.4, np.minimum(t / 0.01, 1) * np.exp(-t * 2), np.minimum((t - 0.42).clip(0) / 0.01, 1) * np.exp(-(t - 0.42).clip(0) * 3)) * (np.abs(t - 0.41) > 0.01)
    return lp(ss.sawtooth(ph) * env, 1800) * 0.35
def ui_till():    # shop till "ding"
    t = tt(1.0); x = np.zeros_like(t)
    for f in (2093, 2637): x += np.sin(2 * np.pi * f * t) * np.exp(-t * 4)
    return (x * 0.18 + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 60) * 0.12) * np.minimum(t / 0.001, 1)
def ui_crash(): return crash() * 0.8
def ui_snap():
    t = tt(0.08); return bp(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t * 120) * 0.6

UI = dict(click=ui_click, tick=ui_tick, whoosh=ui_whoosh, whoosh_s=lambda: ui_whoosh(0.28, 0.6), chime=ui_chime,
          pop=ui_pop, key=ui_key, enter=lambda: ui_key(1.4), thunk=ui_thunk, stretch=ui_stretch, riser=ui_riser, impact=ui_impact,
          lever=ui_lever, womp=ui_womp, till=ui_till, crash=ui_crash, snap=ui_snap)

def env_peak(sig):
    e = np.convolve(np.abs(ss.hilbert(sig)), np.ones(48) / 48, "same"); return int(np.argmax(e))

def place_ui(N, period, events, loop):
    ui = np.zeros((2, N)); placed = []
    for ev in events:
        sig = UI[ev["sound"]]() * ev.get("gain", 1.0) * 0.5
        pk = env_peak(sig); t = ev["beat"] * period
        start = int(round(t * SR)) - pk
        idx = start + np.arange(len(sig))
        if loop: idx %= N
        else:
            keep = (idx >= 0) & (idx < N); idx, sig = idx[keep], sig[keep]
        ui[:, idx] += sig
        placed.append(dict(beat=ev["beat"], t=round(t, 4), sound=ev["sound"], peak_ms=round(pk / SR * 1000, 2)))
    return ui, placed

def load(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, "<f4").reshape(-1, 2).T.astype(float)

def write_wav(path, x):
    y = (np.clip(x, -1, 1).T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())

def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="mode", required=True)
    s = sub.add_parser("synth"); s.add_argument("--bpm", type=float, default=120); s.add_argument("--style", default="house"); s.add_argument("--arr", default="", help="per-bar levels for the new styles, e.g. 1,2,2,0,3")
    g = sub.add_parser("song"); g.add_argument("--in", dest="inp", required=True); g.add_argument("--start-bar", type=int, default=0)
    g.add_argument("--fade", type=float, default=0.6)
    for p in (s, g):
        p.add_argument("--bars", type=int, required=True); p.add_argument("--events", default=None)
        p.add_argument("--loop", action="store_true"); p.add_argument("--out", default="track.wav")
        p.add_argument("--grid", default="beatgrid.json")
    a = ap.parse_args()
    events = json.load(open(a.events)) if a.events else []

    if a.mode == "synth":
        if a.style in STYLES:
            mus, period, T = synth_style(a.bpm, a.bars, a.style, [int(v) for v in a.arr.split(',') if v.strip()])
        else:
            mus, period, T = synth_music(a.bpm, a.bars, a.style, a.loop)
        info = analyze(mus, periodic=a.loop)
        # rotate/shift so the measured kick peak on the downbeat is exactly t=0
        sh = info["first_downbeat"]; sh = sh if sh < 2 * period else sh - 4 * period
        n = int(round(sh * SR))
        if a.loop:
            mus = np.roll(mus, -n, axis=1)   # periodic buffer: rotating is seamless
        # non-loop: kick already starts at 0; its peak is ~15 ms in (under one frame)
        period = 60 / a.bpm
    else:
        full = load(a.inp); info = analyze(full[:, : 90 * SR], periodic=False)
        period = info["period"]; T = a.bars * 4 * period
        start = info["first_downbeat"] + a.start_bar * 4 * period
        i0 = int(round(start * SR)); N = int(round(T * SR))
        if i0 + N > full.shape[1]: raise SystemExit("song too short for --start-bar/--bars")
        mus = full[:, i0:i0 + N].copy()
        nfi = int(0.004 * SR); mus[:, :nfi] *= np.linspace(0, 1, nfi)
        if a.loop:   # crossfade the audio just past the end into the start
            nx = int(0.08 * SR); tail = full[:, i0 + N:i0 + N + nx]
            mus[:, :nx] = mus[:, :nx] * np.linspace(0, 1, nx) + tail * np.linspace(1, 0, nx)
        elif a.fade > 0:
            nf = int(a.fade * SR); mus[:, -nf:] *= np.linspace(1, 0, nf) ** 2
    N = mus.shape[1]
    ui, placed = place_ui(N, period, events, a.loop)
    mus = mus / (np.max(np.abs(mus)) + 1e-9) * 0.72
    mix = np.tanh((mus + ui) * 1.15) / np.tanh(1.15) * 0.93
    write_wav(a.out, mix)
    grid = dict(mode=a.mode, bpm=round(60 / period, 3), period=period, bars=a.bars, duration=N / SR,
                loop=a.loop, analysis=info, events=placed)
    json.dump(grid, open(a.grid, "w"), indent=1)
    print(json.dumps({k: grid[k] for k in ("bpm", "period", "bars", "duration", "loop")}, indent=1))
    print("analysis:", info)

if __name__ == "__main__":
    main()
