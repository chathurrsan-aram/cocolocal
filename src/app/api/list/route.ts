// Shared ticks for the cash and carry list (public/list/index.html).
// Everyone with the page open reads and writes the same Redis hash, so two people
// shopping together can see what the other has already put in the trolley.
// Uses the same Upstash Redis as the wheel (KV_REST_API_URL + KV_REST_API_TOKEN).
// Without Redis the API answers 503 and the page keeps ticks on each phone instead.
import { Redis } from '@upstash/redis';
import { NextResponse, type NextRequest } from 'next/server';
import { ITEM_ID, ticksFromHash, type Ticks } from '@/lib/list/ticks';

export const dynamic = 'force-dynamic';

const KEY = 'coco:list:cash-and-carry:ticks';
const MAX_ITEMS = 120;
const WRITES_PER_MINUTE = 240;
const noStore = { 'Cache-Control': 'no-store' };

type Body =
  | { action: 'tick'; id: string; got: boolean }
  | { action: 'reset' }
  | { action: 'restore'; ticks: Ticks };

function redis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token, automaticDeserialization: false }) : null;
}

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: noStore });

async function readTicks(r: Redis): Promise<Ticks> {
  return ticksFromHash(await r.hgetall(KEY));
}

function parse(raw: unknown): Body | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (b.action === 'tick' && typeof b.id === 'string' && ITEM_ID.test(b.id) && typeof b.got === 'boolean') {
    return { action: 'tick', id: b.id, got: b.got };
  }
  if (b.action === 'reset') return { action: 'reset' };
  if (b.action === 'restore' && b.ticks && typeof b.ticks === 'object') {
    const entries = Object.entries(b.ticks as Record<string, unknown>);
    if (entries.length > MAX_ITEMS) return null;
    const ticks: Ticks = {};
    for (const [id, at] of entries) {
      if (!ITEM_ID.test(id)) return null;
      ticks[id] = typeof at === 'number' && Number.isFinite(at) ? at : Date.now();
    }
    return { action: 'restore', ticks };
  }
  return null;
}

/** Blocks cross-site POSTs: the Origin (when sent) must match this site. */
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return !origin || origin === req.nextUrl.origin;
}

function clientIp(req: NextRequest) {
  return (req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim().slice(0, 64);
}

export async function GET() {
  const r = redis();
  if (!r) return fail('unavailable', 503);
  try {
    return NextResponse.json({ ok: true, ticks: await readTicks(r) }, { headers: noStore });
  } catch {
    return fail('unavailable', 503);
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail('forbidden', 403);
  const r = redis();
  if (!r) return fail('unavailable', 503);
  let body: Body | null = null;
  try { body = parse(await req.json()); } catch { body = null; }
  if (!body) return fail('bad_request', 400);
  try {
    const limitKey = `coco:list:rate:${clientIp(req)}`;
    const [writes] = await r.multi().incr(limitKey).expire(limitKey, 60, 'NX').exec<[number, number]>();
    if (writes > WRITES_PER_MINUTE) return fail('slow_down', 429);

    if (body.action === 'tick') {
      if (body.got) await r.hsetnx(KEY, body.id, String(Date.now()));
      else await r.hdel(KEY, body.id);
    } else if (body.action === 'reset') {
      await r.del(KEY);
    } else {
      const tx = r.multi().del(KEY);
      const fields = Object.fromEntries(Object.entries(body.ticks).map(([id, at]) => [id, String(at)]));
      if (Object.keys(fields).length) tx.hset(KEY, fields);
      await tx.exec();
    }
    return NextResponse.json({ ok: true, ticks: await readTicks(r) }, { headers: noStore });
  } catch {
    return fail('unavailable', 503);
  }
}
