/**
 * GET /api/escrow - قائمة ضمانات المستخدم
 * POST /api/escrow - إنشاء ضمان جديد
 */

import { NextRequest, NextResponse } from 'next/server';
import { EscrowService, CreateEscrowInput } from '@/features/escrow/infrastructure/escrow-service';
import { EscrowStatus } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { createEscrowSchema, formatZodError } from '@/lib/validation/schemas';

/**
 * GET /api/escrow
 * قائمة ضمانات المستخدم
 * يتطلب مصادقة
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
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
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الضمانات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/escrow
 * إنشاء ضمان جديد
 * يتطلب مصادقة
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات باستخدام Zod
    const validatedData = createEscrowSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    // إنشاء الضمان
    const escrowInput: CreateEscrowInput = {
      buyerId: user.id, // استخدام معرف المستخدم من الجلسة - لا نقبل body.authorId
      providerId: validatedData.data.providerId,
      amount: validatedData.data.amount,
      platformFee: validatedData.data.platformFee,
      currency: validatedData.data.currency,
      referenceType: validatedData.data.referenceType,
      referenceId: validatedData.data.referenceId,
      notes: validatedData.data.notes,
    };

    const escrow = await EscrowService.createEscrow(escrowInput);

    return NextResponse.json({ escrow }, { status: 201 });
  } catch (error) {
    console.error('Error creating escrow:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الضمان' },
      { status: 500 }
    );
  }
}
