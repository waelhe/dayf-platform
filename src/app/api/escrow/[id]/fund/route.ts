/**
 * POST /api/escrow/[id]/fund - تمويل الضمان
 *
 * Security: يستخدم verifyOwnership() + قاعدة عمل إضافية
 * - يجب أن يكون المستخدم طرفاً في الضمان (verifyOwnership)
 * - يجب أن يكون المشتري فقط (business rule)
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';
import { fundEscrowSchema, formatZodError } from '@/lib/validation/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/escrow/[id]/fund
 * تمويل الضمان (للمشتري فقط)
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
    const body = await request.json().catch(() => ({}));

    // التحقق من صحة البيانات
    const validatedData = fundEscrowSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    // ✅ ROOT: استخدام verifyOwnership للتحقق من أن المستخدم طرف في الضمان
    const ownershipResult = await verifyOwnership('escrows', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بالوصول لهذا الضمان' },
        { status: 403 }
      );
    }

    // الحصول على الضمان للتحقق من قاعدة العمل
    const escrow = await EscrowService.getEscrowById(id);

    if (!escrow) {
      return NextResponse.json(
        { error: 'الضمان غير موجود' },
        { status: 404 }
      );
    }

    // قاعدة عمل: فقط المشتري يمكنه تمويل الضمان (وليس المزود)
    if (escrow.buyerId !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح - فقط المشتري يمكنه تمويل الضمان' },
        { status: 403 }
      );
    }

    // تمويل الضمان
    const fundedEscrow = await EscrowService.fundEscrow(id, {
      paymentMethod: validatedData.data.paymentMethod,
      paymentMetadata: validatedData.data.paymentMetadata,
    });

    return NextResponse.json({
      escrow: fundedEscrow,
      message: 'تم تمويل الضمان بنجاح'
    });
  } catch (error) {
    console.error('Error funding escrow:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تمويل الضمان';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
