/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Booking Status API Route
 * 
 * PATCH /api/bookings/[bookingId]/status
 * Updates the status of a booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus, getBookingById } from '@/features/bookings';
import { BookingStatus } from '@/core/types/enums';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { status } = body as { status: BookingStatus };

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (PENDING, CONFIRMED, CANCELLED, COMPLETED)' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking status
    const updatedBooking = await updateBookingStatus(bookingId, status);

    return NextResponse.json({ 
      success: true, 
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
