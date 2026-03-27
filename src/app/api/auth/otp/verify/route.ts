// POST /api/auth/otp/verify - التحقق من رمز التحقق

import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/features/auth';
import { z } from 'zod';

type OTPType = 'LOGIN' | 'REGISTER' | 'VERIFY' | 'RESET_PASSWORD';

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  code: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام'),
  type: z.enum(['LOGIN', 'REGISTER', 'VERIFY', 'RESET_PASSWORD']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifyOTPSchema.parse(body);

    const isValid = await otpService.verifyOTP(
      validated.phone,
      validated.code,
      validated.type as OTPType
    );

    return NextResponse.json({
      success: true,
      verified: isValid,
      message: 'تم التحقق بنجاح'
    });
  } catch (error) {
    console.error('[Auth] Verify OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'type' in error) {
      const authError = error as Error & { statusCode?: number };
      return NextResponse.json(
        { error: authError.message, verified: false },
        { status: authError.statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من الرمز' },
      { status: 500 }
    );
  }
}
