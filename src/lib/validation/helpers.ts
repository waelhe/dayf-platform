/**
 * Validation Utility Functions
 * دوال مساعدة للتحقق من صحة البيانات
 */

import { ZodError, ZodSchema } from 'zod';

/**
 * Format Zod error to user-friendly Arabic message
 * تنسيق خطأ Zod إلى رسالة عربية مفهومة
 */
export function formatZodError(error: ZodError): string {
  const firstError = error.errors[0];
  
  if (!firstError) {
    return 'بيانات غير صالحة';
  }

  // ترجمة الرسائل الشائعة
  const messageMap: Record<string, string> = {
    'String must contain at least': 'الحقل قصير جداً',
    'Number must be positive': 'الرقم يجب أن يكون موجباً',
    'Required': 'هذا الحقل مطلوب',
    'Invalid enum value': 'قيمة غير صالحة',
    'Invalid email': 'البريد الإلكتروني غير صالح',
    'Invalid url': 'الرابط غير صالح',
  };

  const defaultMessage = firstError.message;
  
  // البحث عن ترجمة مناسبة
  for (const [key, value] of Object.entries(messageMap)) {
    if (defaultMessage.includes(key)) {
      return value;
    }
  }

  return defaultMessage;
}

/**
 * Validate request body against schema
 * التحقق من جسم الطلب مقابل المخطط
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    return { success: false, error: formatZodError(result.error) };
  } catch {
    return { success: false, error: 'خطأ في قراءة البيانات' };
  }
}

/**
 * Validate search params against schema
 * التحقق من معاملات البحث مقابل المخطط
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: formatZodError(result.error) };
}

/**
 * Create a safe parse response
 * إنشاء استجابة آمنة للتحقق
 */
export function createValidationResponse(error: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
