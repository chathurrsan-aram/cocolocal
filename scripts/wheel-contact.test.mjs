import test from 'node:test';
import assert from 'node:assert/strict';
import { detectContact, formatUkMobile } from '../src/lib/wheel/contact.ts';
import { normaliseEmail, normaliseUkMobile } from '../src/lib/wheel/core.ts';

test('an empty box is neither', () => {
  assert.deepEqual(detectContact(''), { kind: null, value: null, display: null });
  assert.deepEqual(detectContact('   '), { kind: null, value: null, display: null });
});

test('letters or @ mean email; normalised to lower case once complete', () => {
  assert.equal(detectContact('sam').kind, 'email');
  assert.equal(detectContact('sam@').value, null);
  assert.deepEqual(detectContact(' Sam@Example.co.uk '), { kind: 'email', value: 'sam@example.co.uk', display: 'sam@example.co.uk' });
});

test('digits mean mobile; every UK way of writing it normalises to E.164', () => {
  for (const raw of ['07700 900123', '07700900123', '+44 7700 900123', '0044 7700 900 123', '+44 (0)7700-900123']) {
    assert.deepEqual(detectContact(raw), { kind: 'mobile', value: '+447700900123', display: '07700 900123' }, raw);
  }
  assert.deepEqual(detectContact('0770'), { kind: 'mobile', value: null, display: null });
  assert.equal(detectContact('01702 123456').value, null, 'landlines are not accepted');
});

test('the client detector agrees with the server rules', () => {
  for (const raw of ['sam@example.com', 'bad@', '07700900123', '+447700900123', '0161 496 0000', 'x']) {
    const g = detectContact(raw);
    const server = g.kind === 'mobile' ? normaliseUkMobile(raw) : normaliseEmail(raw);
    assert.equal(g.value, server, raw);
  }
});

test('formatUkMobile', () => {
  assert.equal(formatUkMobile('+447911123456'), '07911 123456');
});
