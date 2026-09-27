"""Score for the restored drinks reel (124 BPM, 48 beats, 23.226 s).

Every accent is written against the reel's own seek() choreography (reel.html @ 5e296b8):
  intro   wipes 0/.25/.5 · shop rises .5 · eyebrow types 1–3.9 · shutter 2–3.5 · camera push + flash 4
          headline slams 5 and 5.5 · rule 6 · subtitle 6.5 · whip out 7.6
  offer s headline lines s+.5, s+1 · products land on 8ths from s+1.5 · PRICE SLAM + flash s+4
          details s+4.5… · products hop every beat s+4…s+7 · whip out s+7.6   (s = 8, 16, 24, 32)
  outro   logo 40 · rule 40.5 · lines 41 / 41.5 / 42 · hold to 48
Harmony: D Dorian vamp Dm9 → G13 (the price always lands on the chord change), outro Bbmaj9 → A7 → Dm9 button.

    python3 old_reel_score.py out.wav [events.json]
"""
import json, sys
import groove as g

BPM, BEATS = 124, 48
s = g.Session(BPM, BEATS)
OFFERS = [8, 16, 24, 32]
NPROD = [4, 4, 2, 2]

DM9 = ['F3', 'A3', 'C4', 'E4']
G13 = ['F3', 'A3', 'B3', 'E4']
BBMAJ9 = ['F3', 'A3', 'C4', 'D4']
A7 = ['G3', 'C#4', 'E4', 'Bb4']
A7SUS = ['G3', 'D4', 'E4', 'A4']

def bass_bar(b0, chord, var=0):
    """Two-bar funk bassline, octave pops and chromatic walk-ups."""
    if chord == 'Dm':
        pat = [(0, 'D2', .5), (.75, 'D3', .2), (1.5, 'A2', .4), (2, 'D2', .45), (2.75, 'F2', .2), (3, 'G2', .45), (3.5, 'G#2', .4)]
        if var: pat[-2:] = [(3, 'C3', .25), (3.25, 'A2', .2), (3.5, 'G#2', .4)]
    elif chord == 'G':
        pat = [(0, 'G2', .5), (.75, 'G3', .2), (1.5, 'D3', .4), (2, 'G2', .45), (2.75, 'B2', .2), (3, 'C3', .45), (3.5, 'C#3', .4)]
    elif chord == 'Bb':
        pat = [(0, 'Bb1', .5), (.75, 'Bb2', .2), (1.5, 'F2', .4), (2, 'A1', .5), (2.75, 'A2', .2), (3, 'E2', .4), (3.5, 'C#2', .4)]
    for i, (b, n, l) in enumerate(pat):
        s.bass_note(b0 + b, n, l, gain=1.0 if b in (0, 2) else .85, slide_from=('D2' if n == 'D3' else None))

def groove_bar(b0, hats=True, clap=True, open_hat=True, shaker=True, conga=True, kick=True):
    for q in range(4):
        if kick: s.kick(b0 + q)
        if clap and q in (1, 3): s.clap(b0 + q, gain=.85)
        if open_hat: s.hat(b0 + q + .5, open_=True, gain=.55)
    if hats:
        for k in range(16):
            if k % 4 == 2: continue  # open hat takes the off-beat
            s.hat(b0 + k / 4, gain=(.55 if k % 2 else .35))
    if shaker:
        for k in range(16):
            s.shaker(b0 + k / 4 + (.02 if k % 2 else 0), gain=.35 + .25 * (k % 2))
    if conga:
        for b, p, sl in [(.75, 330, False), (1.5, 250, False), (2.25, 330, True), (3.5, 250, False), (3.75, 250, False)]:
            s.conga(b0 + b, p, gain=.55, slap=sl)

def comp(b0, chord, vel=1.0):
    for b, l in [(0, .5), (1.5, .4), (2.75, .25), (3.5, .4)]:
        s.epiano(b0 + b, chord, l, vel=vel, gain=.9)

def guitar(b0, chord):
    top = chord[1:]
    for k in range(16):
        if k in (2, 6, 10, 14):
            s.guitar_chop(b0 + k / 4, [n.replace('3', '4') if n.endswith('3') else n for n in top], muted=False, gain=.5)
        elif k % 2:
            s.guitar_chop(b0 + k / 4, top, muted=True, gain=.35)

# ---------------------------------------------------------------- intro (beats 0–8)
for i, b in enumerate([0, .25, .5]):
    s.whoosh(b + .12, length=.32, gain=.45 + .1 * i, pan_sweep=(-.7, .7))       # the three colour wipes
s.mark(0, 'wipes')
s.crash(8, reverse=True, length=1.9, gain=.5)
s.epiano(.5, DM9, 3.5, vel=.6, gain=.7); s.mark(.5, 'shop rises: first chord')
s.strings(.5, ['D3', 'A3', 'E4'], 3.5, gain=.35, attack=.8)
for k in range(4, 16):
    s.shaker(k / 4, gain=.2 + .15 * (k % 2))
