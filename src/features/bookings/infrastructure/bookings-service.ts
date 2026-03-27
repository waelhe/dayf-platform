/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bookings Service
 * 
 * خدمة الحجوزات - باستخدام Repository Pattern
 * 
 * 🏛️ Constitutional Compliance:
 * - المادة I: Escrow إلزامي لكل حجز
 * - المادة V: نشر أحداث للتواصل بين الوحدات
 */

import { getBookingRepository } from './repositories';
import { servicesService } from '@/features/services/infrastructure/services-service';
import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import { getEscrowRepository } from '@/features/escrow/infrastructure/repositories';
import { eventBus } from '@/core/events';
import { EVENTS } from '@/core/events/types';
import { BookingStatus, EscrowStatus } from '@/core/types/enums';
import type {
  CreateBookingInput,
  BookingWithService,
} from '../types';
import type { Booking } from '../domain/interfaces';
import type { Service } from '@/features/services/domain/interfaces';

// ============================================
// Constants
// ============================================

// رسوم المنصة (5%)
const PLATFORM_FEE_PERCENTAGE = 0.05;

// ============================================
// Create Booking - مع Escrow تلقائي
// ============================================

/**
 * Create a new booking with automatic Escrow creation
 * 
 * 🏛️ المادة I: Escrow مطلوب لكل حجز
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  
  // 1. التحقق من التوفر
  const isAvailable = await bookingRepo.checkAvailability(
    input.serviceId,
    new Date(input.checkIn),
    new Date(input.checkOut)
  );
  
  if (!isAvailable) {
    throw new Error('الخدمة غير متاحة في هذه الفترة');
  }
  
  // 2. حساب الرسوم
  const platformFee = input.totalPrice * PLATFORM_FEE_PERCENTAGE;
  
  // 3. إنشاء الحجز
  const booking = await bookingRepo.create({
    guestId: input.guestId,
    hostId: input.hostId,
    serviceId: input.serviceId,
    checkIn: input.checkIn instanceof Date ? input.checkIn.toISOString() : input.checkIn,
    checkOut: input.checkOut instanceof Date ? input.checkOut.toISOString() : input.checkOut,
    guests: input.guests,
    totalPrice: input.totalPrice,
    status: BookingStatus.PENDING,
    escrowId: null,
  });
  
  // 4. إنشاء Escrow تلقائياً (المادة I)
  const escrow = await EscrowService.createEscrow({
    buyerId: input.guestId,
    providerId: input.hostId,
    amount: input.totalPrice,
    platformFee,
    currency: 'SYP',
    referenceType: 'BOOKING',
    referenceId: booking.id,
    notes: `ضمان للحجز #${booking.id}`,
  });
  
  // 5. تحديث الحجز بـ escrowId
  await bookingRepo.update(booking.id, { escrowId: escrow.id });
  
  // 6. نشر حدث booking.created (المادة V)
  await eventBus.publish(EVENTS.BOOKING_CREATED, {
    bookingId: booking.id,
    guestId: input.guestId,
    hostId: input.hostId,
    serviceId: input.serviceId,
    escrowId: escrow.id,
    totalPrice: input.totalPrice,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });
  
  return { ...booking, escrowId: escrow.id };
}

// ============================================
// Get Bookings - مع بيانات الخدمة
// ============================================

/**
 * Get all bookings for a guest (user) with service data
 */
export async function getUserBookings(guestId: string): Promise<BookingWithService[]> {
  const bookingRepo = getBookingRepository();
  
  const bookings = await bookingRepo.findByGuest(guestId);
  
  // جلب بيانات الخدمات
  const serviceIds = [...new Set(bookings.map(b => b.serviceId))];
  const services = await Promise.all(
    serviceIds.map(id => servicesService.getById(id))
  );
  
  const serviceMap = new Map(services.filter(Boolean).map(s => [s!.id, s!]));
  
  return bookings.map(booking => {
    const service = serviceMap.get(booking.serviceId);
    return {
      ...booking,
      service: {
        id: booking.serviceId,
        title: service?.title ?? 'خدمة غير متوفرة',
        images: Array.isArray(service?.images) ? service!.images.join(',') : (service?.images ?? ''),
        location: service?.location ?? '',
        price: service?.price ?? booking.totalPrice,
      },
    };
  });
}

/**
 * Get all bookings for a host (provider) with service data
 */
export async function getProviderBookings(hostId: string): Promise<BookingWithService[]> {
  const bookingRepo = getBookingRepository();
  
  const bookings = await bookingRepo.findByHost(hostId);
  
  // جلب بيانات الخدمات
  const serviceIds = [...new Set(bookings.map(b => b.serviceId))];
  const services = await Promise.all(
    serviceIds.map(id => servicesService.getById(id))
  );
  
  const serviceMap = new Map(services.filter(Boolean).map(s => [s!.id, s!]));
  
  return bookings.map(booking => {
    const service = serviceMap.get(booking.serviceId);
    return {
      ...booking,
      service: {
        id: booking.serviceId,
        title: service?.title ?? 'خدمة غير متوفرة',
        images: Array.isArray(service?.images) ? service!.images.join(',') : (service?.images ?? ''),
        location: service?.location ?? '',
        price: service?.price ?? booking.totalPrice,
      },
    };
  });
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const bookingRepo = getBookingRepository();
  return bookingRepo.findById(bookingId);
}

