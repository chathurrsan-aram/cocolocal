"""Full Range soundtrack: original, 120 BPM, Bb major shop-pop house, every UI moment on the grid.
    python3 music.py out.wav
Beat map (matches template.html): cover 0–8 (headline .5/1, cards 2–2.75, 'Come explore' 3.5, grid drop 4,
tiles on 16ths from 4.75, tap 7.5) · collections at 8+6i (tap + swipe on the downbeat, shelf lights on +1.5
(+2 for the first), polaroid +2, pill +2.5) · finale 80 (lights wave 81.5–84.25, address 84.5) · outro 88 · end 94."""
import sys
sys.path.insert(0, '/root/offers-revision/music')
from p2_music import Session, N, drums, bass, lead, outro_fx

ST = dict(name='Bright shop-pop house', bpm=120, drums='four', swing=.0, lead='marimba', hit='keys_strings', bassline='octave',
          chords=[N('D4 F4 A4 C5'), N('Bb3 D4 F4 A4'), N('G3 Bb3 D4 F4'), N('A3 C4 F4 G4')], roots=['Bb', 'G', 'Eb', 'F'])
C, R = ST['chords'], ST['roots']
T0, SEC, NCOL = 8, 6, 12
FIN = T0 + SEC * NCOL; END = FIN + 8; TOTAL = END + 6
WAVE = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6']

def tap(s, b, gain=.7):
    s.snap(b, gain=gain); s.clink(b, 3200, gain=.22)

def light(s, b, k):
    s.crash(b, reverse=True, length=.6, gain=.22)                      # a short swell into the light
    for j, nt in enumerate(C[k % 4][1:]): s.marimba(b + j * .0625, nt.replace('4', '5').replace('3', '4'), gain=.55, pan=-.3 + .3 * j)
    s.clink(b, 2600, gain=.3)

def main(out):
    s = Session(ST['bpm'], TOTAL)
    # ---- cover: airy intro, then the groove drops as the cover folds into the grid
    s.epiano(0, C[0], 3.8, vel=.55, gain=.7); s.strings(0, C[0], 7.6, gain=.25, attack=.8)
    for k in range(16): s.shaker(k / 4, gain=.15 + .1 * (k % 2))
    for b in (.5, 1): s.pluck(b, 'F5' if b == .5 else 'A5', gain=.6)
    for j, b in enumerate((2, 2.25, 2.5, 2.75)): s.clink(b, 2100 + 180 * j, gain=.35, pan=-.3 + .2 * j); s.snap(b, gain=.25)
    s.pluck(3.5, 'C6', gain=.5); s.riser(4, 1.5, gain=.3)
    s.kick(4, punch=1.2); s.crash(4, gain=.5); s.whoosh(3.8, length=.4, gain=.45)
    drums(s, ST, 4, 1, intensity=.8); bass(s, ST, 4, R[1])
    for k in range(8): s.marimba(4.75 + k * .125, ['D5', 'F5', 'A5', 'C6', 'A5', 'F5', 'G5', 'A5'][k], gain=.45, pan=-.4 + .1 * k)
    tap(s, 7.5); s.whoosh(7.8, length=.35, gain=.4)
    # ---- twelve collections, two bars each... six beats: 1.5 bars, so the groove runs bar-wise underneath
    for bar in range(int((FIN - T0) / 4)):
        b0 = T0 + 4 * bar
        drums(s, ST, b0, 1, fill=(bar % 3 == 2), intensity=1.0)
        bass(s, ST, b0, R[bar % 4]); lead(s, ST, b0, C[bar % 4], 'marimba' if bar % 6 < 3 else 'nylon')
    for i in range(NCOL):
        sb = T0 + SEC * i
        s.crash(sb, gain=.35 if i else .5)
        if i: tap(s, sb); s.whoosh(sb - .1, length=.3, gain=.45, pan_sweep=(.6, -.6))
        else: s.whoosh(sb - .1, length=.4, gain=.45)
        lb = sb + (2 if i == 0 else 1.5)
        light(s, lb, i)
        s.snap(lb + .5, gain=.45); s.tom(lb + .5, 190, gain=.18)                 # polaroid lands
        s.clink(lb + 1, 3000, gain=.18)                                          # location pill
    # ---- finale: a breakdown, the whole shop lights up front to back
    s.crash(FIN, gain=.55); s.kick(FIN, punch=1.2)
    s.epiano(FIN, C[0], 3.8, vel=.8); s.strings(FIN, C[0], 7.5, gain=.35, attack=.4); s.bass_note(FIN, R[0] + '2', 3.8)
    for k in range(16): s.shaker(FIN + k / 4, gain=.18 + .1 * (k % 2))
    for k in range(12): s.marimba(FIN + 1.5 + k * .25, WAVE[k % 6] if k < 6 else WAVE[(k % 6)].replace('5', '6'), gain=.42, pan=-.5 + k * .09)
    s.riser(FIN + 4, 1.5, gain=.25); s.kick(FIN + 4, punch=1.2); s.clap(FIN + 4, gain=.6)
    drums(s, ST, FIN + 4, 1, intensity=.85); bass(s, ST, FIN + 4, R[3]); lead(s, ST, FIN + 4, C[3], 'marimba')
    # ---- outro: the lockup lands on END
    outro_fx(s, END)
    s.crash(END, gain=.55); s.kick(END, punch=1.3); s.epiano(END, C[0], 1.8, vel=1.0); s.bass_note(END, R[0] + '2', 1.8)
    drums(s, ST, END, 1, intensity=.7)
    s.kick(END + 4, punch=1.3); s.crash(END + 4, gain=.5, length=2.2); s.epiano(END + 4, C[0], 1.9, vel=1.0); s.bass_note(END + 4, R[0] + '2', 1.9)
    s.strings(END + 4, C[0], 1.9, gain=.4, attack=.05)
    s.render(out, fade_out=.5)

if __name__ == '__main__':
    main(sys.argv[1]); print('wrote', sys.argv[1], ST['name'], TOTAL, 'beats')
