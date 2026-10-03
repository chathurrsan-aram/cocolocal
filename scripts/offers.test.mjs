import test from 'node:test';
import assert from 'node:assert/strict';
import { activeOffers, standingPromos, offers, ALCOHOL_NOTE } from '../src/data/offers.ts';

const at = iso => Date.parse(iso);

test('September offers are shown during the campaign', () => {
  const ids = activeOffers(offers, at('2026-09-26T12:00:00+01:00')).map(o => o.id);
  assert.deepEqual(ids, ['yazoo', 'beer650', 'beer750', 'wine849', 'wine700', 'spirits']);
});

test('September offers disappear after 6 October 2026 (UK time)', () => {
  assert.equal(activeOffers(offers, at('2026-10-06T23:59:00+01:00')).length, 6);
  assert.equal(activeOffers(offers, at('2026-10-07T00:00:00+01:00')).length, 0);
});

test('YAZOO does not show before 9 September', () => {
  assert(!activeOffers(offers, at('2026-09-08T12:00:00+01:00')).some(o => o.id === 'yazoo'));
});

test('standing promos never expire', () => {
  assert.equal(activeOffers(standingPromos, at('2030-01-01T00:00:00Z')).length, standingPromos.length);
  assert.deepEqual(standingPromos.map(p => p.id), ['tuesday-10', 'slushie-friday', 'free-parking']);
});

test('every alcohol offer carries the 18+ line and every offer has text', () => {
  for (const o of [...offers, ...standingPromos]) {
    assert(o.title && o.headline && o.detail, `${o.id} missing copy`);
    if (o.alcohol) assert.equal(ALCOHOL_NOTE, '18+ · Please drink responsibly.');
  }
  assert.equal(offers.filter(o => o.alcohol).length, 5);
});
