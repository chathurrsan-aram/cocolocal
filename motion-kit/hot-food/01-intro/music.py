"""Hot food teaser soundtrack: original, 96 BPM, F major, warm and unhurried.  python3 music.py out.wav
Beat map (matches template.html): logo 0 · eyebrow 1 · words 1.5–2.6 · panel opens 4.8 (soft kick, swell) ·
groove 4.8–17.6 · 'Hot food at Coco Local.' 13.3 · COMING SOON pill 14.6 · ending 17.9 (follow line .4/.8,
address 1.5–1.9, logo 2.3) · held to 24."""
import sys
sys.path.insert(0, '/root/offers-revision/music')
from p2_music import Session, N
BPM, BEATS = 96, 24
C = [N('F3 A3 C4 E4'), N('D3 F3 A3 C4'), N('Bb2 D3 F3 A3'), N('C3 E3 G3 Bb3')]
R = ['F', 'D', 'Bb', 'C']

def main(out):
    s = Session(BPM, BEATS)
    # act 1: an airy pad, the logo chime, a pluck under each word
    s.epiano(0, C[0], 4.6, vel=.5, gain=.7); s.strings(0, C[0], 4.8, gain=.22, attack=.9)
    s.clink(0.05, 2400, gain=.25)
    for b, n in [(1.5, 'A4'), (1.6, 'C5'), (2.1, 'F5'), (2.2, 'A5'), (2.3, 'G5')]: s.pluck(b, n, gain=.42)
    for k in range(8): s.shaker(2.8 + k / 2, gain=.08 + .05 * (k % 2))
    s.riser(4.8, 1.6, gain=.22); s.whoosh(4.5, length=.5, gain=.32, peak=.6)
    # act 2: the panel opens on a soft kick; a gentle groove underneath
    s.kick(4.8, punch=.8, gain=.75); s.crash(4.8, gain=.25, length=3.0)
    for bar in range(4):
        b0 = 4.8 + 4 * bar
        if b0 >= 17.6: break
        ch = C[bar % 4]; s.epiano(b0, ch, 3.8, vel=.62, gain=.7); s.bass_note(b0, R[bar % 4] + '2', 3.6, gain=.55, bright=.6)
        for q in range(4):
            bq = b0 + q
            if bq >= 17.6: break
            s.kick(bq, gain=.42, punch=.6)
            s.hat(bq + .5, gain=.12)
            s.shaker(bq + .25, gain=.07); s.shaker(bq + .75, gain=.1)
            if q in (1, 3): s.snap(bq, gain=.18)
    for b, n in [(6.0, 'C6'), (6.5, 'A5'), (10.0, 'E6'), (10.5, 'C6')]: s.marimba(b, n, gain=.28, pan=.2)
    # act 2b: the new line, then the pill
    s.whoosh(12.6, length=.45, gain=.3, pan_sweep=(.5, -.5))
    for b, n in [(13.3, 'C5'), (13.4, 'F5'), (13.75, 'A5'), (13.85, 'C6')]: s.pluck(b, n, gain=.4)
    s.snap(14.6, gain=.5); s.clink(14.6, 2900, gain=.32); s.marimba(14.62, 'F6', gain=.35)
    # act 3: settle on the tonic for the reading hold
    s.whoosh(17.5, length=.4, gain=.28); s.kick(17.9, punch=.9, gain=.6)
    s.epiano(17.9, C[0], 6.0, vel=.75, gain=.75); s.strings(17.9, C[0], 6.0, gain=.3, attack=.4); s.bass_note(17.9, 'F2', 5.5, gain=.5, bright=.5)
    s.snap(17.9, gain=.4); s.clink(17.9, 2600, gain=.25)
    for b, n in [(18.3, 'A5'), (18.7, 'C6'), (20.2, 'F6')]: s.marimba(b, n, gain=.3)
    s.clink(20.2, 3100, gain=.25)
    s.render(out, fade_out=.6)

if __name__ == '__main__':
    main(sys.argv[1]); print('wrote', sys.argv[1], BEATS, 'beats at', BPM)
