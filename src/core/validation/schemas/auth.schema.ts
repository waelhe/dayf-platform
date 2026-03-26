/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Auth Validation Schemas
 * 
 * مخططات التحقق للمصادقة
 */

import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema, simplePasswordSchema } from './common.schema';

/**
 * تسجيل الدخول
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

/**
 * إنشاء حساب
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: nameSchema,
  language: z.enum(['ar', 'en']).optional().default('ar'),
});

/**
 * تحديث الملف الشخصي
 */
export const updateProfileSchema = z.object({
  displayName: nameSchema.optional(),
  photoURL: z.string().url().optional().nullable(),
  language: z.enum(['ar', 'en']).optional(),
});

/**
 * تغيير كلمة المرور
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'كلمتا المرور غير متطابقتين', path: ['confirmPassword'] }
);

/**
 * إعادة تعيين كلمة المرور
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * تأكيد إعادة التعيين
 */
export const confirmPasswordResetSchema = z.object({
  token: z.string().min(1, 'الرمز مطلوب'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'كلمتا المرور غير متطابقتين', path: ['confirmPassword'] }
);

/**
 * أنواع الإدخال
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
