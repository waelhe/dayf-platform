/**
 * Booking Repository Interface
 * واجهة مستودع الحجوزات
 * 
 * Defines the contract for booking data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { BookingStatus } from '@/core/types/enums';

export { BookingStatus };

/**
 * Booking entity interface
 * واجهة كيان الحجز
 */
export interface Booking extends BaseEntity {
  /** Guest (user) ID */
  guestId: string;
  
  /** Host (provider) ID */
  hostId: string;
  
  /** Service ID */
  serviceId: string;
  
  /** Check-in date */
  checkIn: Date | string;
  
  /** Check-out date */
  checkOut: Date | string;
  
  /** Number of guests */
  guests: number;
  
  /** Total price */
  totalPrice: number;
  
  /** Booking status */
  status: BookingStatus;
  
  /** Escrow ID if payment is held */
  escrowId: string | null;
}

/**
 * Booking filters
 * فلاتر الحجوزات
 */
export interface BookingFilters {
  status?: BookingStatus;
  guestId?: string;
  hostId?: string;
  serviceId?: string;
}

/**
 * Booking stats for provider
 * إحصائيات الحجوزات للمزود
 */
export interface BookingStats {
  totalEarnings: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

/**
 * Booking Repository Interface
 * واجهة مستودع الحجوزات
 */
export interface IBookingRepository extends IRepository<Booking> {
  /**
   * Find bookings by guest ID
   * البحث عن حجوزات بواسطة الضيف
   */
  findByGuest(guestId: string): Promise<Booking[]>;

  /**
   * Find bookings by host ID
   * البحث عن حجوزات بواسطة المضيف
   */
  findByHost(hostId: string): Promise<Booking[]>;

  /**
   * Find bookings with filters
   * البحث عن حجوزات مع فلاتر
   */
  findWithFilters(filters: BookingFilters): Promise<Booking[]>;

  /**
   * Update booking status
   * تحديث حالة الحجز
   */
  updateStatus(bookingId: string, status: BookingStatus): Promise<void>;

  /**
   * Check service availability
   * التحقق من توفر الخدمة
   */
  checkAvailability(
    serviceId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean>;

  /**
   * Get booking stats for provider
   * الحصول على إحصائيات الحجوزات للمزود
   */
  getStatsByHost(hostId: string): Promise<BookingStats>;

  /**
   * Link booking to escrow
   * ربط الحجز بالضمان
   */
  linkEscrow(bookingId: string, escrowId: string): Promise<void>;
}
