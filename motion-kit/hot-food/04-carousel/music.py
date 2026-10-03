"""Hot food carousel soundtrack: original, 120 BPM, Bb major, light and warm, every page turn and price on the grid.
    python3 music.py full out.wav     (six pages: 9,7,7,7,8,9 beats)
    python3 music.py public out.wav   (cover + closing: 9,11 beats)
Per page: swipe whoosh on the turn, plucks under the headline words (+.35/.6 s), price pop at +.75 s (products),
pill pop (cover +1 s, closing +.95 s), menu rows from +.75 s every .22 s."""
import sys
sys.path.insert(0, '/root/offers-revision/music')
from p2_music import Session, N, drums, bass, lead
ST = dict(bpm=120, drums='four', swing=.0, lead='marimba', bassline='octave',
          chords=[N('D4 F4 A4 C5'), N('Bb3 D4 F4 A4'), N('G3 Bb3 D4 F4'), N('A3 C4 F4 G4')], roots=['Bb', 'G', 'Eb', 'F'])
C, R = ST['chords'], ST['roots']
PAGES = {'full': [('cover', 9), ('product', 7), ('product', 7), ('product', 7), ('menu', 8), ('closing', 9)],
         'public': [('cover', 9), ('closing', 11)]}
sec = lambda v: v * 2   # seconds -> beats at 120 BPM

def main(kind, out):
    pages = PAGES[kind]; total = sum(b for _, b in pages)
    s = Session(120, total)
    s.epiano(0, C[0], 3.8, vel=.55, gain=.65); s.strings(0, C[0], 7.5, gain=.22, attack=.7)
    start = 0
    for i, (typ, beats) in enumerate(pages):
        if i: s.whoosh(start - .15, length=.4, gain=.38, pan_sweep=(.6, -.6)); s.snap(start, gain=.3)
        for j, n in enumerate(['F5', 'A5', 'C6']): s.pluck(start + sec(.35) + j * .16, n, gain=.32)
        if typ == 'product':
            s.snap(start + sec(.75), gain=.55); s.clink(start + sec(.75), 3000, gain=.32); s.marimba(start + sec(.76), 'D6', gain=.3)
        if typ == 'cover': s.snap(start + sec(1.0), gain=.45); s.clink(start + sec(1.0), 2700, gain=.3)
        if typ == 'closing': s.snap(start + sec(.95), gain=.45); s.clink(start + sec(.95), 2700, gain=.3)
        if typ == 'menu':
            for k in range(3): s.clink(start + sec(.75 + k * .22 + .18), 2600 + 200 * k, gain=.26); s.snap(start + sec(.75 + k * .22 + .18), gain=.25)
        start += beats
    # groove from the first turn to the closing page, then settle
    g0, g1 = 4, start - pages[-1][1]
    if kind == 'public': g1 = 9
    for bar in range(int((g1 - g0) // 4) + 1):
        b0 = g0 + 4 * bar
        if b0 >= g1: break
        drums(s, ST, b0, 1, fill=False, intensity=.75); bass(s, ST, b0, R[bar % 4]); lead(s, ST, b0, C[bar % 4], 'marimba')
    end0 = start - pages[-1][1]
    s.kick(end0, punch=1.0); s.crash(end0, gain=.3, length=3)
    s.epiano(end0, C[0], pages[-1][1] - .5, vel=.75, gain=.7); s.strings(end0, C[0], pages[-1][1] - .5, gain=.3, attack=.3)
    s.bass_note(end0, 'Bb2', pages[-1][1] - 1, gain=.5, bright=.5)
    for b, n in [(end0 + 2, 'F5'), (end0 + 2.5, 'A5'), (end0 + 4, 'D6')]: s.marimba(b, n, gain=.28)
    s.render(out, fade_out=.6)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2]); print('wrote', sys.argv[2])
