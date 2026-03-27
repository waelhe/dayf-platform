/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * User Bookings API Route
 *
 * GET /api/bookings/user/[userId]
 * Returns all bookings for a specific user (guest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBookings } from '@/features/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const bookings = await getUserBookings(userId);

    // Transform bookings for client consumption
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      serviceId: booking.serviceId,
      serviceTitle: booking.service.title,
      serviceImage: booking.service.images,
      serviceLocation: booking.service.location,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    }));

    return NextResponse.json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
