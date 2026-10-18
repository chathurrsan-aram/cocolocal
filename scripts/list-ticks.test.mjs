import test from 'node:test';
import assert from 'node:assert/strict';
import { ticksFromHash } from '../src/lib/list/ticks.ts';

// The list's Redis client runs with automaticDeserialization off, which returns HGETALL
// as a flat array. Reading that as an object made every tick look missing, so the page
// unticked each item straight after it was ticked.
test('reads the flat field/value array that HGETALL returns without deserialisation', () => {
  assert.deepEqual(ticksFromHash(['i27', '1792326000000', 'i05', '1792326100000']), { i27: 1792326000000, i05: 1792326100000 });
});

test('reads the object shape too', () => {
  assert.deepEqual(ticksFromHash({ i27: 1792326000000, i05: '1792326100000' }), { i27: 1792326000000, i05: 1792326100000 });
});

test('ignores fields that are not list items and a dangling field', () => {
  assert.deepEqual(ticksFromHash(['i27', '1', 'spins', '4', 'i99x', '2', 'i30']), { i27: 1 });
});

test('an empty or missing hash means nothing is ticked', () => {
  assert.deepEqual(ticksFromHash(null), {});
  assert.deepEqual(ticksFromHash([]), {});
  assert.deepEqual(ticksFromHash({}), {});
});

test('a tick with an unreadable time still counts, stamped now', () => {
  assert.deepEqual(ticksFromHash(['i10', 'not-a-time'], 42), { i10: 42 });
});
