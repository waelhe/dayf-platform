/**
 * POST /api/disputes/[id]/escalate - تصعيد المنازعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService } from '@/features/disputes/infrastructure/dispute-service';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null;
}

/**
 * POST /api/disputes/[id]/escalate
 * تصعيد المنازعة للإدارة
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

    // التحقق من وجود سبب
    if (!body.reason) {
      return NextResponse.json(
        { error: 'سبب التصعيد مطلوب' },
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

    // التحقق من صلاحية المستخدم
    const canEscalate = 
      dispute.openedBy === user.id || 
      dispute.againstUser === user.id;

    if (!canEscalate) {
      return NextResponse.json(
        { error: 'غير مصرح بتصعيد هذه المنازعة' },
        { status: 403 }
      );
    }

    // تصعيد المنازعة
    const updated = await DisputeService.escalateDispute(id, user.id, body.reason);

    return NextResponse.json({ 
      dispute: updated,
      message: 'تم تصعيد المنازعة للإدارة' 
    });
  } catch (error) {
    console.error('Error escalating dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تصعيد المنازعة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
