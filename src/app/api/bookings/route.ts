import { NextRequest, NextResponse } from 'next/server';
import { getBookingRepository } from '@/features/bookings/infrastructure/repositories';
import { BookingStatus } from '@/core/types/enums';

export async function POST(request: NextRequest) {
  try {
    const bookingRepo = getBookingRepository();
    const body = await request.json();
    const { guestId, hostId, serviceId, checkIn, checkOut, guests, totalPrice } = body;

    // Validate required fields
    if (!guestId || !hostId || !serviceId || !checkIn || !checkOut || !guests || !totalPrice) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate < now) {
      return NextResponse.json(
        { error: 'لا يمكن الحجز في تاريخ سابق' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول' },
        { status: 400 }
      );
    }

    // Check availability
    const isAvailable = await bookingRepo.checkAvailability(serviceId, checkInDate, checkOutDate);
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'الخدمة غير متاحة في هذه الفترة' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await bookingRepo.create({
      guestId,
      hostId,
      serviceId,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      guests,
      totalPrice,
      status: BookingStatus.PENDING,
      escrowId: null,
    });

    return NextResponse.json({
      id: booking.id,
      message: 'تم إنشاء الحجز بنجاح',
      booking,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء الحجز' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const bookingRepo = getBookingRepository();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as BookingStatus | null;
    const role = searchParams.get('role'); // 'guest' or 'host'

    const filters: { status?: BookingStatus; guestId?: string; hostId?: string } = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (userId) {
      if (role === 'host') {
        filters.hostId = userId;
      } else {
        filters.guestId = userId;
      }
    }

    const bookings = await bookingRepo.findWithFilters(filters);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الحجوزات' },
      { status: 500 }
    );
  }
}
