// GET /api/auth/me - الحصول على المستخدم الحالي

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/features/auth';

export async function GET(request: NextRequest) {
  try {
    // الحصول على التوكن من cookie أو header
    const token = request.cookies.get('auth_token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'غير مصادق' },
        { status: 401 }
      );
    }

    const user = await authService.validateToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'الجلسة منتهية' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[Auth] Me error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحصول على بيانات المستخدم' },
      { status: 500 }
    );
  }
}
