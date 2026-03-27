// POST /api/auth/logout - تسجيل الخروج

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/features/auth';

export async function POST(request: NextRequest) {
  try {
    // الحصول على التوكن من cookie أو header
    const token = request.cookies.get('auth_token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (token) {
      await authService.logout(token);
    }

    // إنشاء الاستجابة مع حذف cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json({ success: true });
  }
}
