/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bookings Service
 * 
 * خدمة الحجوزات - باستخدام Repository Pattern
 */

import { getBookingRepository } from './repositories';
import { BookingStatus } from '@/core/types/enums';
import type {
  CreateBookingInput,
  BookingWithService,
} from '../types';
import type { Booking } from '../domain/interfaces';

/**
 * Create a new booking
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  
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
  
  return booking;
}

/**
 * Get all bookings for a guest (user)
 */
export async function getUserBookings(guestId: string): Promise<BookingWithService[]> {
  const bookingRepo = getBookingRepository();
  
  const bookings = await bookingRepo.findByGuest(guestId);
  
  // Transform to BookingWithService format
  // Note: Service data would need to be fetched separately or joined
  return bookings.map(booking => ({
    ...booking,
    service: {
      id: booking.serviceId,
      title: '',  // Would need to fetch from service
      images: '',
      location: '',
      price: 0,
    },
  }));
}

/**
 * Get all bookings for a host (provider)
 */
export async function getProviderBookings(hostId: string): Promise<BookingWithService[]> {
  const bookingRepo = getBookingRepository();
  
  const bookings = await bookingRepo.findByHost(hostId);
  
  return bookings.map(booking => ({
    ...booking,
    service: {
      id: booking.serviceId,
      title: '',
      images: '',
      location: '',
      price: 0,
    },
  }));
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const bookingRepo = getBookingRepository();
  return bookingRepo.findById(bookingId);
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  
  await bookingRepo.updateStatus(bookingId, status);
  
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found after update');
  }
  
  return booking;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.CANCELLED);
}

/**
 * Confirm a booking
 */
export async function confirmBooking(bookingId: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.COMPLETED);
}

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
