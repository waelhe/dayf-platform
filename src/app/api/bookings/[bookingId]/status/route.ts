/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Booking Status API Route
 *
 * PATCH /api/bookings/[bookingId]/status
 * Updates the status of a booking
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط الضيف أو المضيف أو المسؤول يمكنهم تغيير الحالة
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus, getBookingById } from '@/features/bookings';
import { BookingStatus } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

/**
 * PATCH /api/bookings/[bookingId]/status
 * تحديث حالة الحجز
 *
 * قواعد الوصول:
 * - الضيف (guest): يمكنه إلغاء الحجز (CANCELLED)
 * - المضيف (host): يمكنه تأكيد (CONFIRMED) أو إلغاء (CANCELLED) أو إكمال (COMPLETED)
 * - Admin: يمكنه أي شيء
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;
    const body = await request.json();
    const { status } = body as { status: BookingStatus };

    if (!bookingId) {
      return NextResponse.json(
        { error: 'معرف الحجز مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من صحة الحالة
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
    if (!status || !validStatuses.includes(status as typeof validStatuses[number])) {
      return NextResponse.json(
        { error: 'حالة غير صالحة. الحالات المسموحة: PENDING, CONFIRMED, CANCELLED, COMPLETED' },
        { status: 400 }
      );
    }

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    // bookings config يسمح لـ guest و host بالوصول
    const ownershipResult = await verifyOwnership('bookings', bookingId, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بتعديل هذا الحجز' },
        { status: 403 }
      );
    }

    // التحقق من وجود الحجز
    const existingBooking = await getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    // قواعد تغيير الحالة
    const currentStatus = existingBooking.status;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    // تحديد ما إذا كان المستخدم ضيف أو مضيف
    const isGuest = existingBooking.guestId === user.id;
    const isHost = existingBooking.hostId === user.id;

    // قواعد انتقال الحالة
    const allowedTransitions: Record<string, string[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],      // من Pending يمكن التأكيد أو الإلغاء
      'CONFIRMED': ['COMPLETED', 'CANCELLED'],    // من Confirmed يمكن الإكمال أو الإلغاء
      'COMPLETED': [],                             // مكتمل - لا يمكن تغييره
      'CANCELLED': [],                             // ملغي - لا يمكن تغييره
    };

    // التحقق من صحة انتقال الحالة
    if (!isAdmin && !allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `لا يمكن تغيير الحالة من ${currentStatus} إلى ${status}` },
        { status: 400 }
      );
    }

    // قواعد خاصة لكل دور
    if (!isAdmin) {
      // الضيف يمكنه فقط الإلغاء
      if (isGuest && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'الضيف يمكنه فقط إلغاء الحجز' },
          { status: 403 }
        );
      }

      // المضيف يمكنه التأكيد أو الإلغاء أو الإكمال
      if (isHost && status === 'PENDING') {
        return NextResponse.json(
          { error: 'المضيف لا يمكنه إرجاع الحجز للحالة المعلقة' },
          { status: 400 }
        );
      }
    }

    // تحديث حالة الحجز
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

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في تحديث حالة الحجز' },
      { status: 500 }
    );
  }
}