s.typewriter(1, 23, 8, gain=.55); s.mark(1, 'eyebrow typing')
s.shutter_roll(2, 1.5, gain=.9); s.mark(2, 'shutter rolls up')
s.tom(3.5, 95, gain=.7); s.mark(3.5, 'shutter hits the top')
s.riser(4, 1.5, gain=.45)
s.kick(4, punch=1.3); s.impact(4, gain=.8); s.crash(4, gain=.7); s.mark(4, 'camera push + flash: drop')
bass_bar(4, 'G')
groove_bar(4, clap=False, conga=False)
s.brass(5, ['F4', 'B4', 'E5'], .3, gain=.9); s.snare(5, gain=.7); s.impact(5, gain=.4); s.mark(5, 'headline slam 1')
s.brass(5.5, ['A4', 'D5', 'G5'], .45, gain=1.0); s.snare(5.5, gain=.8); s.clap(5.5, gain=.8); s.impact(5.5, gain=.55); s.mark(5.5, 'headline slam 2')
s.epiano(6, G13, 1.5, vel=.9)
for k, b in enumerate([7, 7.25, 7.5, 7.75]):
    s.snare(b, gain=.35 + .15 * k)
s.whoosh(7.9, length=.45, gain=.8); s.mark(7.6, 'intro whips out')

# ---------------------------------------------------------------- offers (beats 8–40)
for i, s0 in enumerate(OFFERS):
    s.crash(s0, gain=.7); s.kick(s0, punch=1.25); s.impact(s0, gain=.3); s.mark(s0, f'offer {i+1} enters')
    bass_bar(s0, 'Dm', var=i % 2); bass_bar(s0 + 4, 'G')
    groove_bar(s0); groove_bar(s0 + 4)
    comp(s0, DM9, vel=.9); comp(s0 + 4, G13, vel=1.0)
    if i >= 1:
        guitar(s0, DM9); guitar(s0 + 4, G13)
    if i >= 2:
        s.strings(s0, ['D4', 'F4', 'A4', 'C5'], 4, gain=.45, attack=.3)
        s.strings(s0 + 4, ['D4', 'F4', 'B4', 'E5'], 3.6, gain=.5, attack=.15)
    s.snap(s0 + .5, gain=.55, pan=-.2); s.snap(s0 + 1, gain=.55, pan=.2); s.mark(s0 + .5, 'headline lines')
    step = .5 if NPROD[i] > 2 else 1
    rise = [['A3', 'D4', 'F4'], ['C4', 'F4', 'A4'], ['D4', 'G4', 'C5'], ['F4', 'A4', 'D5']]
    for j in range(NPROD[i]):
        b = s0 + 1.5 + step * j
        s.brass(b, rise[j if NPROD[i] > 2 else j * 2 + 1], .16, gain=.32 + .04 * j, scoop=False)
        s.tom(b, 150 + 25 * j, gain=.18, pan=-.3 + .2 * j)
        s.mark(b, f'product {j+1} lands')
    # the price lands on the downbeat of the chord change
    p = s0 + 4
    s.brass(p, ['F4', 'B4', 'E5', 'A5'], .85, gain=1.45, fall=True); s.brass(p, ['G3', 'F4'], .85, gain=.6, fall=True); s.clap(p, gain=.9); s.snare(p, gain=.6)
    s.impact(p, gain=.75); s.crash(p, gain=.55, length=2.6); s.kick(p, punch=1.35)
    s.mark(p, f'offer {i+1} PRICE')
    s.brass(p + 3.5, ['A4', 'D5', 'G5'] if i % 2 else ['G4', 'C5', 'F5'], .2, gain=.5)   # pickup into the whip
    if s0 + 8 < 40 or True:
        s.snare(s0 + 7.5, gain=.5); s.snare(s0 + 7.75, gain=.6)
    s.whoosh(s0 + 7.9, length=.42, gain=.7, pan_sweep=(.7, -.7) if i % 2 else (-.7, .7)); s.mark(s0 + 7.6, f'offer {i+1} whips out')

# ---------------------------------------------------------------- outro (beats 40–48)
s.crash(40, gain=.7); s.kick(40, punch=1.2)
s.brass(40, ['F4', 'A4', 'D5', 'C5'], .9, gain=1.2); s.impact(40, gain=.6); s.mark(40, 'logo lands')
s.strings(40, ['D4', 'F4', 'A4', 'C5'], 2, gain=.55, attack=.12)
s.strings(42, ['E4', 'G4', 'C#5'], 2, gain=.55, attack=.12)
bass_bar(40, 'Bb')
groove_bar(40, conga=False)
for b, c in [(40.5, BBMAJ9), (41.5, BBMAJ9), (42, A7SUS), (42.75, A7), (43.5, A7)]:
    s.epiano(b, c, .45, vel=.9)
s.snap(41, gain=.45); s.snap(41.5, gain=.45); s.snap(42, gain=.5); s.mark(41, 'address lines')
for k, b in enumerate([43, 43.25, 43.5, 43.75]):
    s.tom(b, [220, 185, 150, 120][k], gain=.55)
s.brass(43.5, ['G4', 'C#5', 'E5'], .3, gain=.7)
# the button
s.kick(44, punch=1.4); s.impact(44, gain=.8); s.crash(44, gain=.75, length=3.4)
s.brass(44, ['F4', 'A4', 'C5', 'E5'], 1.6, gain=1.15)
s.epiano(44, ['D3', 'A3', 'C4', 'E4', 'F4'], 3.6, vel=1.0, gain=1.0)
s.strings(44, ['D4', 'F4', 'A4', 'E5'], 3.2, gain=.6, attack=.05)
s.bass_note(44, 'D2', 2.5, gain=1.0)
s.mark(44, 'final button')

out = sys.argv[1] if len(sys.argv) > 1 else 'old-reel-groove.wav'
s.render(out, fade_out=0.9)
if len(sys.argv) > 2:
    json.dump([{'beat': b, 't': round(b * 60 / BPM, 4), 'what': w} for b, w in sorted(s.events)], open(sys.argv[2], 'w'), indent=1)
print('wrote', out, round(s.n / g.SR, 3), 's')
