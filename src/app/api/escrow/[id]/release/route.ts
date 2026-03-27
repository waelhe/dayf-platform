/**
 * POST /api/escrow/[id]/release - إطلاق المبلغ للمزود
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { releaseEscrowSchema, formatZodError } from '@/lib/validation/schemas';

/**
 * POST /api/escrow/[id]/release
 * إطلاق المبلغ للمزود
 * يتطلب مصادقة (المشتري أو المسؤول فقط)
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
    const body = await request.json().catch(() => ({}));

    // التحقق من صحة البيانات
    const validatedData = releaseEscrowSchema.safeParse(body);
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

    // المشتري أو المدير يمكنهم إطلاق المبلغ
    const isBuyer = escrow.buyerId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    
    if (!isBuyer && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح - فقط المشتري أو المدير يمكنهم إطلاق المبلغ' },
        { status: 403 }
      );
    }

    // إطلاق المبلغ
    const releasedEscrow = await EscrowService.releaseEscrow(
      id,
      user.id,
      validatedData.data.notes
    );

    return NextResponse.json({ 
      escrow: releasedEscrow,
      message: 'تم إطلاق المبلغ للمزود بنجاح' 
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إطلاق المبلغ';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
