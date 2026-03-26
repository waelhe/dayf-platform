/**
 * POST /api/escrow/[id]/release - إطلاق المبلغ للمزود
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null; // TODO: التحقق من الجلسة الفعلية
}

/**
 * POST /api/escrow/[id]/release
 * إطلاق المبلغ للمزود
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
    const body = await request.json().catch(() => ({}));

    // الحصول على الضمان للتحقق
    const escrow = await EscrowService.getEscrowById(id);

    if (!escrow) {
      return NextResponse.json(
        { error: 'الضمان غير موجود' },
        { status: 404 }
      );
    }

    // المشتري أو المدير يمكنهم إطلاق المبلغ
    const canRelease = escrow.buyerId === user.id || user.role === 'ADMIN';
    
    if (!canRelease) {
      return NextResponse.json(
        { error: 'غير مصرح - فقط المشتري أو المدير يمكنهم إطلاق المبلغ' },
        { status: 403 }
      );
    }

    // إطلاق المبلغ
    const releasedEscrow = await EscrowService.releaseEscrow(
      id,
      user.id,
      body.notes
    );

    return NextResponse.json({ 
      escrow: releasedEscrow,
      message: 'تم إطلاق المبلغ للمزود بنجاح' 
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إطلاق المبلغ';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
