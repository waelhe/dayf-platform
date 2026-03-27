/**
 * Dispute API Route - GET /api/disputes/[id]
 *
 * GET: تفاصيل المنازعة (يتطلب ملكية أو Admin)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط أطراف النزاع والمسؤولون يمكنهم المشاهدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService } from '@/features/disputes/infrastructure/dispute-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/disputes/[id]
 * تفاصيل المنازعة - يتطلب ملكية (كأحد الأطراف) أو Admin
 */
export async function GET(
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

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('disputes', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بالوصول لهذه المنازعة' },
        { status: 403 }
      );
    }

    const dispute = await DisputeService.getDisputeById(id);

    if (!dispute) {
      return NextResponse.json(
        { error: 'المنازعة غير موجودة' },
        { status: 404 }
      );
    }

    // تصفية الرسائل الداخلية للمستخدمين غير الإداريين
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      dispute.messages = dispute.messages.filter(m => !m.isInternal);
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error('Error fetching dispute:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل المنازعة' },
      { status: 500 }
    );
  }
}
