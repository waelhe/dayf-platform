/**
 * Cart API Route - GET/POST/DELETE /api/cart
 *
 * GET: جلب سلة المستخدم
 * POST: إضافة عنصر للسلة
 * DELETE: تفريغ السلة
 *
 * Security: userId يُؤخذ من الجلسة فقط - حماية من IDOR
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCartRepository,
  getCartItemRepository,
} from '@/features/marketplace/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * GET /api/cart
 * جلب سلة المستخدم - يتطلب مصادقة
 *
 * Security: userId من الجلسة فقط
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const cartRepository = getCartRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط
    const cart = await cartRepository.findWithItemsByUserId(user.id);

    if (!cart) {
      // Create a new cart for the user
      const newCart = await cartRepository.create({ userId: user.id });
      return NextResponse.json({
        ...newCart,
        items: [],
        total: 0,
        itemCount: 0,
      });
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في جلب السلة' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * إضافة عنصر للسلة - يتطلب مصادقة
 *
 * Security: userId من الجلسة فقط
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'معرف المنتج مطلوب' },
        { status: 400 }
      );
    }

    const cartRepository = getCartRepository();
    const cartItemRepository = getCartItemRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط
    const cart = await cartRepository.getOrCreateForUser(user.id);

    // Check if item already exists
    const existingItem = await cartItemRepository.findByCartAndProduct(cart.id, productId);

    if (existingItem) {
      // Update quantity
      const updated = await cartItemRepository.updateQuantity(
        existingItem.id,
        existingItem.quantity + quantity
      );
      return NextResponse.json(updated);
    }

    // Create new item
    const cartItem = await cartItemRepository.create({
      cartId: cart.id,
      productId,
      quantity,
    });

    // Fetch the item with product info
    const itemsWithProduct = await cartItemRepository.findByCart(cart.id);
    const newItem = itemsWithProduct.find(item => item.id === cartItem.id);

    return NextResponse.json(newItem || cartItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to cart:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في إضافة العنصر للسلة' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * تفريغ السلة - يتطلب مصادقة
 *
 * Security: userId من الجلسة فقط
 */
export async function DELETE(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const cartRepository = getCartRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط
    const cart = await cartRepository.findByUserId(user.id);

    if (cart) {
      await cartRepository.clearCart(cart.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في تفريغ السلة' },
      { status: 500 }
    );
  }
}
