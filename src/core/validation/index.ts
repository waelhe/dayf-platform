/**
 * Validation Middleware - نظام التحقق الجذري
 *
 * هذا النظام يطبق validation تلقائياً على كل API route.
 * يوفر schemas افتراضية للأنواع الشائعة.
 *
 * المبدأ: لا يمكن نسيان validation - دائماً هناك حماية أساسية
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================
// Types
// ============================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.inferFormattedError<T>;
}

export interface ValidationOptions {
  /** schema للـ body */
  body?: z.ZodSchema;
  /** schema للـ query params */
  query?: z.ZodSchema;
  /** schema للـ path params */
  params?: z.ZodSchema;
  /** تخطي validation للـ body */
  skipBody?: boolean;
}

// ============================================
// Default Schemas
// ============================================

/**
 * Schemas افتراضية للأنواع الشائعة
 * تُستخدم عندما لا يوجد schema محدد
 */
export const DefaultSchemas = {
  /** معرف UUID */
  uuid: z.string().uuid('معرف غير صالح'),

  /** معرف عام (سلسلة غير فارغة) */
  id: z.string().min(1, 'المعرف مطلوب'),

  /** رقم صحيح موجب */
  positiveInt: z.coerce.number().int().positive(),

  /** رقم صحيح غير سالب */
  nonNegativeInt: z.coerce.number().int().nonnegative(),

  /** Pagination parameters */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    offset: z.coerce.number().int().min(0).optional(),
  }),

  /** معاملات البحث */
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  /** معرف في الـ params */
  idParam: z.object({
    id: z.string().min(1, 'المعرف مطلوب'),
  }),

  /** UUID في الـ params */
  uuidParam: z.object({
    id: z.string().uuid('معرف غير صالح'),
  }),

  /** التواريخ */
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),

  /** الحالة */
  status: z.object({
    status: z.string().min(1),
  }),

  /** نص محتوى */
  content: z.object({
    content: z.string().min(1).max(5000),
  }),

  /** مبلغ مالي */
  amount: z.object({
    amount: z.coerce.number().positive('المبلغ يجب أن يكون موجباً'),
  }),
};

// ============================================
// Validation Functions
// ============================================

/**
 * التحقق من body باستخدام Zod
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      errors: result.error.format() as z.inferFormattedError<T>,
    };
  } catch {
    return {
      success: false,
      errors: { _errors: ['فشل في قراءة البيانات'] } as z.inferFormattedError<T>,
    };
  }
}

/**
 * التحقق من query params باستخدام Zod
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    // Handle multiple values for the same key
    if (query[key]) {
      if (Array.isArray(query[key])) {
        (query[key] as string[]).push(value);
      } else {
        query[key] = [query[key] as string, value];
      }
    } else {
      query[key] = value;
    }
  });

  const result = schema.safeParse(query);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.format() as z.inferFormattedError<T>,
  };
}

/**
 * التحقق من path params باستخدام Zod
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.format() as z.inferFormattedError<T>,
  };
}

// ============================================
// Higher-Order Function for Routes
// ============================================

/**
 * إنشاء route handler مع validation تلقائي
 *
 * @example
 * ```typescript
 * export const POST = withValidation(
 *   z.object({ email: z.string().email(), password: z.string().min(8) }),
 *   async (request, { email, password }) => {
 *     // validated data
 *   }
 * );
 * ```
 */
export function withBody<T extends z.ZodSchema>(
  schema: T,
  handler: (
    request: NextRequest,
    data: z.infer<T>,
    context: { userId?: string; userRole?: string }
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const result = await validateBody(request, schema);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'بيانات غير صالحة',
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // الحصول على معلومات المستخدم من headers
    const userId = request.headers.get('x-user-id') || undefined;
    const userRole = request.headers.get('x-user-role') || undefined;

    return handler(request, result.data!, { userId, userRole });
  };
}

/**
 * إنشاء route handler مع validation للـ query
 */
export function withQuery<T extends z.ZodSchema>(
  schema: T,
  handler: (
    request: NextRequest,
    query: z.infer<T>,
    context: { userId?: string; userRole?: string }
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const result = validateQuery(request, schema);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'معاملات غير صالحة',
          details: result.errors,
        },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id') || undefined;
    const userRole = request.headers.get('x-user-role') || undefined;

    return handler(request, result.data!, { userId, userRole });
  };
}

