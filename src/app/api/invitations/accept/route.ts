/**
 * Invitations Accept API Route - POST /api/invitations/accept
 *
 * POST: قبول دعوة الانضمام لشركة
 *
 * Security: userId يُؤخذ من الجلسة فقط
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/features/companies';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * POST /api/invitations/accept
 * قبول دعوة الانضمام لشركة
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.token) {
      return NextResponse.json(
        { error: 'رمز الدعوة مطلوب' },
        { status: 400 }
      );
    }

    // ✅ SECURITY: userId من الجلسة فقط
    const employee = await EmployeeService.acceptInvitation(user.id, {
      token: body.token,
    });

    return NextResponse.json({
      success: true,
      message: 'تم الانضمام إلى الشركة بنجاح',
      employee,
    });
  } catch (error: unknown) {
    console.error('Error accepting invitation:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء قبول الدعوة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
