/**
 * Escrow API Route - GET /api/escrow/[id]
 *
 * GET: تفاصيل الضمان (يتطلب ملكية - buyer أو provider)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط أطراف الضمان والمسؤولون يمكنهم المشاهدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/escrow/[id]
 * تفاصيل الضمان مع المعاملات
 * يتطلب ملكية (buyer أو provider) أو Admin
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
    // escrows resource معرفة للسماح لـ buyer و provider بالوصول
    const ownershipResult = await verifyOwnership('escrows', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بالوصول لهذا الضمان' },
        { status: 403 }
      );
    }

    const escrow = await EscrowService.getEscrowById(id);

    if (!escrow) {
      return NextResponse.json(
        { error: 'الضمان غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ escrow });
  } catch (error) {
    console.error('Error fetching escrow:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل الضمان' },
      { status: 500 }
    );
  }
}
