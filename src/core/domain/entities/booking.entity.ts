/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Booking Entity
 * 
 * كيان الحجز
 */

import type { BaseEntity } from './base.entity';

/**
 * حالة الحجز
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * كيان الحجز
 */
export interface BookingEntity extends BaseEntity {
  guestId: string;
  hostId: string;
  serviceId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
}

/**
 * قواعد الحجز
 */
export const BOOKING_RULES = {
  MIN_GUESTS: 1,
  MAX_GUESTS: 20,
  MIN_NIGHTS: 1,
  MAX_NIGHTS: 365,
  CANCELLATION_HOURS: 24,
} as const;

/**
 * التحقق من صحة الحجز
 */
export function validateBookingDates(checkIn: Date, checkOut: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (checkIn < now) return false;
  if (checkOut <= checkIn) return false;
  
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights < BOOKING_RULES.MIN_NIGHTS || nights > BOOKING_RULES.MAX_NIGHTS) return false;
  
  return true;
}

/**
 * حساب عدد الليالي
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * حساب السعر الإجمالي
 */
export function calculateTotalPrice(pricePerNight: number, nights: number): number {
  return pricePerNight * nights;
}

/**
 * التحقق من إمكانية الإلغاء
 */
export function canCancel(booking: BookingEntity): boolean {
  if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
    return false;
  }
  
  const now = new Date();
  const hoursBeforeCheckIn = (booking.checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursBeforeCheckIn >= BOOKING_RULES.CANCELLATION_HOURS;
}

/**
 * الانتقالات المسموحة للحالة
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
};

/**
 * التحقق من صحة انتقال الحالة
 */
export function isValidStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}
