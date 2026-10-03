"""Coco Local groove engine: an original nu-disco / house kit rendered in NumPy (no samples, no third-party audio).

Everything is placed on a beat grid so music, accents and picture share one clock.
Instruments are written to sound like a produced track (drum machine, electric piano, synth bass, brass and string
sections, bus reverb, sidechain, glue compression), deliberately avoiding square-wave leads and chiptune bleeps.

    import groove as g
    s = g.Session(bpm=124, beats=48)
    s.kick(0); s.bass_note(0.0, 'D2', 0.5); ...
    s.render('out.wav')
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
NOTE.update({'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10})


def hz(n):
    if isinstance(n, (int, float)):
        return 440.0 * 2 ** ((n - 69) / 12)
    name, octv = (n[:2], n[2:]) if len(n) > 2 and n[1] in '#b' else (n[:1], n[1:])
    return 440.0 * 2 ** ((NOTE[name] + 12 * (int(octv) + 1) - 69) / 12)


def midi(n):
    name, octv = (n[:2], n[2:]) if len(n) > 2 and n[1] in '#b' else (n[:1], n[1:])
    return NOTE[name] + 12 * (int(octv) + 1)


def sos(kind, f, order=2):
    f = np.clip(np.atleast_1d(f), 20, SR / 2 - 200)
    return butter(order, f if len(f) > 1 else f[0], btype=kind, fs=SR, output='sos')


def filt(x, kind, f, order=2):
    return sosfilt(sos(kind, f, order), x)


def env_adsr(n, a, d, s, r, hold=None):
    """Sample-accurate ADSR; hold = seconds before release (defaults to fill n)."""
    a, d, r = int(a * SR) + 1, int(d * SR) + 1, int(r * SR) + 1
    hold = n - r if hold is None else int(hold * SR)
    e = np.zeros(n)
    t = np.arange(n)
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d * 3))
    rel = np.clip((t - hold) / r, 0, 1)
    return e * (1 - rel) ** 2


def one_pole_lp_sweep(x, cut):
    """Time-varying one-pole low-pass (cut in Hz per sample). Cheap, smooth, analog-ish."""
    a = np.exp(-2 * np.pi * np.clip(cut, 20, SR / 2.2) / SR)
    y = np.empty_like(x)
    z = 0.0
    for i in range(len(x)):
        z = (1 - a[i]) * x[i] + a[i] * z
        y[i] = z
    return y


def svf_lp(x, cut, q=0.7):
    """Resonant state-variable low-pass with per-sample cutoff (vectorised in blocks for speed)."""
    y = np.empty_like(x)
    lp = bp = 0.0
    f = 2 * np.sin(np.pi * np.clip(cut, 20, SR / 6) / SR)
    damp = 1 / q
    for i in range(len(x)):
        hp = x[i] - lp - damp * bp
        bp += f[i] * hp
        lp += f[i] * bp
        y[i] = lp
    return y


def saw(ph):
    return 2 * (ph % 1.0) - 1


def polyblep_saw(freq, n, phase0=0.0):
    dt = freq / SR
    ph = (phase0 + np.cumsum(np.full(n, dt) if np.isscalar(freq) else dt)) % 1.0
    dtv = np.full(n, dt) if np.isscalar(freq) else dt
    y = 2 * ph - 1
    m1 = ph < dtv
    t = ph[m1] / dtv[m1]
    y[m1] -= t + t - t * t - 1
    m2 = ph > 1 - dtv
    t = (ph[m2] - 1) / dtv[m2]
    y[m2] -= t * t + t + t + 1
    return y


def make_ir(seconds=1.6, predelay=0.012, damp=6500, width=1.0, seed=3):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-t * 6.9 / seconds)
    L = r.standard_normal(n) * decay
    R = r.standard_normal(n) * decay
    L, R = filt(L, 'low', damp), filt(R, 'low', damp)
    L, R = filt(L, 'high', 180), filt(R, 'high', 180)
    M = (L + R) / 2
    L, R = M + width * (L - M), M + width * (R - M)
    pd = np.zeros(int(predelay * SR))
    ir = np.stack([np.concatenate([pd, L]), np.concatenate([pd, R])])
    return ir / np.sqrt((ir ** 2).sum() / 2)


class Session:
    def __init__(self, bpm, beats, tail=0.0):
        self.bpm, self.B = bpm, 60.0 / bpm
        self.n = int(round((beats * self.B + tail) * SR))
        self.beats = beats
        self.bus = {k: np.zeros((2, self.n)) for k in ['drums', 'kick', 'bass', 'keys', 'pad', 'brass', 'fx', 'perc', 'gtr']}
        self.sends = {k: v for k, v in dict(drums=0.10, kick=0.0, bass=0.0, keys=0.22, pad=0.35, brass=0.20, fx=0.25, perc=0.15, gtr=0.18).items()}
        self.kicks = []
        self.duck_depth = dict(bass=0.55, keys=0.35, pad=0.5, brass=0.15, gtr=0.3, perc=0.1)
        self.events = []  # (beat, label) for the sync report

    # ------------------------------------------------------------------ placement
    def t2s(self, beat):
        return int(round(beat * self.B * SR))

    def put(self, bus, beat, sig, pan=0.0, gain=1.0, jitter_ms=0.0):
        i = self.t2s(beat) + (int(rng.normal(0, jitter_ms) * SR / 1000) if jitter_ms else 0)
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414])
        if i < 0:
            sig, i = sig[:, -i:], 0
        m = min(sig.shape[1], self.n - i)
        if m > 0:
            self.bus[bus][:, i:i + m] += sig[:, :m] * gain

    def mark(self, beat, label):
        self.events.append((round(beat, 4), label))

    # ------------------------------------------------------------------ drums
    def kick(self, beat, gain=1.0, punch=1.0):
        n = int(0.55 * SR)
        t = np.arange(n) / SR
        f = 46 + 110 * np.exp(-t * 38) + 900 * np.exp(-t * 400) * punch
        ph = 2 * np.pi * np.cumsum(f) / SR
        body = np.sin(ph) * np.exp(-t * 6.5)
        click = filt(rng.standard_normal(n), 'band', [1800, 7000]) * np.exp(-t * 900) * 0.35 * punch
        k = np.tanh((body + click) * 1.6) * 0.9
        self.put('kick', beat, k, gain=gain)
        self.kicks.append(beat)

    def clap(self, beat, gain=1.0, pan=0.0, width=0.25):
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for k, d in enumerate([0, 0.008, 0.017, 0.026]):
            j = int(d * SR)
            burst = rng.standard_normal(n - j) * np.exp(-np.arange(n - j) / SR * (220 if k < 3 else 22))
            x[j:] += burst * (0.8 if k < 3 else 1.0)
        x = filt(x, 'band', [950, 5200]) * 0.55
        L = x + width * filt(rng.standard_normal(n), 'band', [1200, 4800]) * np.exp(-t * 28) * 0.18
        R = x + width * filt(rng.standard_normal(n), 'band', [1200, 4800]) * np.exp(-t * 28) * 0.18
        self.put('drums', beat, np.stack([L, R]), gain=gain)

    def snare(self, beat, gain=1.0, pan=0.0, tone=185):
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        body = np.sin(2 * np.pi * tone * t * (1 + 0.3 * np.exp(-t * 60))) * np.exp(-t * 28) * 0.6
        noise = filt(rng.standard_normal(n), 'band', [1500, 9000]) * np.exp(-t * 17) * 0.7
        self.put('drums', beat, np.tanh((body + noise) * 1.3) * 0.75, pan=pan, gain=gain)

    def tom(self, beat, pitch, gain=1.0, pan=0.0):
        n = int(0.45 * SR)
        t = np.arange(n) / SR
        f = pitch * (1 + 0.45 * np.exp(-t * 25))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
        x += filt(rng.standard_normal(n), 'band', [300, 3000]) * np.exp(-t * 60) * 0.25
        self.put('drums', beat, np.tanh(x * 1.2) * 0.8, pan=pan, gain=gain)

    def hat(self, beat, gain=1.0, open_=False, pan=0.15):
        n = int((0.42 if open_ else 0.07) * SR)
        t = np.arange(n) / SR
        # metallic: six detuned square partials (808-style) + noise, high-passed
        parts = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0])
        x = filt(parts * 0.12 + rng.standard_normal(n) * 0.5, 'high', 7200 if not open_ else 6200)
        x *= np.exp(-t * (7.5 if open_ else 70))
        self.put('drums', beat, x * 0.55, pan=pan, gain=gain, jitter_ms=2.0)

    def shaker(self, beat, gain=1.0, pan=-0.35):
        n = int(0.09 * SR)
        t = np.arange(n) / SR
        e = np.minimum(t / 0.012, 1) * np.exp(-t * 45)
        x = filt(rng.standard_normal(n), 'band', [4500, 11000]) * e
        self.put('perc', beat, x * 0.5, pan=pan, gain=gain, jitter_ms=3.0)

    def conga(self, beat, pitch=260, gain=1.0, pan=0.3, slap=False):
        n = int(0.3 * SR)
        t = np.arange(n) / SR
        f = pitch * (1 + 0.08 * np.exp(-t * 40))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (22 if slap else 12))
        x += filt(rng.standard_normal(n), 'band', [800, 5000]) * np.exp(-t * (140 if slap else 300)) * (0.6 if slap else 0.2)
        self.put('perc', beat, x * 0.6, pan=pan, gain=gain, jitter_ms=2.5)

    def snap(self, beat, gain=1.0, pan=0.0):
        n = int(0.18 * SR)
        t = np.arange(n) / SR
        x = filt(rng.standard_normal(n), 'band', [1800, 6500]) * np.exp(-t * 90)
        x += np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 160) * 0.3
        self.put('perc', beat, x * 0.8, pan=pan, gain=gain)

    def crash(self, beat, gain=1.0, length=2.2, reverse=False, pan=0.0):
        n = int(length * SR)
        t = np.arange(n) / SR
        partials = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) for f in rng.uniform(3000, 9000, 40)) / 40
        x = filt(rng.standard_normal(n) * 0.8 + partials * 0.6, 'high', 3800) * np.exp(-t * 2.4 / length * 2.2)
        x *= np.minimum(t / 0.002, 1)
        L = x + filt(rng.standard_normal(n), 'high', 5000) * np.exp(-t * 3) * 0.12
        R = x + filt(rng.standard_normal(n), 'high', 5000) * np.exp(-t * 3) * 0.12
        st = np.stack([L, R]) * 0.5
        if reverse:
            st = st[:, ::-1]
            self.put('fx', beat - length / self.B, st, gain=gain)
        else:
            self.put('drums', beat, st, gain=gain)

    # ------------------------------------------------------------------ tonal parts
    def bass_note(self, beat, note, beats_len, gain=1.0, slide_from=None, bright=1.0):
        n = int(beats_len * self.B * SR) + int(0.03 * SR)
        f1 = hz(note)
        f = np.full(n, f1)
        if slide_from:
            f0 = hz(slide_from)
            g = int(0.05 * SR)
            f[:g] = f0 * (f1 / f0) ** (np.arange(g) / g)
        t = np.arange(n) / SR
        osc = 0.55 * polyblep_saw(f, n) + 0.45 * np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6
        sub = np.sin(2 * np.pi * np.cumsum(f) / SR)
        cut = 180 + (1300 * bright) * np.exp(-t * 14) + 220
        x = svf_lp(osc, cut, q=1.6) * 0.8 + sub * 0.55
        e = env_adsr(n, 0.004, 0.18, 0.72, 0.03)
        self.put('bass', beat, np.tanh(x * e * 1.4) * 0.62, gain=gain)

    def epiano(self, beat, notes, beats_len, gain=1.0, vel=1.0):
        """FM electric piano (Rhodes-like): bell tine + warm body, stereo tremolo."""
        n = int(beats_len * self.B * SR) + int(0.4 * SR)
        t = np.arange(n) / SR
        out = np.zeros((2, n))
        for k, nt in enumerate(notes):
            f = hz(nt)
            idx = (1.6 * vel) * np.exp(-t * 5) + 0.25
            mod = np.sin(2 * np.pi * f * t) * idx
            body = np.sin(2 * np.pi * f * t + mod)
            tine = np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 28) * 0.18 * vel
            e = env_adsr(n, 0.002, 0.9, 0.35, 0.18, hold=beats_len * self.B)
            x = (body + tine) * e / len(notes) ** 0.7
            trem = 1 + 0.18 * np.sin(2 * np.pi * 4.6 * t + k)
            out[0] += x * trem
            out[1] += x * (2 - trem)
        self.put('keys', beat, out * 0.42, gain=gain, jitter_ms=1.5)

    def stab(self, beat, notes, beats_len=0.25, gain=1.0, bright=1.0):
        """Short house chord stab: detuned saws through a snappy filter envelope."""
        n = int((beats_len * self.B + 0.12) * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for nt in notes:
            for d in (-0.08, 0.0, 0.09):
                x += polyblep_saw(hz(nt) * 2 ** (d / 12), n, rng.uniform())
        x /= len(notes) * 3
        cut = 500 + 5200 * bright * np.exp(-t * 18)
        x = svf_lp(x, cut, q=1.1)
        x *= env_adsr(n, 0.003, 0.12, 0.25, 0.06, hold=beats_len * self.B)
        st = np.stack([x, np.roll(x, int(0.011 * SR))])
        self.put('keys', beat, st * 0.8, gain=gain)

    def brass(self, beat, notes, beats_len=0.35, gain=1.0, fall=False, scoop=True):
        """Brass section hit: saw ensemble with a pitch scoop, fast bright filter, optional fall-off."""
        n = int((beats_len * self.B + 0.25) * SR)
        t = np.arange(n) / SR
        out = np.zeros((2, n))
        hold = beats_len * self.B
        for k, nt in enumerate(notes):
            for v, (d, pan) in enumerate([(-0.07, -0.6), (0.0, 0.0), (0.08, 0.6)]):
                pitch = np.ones(n)
                if scoop:
                    pitch *= 2 ** ((-0.6 * np.exp(-t * 45)) / 12)
                if fall:
                    pitch *= 2 ** (-np.clip((t - hold) / 0.2, 0, 1) ** 2 * 3 / 12)
                vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.2, 0, 1)
                f = hz(nt) * 2 ** (d / 12) * pitch * vib
                osc = polyblep_saw(f, n, rng.uniform())
                l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
                out[0] += osc * l
                out[1] += osc * r
        out /= len(notes) * 2
        e = env_adsr(n, 0.012, 0.15, 0.6, 0.1, hold=hold)
        cut = 900 + 4200 * np.exp(-t * 7) + 800 * e
        for c in range(2):
            out[c] = svf_lp(out[c], cut, q=0.9) * e
        out = np.tanh(out * 2.2) * 0.55
        self.put('brass', beat, out, gain=gain, jitter_ms=1.0)

    def strings(self, beat, notes, beats_len, gain=1.0, attack=0.25):
        n = int((beats_len * self.B + 0.5) * SR)
        t = np.arange(n) / SR
        out = np.zeros((2, n))
        for nt in notes:
            for v in range(5):
                d = (v - 2) * 0.06
                f = hz(nt) * 2 ** (d / 12) * (1 + 0.003 * np.sin(2 * np.pi * (4.8 + v * 0.3) * t + v))
                osc = polyblep_saw(f, n, rng.uniform())
                pan = (v - 2) / 2.2
                out[0] += osc * np.cos((pan + 1) * np.pi / 4)
                out[1] += osc * np.sin((pan + 1) * np.pi / 4)
        out /= len(notes) * 3
        e = env_adsr(n, attack, 1.0, 0.85, 0.4, hold=beats_len * self.B)
        for c in range(2):
            out[c] = filt(out[c], 'low', 3400) * e
            out[c] = filt(out[c], 'high', 220)
        self.put('pad', beat, out * 0.5, gain=gain)

    def guitar_chop(self, beat, notes, gain=1.0, muted=True, pan=-0.4, length=0.12):
        """Karplus-Strong funk guitar chop (muted scratch or chord 'chank')."""
        n = int(length * SR) if muted else int(0.35 * SR)
        x = np.zeros(n)
        for k, nt in enumerate(notes):
            f = hz(nt)
            N = int(SR / f)
            buf = rng.uniform(-1, 1, N)
            y = np.empty(n)
            decay = 0.94 if muted else 0.992
            for i in range(n):
                y[i] = buf[i % N]
                buf[i % N] = decay * 0.5 * (buf[i % N] + buf[(i + 1) % N])
            j = int(k * 0.0045 * SR)  # strum spread
            x[j:] += y[:n - j]
        x = filt(x, 'band', [350, 3800]) / len(notes)
        x *= np.exp(-np.arange(n) / SR * (30 if muted else 6))
        self.put('gtr', beat, x * 1.2, pan=pan, gain=gain, jitter_ms=2.0)

    # ------------------------------------------------------------------ sound design FX
    def whoosh(self, beat, length=0.5, gain=1.0, rise=True, pan_sweep=(-0.6, 0.6), peak=0.7):
        n = int(length * SR)
        t = np.arange(n) / SR
        u = t / length
        e = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak) * 4))
        x = rng.standard_normal(n)
        c = (600 + 5200 * u) if rise else (5800 - 5000 * u)
        y = one_pole_lp_sweep(x, c) - one_pole_lp_sweep(x, c * 0.35)
        y = y / (np.abs(y).max() + 1e-9) * e
        p = np.linspace(*pan_sweep, n)
        st = np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)]) * 1.2
        # beat = the moment of peak energy
        self.put('fx', beat - peak * length / self.B, st, gain=gain)

    def riser(self, beat_end, beats, gain=1.0):
        n = int(beats * self.B * SR)
        t = np.arange(n) / SR
        u = t / t[-1]
        noise = rng.standard_normal(n)
        c = 400 * 2 ** (u * 4.2)
        y = one_pole_lp_sweep(noise, c) - one_pole_lp_sweep(noise, c * 0.5)
        tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (u * 2)) / SR) * 0.15
        y = (y / (np.abs(y).max() + 1e-9) + tone) * u ** 2.2
        self.put('fx', beat_end - beats, np.stack([y, np.roll(y, 300)]) * 0.6, gain=gain)

    def impact(self, beat, gain=1.0):
        n = int(1.1 * SR)
        t = np.arange(n) / SR
        boom = np.sin(2 * np.pi * np.cumsum(38 + 50 * np.exp(-t * 9)) / SR) * np.exp(-t * 3.2)
        crack = filt(rng.standard_normal(n), 'band', [900, 6000]) * np.exp(-t * 35) * 0.5
        x = np.tanh((boom * 0.9 + crack) * 1.5) * 0.7
        self.put('fx', beat, x, gain=gain)

    def shutter_roll(self, beat, beats, gain=1.0):
        """Metal roller shutter going up: accelerating ratchet clicks over a rattling metal band."""
        n = int(beats * self.B * SR)
        t = np.arange(n) / SR
        u = t / t[-1]
        band = filt(rng.standard_normal(n), 'band', [700, 3200]) * (0.25 + 0.2 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * u) ** 0.6
        clicks = np.zeros(n)
        rate0, rate1 = 9, 26
        ph = np.cumsum(rate0 + (rate1 - rate0) * np.sin(np.pi / 2 * u) ** 2) / SR
        idx = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
        ck = filt(rng.standard_normal(int(0.012 * SR)), 'band', [1500, 7000]) * np.exp(-np.arange(int(0.012 * SR)) / SR * 500)
        for i in idx:
            m = min(len(ck), n - i)
            clicks[i:i + m] += ck[:m] * rng.uniform(0.6, 1.0)
        x = (band * 0.6 + clicks * 0.9) * np.minimum(u / 0.05, 1) * np.minimum((1 - u) / 0.1, 1)
        self.put('fx', beat, np.stack([x, np.roll(x, 150)]) * 0.55, gain=gain)

    def typewriter(self, beat, count, per_beat=8, gain=1.0):
        n = int(0.03 * SR)
        t = np.arange(n) / SR
        for i in range(count):
            x = filt(rng.standard_normal(n), 'band', [2500, 9000]) * np.exp(-t * 260)
            self.put('fx', beat + i / per_beat, x * 0.25, pan=rng.uniform(-0.2, 0.2), gain=gain * rng.uniform(0.7, 1.0))

    # ------------------------------------------------------------------ mix
    def _duck(self):
        g = np.ones(self.n)
        rel = int(0.19 * SR)
        shape = 1 - np.exp(-np.arange(rel) / SR * 22)
        for b in self.kicks:
            i = self.t2s(b)
            m = min(rel, self.n - i)
            if m > 0:
                g[i:i + m] = np.minimum(g[i:i + m], shape[:m])
        return g

    def render(self, path, master_gain=1.0, fade_out=0.0, levels=None):
        lv = dict(drums=0.9, kick=1.0, bass=0.95, keys=0.8, pad=0.55, brass=0.8, fx=0.75, perc=0.7, gtr=0.55)
        lv.update(levels or {})
        duck = self._duck()
        mix = np.zeros((2, self.n))
        send = np.zeros((2, self.n))
        for k, x in self.bus.items():
            d = self.duck_depth.get(k, 0)
            y = x * (1 - d * (1 - duck)) * lv[k]
            if k in ('keys', 'brass', 'pad', 'gtr'):
                y = np.stack([filt(c, 'high', 190) for c in y])
                y = y - 0.35 * np.stack([filt(c, 'band', [700, 1400]) for c in y])
            mix += y
            send += y * self.sends[k]
        ir = make_ir(1.5, width=1.0)
        wet = np.stack([fftconvolve(send[0], ir[0])[:self.n], fftconvolve(send[1], ir[1])[:self.n]])
        mix += wet * 0.55
        mix[0] = filt(mix[0], 'high', 28)
        mix[1] = filt(mix[1], 'high', 28)
        mix = mix + 0.18 * np.stack([filt(c, 'high', 9000) for c in mix])
        # glue compression (RMS, 2:1 above threshold), then soft saturation
        rms = np.sqrt(np.maximum(filt(mix.mean(axis=0) ** 2, 'low', 12), 0) + 1e-9)
        thr = 0.22
        gr = np.where(rms > thr, (thr / rms) ** 0.5, 1.0)
        mix *= gr * master_gain
        mix = np.tanh(mix * 1.25) / np.tanh(1.25)
        if fade_out:
            f = int(fade_out * SR)
            mix[:, -f:] *= np.linspace(1, 0, f) ** 1.5
        mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
        peak = np.abs(mix).max()
        mix = mix / peak * 0.95
        wavfile.write(path, SR, (mix.T * 32767).astype(np.int16))
        return mix


# ---------------------------------------------------------------- Part 2 product foley (added for Offers Part 2 v3)
def _pour(self, beat, beats_len=1.6, gain=1.0):
    """Liquid pour / swirl: a band-limited rush that sweeps like a wave, with small bubbly resonances."""
    n = int(beats_len * self.B * SR)
    t = np.arange(n) / SR
    u = t / t[-1]
    env = np.minimum(u / .08, 1) * np.exp(-np.maximum(0, u - .35) * 3.2)
    x = rng.standard_normal(n)
    c = 700 + 2600 * np.sin(np.pi * np.clip(u * 1.1, 0, 1))
    y = one_pole_lp_sweep(x, c) - one_pole_lp_sweep(x, c * .3)
    bub = np.zeros(n)
    for k in range(26):
        i = int(rng.uniform(.05, .8) * n); f = rng.uniform(380, 900); m = int(.05 * SR)
        if i + m < n:
            tt = np.arange(m) / SR
            bub[i:i + m] += np.sin(2 * np.pi * f * (1 + 2.5 * tt) * tt) * np.exp(-tt * 70) * rng.uniform(.2, .5)
    y = y / (np.abs(y).max() + 1e-9) * env * .8 + bub * env * .5
    p = np.linspace(.5, -.5, n)
    self.put('fx', beat, np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)]) * 1.1, gain=gain)

def _crunch_burst(self, beat, count=14, spread_beats=.35, gain=1.0):
    """A handful of crisps bursting out: dry, bright crunch transients scattered over a short window."""
    for k in range(count):
        n = int(.05 * SR); t = np.arange(n) / SR
        x = filt(rng.standard_normal(n), 'band', [2000, 9500]) * np.exp(-t * rng.uniform(90, 160))
        x += filt(rng.standard_normal(n), 'band', [600, 1800]) * np.exp(-t * 220) * .4
        self.put('fx', beat + (k / count) ** 1.6 * spread_beats, x * rng.uniform(.4, .9), pan=rng.uniform(-.7, .7), gain=gain)

def _clink(self, beat, pitch=2400, gain=1.0, pan=0.0):
    """Glass bottle set down on stone: a short knock plus two inharmonic glass partials."""
    n = int(.6 * SR); t = np.arange(n) / SR
    knock = filt(rng.standard_normal(n), 'band', [200, 1400]) * np.exp(-t * 60) * .7
    ring = sum(np.sin(2 * np.pi * pitch * r * t) * np.exp(-t * d) * a for r, d, a in [(1, 9, .25), (2.76, 14, .12), (5.4, 22, .05)])
    self.put('fx', beat, (knock + ring) * .8, pan=pan, gain=gain)

def _bag_thud(self, beat, gain=1.0, pan=0.0):
    """Crisp packet landing: soft low thump with a crinkle of foil."""
    n = int(.35 * SR); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(90 + 60 * np.exp(-t * 30)) / SR) * np.exp(-t * 18) * .7
    crinkle = filt(rng.standard_normal(n), 'band', [2500, 9000]) * np.exp(-t * 25) * (rng.random(n) > .7) * .35
    self.put('fx', beat, thump + crinkle, pan=pan, gain=gain)

Session.pour, Session.crunch_burst, Session.clink, Session.bag_thud = _pour, _crunch_burst, _clink, _bag_thud
