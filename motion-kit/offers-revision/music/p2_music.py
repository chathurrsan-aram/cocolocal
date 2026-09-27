"""Offers Part 2 music: a different cue for every video (8 shorts + the full reel), all original, all beat-locked.

Each style changes tempo, key, chords, drum pattern, swing, bassline, lead colour and the price-hit sound, so the
shorts don't sound like one loop reused.  Accents always follow the picture's timeline (in beats):
  products land -> 'land' beats · hero action -> 'action' · qualifier -> price-.5 · PRICE -> 'price' · whip -> 'exit' · end card -> 'end'

    python3 p2_music.py short <offer-id> out.wav        # one 20-beat short
    python3 p2_music.py reel out.wav                    # the 80-beat full reel
    python3 p2_music.py list
"""
import json, sys
import numpy as np
import groove as g
from groove import Session, SR, rng, filt, env_adsr, hz

# ------------------------------------------------------------------ extra instruments (Part 2 only)
def marimba(self, beat, note, gain=1.0, pan=0.0):
    n = int(.9 * SR); t = np.arange(n) / SR; f = hz(note)
    x = np.sin(2 * np.pi * f * t + 1.2 * np.exp(-t * 30) * np.sin(2 * np.pi * f * 4 * t)) * np.exp(-t * 7)
    x += np.sin(2 * np.pi * f * 3.9 * t) * np.exp(-t * 40) * .25
    self.put('keys', beat, x * .5, pan=pan, gain=gain, jitter_ms=1.5)

