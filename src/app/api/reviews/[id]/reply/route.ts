/**
 * Review Reply API Route - POST /api/reviews/[id]/reply
 *
 * POST: إضافة رد على مراجعة (للمزودين والإدارة)
 *
 * Security: authorId يُؤخذ من الجلسة فقط
 * يجب أن يكون المستخدم مالك الخدمة أو Admin للرد
 */

import { NextRequest, NextResponse } from 'next/server';
import { addReply, getReview } from '@/features/reviews/infrastructure/review-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { servicesService } from '@/features/services/infrastructure/services-service';
import { Role } from '@/core/types/enums';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reviews/[id]/reply
 * إضافة رد على مراجعة
 *
 * قواعد الوصول:
 * - Admin: يمكنه الرد على أي مراجعة
 * - Provider (مالك الخدمة): يمكنه الرد على مراجعات خدماته
 * - المستخدم العادي: لا يمكنه الرد
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
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;
    const body = await request.json();

    // التحقق من المحتوى
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'المحتوى مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول المحتوى
    if (body.content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'الرد يجب أن لا يتجاوز 500 حرف' },
        { status: 400 }
      );
    }

    // الحصول على المراجعة للتحقق من الملكية
    const review = await getReview(reviewId);

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    // تحديد دور المستخدم في الرد
    let authorRole: 'PROVIDER' | 'ADMIN' | 'USER' = 'USER';
    let canReply = false;

    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (isAdmin) {
      authorRole = 'ADMIN';
      canReply = true;
    } else {
      // التحقق مما إذا كان المستخدم هو مالك الخدمة
      if (review.referenceType === 'SERVICE' && review.referenceId) {
        try {
          const service = await servicesService.getById(review.referenceId);
          if (service && service.hostId === user.id) {
            authorRole = 'PROVIDER';
            canReply = true;
          }
        } catch {
          // Service not found, cannot reply as provider
        }
      }
    }

    if (!canReply) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالرد على هذه المراجعة' },
        { status: 403 }
      );
    }

    // ✅ SECURITY: authorId من الجلسة فقط
    const reply = await addReply({
      reviewId,
      authorId: user.id,
      authorName: user.displayName || 'مستخدم',
      authorRole,
      content: body.content.trim(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: reply.id,
        authorName: reply.authorName,
        authorRole: reply.authorRole,
        content: reply.content,
        createdAt: reply.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding reply:', error);

    const errorMessage = error instanceof Error ? error.message : 'خطأ في إضافة الرد';

    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
