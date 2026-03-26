/**
 * POST /api/escrow/[id]/refund - استرداد المبلغ
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null; // TODO: التحقق من الجلسة الفعلية
}

/**
 * POST /api/escrow/[id]/refund
 * استرداد المبلغ للمشتري
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

    // التحقق من سبب الاسترداد
    if (!body.reason) {
      return NextResponse.json(
        { error: 'سبب الاسترداد مطلوب' },
        { status: 400 }
      );
    }

    // الحصول على الضمان للتحقق
    const escrow = await EscrowService.getEscrowById(id);

    if (!escrow) {
      return NextResponse.json(
        { error: 'الضمان غير موجود' },
        { status: 404 }
      );
    }

    // المزود أو المشتري أو المدير يمكنهم طلب الاسترداد
    const canRefund = 
      escrow.buyerId === user.id || 
      escrow.providerId === user.id || 
      user.role === 'ADMIN';
    
    if (!canRefund) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      );
    }

    // استرداد المبلغ
    const refundedEscrow = await EscrowService.refundEscrow(
      id,
      body.reason,
      body.partialAmount ? parseFloat(body.partialAmount) : undefined
    );

    return NextResponse.json({ 
      escrow: refundedEscrow,
      message: body.partialAmount 
        ? 'تم الاسترداد الجزئي بنجاح' 
        : 'تم الاسترداد بنجاح' 
    });
  } catch (error) {
    console.error('Error refunding escrow:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الاسترداد';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
