// Spin choreography as pure functions of time (the code-motion-design approach): the page
// samples `plan.at(t)` every frame, so the motion is exact, testable and frame-rate independent.
//
//   wind-up  0 → 0.32 s   pull back 14° (ease in-out), like drawing back a lever
//   spin     → 4.4 s      cubic ease-out: fast launch, then a slow, tense crawl over the last slices
//   land     ~0.6 s       2.6° overshoot, then an underdamped spring settles it back (small bounce)

export const SPIN = {
  windup: 0.32,
  windupDeg: 14,
  main: 4.4,
  power: 3,
  overshoot: 2.6,
  settleOmega: 17,
  settleZeta: 0.42,
};

const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;

/** Unit spring decay from 1 to 0 with zero start velocity (ζ < 1: a little wobble). */
export function springDecay(t: number, omega: number, zeta: number) {
  if (t <= 0) return 1;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
}

export function spinPlan(from: number, to: number, s = SPIN) {
  const startB = from - s.windupDeg;
  const endB = to + s.overshoot;
  const settle = 4 / (s.settleZeta * s.settleOmega) + 0.25;
  const duration = s.windup + s.main + settle;
  const at = (t: number) => {
    if (t <= 0) return from;
    if (t < s.windup) return from - s.windupDeg * easeInOutSine(t / s.windup);
    const tb = t - s.windup;
    if (tb < s.main) return startB + (endB - startB) * (1 - Math.pow(1 - tb / s.main, s.power));
    if (t >= duration) return to;
    return to + s.overshoot * springDecay(tb - s.main, s.settleOmega, s.settleZeta);
  };
  return { at, duration, landsAt: s.windup + s.main };
}

/** Motion blur (px) for an angular speed in degrees per second. */
export function blurFor(speed: number) {
  return Math.min(3.2, Math.max(0, (Math.abs(speed) - 250) / 420));
}

/** Pointer angle after a peg flicks it (seconds since the clack): a quick damped wobble. */
export function pointerKick(t: number, strength = 18) {
  return -strength * springDecay(t, 22, 0.35);
}

/** Index of the slice under the top pointer for a wheel rotation in degrees. */
export function sliceUnder(rotation: number, count = 12) {
  const deg = (((-rotation) % 360) + 360) % 360;
  return Math.floor(deg / (360 / count)) % count;
}
