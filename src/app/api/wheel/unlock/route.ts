import { NextResponse, type NextRequest } from 'next/server';
import { checkGatePassword, gateToken, GATE_COOKIE, GATE_DAYS } from '@/lib/wheel/gate';
import { gateRateLimit } from '@/lib/wheel/service';
import { wheelRuntime, clientIp, sameOrigin } from '@/lib/wheel/runtime';

export const dynamic = 'force-dynamic';

// A plain form POST from /wheel/unlock, so it works without JavaScript.
export async function POST(req: NextRequest) {
  const back = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  if (!sameOrigin(req)) return back('/wheel/unlock?error=1');
  const rt = wheelRuntime();
  if (rt && !(await gateRateLimit(rt.ctx, clientIp(req)))) return back('/wheel/unlock?error=busy');
  const form = await req.formData().catch(() => null);
  if (!(await checkGatePassword(String(form?.get('password') ?? '')))) return back('/wheel/unlock?error=1');
  const res = back('/wheel');
  res.cookies.set(GATE_COOKIE, await gateToken(), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GATE_DAYS * 86400 });
  return res;
}
