import test from 'node:test';
import assert from 'node:assert/strict';
import { outcomes, segments, wheelConfig } from '../src/data/wheel.ts';
import {
  validateOdds, pickOutcome, pickSegment, londonWeek, normaliseEmail, normaliseUkMobile,
  generateCode, normaliseCode, PRIZE_CODE_RE, BONUS_CODE_RE, signStaffSession, verifyStaffSession, segmentAngle,
} from '../src/lib/wheel/core.ts';

const at = iso => new Date(iso);
// Deterministic "random" source: always returns the given value (clamped into range).
const fixed = value => max => Math.min(value, max - 1);

test('default odds: 15% real prizes, 10% spin again, 75% not this time, 100% total', () => {
  validateOdds(outcomes, segments);
  const pct = kind => outcomes.filter(o => o.kind === kind).reduce((sum, o) => sum + o.percent, 0);
  assert.equal(pct('prize'), 15);
  assert.equal(outcomes.find(o => o.id === 'spin-again').percent, 10);
  assert.equal(outcomes.find(o => o.id === 'not-this-time').percent, 75);
});

test('odds validation rejects totals other than 100% and outcomes with no slice', () => {
  const broken = outcomes.map(o => o.id === 'free-coffee' ? { ...o, percent: 3 } : o);
  assert.throws(() => validateOdds(broken, segments), /100/);
  assert.throws(() => validateOdds(outcomes, segments.filter(s => s !== 'free-crisps')), /free-crisps/);
});

test('no alcohol, tobacco or 18+ prizes', () => {
  for (const o of outcomes) assert.doesNotMatch(`${o.label} ${o.claim ?? ''}`, /alcohol|beer|wine|spirit|cider|tobacco|cigar|vape|lottery|18\+/i);
});

test('wheel has the 12 poster slices in clockwise order from the pointer', () => {
  assert.equal(segments.length, 12);
  assert.deepEqual(segments.slice(0, 4), ['not-this-time', 'free-slushie', 'not-this-time', 'free-coffee']);
  assert.equal(segments.filter(s => s === 'not-this-time').length, 4);
});

test('pickOutcome maps the basis-point draw onto cumulative odds', () => {
  // Order in config: prizes first, then spin-again, then not-this-time.
  assert.equal(pickOutcome(fixed(0)), outcomes[0].id);
  assert.equal(pickOutcome(fixed(9999)), 'not-this-time');
  assert.equal(pickOutcome(fixed(1499)), outcomes.filter(o => o.kind === 'prize').at(-1).id);
  assert.equal(pickOutcome(fixed(1500)), 'spin-again');
  assert.equal(pickOutcome(fixed(2499)), 'spin-again');
  assert.equal(pickOutcome(fixed(2500)), 'not-this-time');
});

test('a re-spin can never land on spin again (its share goes to not this time)', () => {
  for (const draw of [1500, 2000, 2499]) assert.equal(pickOutcome(fixed(draw), { respin: true }), 'not-this-time');
  assert.equal(pickOutcome(fixed(0), { respin: true }), outcomes[0].id);
});

test('pickSegment chooses among the slices for that outcome', () => {
  const ntt = segments.flatMap((s, i) => s === 'not-this-time' ? [i] : []);
  assert.equal(pickSegment('not-this-time', fixed(0)), ntt[0]);
  assert.equal(pickSegment('not-this-time', fixed(3)), ntt[3]);
  assert.equal(pickSegment('free-coffee', fixed(0)), segments.indexOf('free-coffee'));
});

test('segmentAngle puts the chosen slice under the top pointer', () => {
  // Slice i spans [i*30, (i+1)*30) degrees clockwise from the top. Rotating the wheel
  // by -(i*30 + 30*landing) brings the landing point to the pointer.
  assert.equal(segmentAngle(0, 0.5), 360 - 15);
  assert.equal(segmentAngle(3, 0.5), 360 - 105);
});

