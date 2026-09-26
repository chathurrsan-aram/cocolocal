import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/lib/wheel/memory-store.ts';
import {
  spin, createBonusCodes, lookupPrize, redeemPrize, weeklySummary, winsCsv, checkStaffPin, deleteEntrant,
} from '../src/lib/wheel/service.ts';

// A tiny harness: a clock we can move, a memory store that honours expiry on that clock,
// and a scripted "random" source so each test decides the outcome.
function harness(start = '2026-09-26T10:00:00Z') {
  let now = new Date(start);
  const draws = [];
  let seed = 42; // small seeded LCG so codes and slices vary but tests stay repeatable
  const prng = max => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % max; };
  const ctx = {
    store: new MemoryStore(() => now),
    now: () => now,
    // Tests push basis-point draws for pickOutcome (unscripted spins lose); everything else is the PRNG.
    randomInt: max => (max === 10000 ? (draws.length ? draws.shift() : 9000) : prng(max)),
    secret: 'test-secret',
  };
  return { ctx, draws, advance: ms => { now = new Date(now.getTime() + ms); }, set: iso => { now = new Date(iso); } };
}
const HOUR = 3600e3, DAY = 24 * HOUR;
const WIN = 0, SPIN_AGAIN = 1500, LOSE = 9000; // first prize in config / spin again / not this time
const entry = (over = {}) => ({ firstName: 'Sam', contactType: 'email', contact: 'sam@example.com', marketingOptIn: false, deviceId: 'dev-1', ip: '1.1.1.1', ...over });

test('first free spin works; a second one in the same ISO week is refused with the unlock time', async () => {
  const { ctx, draws } = harness();
  draws.push(LOSE, LOSE);
  const first = await spin(ctx, entry());
  assert.equal(first.ok, true);
  assert.equal(first.spinType, 'free');
  assert.equal(first.outcome, 'not-this-time');
  const again = await spin(ctx, entry({ contact: ' SAM@Example.com ' })); // same person, sloppy input
  assert.equal(again.ok, false);
  assert.equal(again.error, 'already-spun');
  assert.equal(again.nextFreeSpinAt, '2026-09-27T23:00:00.000Z');
});

test('free spin unlocks again on Monday 00:00 UK time', async () => {
  const { ctx, draws, set } = harness();
  draws.push(LOSE, LOSE, LOSE);
  assert.equal((await spin(ctx, entry())).ok, true);
  set('2026-09-27T22:59:00Z');
  assert.equal((await spin(ctx, entry())).ok, false);
  set('2026-09-27T23:00:00Z');
  assert.equal((await spin(ctx, entry())).ok, true);
});

test('light device check: a second identity on the same device is refused this week', async () => {
  const { ctx, draws } = harness();
  draws.push(LOSE, LOSE, LOSE);
  assert.equal((await spin(ctx, entry())).ok, true);
  const other = await spin(ctx, entry({ contact: 'alex@example.com' }));
  assert.equal(other.ok, false);
  assert.equal(other.error, 'device-used');
  // A different device with a different person is fine.
  assert.equal((await spin(ctx, entry({ contact: 'alex@example.com', deviceId: 'dev-2' }))).ok, true);
});

test('mobile numbers are the same person however they are typed', async () => {
  const { ctx, draws } = harness();
  draws.push(LOSE, LOSE);
  assert.equal((await spin(ctx, entry({ contactType: 'mobile', contact: '07700 900123' }))).ok, true);
  const again = await spin(ctx, entry({ contactType: 'mobile', contact: '+44 7700 900123', deviceId: 'dev-9' }));
  assert.equal(again.error, 'already-spun');
});

test('invalid details are rejected before anything is stored', async () => {
  const { ctx } = harness();
  assert.equal((await spin(ctx, entry({ firstName: ' ' }))).error, 'invalid-name');
  assert.equal((await spin(ctx, entry({ firstName: 'x'.repeat(41) }))).error, 'invalid-name');
  assert.equal((await spin(ctx, entry({ contact: 'nope' }))).error, 'invalid-contact');
  assert.equal((await spin(ctx, entry({ contactType: 'mobile', contact: '01702 123456' }))).error, 'invalid-contact');
  assert.equal((await spin(ctx, entry())).ok, true); // nothing was used up by the failures
});

