/**
 * GET /api/escrow - قائمة ضمانات المستخدم
 * POST /api/escrow - إنشاء ضمان جديد
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService, CreateEscrowInput } from '@/features/escrow/infrastructure/escrow-service';
import { EscrowStatus } from '@/core/types/enums';

// الحصول على المستخدم الحالي من الجلسة
async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  // محاكاة - في الإنتاج يجب استخدام نظام الجلسات الفعلي
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }

  // TODO: التحقق من الجلسة الفعلية
  // حالياً نرجع null للمستخدمين غير المسجلين
  return null;
}

/**
 * GET /api/escrow
 * قائمة ضمانات المستخدم
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'buyer' | 'provider';
    const status = searchParams.get('status') as EscrowStatus | null;

    let escrows;
    if (role === 'provider') {
      escrows = await EscrowService.listProviderEscrows(user.id, status ?? undefined);
    } else {
      escrows = await EscrowService.listBuyerEscrows(user.id, status ?? undefined);
    }

    return NextResponse.json({ escrows });
  } catch (error) {
    console.error('Error fetching escrows:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الضمانات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/escrow
 * إنشاء ضمان جديد
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    const requiredFields = ['providerId', 'amount', 'referenceType', 'referenceId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `الحقل ${field} مطلوب` },
          { status: 400 }
        );
      }
    }

    // التحقق من صحة نوع المرجع
    const validReferenceTypes = ['BOOKING', 'ORDER', 'ACTIVITY'];
    if (!validReferenceTypes.includes(body.referenceType)) {
      return NextResponse.json(
        { error: 'نوع المرجع غير صالح' },
        { status: 400 }
      );
    }

    // إنشاء الضمان
    const escrowInput: CreateEscrowInput = {
      buyerId: user.id,
      providerId: body.providerId,
      amount: parseFloat(body.amount),
      platformFee: body.platformFee ? parseFloat(body.platformFee) : undefined,
      currency: body.currency ?? 'SYP',
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      notes: body.notes,
    };

    const escrow = await EscrowService.createEscrow(escrowInput);

    return NextResponse.json({ escrow }, { status: 201 });
  } catch (error) {
    console.error('Error creating escrow:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الضمان' },
      { status: 500 }
    );
  }
}