test('ISO week in Europe/London: Monday 00:00 to Sunday 23:59 local time', () => {
  const w = londonWeek(at('2026-09-26T12:00:00Z')); // Saturday
  assert.equal(w.key, '2026-W39');
  assert.equal(w.start.toISOString(), '2026-09-20T23:00:00.000Z'); // Mon 21 Sep 00:00 BST
  assert.equal(w.next.toISOString(), '2026-09-27T23:00:00.000Z'); // Mon 28 Sep 00:00 BST
  // Sunday 23:30 BST is still week 39; Monday 00:00 BST is week 40.
  assert.equal(londonWeek(at('2026-09-27T22:30:00Z')).key, '2026-W39');
  assert.equal(londonWeek(at('2026-09-27T23:00:00Z')).key, '2026-W40');
});

test('ISO week handles the clocks going back and year boundaries', () => {
  // Clocks go back Sun 25 Oct 2026; the next Monday starts at 00:00 GMT.
  const w = londonWeek(at('2026-10-25T12:00:00Z'));
  assert.equal(w.key, '2026-W43');
  assert.equal(w.next.toISOString(), '2026-10-26T00:00:00.000Z');
  assert.equal(londonWeek(at('2027-01-01T12:00:00Z')).key, '2026-W53'); // Fri 1 Jan 2027 is in 2026-W53
  assert.equal(londonWeek(at('2027-01-04T00:00:00Z')).key, '2027-W01');
});

test('email normalisation: trim + lowercase, rejects junk', () => {
  assert.equal(normaliseEmail('  Sam.Smith@Example.CO.UK '), 'sam.smith@example.co.uk');
  for (const bad of ['', 'sam', 'sam@', '@x.com', 'a b@x.com', 'sam@x', `${'a'.repeat(250)}@x.com`]) assert.equal(normaliseEmail(bad), null, bad);
});

test('UK mobile normalisation to E.164', () => {
  for (const raw of ['07700 900123', '+44 7700 900123', '447700900123', '0044 7700-900-123', '(07700) 900 123', '+44 (0)7700 900123'])
    assert.equal(normaliseUkMobile(raw), '+447700900123', raw);
  for (const bad of ['01702 123456', '0770090012', '077009001234', '+1 202 555 0100', 'seven']) assert.equal(normaliseUkMobile(bad), null, bad);
});

test('prize and bonus codes use an unambiguous alphabet and normalise from sloppy input', () => {
  let n = 0; const seq = max => (n++ * 7) % max;
  const prize = generateCode('prize', seq), bonus = generateCode('bonus', seq);
  assert.match(prize, PRIZE_CODE_RE);
  assert.match(bonus, BONUS_CODE_RE);
  assert.doesNotMatch(prize.slice(5) + bonus.slice(6), /[01ILO]/);
  assert.equal(normaliseCode(' coco 7k2p '), 'COCO-7K2P');
  assert.equal(normaliseCode('coco7k2p'), 'COCO-7K2P');
  assert.equal(normaliseCode('bonus-7k2p9q'), 'BONUS-7K2P9Q');
  assert.equal(normaliseCode('bonus 7k2p 9q'), 'BONUS-7K2P9Q');
  assert.equal(normaliseCode('7k2p9q'), 'BONUS-7K2P9Q'); // staff may hand out the sheet without the prefix
  assert.equal(normaliseCode('hello'), null);
});

test('staff session tokens are signed and expire', () => {
  const now = at('2026-09-26T10:00:00Z');
  const token = signStaffSession('secret', now);
  assert.equal(verifyStaffSession(token, 'secret', now), true);
  assert.equal(verifyStaffSession(token, 'other', now), false);
  assert.equal(verifyStaffSession(token.replace(/.$/, c => c === 'a' ? 'b' : 'a'), 'secret', now), false);
  assert.equal(verifyStaffSession(token, 'secret', at('2026-09-27T10:00:00Z')), false); // 12 h lifetime
  assert.equal(verifyStaffSession('', 'secret', now), false);
});

test('config: 7-day prize codes, 1 free spin a week, 1 re-spin max, 16+', () => {
  assert.equal(wheelConfig.prizeValidDays, 7);
  assert.equal(wheelConfig.freeSpinsPerWeek, 1);
  assert.equal(wheelConfig.maxRespins, 1);
  assert.equal(wheelConfig.minimumAge, 16);
});
