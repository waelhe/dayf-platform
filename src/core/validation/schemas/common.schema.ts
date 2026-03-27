/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Common Validation Schemas
 * 
 * مخططات التحقق المشتركة
 */

import { z } from 'zod';

/**
 * التحقق من المعرف
 */
export const idSchema = z.string().min(1, 'المعرف مطلوب');

/**
 * التحقق من البريد الإلكتروني
 */
export const emailSchema = z
  .string()
  .min(1, 'البريد الإلكتروني مطلوب')
  .email('البريد الإلكتروني غير صالح');

/**
 * التحقق من كلمة المرور
 */
export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
  .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم');

/**
 * التحقق من كلمة المرور (بسيط)
 */
export const simplePasswordSchema = z
  .string()
  .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

/**
 * التحقق من الاسم
 */
export const nameSchema = z
  .string()
  .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
  .max(100, 'الاسم طويل جداً');

/**
 * التحقق من رقم الهاتف
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{10,15}$/, 'رقم الهاتف غير صالح');

/**
 * التحقق من السعر
 */
export const priceSchema = z
  .number()
  .positive('السعر يجب أن يكون أكبر من صفر')
  .max(1000000, 'السعر كبير جداً');

/**
 * التحقق من التاريخ
 */
export const dateSchema = z.date();

/**
 * التحقق من نطاق التاريخ
 */
export const dateRangeSchema = z.object({
  start: dateSchema,
  end: dateSchema,
}).refine(
  (data) => data.end > data.start,
  { message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' }
);

/**
 * التحقق من الصور
 */
export const imageUrlSchema = z.string().url('رابط الصورة غير صالح');

/**
 * التحقق من نص الوصف
 */
export const descriptionSchema = z
  .string()
  .min(10, 'الوصف قصير جداً')
  .max(5000, 'الوصف طويل جداً');

/**
 * التحقق من التقييم
 */
export const ratingSchema = z
  .number()
  .min(0, 'التقييم يجب أن يكون 0 على الأقل')
  .max(5, 'التقييم يجب أن يكون 5 على الأكثر');

/**
 * التحقق من الصفحات
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * التحقق من البحث
 */
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.record(z.string(), z.string()).optional(),
  sort: z.enum(['asc', 'desc']).optional(),
});

/**
 * نوع الاستجابة
 */
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