test('bonus code gives exactly one extra spin and cannot be reused', async () => {
  const { ctx, draws } = harness();
  const [code] = await createBonusCodes(ctx, 1);
  draws.push(LOSE, LOSE, LOSE);
  assert.equal((await spin(ctx, entry())).spinType, 'free');
  const bonus = await spin(ctx, entry({ bonusCode: code.toLowerCase().replace('-', ' ') }));
  assert.equal(bonus.ok, true);
  assert.equal(bonus.spinType, 'bonus');
  const reuse = await spin(ctx, entry({ bonusCode: code }));
  assert.equal(reuse.error, 'bonus-used');
  const madeUp = await spin(ctx, entry({ bonusCode: 'BONUS-ZZZZZZ' }));
  assert.equal(madeUp.error, 'bonus-invalid');
});

test('with a free spin still available, the free spin is used first and the bonus code is kept', async () => {
  const { ctx, draws } = harness();
  const [code] = await createBonusCodes(ctx, 1);
  draws.push(LOSE, LOSE);
  const first = await spin(ctx, entry({ bonusCode: code }));
  assert.equal(first.spinType, 'free');
  assert.equal(first.bonusStillAvailable, true);
  assert.equal((await spin(ctx, entry({ bonusCode: code }))).spinType, 'bonus');
});

test('bonus codes expire after the configured days', async () => {
  const { ctx, draws, advance } = harness();
  const [code] = await createBonusCodes(ctx, 1);
  draws.push(LOSE, LOSE);
  await spin(ctx, entry());
  advance(31 * DAY);
  await spin(ctx, entry()); // new week's free spin
  assert.equal((await spin(ctx, entry({ bonusCode: code }))).error, 'bonus-invalid');
});

test('bonus batches are unique and capped', async () => {
  const { ctx } = harness();
  const codes = await createBonusCodes(ctx, 50);
  assert.equal(new Set(codes).size, 50);
  await assert.rejects(createBonusCodes(ctx, 501), /1 and 500/);
});

test('a win issues a 7-day prize code that can be redeemed exactly once', async () => {
  const { ctx, draws, advance } = harness();
  draws.push(WIN);
  const win = await spin(ctx, entry());
  assert.equal(win.ok, true);
  assert.match(win.prize.code, /^COCO-[2-9A-HJKMNP-Z]{4}$/);
  assert.equal(win.prize.expiresAt, '2026-10-03T10:00:00.000Z');
  assert.equal((await lookupPrize(ctx, win.prize.code.toLowerCase())).status, 'valid');
  advance(2 * DAY);
  assert.equal((await redeemPrize(ctx, win.prize.code)).status, 'redeemed-now');
  assert.equal((await redeemPrize(ctx, win.prize.code)).status, 'already-redeemed');
  assert.equal((await lookupPrize(ctx, win.prize.code)).status, 'redeemed');
});

test('an expired prize code cannot be redeemed; an unknown one is not found', async () => {
  const { ctx, draws, advance } = harness();
  draws.push(WIN);
  const win = await spin(ctx, entry());
  advance(7 * DAY + 1000);
  assert.equal((await lookupPrize(ctx, win.prize.code)).status, 'expired');
  assert.equal((await redeemPrize(ctx, win.prize.code)).status, 'expired');
  assert.equal((await lookupPrize(ctx, 'COCO-ZZZZ')).status, 'not-found');
  assert.equal((await lookupPrize(ctx, 'rubbish')).status, 'not-found');
});

