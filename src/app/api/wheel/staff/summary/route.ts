import type { NextRequest } from 'next/server';
import { weeklySummary } from '@/lib/wheel/service';
import { londonWeek } from '@/lib/wheel/core';
import { withStaff } from '@/lib/wheel/staff-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withStaff(req, async ({ ctx, demo }) => {
    const asked = req.nextUrl.searchParams.get('week') ?? '';
    const week = /^\d{4}-W\d{2}$/.test(asked) ? asked : londonWeek(ctx.now()).key;
    return Response.json({ ...(await weeklySummary(ctx, week)), demo }, { headers: { 'Cache-Control': 'no-store' } });
  });
}
