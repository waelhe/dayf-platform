/**
 * GET /api/disputes/[id] - تفاصيل المنازعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService } from '@/features/disputes/infrastructure/dispute-service';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null;
}

/**
 * GET /api/disputes/[id]
 * تفاصيل المنازعة
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

    const dispute = await DisputeService.getDisputeById(id);

    if (!dispute) {
      return NextResponse.json(
        { error: 'المنازعة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية المستخدم
    const canView = 
      dispute.openedBy === user.id || 
      dispute.againstUser === user.id || 
      user.role === 'ADMIN';

    if (!canView) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذه المنازعة' },
        { status: 403 }
      );
    }

    // تصفية الرسائل الداخلية للمستخدمين غير الإداريين
    if (user.role !== 'ADMIN') {
      dispute.messages = dispute.messages.filter(m => !m.isInternal);
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل المنازعة' },
      { status: 500 }
    );
  }
}
