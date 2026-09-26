import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { deviceStatus } from '@/lib/wheel/service';
import { wheelRuntime, deviceCookie, DEVICE_COOKIE } from '@/lib/wheel/runtime';

export const dynamic = 'force-dynamic';

// Called on page load. Sets the device cookie before any spin, so a spin whose response is
// lost can still be recovered from here (the latest result is kept per device).
export async function GET(req: NextRequest) {
  const rt = wheelRuntime();
  if (!rt) return NextResponse.json({ available: false });
  const existing = req.cookies.get(DEVICE_COOKIE)?.value;
  const device = existing || randomBytes(16).toString('base64url');
  const res = NextResponse.json({ available: true, demo: rt.demo, ...(await deviceStatus(rt.ctx, device)) }, { headers: { 'Cache-Control': 'no-store' } });
  if (!existing) res.cookies.set(deviceCookie(device));
  return res;
}
