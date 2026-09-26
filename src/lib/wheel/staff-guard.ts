import type { NextRequest } from 'next/server';
import { verifyStaffSession } from './core.ts';
import { wheelRuntime, STAFF_COOKIE, clientIp, sameOrigin, unavailable } from './runtime.ts';
import { staffRateLimit } from './service.ts';

/** Runs `handler` only for a signed-in, not-rate-limited staff member. */
export async function withStaff(req: NextRequest, handler: (rt: NonNullable<ReturnType<typeof wheelRuntime>>) => Promise<Response>) {
  const rt = wheelRuntime();
  if (!rt) return unavailable();
  if (req.method !== 'GET' && !sameOrigin(req)) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (!verifyStaffSession(req.cookies.get(STAFF_COOKIE)?.value, rt.ctx.secret, rt.ctx.now())) {
    return Response.json({ ok: false, error: 'signed-out' }, { status: 401 });
  }
  if (!(await staffRateLimit(rt.ctx, clientIp(req)))) return Response.json({ ok: false, error: 'rate-limited' }, { status: 429 });
  return handler(rt);
}
