/**
 * POST /api/escrow/[id]/refund - استرداد المبلغ
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { refundEscrowSchema, formatZodError } from '@/lib/validation/schemas';

/**
 * POST /api/escrow/[id]/refund
 * استرداد المبلغ للمشتري
 * يتطلب مصادقة (المشتري أو المزود أو المسؤول)
 */
export async function POST(
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
    const body = await request.json();

    // التحقق من صحة البيانات
    const validatedData = refundEscrowSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
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

    // المشتري أو المزود أو المدير يمكنهم طلب الاسترداد
    const isBuyer = escrow.buyerId === user.id;
    const isProvider = escrow.providerId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    
    if (!isBuyer && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      );
    }

    // استرداد المبلغ
    const refundedEscrow = await EscrowService.refundEscrow(
      id,
      validatedData.data.reason,
      validatedData.data.partialAmount
    );

    return NextResponse.json({ 
      escrow: refundedEscrow,
      message: validatedData.data.partialAmount 
        ? 'تم الاسترداد الجزئي بنجاح' 
        : 'تم الاسترداد بنجاح' 
    });
  } catch (error) {
    console.error('Error refunding escrow:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الاسترداد';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
