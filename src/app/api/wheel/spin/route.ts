import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { spin } from '@/lib/wheel/service';
import { wheelRuntime, clientIp, sameOrigin, unavailable, DEVICE_COOKIE } from '@/lib/wheel/runtime';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = {
  'rate-limited': 429, 'invalid-name': 400, 'invalid-contact': 400, 'already-spun': 409, 'device-used': 409,
  'bonus-invalid': 400, 'bonus-used': 409, 'respin-invalid': 409,
};

export async function POST(req: NextRequest) {
  const rt = wheelRuntime();
  if (!rt) return unavailable();
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const deviceId = req.cookies.get(DEVICE_COOKIE)?.value || randomBytes(16).toString('base64url');
  const result = await spin(rt.ctx, {
    firstName: typeof body.firstName === 'string' ? body.firstName : undefined,
    contactType: body.contactType === 'mobile' ? 'mobile' : 'email',
    contact: typeof body.contact === 'string' ? body.contact : undefined,
    marketingOptIn: body.marketingOptIn === true,
    bonusCode: typeof body.bonusCode === 'string' && body.bonusCode.trim() ? body.bonusCode : undefined,
    respinToken: typeof body.respinToken === 'string' ? body.respinToken : undefined,
    deviceId, ip: clientIp(req),
  });
  const res = NextResponse.json({ ...result, demo: rt.demo }, { status: result.ok ? 200 : STATUS[result.error] ?? 400 });
  res.cookies.set(DEVICE_COOKIE, deviceId, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 400 * 86400 });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
