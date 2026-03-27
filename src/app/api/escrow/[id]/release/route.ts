/**
 * POST /api/escrow/[id]/release - إطلاق المبلغ للمزود
 *
 * Security: يستخدم verifyOwnership() + قاعدة عمل إضافية
 * - يجب أن يكون المستخدم طرفاً في الضمان أو Admin (verifyOwnership)
 * - المشتري أو Admin يمكنهم إطلاق المبلغ (business rule)
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';
import { releaseEscrowSchema, formatZodError } from '@/lib/validation/schemas';
import { Role } from '@/core/types/enums';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/escrow/[id]/release
 * إطلاق المبلغ للمزود
 * المشتري أو المدير فقط
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
    const validatedData = releaseEscrowSchema.safeParse(body);
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

    // قاعدة عمل: المشتري أو Admin يمكنهم إطلاق المبلغ (وليس المزود)
    const isBuyer = escrow.buyerId === user.id;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (!isBuyer && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح - فقط المشتري أو المدير يمكنهم إطلاق المبلغ' },
        { status: 403 }
      );
    }

    // إطلاق المبلغ
    const releasedEscrow = await EscrowService.releaseEscrow(
      id,
      user.id,
      validatedData.data.notes
    );

    return NextResponse.json({
      escrow: releasedEscrow,
      message: 'تم إطلاق المبلغ للمزود بنجاح'
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إطلاق المبلغ';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
