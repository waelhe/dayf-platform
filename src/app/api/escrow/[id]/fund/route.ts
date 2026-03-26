/**
 * POST /api/escrow/[id]/fund - تمويل الضمان
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null; // TODO: التحقق من الجلسة الفعلية
}

/**
 * POST /api/escrow/[id]/fund
 * تمويل الضمان (للمشتري)
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

    // الحصول على الضمان للتحقق من الملكية
    const escrow = await EscrowService.getEscrowById(id);

    if (!escrow) {
      return NextResponse.json(
        { error: 'الضمان غير موجود' },
        { status: 404 }
      );
    }

    // فقط المشتري يمكنه تمويل الضمان
    if (escrow.buyerId !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح - فقط المشتري يمكنه تمويل الضمان' },
        { status: 403 }
      );
    }

    // تمويل الضمان
    const fundedEscrow = await EscrowService.fundEscrow(id, body.paymentMetadata);

    return NextResponse.json({ 
      escrow: fundedEscrow,
      message: 'تم تمويل الضمان بنجاح' 
    });
  } catch (error) {
    console.error('Error funding escrow:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تمويل الضمان';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
