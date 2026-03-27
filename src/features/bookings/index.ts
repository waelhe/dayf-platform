/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bookings Feature Exports
 */

// Types
export type {
  Booking,
  BookingWithRelations,
  BookingWithService,
  CreateBookingInput,
  UpdateBookingStatusInput,
  BookingFilters,
  BookingStats,
} from './types';

// Domain Interfaces
export * from './domain/interfaces';

// Services
export {
  createBooking,
  getUserBookings,
  getProviderBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  confirmBooking,
  completeBooking,
  getProviderBookingStats,
  checkServiceAvailability,
  getBookingsWithFilters,
} from './infrastructure/bookings-service';

// Repositories
export { getBookingRepository } from './infrastructure/repositories';

// Components
export { default as BookingManagement } from './components/BookingManagement';
