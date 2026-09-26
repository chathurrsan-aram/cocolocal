import test from 'node:test';
import assert from 'node:assert/strict';
import { spinPlan, SPIN, blurFor, pointerKick, sliceUnder } from '../src/lib/wheel/motion.ts';

const from = -15, to = 360 * 5 + 200;
const plan = spinPlan(from, to);
const sample = (fn, dur, step = 1 / 240) => { const out = []; for (let t = 0; t <= dur + 1e-9; t += step) out.push([t, fn(t)]); return out; };

test('wind-up pulls back, then launches forward', () => {
  assert.equal(plan.at(0), from);
  assert.ok(Math.abs(plan.at(SPIN.windup) - (from - SPIN.windupDeg)) < 1e-6);
  const s = sample(plan.at, plan.duration);
  const min = Math.min(...s.map(([, a]) => a));
  assert.ok(min >= from - SPIN.windupDeg - 1e-6, 'never pulls back further than the wind-up');
});

test('forward spin never reverses before landing, crawls at the end', () => {
  const s = sample(plan.at, SPIN.windup + SPIN.main).filter(([t]) => t >= SPIN.windup);
  for (let i = 1; i < s.length; i++) assert.ok(s[i][1] >= s[i - 1][1] - 1e-9, `reversed at ${s[i][0]}`);
  const v = t => (plan.at(t + 0.001) - plan.at(t)) / 0.001;
  assert.ok(v(SPIN.windup + 0.05) > 900, 'fast launch');
  assert.ok(v(SPIN.windup + SPIN.main - 0.4) < 40, 'slow tense crawl near the end');
});

test('lands exactly on the target with a small bounce', () => {
  const s = sample(plan.at, plan.duration);
  const max = Math.max(...s.map(([, a]) => a));
  assert.ok(max <= to + SPIN.overshoot + 1e-6 && max > to + 1, 'overshoots a little, never more');
  const after = s.filter(([t]) => t > SPIN.windup + SPIN.main).map(([, a]) => a);
  assert.ok(Math.min(...after) < to, 'bounces back past the target once');
  assert.ok(Math.abs(plan.at(plan.duration) - to) < 0.05);
  assert.equal(plan.at(plan.duration + 5), to);
});

test('motion blur follows speed and is off when slow', () => {
  assert.equal(blurFor(0), 0);
  assert.equal(blurFor(200), 0);
  assert.ok(blurFor(1200) > 1.5 && blurFor(99999) <= 3.2);
});

test('pointer kicks on each peg and settles', () => {
  assert.equal(pointerKick(0), -18);
  assert.ok(Math.abs(pointerKick(0.6)) < 0.5);
  assert.equal(sliceUnder(-15), 0);
  assert.equal(sliceUnder(-45), 1);
  assert.equal(sliceUnder(10), 11);
});
