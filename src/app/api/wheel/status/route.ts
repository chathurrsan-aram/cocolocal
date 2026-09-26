import { NextResponse, type NextRequest } from 'next/server';
import { deviceStatus } from '@/lib/wheel/service';
import { londonWeek } from '@/lib/wheel/core';
import { wheelRuntime, DEVICE_COOKIE } from '@/lib/wheel/runtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rt = wheelRuntime();
  if (!rt) return NextResponse.json({ available: false });
  const device = req.cookies.get(DEVICE_COOKIE)?.value;
  const status = device ? await deviceStatus(rt.ctx, device) : { freeSpinUsed: false, nextFreeSpinAt: londonWeek(rt.ctx.now()).next.toISOString() };
  return NextResponse.json({ available: true, demo: rt.demo, ...status }, { headers: { 'Cache-Control': 'no-store' } });
}
