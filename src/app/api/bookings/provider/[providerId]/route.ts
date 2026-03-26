/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider Bookings API Route
 * 
 * GET /api/bookings/provider/[providerId]
 * Returns all bookings for a specific provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProviderBookings } from '@/features/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const bookings = await getProviderBookings(providerId);

    // Transform bookings for client consumption
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      serviceId: booking.serviceId,
      serviceTitle: booking.service.title,
      providerId: booking.hostId,
      userId: booking.guestId,
      userEmail: 'user@example.com', // Would need to include guest relation
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    }));

    return NextResponse.json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
