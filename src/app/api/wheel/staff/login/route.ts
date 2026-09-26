import { NextResponse, type NextRequest } from 'next/server';
import { checkStaffPin } from '@/lib/wheel/service';
import { signStaffSession } from '@/lib/wheel/core';
import { wheelRuntime, clientIp, sameOrigin, unavailable, STAFF_COOKIE } from '@/lib/wheel/runtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rt = wheelRuntime();
  if (!rt) return unavailable();
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (!rt.staffPin) return NextResponse.json({ ok: false, error: 'no-pin-set' }, { status: 503 });
  const { pin } = await req.json().catch(() => ({ pin: '' }));
  const check = await checkStaffPin(rt.ctx, String(pin ?? ''), rt.staffPin, clientIp(req));
  if (!check.ok) return NextResponse.json({ ok: false, error: check.locked ? 'locked' : 'wrong-pin' }, { status: check.locked ? 429 : 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, signStaffSession(rt.ctx.secret, rt.ctx.now()), { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 12 * 3600 });
  return res;
}
