"""20-beat score for one Offers Part 2 short (124 BPM, 9.677 s). Lighter and warmer than the drinks reel, same kit.
   python3 p2_short_score.py <coffee|mccoys|...> out.wav
Timeline (beats): copy 0 · products land 1, 1.5 · hero action 2 · qualifier 3.5 · PRICE 4 · hold · exit whoosh 13.5 · end card 14 · button 18"""
import sys, groove as g
kind, out = sys.argv[1], sys.argv[2]
s = g.Session(124, 20)
FM7 = ['A3', 'C4', 'E4', 'G4']      # Fmaj7 (rootless), warm
EM7 = ['G3', 'B3', 'D4', 'F#4']     # Em7
DM9 = ['F3', 'A3', 'C4', 'E4']
G13 = ['F3', 'A3', 'B3', 'E4']
def bar(b0, chord, root, full=True, clap=True):
    for q in range(4):
        s.kick(b0 + q, gain=.9 if full else .6)
        if clap and q in (1, 3): s.clap(b0 + q, gain=.7)
        s.hat(b0 + q + .5, open_=True, gain=.45)
    for k in range(16):
        if k % 4 != 2: s.hat(b0 + k / 4, gain=.4 if k % 2 else .25)
        s.shaker(b0 + k / 4, gain=.25 + .15 * (k % 2))
    for b, l in [(0, .5), (1.5, .4), (2.75, .25), (3.5, .4)]:
        s.epiano(b0 + b, chord, l, vel=.85, gain=.8)
    pat = [(0, root + '2', .5), (.75, root + '3', .2), (1.5, root + '2', .4), (2, root + '2', .45), (3, root + '3', .25), (3.5, root + '2', .4)]
    for b, n, l in pat: s.bass_note(b0 + b, n, l, gain=.85)
# copy + landings
s.crash(0, gain=.45); s.typewriter(0, 10, 16, gain=.4)
bar(0, DM9, 'D', clap=False); bar(4, G13, 'G'); bar(8, DM9, 'D'); bar(12, G13, 'G')
if kind == 'coffee':
    s.clink(1, 2500, gain=.9, pan=-.2); s.clink(1.5, 2200, gain=.9, pan=.2)
    s.pour(2, 1.9, gain=1.0); s.strings(2, ['D4', 'F4', 'A4', 'C5'], 2, gain=.4, attack=.4)
else:
    s.bag_thud(1, gain=1.0, pan=-.2); s.bag_thud(1.5, gain=1.0, pan=.2)
    s.whoosh(2.12, length=.3, gain=.6); s.crunch_burst(2, 16, .4, gain=1.0); s.impact(2, gain=.35)
s.brass(3.5, ['A4', 'D5', 'G5'], .25, gain=.55)
s.brass(4, ['F4', 'B4', 'E5', 'A5'], .85, gain=1.35, fall=True); s.impact(4, gain=.7); s.crash(4, gain=.5, length=2.4); s.clap(4, gain=.8)
s.snare(13.5, gain=.45); s.snare(13.75, gain=.55); s.whoosh(13.78, length=.42, gain=.75)
# end card: logo lands on the downbeat, groove eases, button on 18
s.crash(14, gain=.55); s.brass(14, ['F4', 'A4', 'D5'], .8, gain=.95); s.kick(14, punch=1.2)
for q in range(4):
    s.kick(14 + q, gain=.8); s.hat(14 + q + .5, open_=True, gain=.35)
    if q in (1, 3): s.clap(14 + q, gain=.6)
s.epiano(14, FM7, 1.8, vel=.8); s.epiano(16, EM7, 1.8, vel=.8); s.bass_note(14, 'F2', 1.8); s.bass_note(16, 'E2', 1.8)
s.tom(17.5, 180, gain=.5); s.tom(17.75, 140, gain=.5)
s.kick(18, punch=1.3); s.brass(18, ['F4', 'A4', 'C5', 'E5'], 1.3, gain=1.0); s.crash(18, gain=.55, length=2.2)
s.epiano(18, ['D3', 'A3', 'C4', 'E4', 'F4'], 1.9, vel=1.0); s.bass_note(18, 'D2', 1.9)
s.render(out, fade_out=.5)
print('wrote', out)
