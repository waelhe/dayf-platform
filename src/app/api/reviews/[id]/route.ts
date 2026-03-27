/**
 * Review API Route - GET/PATCH/DELETE /api/reviews/[id]
 *
 * GET: تفاصيل مراجعة واحدة (عام)
 * PATCH: تحديث مراجعة (يحتاج ملكية)
 * DELETE: حذف مراجعة (يحتاج ملكية)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - المستخدم لا يمكنه تعديل مراجعات الآخرين
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReview, updateReview, deleteReview } from '@/features/reviews/infrastructure/review-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';
import { updateReviewSchema, formatZodError } from '@/lib/validation/schemas';
import { Role } from '@/core/types/enums';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reviews/[id]
 * تفاصيل مراجعة واحدة - عام (لا يحتاج مصادقة)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const review = await getReview(id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب المراجعة' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reviews/[id]
 * تحديث مراجعة - يتطلب ملكية
 * @security authorId يؤخذ من الجلسة فقط
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('reviews', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { success: false, error: ownershipResult.reason || 'غير مصرح لك بتعديل هذه المراجعة' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // التحقق من صحة البيانات
    const validatedData = updateReviewSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    // تحويل visitDate من string إلى Date إذا كان موجوداً
    const updateData = {
      ...validatedData.data,
      visitDate: validatedData.data.visitDate ? new Date(validatedData.data.visitDate) : undefined,
    };

    // ✅ SECURITY: authorId من الجلسة فقط، وليس من body
    const review = await updateReview(id, user.id, updateData);

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating review:', error);

    const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث المراجعة';

    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    if (errorMessage === 'NOT_AUTHORIZED') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذه المراجعة' },
        { status: 403 }
      );
    }

    if (errorMessage === 'EDIT_PERIOD_EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'انتهت فترة التعديل (30 يوم)' },
        { status: 400 }
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * حذف مراجعة - يتطلب ملكية أو صلاحية Admin
 * @security authorId يؤخذ من الجلسة فقط
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('reviews', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { success: false, error: ownershipResult.reason || 'غير مصرح لك بحذف هذه المراجعة' },
        { status: 403 }
      );
    }

    // ✅ SECURITY: authorId من الجلسة فقط
    await deleteReview(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'تم حذف المراجعة',
    });
  } catch (error) {
    console.error('Error deleting review:', error);

    const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف المراجعة';

    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    if (errorMessage === 'NOT_AUTHORIZED') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف هذه المراجعة' },
        { status: 403 }
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// دعم PUT للتوافق مع الكود القديم
export const PUT = PATCH;
