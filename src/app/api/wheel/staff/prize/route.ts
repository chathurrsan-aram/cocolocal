import type { NextRequest } from 'next/server';
import { lookupPrize, redeemPrize } from '@/lib/wheel/service';
import { withStaff } from '@/lib/wheel/staff-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withStaff(req, async ({ ctx }) => Response.json(await lookupPrize(ctx, req.nextUrl.searchParams.get('code') ?? '')));
}

export async function POST(req: NextRequest) {
  return withStaff(req, async ({ ctx }) => {
    const { code } = await req.json().catch(() => ({ code: '' }));
    return Response.json(await redeemPrize(ctx, String(code ?? '')));
  });
}
