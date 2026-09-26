// Pure Coco Wheel logic: odds, ISO weeks in UK time, contact normalisation and codes.
// No I/O here, so it can be unit-tested with `node --test` and reused by the API routes.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { outcomes as defaultOutcomes, segments as defaultSegments, wheelConfig } from '../../data/wheel.ts';
import type { Outcome, OutcomeId } from '../../data/wheel.ts';

/** Returns an integer in [0, max). In production this is crypto.randomInt. */
export type RandomInt = (max: number) => number;

const BASIS = 10000;

export function validateOdds(list: Outcome[] = defaultOutcomes, wheel: OutcomeId[] = defaultSegments) {
  const total = list.reduce((sum, o) => sum + Math.round(o.percent * 100), 0);
  if (total !== BASIS) throw new Error(`Wheel odds must add up to 100% (they add up to ${total / 100}%)`);
  for (const o of list) {
    if (!(o.percent >= 0)) throw new Error(`${o.id}: odds must be zero or more`);
    if (o.percent > 0 && !wheel.includes(o.id)) throw new Error(`${o.id} has odds but no slice on the wheel`);
  }
  for (const s of wheel) if (!list.some(o => o.id === s)) throw new Error(`Slice ${s} has no outcome`);
}

export function pickOutcome(randomInt: RandomInt, { respin = false } = {}, list: Outcome[] = defaultOutcomes): OutcomeId {
  // On a re-spin "Spin again" is not allowed; its share goes to "Not this time".
  const weights = list.map(o => ({ id: o.id, bp: Math.round(o.percent * 100) }));
  if (respin) {
    const again = weights.find(w => w.id === 'spin-again');
    const lose = weights.find(w => w.id === 'not-this-time');
    if (again && lose) { lose.bp += again.bp; again.bp = 0; }
  }
  const draw = randomInt(BASIS);
  let upTo = 0;
  for (const w of weights) {
    upTo += w.bp;
    if (draw < upTo) return w.id;
  }
  return 'not-this-time';
}

export function pickSegment(outcome: OutcomeId, randomInt: RandomInt, wheel: OutcomeId[] = defaultSegments) {
  const slots = wheel.flatMap((s, i) => (s === outcome ? [i] : []));
  if (!slots.length) throw new Error(`No slice for ${outcome}`);
  return slots[randomInt(slots.length)];
}

export { segmentAngle } from './geometry.ts';

// ---- ISO week in Europe/London ----

const londonParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: wheelConfig.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

function localFields(date: Date) {
  const p = Object.fromEntries(londonParts.formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Milliseconds London is ahead of UTC at this instant (0 in winter, 1 h in summer). */
function londonOffset(date: Date) {
  const f = localFields(date);
  return Date.UTC(f.y, f.m - 1, f.d, f.h, f.min, f.s) - Math.floor(date.getTime() / 1000) * 1000;
}

/** The UTC instant of 00:00 London time on the given calendar date. */
function londonMidnight(y: number, m: number, d: number) {
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - londonOffset(new Date(guess)));
}

export function londonWeek(now: Date) {
  const { y, m, d } = localFields(now);
  const day = new Date(Date.UTC(y, m - 1, d));
  const weekday = (day.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(day.getTime() - weekday * 864e5);
  // ISO week-year is the year of the week's Thursday.
  const thursday = new Date(monday.getTime() + 3 * 864e5);
  const isoYear = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(isoYear, 0, 1)) / (7 * 864e5)) + 1;
  const nextMonday = new Date(monday.getTime() + 7 * 864e5);
  return {
    key: `${isoYear}-W${String(week).padStart(2, '0')}`,
    start: londonMidnight(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate()),
    next: londonMidnight(nextMonday.getUTCFullYear(), nextMonday.getUTCMonth() + 1, nextMonday.getUTCDate()),
  };
}

// ---- Contact details ----

export function normaliseEmail(raw: string) {
  const email = String(raw ?? '').trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email) ? email : null;
}

export function normaliseUkMobile(raw: string) {
  let digits = String(raw ?? '').trim().replace(/\(0\)/g, '').replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `44${digits.slice(1)}`;
  return /^447\d{9}$/.test(digits) ? `+${digits}` : null;
}

// ---- Codes ----

// No 0/O, 1/I/L: easy to read out at the till.
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const PRIZE_CODE_RE = /^COCO-[2-9A-HJKMNP-Z]{4}$/;
export const BONUS_CODE_RE = /^BONUS-[2-9A-HJKMNP-Z]{6}$/;

export function generateCode(type: 'prize' | 'bonus', randomInt: RandomInt) {
  const length = type === 'prize' ? 4 : 6;
  let body = '';
  for (let i = 0; i < length; i++) body += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${type === 'prize' ? 'COCO' : 'BONUS'}-${body}`;
}

/** Accepts "coco 7k2p", "COCO7K2P", "bonus-7k2p9q" or a bare 6-character bonus code. */
export function normaliseCode(raw: string) {
  const compact = String(raw ?? '').toUpperCase().replace(/[\s-]/g, '');
  let code = null;
  if (compact.startsWith('COCO')) code = `COCO-${compact.slice(4)}`;
  else if (compact.startsWith('BONUS')) code = `BONUS-${compact.slice(5)}`;
  else if (compact.length === 6) code = `BONUS-${compact}`;
  return code && (PRIZE_CODE_RE.test(code) || BONUS_CODE_RE.test(code)) ? code : null;
}

// ---- Identity and staff sessions ----

export function hmac(secret: string, value: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/** Stable, non-reversible key for a person (so Redis keys never hold raw emails or numbers). */
export function identityKey(secret: string, contact: string) {
  return hmac(secret, `id:${contact}`).slice(0, 32);
}

const STAFF_SESSION_MS = 12 * 3600e3;

export function signStaffSession(secret: string, now: Date) {
  const expires = String(now.getTime() + STAFF_SESSION_MS);
  return `${expires}.${hmac(secret, `staff:${expires}`)}`;
}

export function verifyStaffSession(token: string | undefined, secret: string, now: Date) {
  const [expires, sig] = String(token ?? '').split('.');
  if (!expires || !sig || !(Number(expires) > now.getTime())) return false;
  const expected = Buffer.from(hmac(secret, `staff:${expires}`));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(hmac('cmp', a)), y = Buffer.from(hmac('cmp', b));
  return timingSafeEqual(x, y);
}
