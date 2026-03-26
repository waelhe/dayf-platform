// POST /api/auth/otp/send - إرسال رمز التحقق

import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/features/auth';
import { z } from 'zod';

type OTPType = 'LOGIN' | 'REGISTER' | 'VERIFY' | 'RESET_PASSWORD';

const sendOTPSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  type: z.enum(['LOGIN', 'REGISTER', 'VERIFY', 'RESET_PASSWORD']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sendOTPSchema.parse(body);

    const result = await otpService.sendOTP(
      validated.phone,
      validated.type as OTPType
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Auth] Send OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'type' in error) {
      const authError = error as Error & { statusCode?: number };
      return NextResponse.json(
        { error: authError.message },
        { status: authError.statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال رمز التحقق' },
      { status: 500 }
    );
  }
}
