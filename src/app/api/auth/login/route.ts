// POST /api/auth/login - تسجيل الدخول

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/features/auth';
import { z } from 'zod';

const loginSchema = z.object({
  method: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  otp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    let result;

    if (validated.method === 'email') {
      if (!validated.email || !validated.password) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
          { status: 400 }
        );
      }

      result = await authService.loginWithEmail({
        email: validated.email,
        password: validated.password,
      });
    } else {
      if (!validated.phone || !validated.otp) {
        return NextResponse.json(
          { error: 'رقم الهاتف ورمز التحقق مطلوبان' },
          { status: 400 }
        );
      }

      result = await authService.loginWithPhone({
        phone: validated.phone,
        otp: validated.otp,
      });
    }

    // إنشاء الاستجابة مع cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });

    // تعيين التوكن في cookie
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 يوم
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Auth] Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'type' in error) {
      const authError = error as any;
      return NextResponse.json(
        { error: authError.message },
        { status: authError.statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
