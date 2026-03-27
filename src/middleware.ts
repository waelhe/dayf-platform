/**
 * Next.js Middleware - Route Protection System
 *
 * هذا الـ middleware يطبق حماية الـ routes تلقائياً.
 * يعمل قبل كل API request ولا يمكن تجاوزه.
 *
 * المبدأ: Deny by Default (Constitution Article VI)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRouteProtection, extractResourceId, type RouteLevel } from './core/auth/route-protection';

/**
 * التحقق من JWT token
 */
async function verifyToken(token: string | undefined): Promise<{ id: string; email: string; role: string } | null> {
  if (!token) return null;

  try {
    // استخدام jose للتحقق من token
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dayf-secret-key-2025');

    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || !payload.email) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as string) || 'user',
    };
  } catch {
    // Token invalid or expired
    return null;
  }
}

/**
 * إنشاء استجابة خطأ موحدة
 */
function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Middleware الرئيسي
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // تجاهل المسارات غير API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // الحصول على مستوى الحماية للمسار
  const protection = getRouteProtection(pathname, method);

  // المسارات العامة - لا تتطلب مصادقة
  if (protection?.level === 'public') {
    return NextResponse.next();
  }

  // الحصول على token من cookie
  const token = request.cookies.get('auth_token')?.value;
  const user = await verifyToken(token);

  // المسارات غير المعرفة - تتطلب مصادقة افتراضياً
  if (!protection) {
    if (!user) {
      return errorResponse('Unauthorized - Authentication required', 401);
    }
    // إضافة معلومات المستخدم للـ headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email);
    response.headers.set('x-user-role', user.role);
    return response;
  }

  // التحقق من المصادقة
  if (!user && protection.level !== 'public') {
    return errorResponse('Unauthorized - Authentication required', 401);
  }

  // المسارات التي تتطلب صلاحية Admin
  if (protection.level === 'admin') {
    if (user!.role !== 'admin' && user!.role !== 'superadmin') {
      return errorResponse('Forbidden - Admin access required', 403);
    }
  }

  // إنشاء الاستجابة مع معلومات المستخدم
  const response = NextResponse.next();

  if (user) {
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email);
    response.headers.set('x-user-role', user.role);
  }

  // للـ owner routes، نضيف معرف المورد
  if (protection.level === 'owner' && protection.pattern) {
    const resourceId = extractResourceId(pathname, protection.pattern);
    if (resourceId) {
      response.headers.set('x-resource-id', resourceId);
      response.headers.set('x-resource-type', protection.resourceType || '');
    }
  }

  return response;
}

/**
 * تكوين الـ matcher - يطبق على كل المسارات
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
