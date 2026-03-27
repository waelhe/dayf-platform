/**
 * Cart Item API Route - PATCH/DELETE /api/cart/[itemId]
 *
 * PATCH: تحديث كمية عنصر في السلة
 * DELETE: حذف عنصر من السلة
 *
 * Security: يتحقق من ملكية السلة للمستخدم
 * لمنع ثغرات IDOR - لا يمكن تعديل سلة مستخدم آخر
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCartItemRepository, getCartRepository } from '@/features/marketplace/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

/**
 * PATCH /api/cart/[itemId]
 * تحديث كمية عنصر - يتطلب ملكية السلة
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

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'الكمية يجب أن تكون 1 أو أكثر' },
        { status: 400 }
      );
    }

    const cartItemRepository = getCartItemRepository();
    const cartRepository = getCartRepository();

    // الحصول على عنصر السلة مع التحقق من الملكية
    const item = await cartItemRepository.findById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'العنصر غير موجود في السلة' },
        { status: 404 }
      );
    }

    // التحقق من أن السلة تابعة للمستخدم
    const cart = await cartRepository.findById(item.cartId);

    if (!cart || cart.userId !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح بتعديل هذه السلة' },
        { status: 403 }
      );
    }

    // تحديث الكمية
    const updatedItem = await cartItemRepository.updateQuantity(itemId, quantity);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating cart item:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في تحديث عنصر السلة' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[itemId]
 * حذف عنصر من السلة - يتطلب ملكية السلة
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

    const { itemId } = await params;

    const cartItemRepository = getCartItemRepository();
    const cartRepository = getCartRepository();

    // الحصول على عنصر السلة مع التحقق من الملكية
    const item = await cartItemRepository.findById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'العنصر غير موجود في السلة' },
        { status: 404 }
      );
    }

    // التحقق من أن السلة تابعة للمستخدم
    const cart = await cartRepository.findById(item.cartId);

    if (!cart || cart.userId !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح بحذف من هذه السلة' },
        { status: 403 }
      );
    }

    // حذف العنصر
    const success = await cartItemRepository.delete(itemId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error removing cart item:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في حذف عنصر السلة' },
      { status: 500 }
    );
  }
}
