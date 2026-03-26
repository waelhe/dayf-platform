// POST /api/auth/register - التسجيل

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/features/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  phone: z.string().min(10, 'رقم الهاتف غير صالح').optional(),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').optional(),
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'الاسم الأخير مطلوب'),
  method: z.enum(['email', 'phone']).default('email'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    let result;

    if (validated.method === 'email') {
      if (!validated.email || !validated.password) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
          { status: 400 }
        );
      }

      result = await authService.registerWithEmail({
        email: validated.email,
        password: validated.password,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
      });
    } else {
      if (!validated.phone) {
        return NextResponse.json(
          { error: 'رقم الهاتف مطلوب' },
          { status: 400 }
        );
      }

      result = await authService.registerWithPhone(
        validated.phone,
        validated.firstName,
        validated.lastName,
        validated.email
      );
    }

    // إنشاء الاستجابة مع cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      isNewUser: result.isNewUser,
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
    console.error('[Auth] Register error:', error);

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
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
