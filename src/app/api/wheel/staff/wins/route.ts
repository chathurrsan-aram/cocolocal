import type { NextRequest } from 'next/server';
import { winsCsv } from '@/lib/wheel/service';
import { withStaff } from '@/lib/wheel/staff-guard';

export const dynamic = 'force-dynamic';

// Wins only (code, prize, dates). No names, emails or numbers: there is no customer-list export in v1.
export async function GET(req: NextRequest) {
  return withStaff(req, async ({ ctx }) => new Response(await winsCsv(ctx), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="coco-wheel-wins.csv"', 'Cache-Control': 'no-store' },
  }));
}