/**
 * إنشاء route handler مع validation شامل
 */
export function withValidation<TBody extends z.ZodSchema, TQuery extends z.ZodSchema>(
  options: {
    body?: TBody;
    query?: TQuery;
  },
  handler: (
    request: NextRequest,
    context: {
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
      userId?: string;
      userRole?: string;
    }
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    let body: z.infer<TBody> | undefined;
    let query: z.infer<TQuery> | undefined;

    // Validate body
    if (options.body) {
      const bodyResult = await validateBody(request, options.body);
      if (!bodyResult.success) {
        return NextResponse.json(
          {
            error: 'بيانات غير صالحة',
            details: bodyResult.errors,
          },
          { status: 400 }
        );
      }
      body = bodyResult.data;
    }

    // Validate query
    if (options.query) {
      const queryResult = validateQuery(request, options.query);
      if (!queryResult.success) {
        return NextResponse.json(
          {
            error: 'معاملات غير صالحة',
            details: queryResult.errors,
          },
          { status: 400 }
        );
      }
      query = queryResult.data;
    }

    const userId = request.headers.get('x-user-id') || undefined;
    const userRole = request.headers.get('x-user-role') || undefined;

    return handler(request, { body, query, userId, userRole });
  };
}

// ============================================
// Error Formatting
// ============================================

/**
 * تنسيق أخطاء Zod للعرض
 */
export function formatValidationErrors(
  errors: z.ZodError | Record<string, unknown>
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  if (errors instanceof z.ZodError) {
    for (const issue of errors.issues) {
      const path = issue.path.join('.');
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(issue.message);
    }
  } else {
    // Handle formatted errors
    const traverse = (obj: Record<string, unknown>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (key === '_errors' && Array.isArray(value)) {
          if (value.length > 0) {
            formatted[prefix || '_root'] = value as string[];
          }
        } else if (typeof value === 'object' && value !== null) {
          traverse(value as Record<string, unknown>, path);
        }
      }
    };
    traverse(errors);
  }

  return formatted;
}

/**
 * إنشاء استجابة خطأ validation
 */
export function validationErrorResponse(
  errors: z.ZodError | Record<string, unknown>
): NextResponse {
  const formatted = formatValidationErrors(errors);

  return NextResponse.json(
    {
      error: 'بيانات غير صالحة',
      validationErrors: formatted,
    },
    { status: 400 }
  );
}

// ============================================
// Common Validation Schemas for Dayf
// ============================================

/**
 * Schemas خاصة بمنصة ضيف
 */
export const DayfSchemas = {
  /** إنشاء حجز */
  createBooking: z.object({
    serviceId: z.string().min(1, 'الخدمة مطلوبة'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    guests: z.coerce.number().int().min(1).max(100).default(1),
    notes: z.string().max(1000).optional(),
  }),

  /** إنشاء مراجعة */
  createReview: z.object({
    referenceId: z.string().min(1),
    referenceType: z.enum(['service', 'company', 'destination', 'activity']),
    rating: z.coerce.number().min(1).max(5),
    title: z.string().min(3).max(100).optional(),
    content: z.string().min(10).max(2000),
    photos: z.array(z.string().url()).max(5).optional(),
  }),

  /** إنشاء شركة */
  createCompany: z.object({
    name: z.string().min(2).max(100),
    type: z.enum(['hotel', 'restaurant', 'tour_operator', 'transport', 'other']),
    description: z.string().max(2000).optional(),
    email: z.string().email(),
    phone: z.string().min(9).max(15).optional(),
    website: z.string().url().optional(),
  }),

  /** إنشاء خدمة */
  createService: z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(5000).optional(),
    category: z.enum([
      'accommodation',
      'food',
      'transport',
      'tourism',
      'medical',
      'realestate',
      'other',
    ]),
    price: z.coerce.number().positive().optional(),
    priceUnit: z.enum(['night', 'person', 'trip', 'hour', 'item']).optional(),
    capacity: z.coerce.number().int().positive().optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).max(10).optional(),
  }),

  /** تمويل ضمان */
  fundEscrow: z.object({
    bookingId: z.string().min(1),
    amount: z.coerce.number().positive('المبلغ يجب أن يكون موجباً'),
  }),

  /** تحديث حالة */
  updateStatus: z.object({
    status: z.string().min(1),
    reason: z.string().max(500).optional(),
  }),
};
