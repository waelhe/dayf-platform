/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * App Error - الخطأ الأساسي
 * 
 * الخطأ الأساسي لجميع أخطاء التطبيق
 */

/**
 * رموز الأخطاء
 */
export enum ErrorCode {
  // المصادقة
  AUTH_001 = 'AUTH_001', // بيانات اعتماد غير صالحة
  AUTH_002 = 'AUTH_002', // الجلسة منتهية
  AUTH_003 = 'AUTH_003', // غير مصرح
  AUTH_004 = 'AUTH_004', // المستخدم موجود مسبقاً
  
  // الحجوزات
  BOOKING_001 = 'BOOKING_001', // غير متاح
  BOOKING_002 = 'BOOKING_002', // تواريخ غير صالحة
  BOOKING_003 = 'BOOKING_003', // تجاوز الضيوف
  BOOKING_004 = 'BOOKING_004', // لا يمكن الإلغاء
  
  // المدفوعات
  PAYMENT_001 = 'PAYMENT_001', // فشل الدفع
  PAYMENT_002 = 'PAYMENT_002', // استرداد غير مسموح
  
  // التحقق
  VALIDATION_001 = 'VALIDATION_001', // بيانات غير صالحة
  VALIDATION_002 = 'VALIDATION_002', // حقل مطلوب
  
  // عام
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * رسائل الأخطاء
 */
export const ERROR_MESSAGES: Record<ErrorCode, { ar: string; en: string }> = {
  [ErrorCode.AUTH_001]: {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    en: 'Invalid email or password',
  },
  [ErrorCode.AUTH_002]: {
    ar: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
    en: 'Session expired, please login again',
  },
  [ErrorCode.AUTH_003]: {
    ar: 'غير مصرح لك بالوصول',
    en: 'Unauthorized access',
  },
  [ErrorCode.AUTH_004]: {
    ar: 'البريد الإلكتروني مستخدم مسبقاً',
    en: 'Email already exists',
  },
  [ErrorCode.BOOKING_001]: {
    ar: 'الإقامة غير متاحة في هذه التواريخ',
    en: 'Accommodation not available for these dates',
  },
  [ErrorCode.BOOKING_002]: {
    ar: 'التواريخ المحددة غير صالحة',
    en: 'Invalid dates selected',
  },
  [ErrorCode.BOOKING_003]: {
    ar: 'عدد الضيوف يتجاوز الحد المسموح',
    en: 'Guests count exceeds maximum allowed',
  },
  [ErrorCode.BOOKING_004]: {
    ar: 'لا يمكن إلغاء الحجز في هذا الوقت',
    en: 'Cannot cancel booking at this time',
  },
  [ErrorCode.PAYMENT_001]: {
    ar: 'فشل في عملية الدفع',
    en: 'Payment failed',
  },
  [ErrorCode.PAYMENT_002]: {
    ar: 'الاسترداد غير مسموح لهذا الحجز',
    en: 'Refund not allowed for this booking',
  },
  [ErrorCode.VALIDATION_001]: {
    ar: 'البيانات المدخلة غير صالحة',
    en: 'Invalid input data',
  },
  [ErrorCode.VALIDATION_002]: {
    ar: 'هذا الحقل مطلوب',
    en: 'This field is required',
  },
  [ErrorCode.NOT_FOUND]: {
    ar: 'المورد غير موجود',
    en: 'Resource not found',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    ar: 'حدث خطأ داخلي، يرجى المحاولة لاحقاً',
    en: 'Internal error, please try again later',
  },
  [ErrorCode.RATE_LIMIT]: {
    ar: 'طلبات كثيرة، يرجى الانتظار',
    en: 'Too many requests, please wait',
  },
};

/**
 * الخطأ الأساسي
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    statusCode: number = 400,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * الحصول على رسالة الخطأ
   */
  getMessage(language: 'ar' | 'en' = 'ar'): string {
    return ERROR_MESSAGES[this.code][language];
  }

  /**
   * تحويل إلى JSON
   */
  toJSON(language: 'ar' | 'en' = 'ar') {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.getMessage(language),
        details: this.details,
      },
    };
  }
}

/**
 * أخطاء محددة
 */
export class ValidationError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_001, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(code: ErrorCode = ErrorCode.AUTH_001) {
    super(code, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor() {
    super(ErrorCode.AUTH_003, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(ErrorCode.NOT_FOUND, 404, true, details);
  }
}

export class BookingError extends AppError {
  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code, 400, true, details);
  }
}

export class PaymentError extends AppError {
  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code, 402, true, details);
  }
}
