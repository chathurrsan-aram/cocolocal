// Server-only wiring: picks the store, secret and RNG for the API routes.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   KV_REST_API_URL + KV_REST_API_TOKEN   added automatically by the Upstash Redis Marketplace integration
//     (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN also work)
//   WHEEL_SECRET      long random string; signs staff sessions and hashes contact details in keys
//   WHEEL_STAFF_PIN   the PIN for /wheel/staff
//
// Without Redis, preview/development deployments run in DEMO MODE: an in-memory store
// (nothing is kept; each server instance has its own copy) and staff PIN 2468.
// Production never falls back: without Redis and a secret the wheel returns 503.
import { randomInt } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { MemoryStore } from './memory-store.ts';
import { RedisStore } from './redis-store.ts';
import type { WheelContext } from './service.ts';

export const DEVICE_COOKIE = 'coco_wheel_device';
export const STAFF_COOKIE = 'coco_wheel_staff';
const DEMO_PIN = '2468';

const isProduction = () => process.env.VERCEL_ENV === 'production' || (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production' && !process.env.WHEEL_ALLOW_DEMO);

export function wheelRuntime(): { ctx: WheelContext; demo: boolean; staffPin: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  const secret = process.env.WHEEL_SECRET;
  const now = () => new Date();
  if (url && token && secret) {
    return { ctx: { store: new RedisStore(url, token), now, randomInt, secret }, demo: false, staffPin: process.env.WHEEL_STAFF_PIN ?? '' };
  }
  if (isProduction()) return null;
  const g = globalThis as unknown as { __cocoWheelDemo?: MemoryStore };
  g.__cocoWheelDemo ??= new MemoryStore(now);
  return { ctx: { store: g.__cocoWheelDemo, now, randomInt, secret: secret ?? 'demo-mode-secret' }, demo: true, staffPin: process.env.WHEEL_STAFF_PIN ?? DEMO_PIN };
}

export function clientIp(req: NextRequest) {
  return (req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim().slice(0, 64);
}

/** Blocks cross-site POSTs: the Origin (when sent) must match this site. */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return !origin || origin === req.nextUrl.origin;
}

export const unavailable = () => Response.json({ ok: false, error: 'unavailable' }, { status: 503 });
