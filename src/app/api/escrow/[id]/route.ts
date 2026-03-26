/**
 * GET /api/escrow/[id] - تفاصيل الضمان
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';

// الحصول على المستخدم الحالي من الجلسة
async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }

  // TODO: التحقق من الجلسة الفعلية
  return null;
}

/**
 * GET /api/escrow/[id]
 * تفاصيل الضمان مع المعاملات
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
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

    // التحقق من صلاحية المستخدم
    if (escrow.buyerId !== user.id && escrow.providerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا الضمان' },
        { status: 403 }
      );
    }

    return NextResponse.json({ escrow });
  } catch (error) {
    console.error('Error fetching escrow:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل الضمان' },
      { status: 500 }
    );
  }
}