def clav(self, beat, notes, gain=1.0, length=.12, pan=.15):
    n = int((length * self.B + .08) * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for nt in notes:
        ph = (hz(nt) * t) % 1; x += np.where(ph < .3, 1.0, -.43)
    x = filt(x / len(notes), 'band', [500, 4200]) * env_adsr(n, .001, .06, .3, .03, hold=length * self.B)
    self.put('gtr', beat, x * .7, pan=pan, gain=gain, jitter_ms=1.0)

def supersaw(self, beat, notes, beats_len, gain=1.0, bright=6000):
    n = int((beats_len * self.B + .15) * SR); t = np.arange(n) / SR; out = np.zeros((2, n))
    for nt in notes:
        for v in range(7):
            d = (v - 3) * .09; osc = g.polyblep_saw(hz(nt) * 2 ** (d / 12), n, rng.uniform()); pan = (v - 3) / 3.5
            out[0] += osc * np.cos((pan + 1) * np.pi / 4); out[1] += osc * np.sin((pan + 1) * np.pi / 4)
    out /= len(notes) * 4
    e = env_adsr(n, .005, .25, .7, .12, hold=beats_len * self.B)
    out = np.stack([filt(c, 'low', bright) * e for c in out])
    self.put('pad', beat, out * .55, gain=gain)

def pluck(self, beat, note, gain=1.0, pan=-.3):
    self.guitar_chop(beat, [note], gain=gain, muted=False, pan=pan)

Session.marimba, Session.clav, Session.supersaw, Session.pluck = marimba, clav, supersaw, pluck

# ------------------------------------------------------------------ styles
N = lambda s: s.split()
STYLES = {
    # id: bpm, chords (4 bars, rootless voicings) + bass roots, drum pattern, swing, lead, price hit
    'water':      dict(name='Fresh tropical house', bpm=120, drums='four', swing=.0, lead='marimba', hit='marimba_brass', bassline='sub',
                       chords=[N('E4 G#4 B4 C#5'), N('F#4 A4 C#5 E5'), N('D4 F#4 A4 C#5'), N('E4 G#4 B4 D5')], roots=['A', 'F#', 'D', 'E']),
    'coffee':     dict(name='Warm lounge disco', bpm=116, drums='four', swing=.05, lead='rhodes', hit='keys_strings', bassline='octave',
                       chords=[N('A3 C4 E4 G4'), N('G3 B3 D4 F#4'), N('F3 A3 C4 E4'), N('E3 G3 B3 D4')], roots=['F', 'E', 'D', 'C']),
    'thirsty':    dict(name='Bright funk pop', bpm=126, drums='four', swing=.0, lead='brass', hit='brass', bassline='slap',
                       chords=[N('G#3 B3 D#4 F#4'), N('A3 C#4 E4 G#4'), N('F#3 A3 C#4 E4'), N('G#3 B3 D4 F#4')], roots=['E', 'A', 'F#', 'B']),
    'jacobs':     dict(name='Playful clavinet break', bpm=108, drums='break', swing=.12, lead='clav', hit='clav_brass', bassline='walking',
                       chords=[N('A3 C4 E4 G4'), N('A3 C#4 E4 G4'), N('A3 C4 D4 F#4'), N('G#3 B3 D4 F4')], roots=['A', 'A', 'D', 'E']),
    'mccoys':     dict(name='Punchy house', bpm=124, drums='four', swing=.0, lead='stab', hit='brass', bassline='octave',
                       chords=[N('F3 A3 C4 E4'), N('F3 A3 B3 E4'), N('F3 A3 C4 E4'), N('F3 A3 B3 E4')], roots=['D', 'G', 'D', 'G']),
    'pringles':   dict(name='Party electro pop', bpm=128, drums='four', swing=.0, lead='supersaw', hit='supersaw', bassline='offbeat',
                       chords=[N('B3 D#4 F#4'), N('G#3 B3 D#4'), N('E3 G#3 B3'), N('F#3 A#3 C#4')], roots=['B', 'G#', 'E', 'F#']),
    'barefoot':   dict(name='Smooth deep house', bpm=118, drums='deep', swing=.06, lead='rhodes_strings', hit='keys_strings', bassline='sub',
                       chords=[N('Bb3 D4 F4 A4'), N('A3 C4 Eb4 G4'), N('G3 Bb3 D4 F4'), N('F#3 A3 C4 Eb4')], roots=['G', 'C', 'Eb', 'D']),
    'yellow-tail':dict(name='Sunny bossa house', bpm=122, drums='bossa', swing=.08, lead='nylon', hit='keys_strings', bassline='bossa',
                       chords=[N('E4 G4 B4 D5'), N('F4 A4 C5 E5'), N('D4 F4 A4 C5'), N('D4 F#4 A4 C5')], roots=['C', 'F', 'D', 'G']),
    'reel':       dict(name='Big-room nu-disco medley', bpm=122, drums='four', swing=.03, lead='medley', hit='brass', bassline='octave',
                       chords=[N('C4 E4 G4 B4'), N('A3 C4 E4 G4'), N('G3 B3 D4 E4'), N('F3 A3 B3 D4')], roots=['A', 'F', 'C', 'G']),
}

# ------------------------------------------------------------------ parts
def drums(s, st, b0, bars=1, fill=False, intensity=1.0):
    sw = st['swing']
    for bar in range(bars):
        o = b0 + 4 * bar; p = st['drums']
        if p in ('four', 'deep'):
            for q in range(4):
                s.kick(o + q, gain=.95 * intensity)
                if q in (1, 3): s.clap(o + q, gain=(.55 if p == 'deep' else .8) * intensity)
                s.hat(o + q + .5, open_=True, gain=(.3 if p == 'deep' else .45) * intensity)
            for k in range(16):
                if k % 4 != 2: s.hat(o + k / 4 + (sw if k % 2 else 0), gain=(.35 if k % 2 else .22) * intensity)
            if p == 'deep':
                for b in (.75, 2.5, 3.25): s.conga(o + b, 230, gain=.4)
        elif p == 'break':
            for b in (0, .75, 2.5): s.kick(o + b, gain=.9 * intensity)
            for b in (1, 3): s.snare(o + b, gain=.75 * intensity)
            s.snare(o + 3.75 + sw, gain=.3)
            for k in range(8): s.hat(o + k / 2 + (sw * 2 if k % 2 else 0), gain=.35 if k % 2 else .5)
        elif p == 'bossa':
            for q in range(4): s.kick(o + q, gain=.85 * intensity)
            for b in (0, .75, 1.5, 2.5, 3.25): s.snap(o + b, gain=.35, pan=.3)   # rim-click clave
            for k in range(16): s.shaker(o + k / 4 + (sw if k % 2 else 0), gain=.3 + .15 * (k % 2))
            s.clap(o + 3, gain=.45)
        if p != 'bossa':
            for k in range(16): s.shaker(o + k / 4 + (sw if k % 2 else 0), gain=(.2 + .12 * (k % 2)) * intensity)
    if fill:
        e = b0 + 4 * bars
        for k, b in enumerate([e - 1, e - .75, e - .5, e - .25]):
            s.tom(b, [220, 185, 150, 120][k], gain=.5) if st['drums'] in ('break', 'bossa') else s.snare(b, gain=.3 + .12 * k)

def bass(s, st, b0, root, bars=1):
    r2, r3 = root + '2', root + '3'
    if st['bassline'] == 'sub':
        pat = [(0, r2, 1.4), (1.5, r2, .4), (2, r2, 1.4), (3.5, r3, .4)]
    elif st['bassline'] == 'octave':
        pat = [(0, r2, .5), (.75, r3, .2), (1.5, r2, .4), (2, r2, .45), (2.75, r3, .2), (3, r2, .45), (3.5, r3, .3)]
    elif st['bassline'] == 'slap':
        pat = [(0, r2, .25), (.5, r3, .15), (.75, r2, .2), (1.5, r3, .15), (2, r2, .25), (2.5, r3, .15), (3, r2, .2), (3.25, r3, .15), (3.5, r2, .3)]
    elif st['bassline'] == 'walking':
        steps = [0, 4, 7, 9]; base = g.midi(r2)
        pat = [(q, base + steps[q], .8) for q in range(4)]
    elif st['bassline'] == 'offbeat':
        pat = [(q + .5, r2, .4) for q in range(4)]
    elif st['bassline'] == 'bossa':
        base = g.midi(r2); pat = [(0, base, 1.3), (1.5, base + 7, .45), (2, base + 7, 1.3), (3.5, base, .45)]
    for bar in range(bars):
        for b, n, l in pat:
            s.bass_note(b0 + 4 * bar + b, n, l, gain=.85, bright=.6 if st['bassline'] in ('sub', 'bossa') else 1.0)

def lead(s, st, b0, chord, which=None):
    kind = which or st['lead']
    if kind in ('rhodes', 'rhodes_strings'):
        for b, l in [(0, .5), (1.5, .4), (2.75, .25), (3.5, .4)]: s.epiano(b0 + b, chord, l, vel=.85, gain=.8)
        if kind == 'rhodes_strings': s.strings(b0, chord, 3.9, gain=.3, attack=.5)
    elif kind == 'marimba':
        seq = [chord[0], chord[2], chord[1], chord[3], chord[2], chord[0], chord[3], chord[1]]
        for k, nt in enumerate(seq): s.marimba(b0 + k * .5 + (.25 if k % 3 == 2 else 0), nt, gain=.7, pan=(-.3 if k % 2 else .3))
        s.epiano(b0, chord, 3.5, vel=.4, gain=.4)
    elif kind == 'brass':
        for b in (0, 1.5, 2.75): s.brass(b0 + b, chord[1:], .22, gain=.5)
        s.guitar_chop(b0 + .5, chord[1:], muted=False, gain=.35); s.guitar_chop(b0 + 2.5, chord[1:], muted=False, gain=.35)
    elif kind == 'clav':
        for k in range(8):
            if k in (0, 3, 5, 6): s.clav(b0 + k / 2 + (st['swing'] if k % 2 else 0), chord[1:], gain=.7)
        s.epiano(b0, chord, 3.6, vel=.35, gain=.35)
    elif kind == 'stab':
        for b in (.5, 1.5, 2.5, 3.5): s.stab(b0 + b, chord, .25, gain=.55)
        s.epiano(b0, chord, 3.6, vel=.4, gain=.35)
    elif kind == 'supersaw':
        for b in (.5, 1.5, 2.5, 3.5): s.supersaw(b0 + b, chord, .35, gain=.7)
    elif kind == 'nylon':
        arp = [chord[0], chord[2], chord[1], chord[3]]
        for k in range(8): s.pluck(b0 + k * .5 + (st['swing'] if k % 2 else 0), arp[k % 4], gain=.55)
        s.epiano(b0, chord, 3.6, vel=.5, gain=.45)

def hit(s, st, b, big=True):
    kind = st['hit']; top = st['chords'][1]
    s.kick(b, punch=1.3); s.crash(b, gain=.5, length=2.4)
    if not SIMPLE: s.impact(b, gain=.6 if big else .4)
    if kind in ('brass', 'marimba_brass', 'clav_brass'):
        s.brass(b, top, .8, gain=1.3, fall=True); s.clap(b, gain=.7)
        if kind == 'marimba_brass':
            for k, nt in enumerate(top): s.marimba(b + k * .0625, nt, gain=.8)
        if kind == 'clav_brass': s.clav(b, top[1:], gain=.9)
    elif kind == 'keys_strings':
        s.epiano(b, top, 1.8, vel=1.0, gain=1.0); s.strings(b, top, 1.8, gain=.6, attack=.03); s.brass(b, top[1:], .5, gain=.7)
    elif kind == 'supersaw':
        s.supersaw(b, top, 1.2, gain=1.1, bright=9000); s.clap(b, gain=.9); s.snare(b, gain=.6)

SIMPLE = True   # v4 simple motion: products glide in and props ease in, so the sound is soft air and shimmer, not thuds, pours and crunches

def foley(s, offer, T):
    if SIMPLE: return soft_foley(s, offer, T)
    act, land = T['action'], T['land']
    kinds = {'water': 'pour', 'coffee': 'pour', 'barefoot': 'pour', 'yellow-tail': 'pour', 'thirsty': 'burst', 'jacobs': 'burst', 'mccoys': 'burst', 'pringles': 'burst'}
    for j, b in enumerate(land):
        if offer in ('mccoys', 'jacobs'): s.bag_thud(b, gain=.9, pan=-.2 + .2 * j)
        elif offer == 'water': s.bag_thud(b, gain=.7, pan=-.2 + .2 * j); s.clink(b, 1900, gain=.25)
        else: s.clink(b, [2500, 2200, 2700][j % 3], gain=.8, pan=-.2 + .2 * j)
    if kinds[offer] == 'pour': s.pour(act, 1.9, gain=1.0)
    else:
        s.whoosh(act + .12, length=.3, gain=.55); s.crunch_burst(act, 16 if offer != 'thirsty' else 8, .4, gain=.9 if offer != 'thirsty' else .5); s.impact(act, gain=.3)

def soft_foley(s, offer, T):
    act, land = T['action'], T['land']
    s.whoosh(land[0] - .25, length=.55, gain=.3, peak=.6)                    # products glide up together
    s.crash(act + .15, reverse=True, length=.7, gain=.28)                    # swell as the splash or snacks ease in
    s.whoosh(act - .1, length=.7, gain=.25, peak=.5)

# ------------------------------------------------------------------ cues
SHORT_T = dict(copy=0, land=[1, 1.5], action=2, price=4, exit=13.5, end=14, total=20)

def short(offer, out, T=SHORT_T):
    st = STYLES[offer]; s = Session(st['bpm'], T['total']); C, R = st['chords'], st['roots']
    L0 = T['land'][0]; n = 3 if offer in ('thirsty', 'jacobs', 'pringles') else 2
    T = dict(T, land=[L0 + (1 / 3 if n > 2 else .5) * j for j in range(n)])   # matches the picture's landAt()
    s.crash(0, gain=.4); s.typewriter(0, 10, 16, gain=.35)
    for bar in range(int(T['end'] // 4) + (1 if T['end'] % 4 else 0)):
        b0 = 4 * bar
        if b0 >= T['end']: break
        drums(s, st, b0, 1, fill=(b0 + 4 >= T['exit']), intensity=.75 if bar == 0 else 1.0)
        bass(s, st, b0, R[bar % 4]); lead(s, st, b0, C[bar % 4])
    foley(s, offer, T)
    s.brass(T['price'] - .5, C[1][1:], .22, gain=.45) if st['hit'] != 'supersaw' else s.supersaw(T['price'] - .5, C[1], .2, gain=.5)
    hit(s, st, T['price'])
    s.crash(T['end'], reverse=True, length=.9, gain=.35) if SIMPLE else s.whoosh(T['exit'] + .28, length=.42, gain=.75)
    # end card: two calmer bars, then a button two beats from the end
    e = T['end']; s.crash(e, gain=.5); s.kick(e, punch=1.2)
    drums(s, st, e, 1, intensity=.7)
    for k, bb in enumerate((e, e + 2)):
        s.epiano(bb, C[(k + 2) % 4], 1.8, vel=.8); s.bass_note(bb, R[(k + 2) % 4] + '2', 1.8)
    btn = T['total'] - 2
    s.kick(btn, punch=1.3); s.crash(btn, gain=.5, length=2.2); s.epiano(btn, C[0], 1.9, vel=1.0); s.bass_note(btn, R[0] + '2', 1.9)
    s.brass(btn, C[0], 1.2, gain=.9) if st['hit'] != 'supersaw' else s.supersaw(btn, C[0], 1.2, gain=.9)
    s.render(out, fade_out=.45)
    return st

REEL_ORDER = ['water', 'coffee', 'thirsty', 'jacobs', 'mccoys', 'pringles', 'barefoot', 'yellow-tail']
LEAD_FOR = {'water': 'marimba', 'coffee': 'rhodes', 'thirsty': 'brass', 'jacobs': 'clav', 'mccoys': 'stab', 'pringles': 'supersaw', 'barefoot': 'rhodes_strings', 'yellow-tail': 'nylon'}

def reel(out, T=None):
    """80 beats: intro 0–8 · offers at 8+8i (land +.5/+1/+1.5, action +1.5, price +3, whip +7.5) · outro 72–80."""
    st = STYLES['reel']; s = Session(st['bpm'], 80); C, R = st['chords'], st['roots']
    # intro (matches the cover): eyebrow types from 0 · title lines slam on 1 and 1.5 · products land 2–2.75 · groove drops on 4
    for k in range(16): s.shaker(k / 4, gain=.2 + .1 * (k % 2))
    s.typewriter(0, 18, 16, gain=.35); s.epiano(0, C[0], 3.8, vel=.55); s.strings(0, C[0], 7.5, gain=.3, attack=.8)
    if SIMPLE:
        for b in (1, 1.5): s.epiano(b, C[0][1:], .45, vel=.8, gain=.7); s.kick(b, punch=.9, gain=.7)
        s.whoosh(1.75, length=.6, gain=.3, peak=.6)
    else:
        for b in (1, 1.5): s.brass(b, C[0][1:], .3, gain=.85); s.snare(b, gain=.6); s.kick(b, punch=1.1)
        for j, b in enumerate((2, 2.25, 2.5, 2.75)): s.clink(b, 2200 + 150 * j, gain=.45, pan=-.3 + .2 * j)
    s.riser(4, 1.5, gain=.35)
    s.kick(4, punch=1.3); s.impact(4, gain=.55); s.crash(4, gain=.6); drums(s, st, 4, 1, fill=True); bass(s, st, 4, R[1]); lead(s, st, 4, C[1], 'rhodes')
    s.crash(8, reverse=True, length=1.6, gain=.4)
    for i, offer in enumerate(REEL_ORDER):
        o = 8 + 8 * i
        s.crash(o, gain=.55); s.crash(o, reverse=True, length=.8, gain=.3) if SIMPLE else s.whoosh(o - .2, length=.4, gain=.6)
        for bar in range(2):
            drums(s, st, o + 4 * bar, 1, fill=(bar == 1)); bass(s, st, o + 4 * bar, R[(2 * i + bar) % 4]); lead(s, st, o + 4 * bar, C[(2 * i + bar) % 4], LEAD_FOR[offer])
        foley(s, offer, dict(land=[o + .5 + (1 / 3 if offer in ('thirsty', 'jacobs', 'pringles') else .5) * j for j in range(3 if offer in ('thirsty', 'jacobs', 'pringles') else 2)], action=o + 1.5))
        s.brass(o + 3, STYLES[offer]['chords'][1][1:] if False else C[(2 * i + 1) % 4][1:], .8, gain=1.25, fall=True)
        s.kick(o + 3, punch=1.3); s.clap(o + 3, gain=.7)
        s.crash(o + 3, gain=.45, length=2)
        if not SIMPLE: s.impact(o + 3, gain=.6)
    e = 72; s.crash(e, gain=.6); s.kick(e, punch=1.3); s.brass(e, C[0], .9, gain=1.1)
    drums(s, st, e, 1, fill=True); bass(s, st, e, R[2]); lead(s, st, e, C[2], 'rhodes_strings')
    s.kick(76, punch=1.4); s.impact(76, gain=.7); s.crash(76, gain=.7, length=3.2); s.brass(76, C[0], 1.6, gain=1.1)
    s.epiano(76, C[0], 3.6, vel=1.0); s.strings(76, C[0], 3.4, gain=.55, attack=.05); s.bass_note(76, R[0] + '2', 3.0)
    s.render(out, fade_out=.8)
    return st

if __name__ == '__main__':
    if sys.argv[1] == 'list':
        for k, v in STYLES.items(): print(f"{k:<12} {v['bpm']} BPM  {v['name']}")
    elif sys.argv[1] == 'short':
        st = short(sys.argv[2], sys.argv[3]); print('wrote', sys.argv[3], st['name'], st['bpm'])
    elif sys.argv[1] == 'reel':
        st = reel(sys.argv[2]); print('wrote', sys.argv[2], st['name'], st['bpm'])
