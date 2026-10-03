import type { NextRequest } from 'next/server';
import { createBonusCodes } from '@/lib/wheel/service';
import { withStaff } from '@/lib/wheel/staff-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withStaff(req, async ({ ctx }) => {
    const { count } = await req.json().catch(() => ({ count: 0 }));
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 500) return Response.json({ ok: false, error: 'Choose between 1 and 500 codes' }, { status: 400 });
    return Response.json({ ok: true, codes: await createBonusCodes(ctx, n), createdAt: ctx.now().toISOString() });
  });
}