// ============================================
// Update Booking Status - مع التحقق من Escrow
// ============================================

/**
 * Update booking status (internal)
 */
async function _updateStatus(
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  
  await bookingRepo.updateStatus(bookingId, status);
  
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw new Error('الحجز غير موجود بعد التحديث');
  }
  
  return booking;
}

// ============================================
// Confirm Booking - التحقق من Escrow
// ============================================

/**
 * Confirm a booking
 * 
 * 🏛️ المادة I: التحقق من Escrow ممول قبل التأكيد
 */
export async function confirmBooking(bookingId: string): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  const escrowRepo = getEscrowRepository();
  
  // 1. جلب الحجز
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw new Error('الحجز غير موجود');
  }
  
  // 2. التحقق من وجود Escrow (المادة I)
  if (!booking.escrowId) {
    throw new Error('Escrow مطلوب لتأكيد الحجز');
  }
  
  // 3. التحقق من أن Escrow ممول
  const escrow = await escrowRepo.findById(booking.escrowId);
  if (!escrow) {
    throw new Error('حساب الضمان غير موجود');
  }
  
  if (escrow.status !== EscrowStatus.FUNDED) {
    throw new Error('يجب تمويل حساب الضمان أولاً قبل تأكيد الحجز');
  }
  
  // 4. تأكيد الحجز
  const confirmedBooking = await _updateStatus(bookingId, BookingStatus.CONFIRMED);
  
  // 5. نشر حدث booking.confirmed
  await eventBus.publish(EVENTS.BOOKING_CONFIRMED, {
    bookingId,
    guestId: booking.guestId,
    hostId: booking.hostId,
    confirmedAt: new Date(),
  });
  
  return confirmedBooking;
}

// ============================================
// Complete Booking - نشر حدث الاكتمال
// ============================================

/**
 * Mark booking as completed
 * 
 * 🏛️ المادة V: نشر حدث booking.completed لإطلاق سلسلة الأحداث
 */
export async function completeBooking(bookingId: string): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  
  // 1. جلب الحجز
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw new Error('الحجز غير موجود');
  }
  
  // 2. تحديث الحالة
  const completedBooking = await _updateStatus(bookingId, BookingStatus.COMPLETED);
  
  // 3. نشر حدث booking.completed (المادة V)
  // هذا يُطلق سلسلة: Review request → Loyalty points → Gamification
  await eventBus.publish(EVENTS.BOOKING_COMPLETED, {
    bookingId,
    guestId: booking.guestId,
    hostId: booking.hostId,
    serviceId: booking.serviceId,
    totalPrice: booking.totalPrice,
    completedAt: new Date(),
  });
  
  return completedBooking;
}

// ============================================
// Cancel Booking
// ============================================

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, cancelledBy: string, reason?: string): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  
  // 1. جلب الحجز
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw new Error('الحجز غير موجود');
  }
  
  // 2. إلغاء الحجز
  const cancelledBooking = await _updateStatus(bookingId, BookingStatus.CANCELLED);
  
  // 3. إذا كان هناك Escrow ممول، استرد المبلغ
  if (booking.escrowId) {
    try {
      await EscrowService.cancelEscrow(booking.escrowId, reason ?? 'إلغاء الحجز');
    } catch (error) {
      console.error('Failed to cancel escrow:', error);
      // نستمر حتى لو فشل إلغاء Escrow
    }
  }
  
  // 4. نشر حدث booking.cancelled
  await eventBus.publish(EVENTS.BOOKING_CANCELLED, {
    bookingId,
    guestId: booking.guestId,
    hostId: booking.hostId,
    cancelledBy,
    reason,
  });
  
  return cancelledBooking;
}

// ============================================
// Stats & Availability
// ============================================

/**
 * Get booking stats for a provider
 */
export async function getProviderBookingStats(hostId: string) {
  const bookingRepo = getBookingRepository();
  return bookingRepo.getStatsByHost(hostId);
}

/**
 * Check if a service is available for the given dates
 */
export async function checkServiceAvailability(
  serviceId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const bookingRepo = getBookingRepository();
  return bookingRepo.checkAvailability(serviceId, checkIn, checkOut);
}

/**
 * Get bookings with filters
 */
export async function getBookingsWithFilters(filters: {
  status?: BookingStatus;
  guestId?: string;
  hostId?: string;
  serviceId?: string;
}): Promise<Booking[]> {
  const bookingRepo = getBookingRepository();
  return bookingRepo.findWithFilters(filters);
}
