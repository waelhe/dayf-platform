/**
 * POST /api/disputes/[id]/messages - إضافة رسالة للمنازعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService } from '@/features/disputes/infrastructure/dispute-service';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null;
}

/**
 * POST /api/disputes/[id]/messages
 * إضافة رسالة للمنازعة
 */
export async function POST(
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
    const body = await request.json();

    // التحقق من وجود الرسالة
    if (!body.message) {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    // الحصول على المنازعة للتحقق من الصلاحية
    const dispute = await DisputeService.getDisputeById(id);

    if (!dispute) {
      return NextResponse.json(
        { error: 'المنازعة غير موجودة' },
        { status: 404 }
      );
    }

    // تحديد دور المستخدم
    let senderRole: 'BUYER' | 'PROVIDER' | 'ADMIN';
    if (user.role === 'ADMIN') {
      senderRole = 'ADMIN';
    } else if (user.id === dispute.escrow.buyerId) {
      senderRole = 'BUYER';
    } else if (user.id === dispute.escrow.providerId) {
      senderRole = 'PROVIDER';
    } else {
      return NextResponse.json(
        { error: 'غير مصرح بالمشاركة في هذه المنازعة' },
        { status: 403 }
      );
    }

    // إضافة الرسالة
    await DisputeService.addMessage(
      id,
      user.id,
      senderRole,
      body.message,
      body.attachments,
      body.isInternal && user.role === 'ADMIN'
    );

    return NextResponse.json({ 
      message: 'تمت إضافة الرسالة بنجاح' 
    });
  } catch (error) {
    console.error('Error adding message:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الرسالة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
