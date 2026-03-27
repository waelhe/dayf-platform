/**
 * GET /api/escrow/[id] - تفاصيل الضمان
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * GET /api/escrow/[id]
 * تفاصيل الضمان مع المعاملات
 * يتطلب مصادقة + صلاحية الوصول
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const escrow = await EscrowService.getEscrowById(id);

    if (!escrow) {
      return NextResponse.json(
        { error: 'الضمان غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية المستخدم (المشتري أو المزود أو المسؤول)
    const isBuyer = escrow.buyerId === user.id;
    const isProvider = escrow.providerId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    
    if (!isBuyer && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا الضمان' },
        { status: 403 }
      );
    }

    return NextResponse.json({ escrow });
  } catch (error) {
    console.error('Error fetching escrow:', error);
    
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل الضمان' },
      { status: 500 }
    );
  }
}
