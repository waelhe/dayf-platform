/**
 * Order API Route - GET/PATCH/DELETE /api/orders/[id]
 *
 * GET: تفاصيل طلب (يتطلب ملكية)
 * PATCH: تحديث حالة الطلب (يتطلب ملكية)
 * DELETE: إلغاء الطلب (يتطلب ملكية)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط صاحب الطلب أو المسؤول يمكنهم الوصول
 */

import { NextRequest, NextResponse } from 'next/server';
import { ordersService } from '@/features/orders/infrastructure/orders-service';
import { OrderStatus } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orders/[id]
 * تفاصيل الطلب - يتطلب ملكية أو Admin
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('orders', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بالوصول لهذا الطلب' },
        { status: 403 }
      );
    }

    const order = await ordersService.getById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'الطلب غير موجود', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في جلب الطلب' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * تحديث حالة الطلب - يتطلب ملكية أو Admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
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

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('orders', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بتعديل هذا الطلب' },
        { status: 403 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'الحالة مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة الحالة
    const validStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة غير صالحة', validStatuses },
        { status: 400 }
      );
    }

    const order = await ordersService.updateStatus(id, status);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في تحديث الطلب' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]
 * إلغاء الطلب - يتطلب ملكية أو Admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('orders', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بإلغاء هذا الطلب' },
        { status: 403 }
      );
    }

    const order = await ordersService.cancel(id);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في إلغاء الطلب' },
      { status: 500 }
    );
  }
}
