// Coco Wheel rules on top of a WheelStore. Every decision (who may spin, the outcome,
// codes) is made here, on the server, before the browser animates anything.
import { randomBytes } from 'node:crypto';
import { outcomes, segments, wheelConfig } from '../../data/wheel.ts';
import type { OutcomeId } from '../../data/wheel.ts';
import type { WheelStore } from './store.ts';
import {
  pickOutcome, pickSegment, londonWeek, normaliseEmail, normaliseUkMobile, generateCode, normaliseCode,
  identityKey, safeEqual, PRIZE_CODE_RE, BONUS_CODE_RE,
} from './core.ts';
import type { RandomInt } from './core.ts';

export type WheelContext = { store: WheelStore; now: () => Date; randomInt: RandomInt; secret: string };

export type SpinInput = {
  firstName?: string; contactType?: 'email' | 'mobile'; contact?: string; marketingOptIn?: boolean;
  bonusCode?: string; respinToken?: string; deviceId: string; ip: string;
};

export type SpinError = 'rate-limited' | 'invalid-name' | 'invalid-contact' | 'already-spun' | 'device-used'
  | 'bonus-invalid' | 'bonus-used' | 'respin-invalid';

export type SpinSuccess = {
  ok: true; spinType: 'free' | 'bonus' | 'respin'; outcome: OutcomeId; segment: number; landing: number;
  prize?: { code: string; label: string; claim?: string; expiresAt: string };
  respinToken?: string; bonusStillAvailable?: boolean; nextFreeSpinAt: string; firstName: string;
};
export type SpinResult = SpinSuccess | { ok: false; error: SpinError; nextFreeSpinAt?: string };

const DAY = 86400;
const K = {
  free: (week: string, id: string) => `wheel:free:${week}:${id}`,
  device: (week: string, device: string) => `wheel:dev:${week}:${device}`,
  entrant: (id: string) => `wheel:entrant:${id}`,
  bonus: (code: string) => `wheel:bonus:${code}`,
  bonusUsed: (code: string) => `wheel:bonus-used:${code}`,
  prize: (code: string) => `wheel:prize:${code}`,
  redeemed: (code: string) => `wheel:redeemed:${code}`,
  respin: (token: string) => `wheel:respin:${token}`,
  stats: (week: string) => `wheel:stats:${week}`,
  wins: 'wheel:wins',
  rate: (name: string, who: string, window: number) => `wheel:rl:${name}:${who}:${window}`,
  staffFail: (ip: string) => `wheel:staff-fail:${ip}`,
};

async function rateLimit(ctx: WheelContext, name: string, who: string, limit: number, windowSec = 60) {
  const window = Math.floor(ctx.now().getTime() / 1000 / windowSec);
  return (await ctx.store.incr(K.rate(name, who, window), windowSec + 5)) <= limit;
}

async function stat(ctx: WheelContext, field: string, week = londonWeek(ctx.now()).key) {
  await ctx.store.hincrby(K.stats(week), field, 1, 400 * DAY);
}

function contactFrom(type: SpinInput['contactType'], raw: string | undefined) {
  if (type === 'email') return normaliseEmail(raw ?? '');
  if (type === 'mobile') return normaliseUkMobile(raw ?? '');
  return null;
}

