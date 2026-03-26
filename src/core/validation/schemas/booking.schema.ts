/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Booking Validation Schemas
 * 
 * مخططات التحقق للحجوزات
 */

import { z } from 'zod';
import { idSchema, priceSchema, dateSchema } from './common.schema';

/**
 * حالة الحجز
 */
export const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

/**
 * إنشاء حجز
 */
export const createBookingSchema = z.object({
  serviceId: idSchema,
  checkIn: dateSchema,
  checkOut: dateSchema,
  guests: z.number().int().min(1, 'يجب أن يكون ضيف واحد على الأقل').max(20, 'الحد الأقصى 20 ضيف'),
}).refine(
  (data) => data.checkOut > data.checkIn,
  { message: 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول', path: ['checkOut'] }
);

/**
 * تحديث حالة الحجز
 */
export const updateBookingStatusSchema = z.object({
  bookingId: idSchema,
  status: bookingStatusSchema,
});

/**
 * فلترة الحجوزات
 */
export const bookingFiltersSchema = z.object({
  status: bookingStatusSchema.optional(),
  guestId: idSchema.optional(),
  hostId: idSchema.optional(),
  serviceId: idSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

/**
 * أنواع الإدخال
 */
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type BookingFiltersInput = z.infer<typeof bookingFiltersSchema>;
