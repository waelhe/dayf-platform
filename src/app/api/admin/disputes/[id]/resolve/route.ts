/**
 * POST /api/admin/disputes/[id]/resolve
 * حل المنازعة (للمدير فقط)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService } from '@/features/disputes/infrastructure/dispute-service';
import { DisputeDecision } from '@/core/types/enums';
import { requireAdmin, AuthError } from '@/lib/auth/middleware';
import { z } from 'zod';

// Zod validation schema
const resolveDisputeSchema = z.object({
  decision: z.enum(['BUYER_FAVOR', 'PROVIDER_FAVOR', 'SPLIT', 'NO_ACTION'], {
    errorMap: () => ({ message: 'قرار غير صالح' }),
  }),
  reason: z.string().min(10, 'السبب يجب أن يكون 10 أحرف على الأقل').max(500),
  splitAmount: z.object({
    buyerAmount: z.number().positive(),
    providerAmount: z.number().positive(),
  }).optional(),
});

/**
 * POST /api/admin/disputes/[id]/resolve
 * حل المنازعة
 * @requires ADMIN or SUPER_ADMIN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من صلاحية المدير
    const authResult = await requireAdmin(request);
    
    const { id } = await params;
    const body = await request.json();

    // التحقق من صحة البيانات
    const validatedData = resolveDisputeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.success === false ? validatedData.error.issues[0]?.message : 'بيانات غير صالحة' },
        { status: 400 }
      );
    }

    // حل المنازعة
    const updated = await DisputeService.resolveDispute(
      id,
      authResult.user.id,
      validatedData.data.decision as DisputeDecision,
      validatedData.data.reason,
      validatedData.data.splitAmount
    );

    // تسجيل النشاط
    console.log(`[Admin] ${authResult.user.id} resolved dispute ${id}: ${validatedData.data.decision}`);

    return NextResponse.json({ 
      dispute: updated,
      message: 'تم حل المنازعة بنجاح' 
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حل المنازعة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
