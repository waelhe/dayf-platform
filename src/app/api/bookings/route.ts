/**
 * Bookings API Route - GET/POST /api/bookings
 * 
 * GET: قائمة حجوزات المستخدم
 * POST: إنشاء حجز جديد (يتطلب مصادقة)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBookingRepository } from '@/features/bookings/infrastructure/repositories';
import { BookingStatus } from '@/core/types/enums';
import { getAuthUser, AuthError, requireOwnerOrAdmin } from '@/lib/auth/middleware';
import { createBookingSchema, formatZodError, paginationSchema } from '@/lib/validation/schemas';

/**
 * POST /api/bookings
 * إنشاء حجز جديد
 * @requires AUTH
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // التحقق من صحة البيانات باستخدام Zod
    const validatedData = createBookingSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    const { hostId, serviceId, checkIn, checkOut, guests, totalPrice } = validatedData.data;
    const bookingRepo = getBookingRepository();

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

    // Create booking with authenticated user as guest
    const booking = await bookingRepo.create({
      guestId: user.id, // ✅ من الجلسة فقط - حماية من IDOR
      hostId,
      serviceId,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      guests,
      totalPrice,
      status: BookingStatus.PENDING,
      escrowId: null,
    });

    // تسجيل النشاط
    console.log(`[Bookings] User ${user.id} created booking ${booking.id}`);

    return NextResponse.json({
      id: booking.id,
      message: 'تم إنشاء الحجز بنجاح',
      booking,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'فشل في إنشاء الحجز' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * قائمة حجوزات المستخدم
 * @requires AUTH
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // التحقق من صحة معاملات التصفح
    const validatedParams = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: formatZodError(validatedParams.error) },
        { status: 400 }
      );
    }

    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as BookingStatus | null;
    const role = searchParams.get('role'); // 'guest' or 'host'

    // الأمان: المستخدم يرى حجوزاته فقط (ما لم يكن مديراً)
    const targetUserId = userId || user.id;
    if (targetUserId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح بعرض حجوزات مستخدم آخر' },
        { status: 403 }
      );
    }

    const bookingRepo = getBookingRepository();
    const filters: { status?: BookingStatus; guestId?: string; hostId?: string } = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (targetUserId) {
      if (role === 'host') {
        filters.hostId = targetUserId;
      } else {
        filters.guestId = targetUserId;
      }
    }

    const bookings = await bookingRepo.findWithFilters(filters);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'فشل في جلب الحجوزات' },
      { status: 500 }
    );
  }
}
