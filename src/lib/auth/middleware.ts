/**
 * Auth Middleware
 * وسيط المصادقة
 * 
 * Provides authentication and authorization utilities for API routes.
 * يحترم المادة VI من الدستور: كل API route يمر بـ auth middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionRepository } from '@/features/auth/infrastructure/repositories/session.repository';
import { getUserRepository } from '@/features/auth/infrastructure/repositories/user.repository';
import { Role } from '@/core/types/enums';

// ============================================
// Types
// ============================================

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  role: Role;
  status: string;
}

export interface AuthResult {
  user: AuthUser;
  sessionId: string;
}

// ============================================
// Auth Middleware Functions
// ============================================

/**
 * Get current authenticated user from request
 * الحصول على المستخدم المصادق من الطلب
 *
 * يدعم طريقتين:
 * 1. من headers (الأسرع - من middleware الجذري) - TRUST HEADERS
 * 2. من token مباشرة (للتوافق مع الكود القديم)
 *
 * ROOT SOLUTION: لا نستعلم عن المستخدم إذا كان middleware قد تحقق منه
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // الطريقة 1: القراءة من headers (الأسرع - من middleware الجذري)
    // ROOT: Trust the middleware - لا نحتاج للاستعلام عن المستخدم
    const headerUserId = request.headers.get('x-user-id');
    const headerUserEmail = request.headers.get('x-user-email');
    const headerUserRole = request.headers.get('x-user-role');

    if (headerUserId && headerUserRole) {
      // المستخدم مصادق بالفعل بواسطة middleware - نثق بالـ headers
      // لا نستعلم عن المستخدم - هذا هو الحل الجذري
      return {
        id: headerUserId,
        email: headerUserEmail || null,
        phone: null, // غير متوفر في headers - يمكن جلبه لاحقاً إذا احتجنا
        displayName: headerUserEmail?.split('@')[0] || 'مستخدم', // fallback
        role: headerUserRole as Role,
        status: 'ACTIVE', // افتراضي - المستخدم المصادق نشط
      };
    }

    // الطريقة 2: القراءة من token مباشرة (للتوافق مع الكود القديم)
    // هذا يُستخدم فقط إذا middleware لم يعمل (testing, direct calls)
    const token = request.cookies.get('auth_token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const sessionRepo = getSessionRepository();
    const userRepo = getUserRepository();

    // Find valid session
    const session = await sessionRepo.findValidByToken(token);
    if (!session) {
      return null;
    }

    // Get user
    const user = await userRepo.findById(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      role: user.role as Role,
      status: user.status,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return null;
  }
}

/**
 * Get full user profile from database (when needed)
 * الحصول على ملف المستخدم الكامل (عند الحاجة)
 *
 * استخدم هذه الدالة فقط إذا احتجت phone, displayName, status الحقيقية
 */
export async function getFullAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const basicUser = await getAuthUser(request);
  if (!basicUser) return null;

  // فقط استعلم إذا احتجنا بيانات إضافية
  const userRepo = getUserRepository();
  const user = await userRepo.findById(basicUser.id);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    role: user.role as Role,
    status: user.status,
  };
}

/**
 * Require authentication - returns 401 if not authenticated
 * يتطلب المصادقة - يرجع 401 إذا لم يكن مصادقاً
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new AuthError('غير مصادق - يرجى تسجيل الدخول', 401);
  }

  return {
    user,
    sessionId: '', // Would need to get from session
  };
}

/**
 * Require specific role
 * يتطلب دور محدد
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<AuthResult> {
  const result = await requireAuth(request);

  if (!allowedRoles.includes(result.user.role)) {
    throw new AuthError('ليس لديك صلاحية للوصول', 403);
  }

  return result;
}

/**
 * Require admin role (ADMIN or SUPER_ADMIN)
 * يتطلب دور المسؤول
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, [Role.ADMIN, Role.SUPER_ADMIN]);
}

/**
 * Require super admin role
 * يتطلب دور المسؤول الأعلى
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, [Role.SUPER_ADMIN]);
}

/**
 * Require resource ownership or admin
 * يتطلب ملكية المورد أو صلاحية المسؤول
 */
export async function requireOwnerOrAdmin(
  request: NextRequest,
  resourceOwnerId: string
): Promise<AuthResult> {
  const result = await requireAuth(request);

  const isOwner = result.user.id === resourceOwnerId;
  const isAdmin = result.user.role === Role.ADMIN || result.user.role === Role.SUPER_ADMIN;

  if (!isOwner && !isAdmin) {
    throw new AuthError('غير مصرح بالوصول لهذا المورد', 403);
  }

  return result;
}

// ============================================
// Auth Error Class
// ============================================

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      { error: this.message },
      { status: this.statusCode }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create unauthorized response
 * إنشاء استجابة غير مصرح
 */
export function unauthorizedResponse(message: string = 'غير مصادق'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create forbidden response
 * إنشاء استجابة محظورة
 */
export function forbiddenResponse(message: string = 'ليس لديك صلاحية'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Check if user owns resource
 * التحقق مما إذا كان المستخدم يملك المورد
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Check if user is admin or owner
 * التحقق مما إذا كان المستخدم مسؤولاً أو مالكاً
 */
export function isAdminOrOwner(
  user: AuthUser,
  resourceOwnerId: string
): boolean {
  return (
    user.role === Role.ADMIN ||
    user.role === Role.SUPER_ADMIN ||
    user.id === resourceOwnerId
  );
}