test('spin again gives one single-use re-spin that can never land on spin again', async () => {
  const { ctx, draws } = harness();
  draws.push(SPIN_AGAIN, SPIN_AGAIN);
  const first = await spin(ctx, entry());
  assert.equal(first.outcome, 'spin-again');
  assert.ok(first.respinToken);
  const second = await spin(ctx, { respinToken: first.respinToken, deviceId: 'dev-1', ip: '1.1.1.1' });
  assert.equal(second.ok, true);
  assert.equal(second.spinType, 'respin');
  assert.equal(second.outcome, 'not-this-time');
  assert.equal(second.respinToken, undefined);
  const replay = await spin(ctx, { respinToken: first.respinToken, deviceId: 'dev-1', ip: '1.1.1.1' });
  assert.equal(replay.error, 'respin-invalid');
});

test('the server picks a landing slice that matches the outcome', async () => {
  const { ctx, draws } = harness();
  const { segments } = await import('../src/data/wheel.ts');
  draws.push(WIN);
  const win = await spin(ctx, entry());
  assert.equal(segments[win.segment], win.outcome);
  assert.ok(win.landing >= 0.2 && win.landing <= 0.8);
});

test('spins are rate limited per IP', async () => {
  const { ctx } = harness();
  const results = [];
  for (let i = 0; i < 12; i++) results.push(await spin(ctx, entry({ contact: `p${i}@example.com`, deviceId: `d${i}` })));
  assert.equal(results.filter(r => r.error === 'rate-limited').length, 4); // 8 per minute
});

test('weekly summary counts spins, wins by prize and redemptions; CSV has no personal data', async () => {
  const { ctx, draws } = harness();
  const [code] = await createBonusCodes(ctx, 1);
  draws.push(WIN, LOSE, SPIN_AGAIN, LOSE);
  const win = await spin(ctx, entry());
  await spin(ctx, entry({ bonusCode: code }));
  const sa = await spin(ctx, entry({ contact: 'b@example.com', deviceId: 'd2', marketingOptIn: true }));
  await spin(ctx, { respinToken: sa.respinToken, deviceId: 'd2', ip: '1.1.1.1' });
  await redeemPrize(ctx, win.prize.code);
  const s = await weeklySummary(ctx);
  assert.equal(s.week, '2026-W39');
  assert.deepEqual({ spins: s.spins, free: s.free, bonus: s.bonus, respin: s.respin }, { spins: 4, free: 2, bonus: 1, respin: 1 });
  assert.equal(s.wins[win.outcome], 1);
  assert.equal(s.redeemed[win.outcome], 1);
  assert.equal(s.bonusIssued, 1);
  assert.equal(s.optIns, 1);
  const csv = await winsCsv(ctx);
  assert.match(csv, /^code,prize,won_at,expires_at,redeemed_at\n/);
  assert.match(csv, new RegExp(win.prize.code));
  assert.doesNotMatch(csv, /Sam|example\.com/);
});

test('staff PIN: correct PIN passes, 5 wrong tries lock that IP out for 15 minutes', async () => {
  const { ctx, advance } = harness();
  assert.equal((await checkStaffPin(ctx, '2468', '2468', '9.9.9.9')).ok, true);
  for (let i = 0; i < 5; i++) assert.equal((await checkStaffPin(ctx, '0000', '2468', '9.9.9.9')).ok, false);
  const locked = await checkStaffPin(ctx, '2468', '2468', '9.9.9.9');
  assert.equal(locked.ok, false);
  assert.equal(locked.locked, true);
  assert.equal((await checkStaffPin(ctx, '2468', '2468', '8.8.8.8')).ok, true);
  advance(16 * 60e3);
  assert.equal((await checkStaffPin(ctx, '2468', '2468', '9.9.9.9')).ok, true);
});

test('deleting an entrant removes their stored details (privacy request)', async () => {
  const { ctx, draws } = harness();
  draws.push(LOSE);
  await spin(ctx, entry({ marketingOptIn: true }));
  assert.equal(await deleteEntrant(ctx, 'email', 'SAM@example.com'), true);
  assert.equal(await deleteEntrant(ctx, 'email', 'sam@example.com'), false);
});
