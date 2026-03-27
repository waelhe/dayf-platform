/**
 * POST /api/escrow/[id]/refund - استرداد المبلغ
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * - buyer, provider, admin يمكنهم طلب الاسترداد (معرف في RESOURCE_CONFIGS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';
import { refundEscrowSchema, formatZodError } from '@/lib/validation/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/escrow/[id]/refund
 * استرداد المبلغ للمشتري
 * buyer أو provider أو Admin يمكنهم طلب الاسترداد
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // التحقق من صحة البيانات
    const validatedData = refundEscrowSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    // ✅ ROOT: استخدام verifyOwnership للتحقق من أن المستخدم طرف في الضمان
    // escrows معرفة للسماح لـ buyer و provider بالوصول
    const ownershipResult = await verifyOwnership('escrows', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بالوصول لهذا الضمان' },
        { status: 403 }
      );
    }

    // استرداد المبلغ
    const refundedEscrow = await EscrowService.refundEscrow(
      id,
      validatedData.data.reason,
      validatedData.data.partialAmount
    );

    return NextResponse.json({
      escrow: refundedEscrow,
      message: validatedData.data.partialAmount
        ? 'تم الاسترداد الجزئي بنجاح'
        : 'تم الاسترداد بنجاح'
    });
  } catch (error) {
    console.error('Error refunding escrow:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الاسترداد';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