export async function spin(ctx: WheelContext, input: SpinInput): Promise<SpinResult> {
  if (!(await rateLimit(ctx, 'spin', input.ip, wheelConfig.spinsPerIpPerMinute))) return { ok: false, error: 'rate-limited' };
  const week = londonWeek(ctx.now());
  const nextFreeSpinAt = week.next.toISOString();

  // Second turn after landing on "Spin again": the token is consumed exactly once.
  if (input.respinToken) {
    const key = K.respin(String(input.respinToken));
    const saved = await ctx.store.get(key);
    if (!saved || (await ctx.store.del(key)) !== 1) return { ok: false, error: 'respin-invalid' };
    const { firstName } = JSON.parse(saved);
    await stat(ctx, 'spins:respin');
    return finish(ctx, pickOutcome(ctx.randomInt, { respin: true }), 'respin', firstName, nextFreeSpinAt);
  }

  const firstName = String(input.firstName ?? '').trim().replace(/\s+/g, ' ');
  if (!firstName || firstName.length > 40 || !/^[\p{L}\p{M}' .-]+$/u.test(firstName)) return { ok: false, error: 'invalid-name' };
  const contact = contactFrom(input.contactType, input.contact);
  if (!contact) return { ok: false, error: 'invalid-contact' };
  const id = identityKey(ctx.secret, contact);
  const bonusCode = input.bonusCode ? normaliseCode(input.bonusCode) : null;

  // Free weekly spin first; a bonus code is only consumed once the free spin is used.
  const freeKey = K.free(week.key, id), deviceKey = K.device(week.key, String(input.deviceId).slice(0, 64));
  const deviceOwner = await ctx.store.get(deviceKey);
  const personUsed = Boolean(await ctx.store.get(freeKey));
  let spinType: 'free' | 'bonus';
  let bonusStillAvailable: boolean | undefined;
  if (!personUsed && (!deviceOwner || deviceOwner === id) && (await ctx.store.set(freeKey, '1', { nx: true, ex: 8 * DAY }))) {
    await ctx.store.set(deviceKey, id, { ex: 8 * DAY });
    spinType = 'free';
    if (bonusCode && BONUS_CODE_RE.test(bonusCode)) bonusStillAvailable = Boolean(await ctx.store.get(K.bonus(bonusCode)));
  } else if (input.bonusCode) {
    if (!bonusCode || !BONUS_CODE_RE.test(bonusCode)) return { ok: false, error: 'bonus-invalid' };
    if ((await ctx.store.del(K.bonus(bonusCode))) !== 1) {
      return { ok: false, error: (await ctx.store.get(K.bonusUsed(bonusCode))) ? 'bonus-used' : 'bonus-invalid' };
    }
    await ctx.store.set(K.bonusUsed(bonusCode), ctx.now().toISOString(), { ex: wheelConfig.bonusValidDays * DAY });
    await stat(ctx, 'bonus:used');
    spinType = 'bonus';
  } else {
    return { ok: false, error: personUsed || !deviceOwner ? 'already-spun' : 'device-used', nextFreeSpinAt };
  }

  await saveEntrant(ctx, id, { firstName, contactType: input.contactType!, contact, marketingOptIn: Boolean(input.marketingOptIn) });
  await stat(ctx, `spins:${spinType}`);
  const result = await finish(ctx, pickOutcome(ctx.randomInt), spinType, firstName, nextFreeSpinAt);
  if (bonusStillAvailable) result.bonusStillAvailable = true;
  return result;
}

async function finish(ctx: WheelContext, outcome: OutcomeId, spinType: SpinSuccess['spinType'], firstName: string, nextFreeSpinAt: string) {
  await stat(ctx, 'spins');
  await stat(ctx, `outcome:${outcome}`);
  const result: SpinSuccess = {
    ok: true, spinType, outcome, firstName, nextFreeSpinAt,
    segment: pickSegment(outcome, ctx.randomInt),
    landing: 0.2 + ctx.randomInt(601) / 1000,
  };
  const info = outcomes.find(o => o.id === outcome)!;
  if (info.kind === 'prize') result.prize = await issuePrize(ctx, outcome, firstName);
  if (info.kind === 'spin-again' && spinType !== 'respin') {
    result.respinToken = randomBytes(18).toString('base64url');
    await ctx.store.set(K.respin(result.respinToken), JSON.stringify({ firstName }), { ex: 15 * 60 });
  }
  return result;
}

async function issuePrize(ctx: WheelContext, outcome: OutcomeId, firstName: string) {
  const info = outcomes.find(o => o.id === outcome)!;
  const issuedAt = ctx.now();
  const expiresAt = new Date(issuedAt.getTime() + wheelConfig.prizeValidDays * DAY * 1000);
  const record = { outcome, label: info.label, firstName, issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString() };
  const ttl = (wheelConfig.prizeValidDays + wheelConfig.prizeRecordGraceDays) * DAY;
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateCode('prize', ctx.randomInt);
    if (await ctx.store.set(K.prize(code), JSON.stringify({ code, ...record }), { nx: true, ex: ttl })) {
      await ctx.store.rpush(K.wins, JSON.stringify({ code, outcome, wonAt: record.issuedAt, expiresAt: record.expiresAt }));
      return { code, label: info.label, claim: info.claim, expiresAt: record.expiresAt };
    }
  }
  throw new Error('Could not allocate a unique prize code');
}

async function saveEntrant(ctx: WheelContext, id: string, details: { firstName: string; contactType: string; contact: string; marketingOptIn: boolean }) {
  const key = K.entrant(id);
  const previous = JSON.parse((await ctx.store.get(key)) ?? 'null');
  const now = ctx.now().toISOString();
  // Opt-in is only ever added here; withdrawing is done on request (see the privacy notice).
  const optInAt = previous?.optInAt ?? (details.marketingOptIn ? now : null);
  if (optInAt && !previous?.optInAt) await stat(ctx, 'optins');
  const record = { ...details, marketingOptIn: Boolean(optInAt), optInAt, firstSeen: previous?.firstSeen ?? now, lastSpin: now };
  // Retention: details expire 12 months after the latest spin.
  await ctx.store.set(key, JSON.stringify(record), { ex: Math.round(wheelConfig.retentionMonths * 30.44 * DAY) });
}

export async function deleteEntrant(ctx: WheelContext, contactType: 'email' | 'mobile', raw: string) {
  const contact = contactFrom(contactType, raw);
  return contact ? (await ctx.store.del(K.entrant(identityKey(ctx.secret, contact)))) === 1 : false;
}

// ---- Status for returning visitors (by device cookie only — never reveals whether an email has played) ----

export async function deviceStatus(ctx: WheelContext, deviceId: string) {
  const week = londonWeek(ctx.now());
  const used = Boolean(await ctx.store.get(K.device(week.key, String(deviceId).slice(0, 64))));
  return { freeSpinUsed: used, nextFreeSpinAt: week.next.toISOString() };
}

// ---- Staff ----

export async function createBonusCodes(ctx: WheelContext, count: number) {
  if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error('Choose between 1 and 500 codes');
  const now = ctx.now();
  const expiresAt = new Date(now.getTime() + wheelConfig.bonusValidDays * DAY * 1000).toISOString();
  const codes: string[] = [];
  let attempts = 0;
  while (codes.length < count) {
    if (attempts++ > count * 20) throw new Error('Could not allocate unique bonus codes');
    const code = generateCode('bonus', ctx.randomInt);
    if (await ctx.store.get(K.bonusUsed(code))) continue;
    if (await ctx.store.set(K.bonus(code), JSON.stringify({ createdAt: now.toISOString(), expiresAt }), { nx: true, ex: wheelConfig.bonusValidDays * DAY })) {
      codes.push(code);
      await stat(ctx, 'bonus:issued');
    }
  }
  return codes;
}

type PrizeRecord = { code: string; outcome: OutcomeId; label: string; firstName: string; issuedAt: string; expiresAt: string };
export type PrizeLookup =
  | { status: 'not-found' }
  | { status: 'valid' | 'expired' | 'redeemed'; prize: PrizeRecord; redeemedAt?: string };

export async function lookupPrize(ctx: WheelContext, raw: string): Promise<PrizeLookup> {
  const code = normaliseCode(raw);
  if (!code || !PRIZE_CODE_RE.test(code)) return { status: 'not-found' };
  const saved = await ctx.store.get(K.prize(code));
  if (!saved) return { status: 'not-found' };
  const prize: PrizeRecord = JSON.parse(saved);
  const redeemedAt = await ctx.store.get(K.redeemed(code));
  if (redeemedAt) return { status: 'redeemed', prize, redeemedAt };
  return { status: Date.parse(prize.expiresAt) <= ctx.now().getTime() ? 'expired' : 'valid', prize };
}

export async function redeemPrize(ctx: WheelContext, raw: string) {
  const found = await lookupPrize(ctx, raw);
  if (found.status === 'not-found' || found.status === 'expired') return found;
  if (found.status === 'redeemed') return { ...found, status: 'already-redeemed' as const };
  const at = ctx.now().toISOString();
  const ttl = (wheelConfig.prizeValidDays + wheelConfig.prizeRecordGraceDays) * DAY;
  if (!(await ctx.store.set(K.redeemed(found.prize.code), at, { nx: true, ex: ttl }))) {
    return { ...found, status: 'already-redeemed' as const, redeemedAt: (await ctx.store.get(K.redeemed(found.prize.code))) ?? undefined };
  }
  await stat(ctx, `redeemed:${found.prize.outcome}`);
  return { ...found, status: 'redeemed-now' as const, redeemedAt: at };
}

export async function weeklySummary(ctx: WheelContext, weekKey = londonWeek(ctx.now()).key) {
  const raw = await ctx.store.hgetall(K.stats(weekKey));
  const n = (field: string) => Number(raw[field] ?? 0);
  const by = (prefix: string) => Object.fromEntries(outcomes.filter(o => o.kind === 'prize').map(o => [o.id, n(`${prefix}:${o.id}`)]));
  return {
    week: weekKey, spins: n('spins'), free: n('spins:free'), bonus: n('spins:bonus'), respin: n('spins:respin'),
    wins: by('outcome'), redeemed: by('redeemed'), spinAgain: n('outcome:spin-again'), notThisTime: n('outcome:not-this-time'),
    bonusIssued: n('bonus:issued'), bonusUsed: n('bonus:used'), optIns: n('optins'),
  };
}

export async function winsCsv(ctx: WheelContext) {
  const wins = (await ctx.store.lrange(K.wins, 0, -1)).map(w => JSON.parse(w));
  const redeemed = wins.length ? await ctx.store.mget(wins.map(w => K.redeemed(w.code))) : [];
  const label = (id: string) => outcomes.find(o => o.id === id)?.label ?? id;
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const rows = wins.map((w, i) => [w.code, label(w.outcome), w.wonAt, w.expiresAt, redeemed[i] ?? ''].map(cell).join(','));
  return ['code,prize,won_at,expires_at,redeemed_at', ...rows].join('\n') + '\n';
}

export async function checkStaffPin(ctx: WheelContext, pin: string, expected: string, ip: string) {
  const failKey = K.staffFail(ip);
  if (Number((await ctx.store.get(failKey)) ?? 0) >= 5) return { ok: false, locked: true };
  if (expected && safeEqual(String(pin ?? ''), expected)) return { ok: true, locked: false };
  const fails = await ctx.store.incr(failKey, 15 * 60);
  return { ok: false, locked: fails >= 5 };
}

export async function staffRateLimit(ctx: WheelContext, ip: string) {
  return rateLimit(ctx, 'staff', ip, wheelConfig.staffLookupsPerIpPerMinute);
}

export { segments };
