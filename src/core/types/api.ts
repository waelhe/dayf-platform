/**
 * API Types - أنواع واجهة برمجة التطبيقات
 *
 * هذا الملف يحدد الأنواع الأساسية للـ API requests و responses.
 * الهدف: توحيد شكل الاستجابات والأخطاء.
 *
 * المبدأ: كل API response يتبع نفس الهيكل
 */

import type { JsonEntity, PaginatedResult } from './entities';

// ============================================
// Response Types
// ============================================

/**
 * الاستجابة الناجحة
 */
export interface ApiSuccessResponse<T = unknown> {
  /** نجاح العملية */
  success: true;
  /** البيانات */
  data: T;
  /** رسالة اختيارية */
  message?: string;
  /** توقيت الاستجابة */
  timestamp: string;
}

/**
 * الاستجابة بالخطأ
 */
export interface ApiErrorResponse {
  /** فشل العملية */
  success: false;
  /** رسالة الخطأ */
  error: string;
  /** تفاصيل الخطأ */
  details?: Record<string, string[]>;
  /** كود الخطأ */
  code?: string;
  /** توقيت الاستجابة */
  timestamp: string;
}

/**
 * الاستجابة العامة (نجاح أو خطأ)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * استجابة مرقمة
 */
export interface ApiPaginatedResponse<T> {
  /** نجاح العملية */
  success: true;
  /** البيانات المرقمة */
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  /** توقيت الاستجابة */
  timestamp: string;
}

/**
 * استجابة بدون بيانات
 */
export type ApiEmptyResponse = ApiSuccessResponse<null>;

// ============================================
// Request Types
// ============================================

/**
 * معاملات الترقيم القياسية
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * معاملات البحث القياسية
 */
export interface SearchQuery extends PaginationQuery {
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * معاملات التصفية القياسية
 */
export interface FilterQuery {
  status?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * إنشاء استجابة ناجحة
 */
export function success<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * إنشاء استجابة خطأ
 */
export function error(
  message: string,
  details?: Record<string, string[]>,
  code?: string
): ApiErrorResponse {
  return {
    success: false,
    error: message,
    details,
    code,
    timestamp: new Date().toISOString(),
  };
}

/**
 * إنشاء استجابة مرقمة
 */
export function paginated<T>(result: PaginatedResult<T>): ApiPaginatedResponse<T> {
  return {
    success: true,
    data: {
      items: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * إنشاء استجابة فارغة
 */
export function empty(message?: string): ApiEmptyResponse {
  return {
    success: true,
    data: null,
    message,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Not found errors
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  
  // Business logic errors
  BOOKING_ALREADY_EXISTS: 'BOOKING_ALREADY_EXISTS',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// Type Guards for API Responses
// ============================================

/**
 * التحقق من أن الاستجابة ناجحة
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * التحقق من أن الاستجابة خطأ
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * التحقق من أن الاستجابة مرقمة
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<T>
): response is ApiPaginatedResponse<T> {
  return (
    response.success === true &&
    'data' in response &&
    'items' in (response.data as unknown as Record<string, unknown>) &&
    'pagination' in (response.data as unknown as Record<string, unknown>)
  );
}

// ============================================
// API Context Types
// ============================================

/**
 * سياق الـ API route
 */
export interface ApiContext {
  /** معرف المستخدم */
  userId?: string;
  /** بريد المستخدم */
  userEmail?: string;
  /** دور المستخدم */
  userRole?: string;
  /** معرف المورد (للـ owner routes) */
  resourceId?: string;
  /** نوع المورد */
  resourceType?: string;
}

/**
 * خيارات الـ API handler
 */
export interface ApiHandlerOptions {
  /** requires authentication */
  requireAuth?: boolean;
  /** requires admin role */
  requireAdmin?: boolean;
  /** requires ownership */
  requireOwner?: boolean;
  /** resource type for ownership check */
  resourceType?: string;
}
