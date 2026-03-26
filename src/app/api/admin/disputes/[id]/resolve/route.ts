/**
 * POST /api/admin/disputes/[id]/resolve - حل المنازعة (للمدير)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService } from '@/features/disputes/infrastructure/dispute-service';
import { DisputeDecision } from '@/core/types/enums';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null;
}

/**
 * POST /api/admin/disputes/[id]/resolve
 * حل المنازعة (للمدير فقط)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - للمديرين فقط' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.decision || !body.reason) {
      return NextResponse.json(
        { error: 'القرار والسبب مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من صحة القرار
    const validDecisions = ['BUYER_FAVOR', 'PROVIDER_FAVOR', 'SPLIT', 'NO_ACTION'];
    if (!validDecisions.includes(body.decision)) {
      return NextResponse.json(
        { error: 'قرار غير صالح' },
        { status: 400 }
      );
    }

    // حل المنازعة
    const updated = await DisputeService.resolveDispute(
      id,
      user.id,
      body.decision as DisputeDecision,
      body.reason,
      body.splitAmount
    );

    return NextResponse.json({ 
      dispute: updated,
      message: 'تم حل المنازعة بنجاح' 
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حل المنازعة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
