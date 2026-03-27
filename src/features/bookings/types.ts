/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Booking Types
 * 
 * أنواع البيانات للحجوزات
 */

import { BookingStatus } from '@/core/types/enums';

// Re-export for convenience
export { BookingStatus };

// Booking entity type
export interface Booking {
  id: string;
  guestId: string;
  hostId: string;
  serviceId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  escrowId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Booking with relations
export interface BookingWithRelations extends Booking {
  service: {
    id: string;
    title: string;
    images: string;
    location: string;
    price: number;
  };
  guest: {
    id: string;
    displayName: string;
    avatar: string | null;
  };
  host: {
    id: string;
    displayName: string;
    avatar: string | null;
  };
}

// Booking with minimal service info (for list views)
export interface BookingWithService extends Booking {
  service: {
    id: string;
    title: string;
    images: string;
    location: string;
    price: number;
  };
}

// Input type for creating a booking
export interface CreateBookingInput {
  guestId: string;
  hostId: string;
  serviceId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
}

// Input type for updating booking status
export interface UpdateBookingStatusInput {
  bookingId: string;
  status: BookingStatus;
}

// Booking filter options
export interface BookingFilters {
  status?: BookingStatus;
  guestId?: string;
  hostId?: string;
  serviceId?: string;
}

// Stats for provider dashboard
export interface BookingStats {
  totalEarnings: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}
