import { NextResponse, type NextRequest } from 'next/server';
import { GATE_COOKIE, gateToken } from '@/lib/wheel/gate';

// The Coco Wheel is password-protected for now (see src/lib/wheel/gate.ts).
// The page sends people to /wheel/unlock; the spin and status APIs refuse without the cookie.
// Staff tools (/wheel/staff, PIN-protected) and the terms and privacy pages stay reachable.
export async function middleware(req: NextRequest) {
  if (req.cookies.get(GATE_COOKIE)?.value === (await gateToken())) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'locked' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/wheel/unlock';
  url.search = '';
  return NextResponse.redirect(url, 307);
}

export const config = { matcher: ['/wheel', '/api/wheel/spin', '/api/wheel/status'] };
