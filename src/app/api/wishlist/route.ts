/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wishlist API - GET/POST/DELETE /api/wishlist
 *
 * GET: جلب المفضلة
 * POST: إضافة للمفضلة
 * DELETE: حذف من المفضلة
 *
 * Security: userId يُؤخذ من الجلسة فقط - حماية من IDOR
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWishlistRepository } from '@/features/marketplace/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * GET /api/wishlist
 * جلب المفضلة - يتطلب مصادقة
 *
 * Security: userId من الجلسة فقط
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const wishlistRepository = getWishlistRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط
    const wishlistItems = await wishlistRepository.findByUserId(user.id);

    // Transform to match the expected output format
    const transformedItems = wishlistItems.map(item => ({
      id: item.id,
      serviceId: item.serviceId,
      productId: item.productId,
      createdAt: item.createdAt,
      type: item.type,
      name: item.name,
      location: item.location,
      price: item.price,
      rating: item.rating,
      image: item.image || '/placeholder.jpg',
    }));

    return NextResponse.json({
      success: true,
      items: transformedItems,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب المفضلة' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * إضافة للمفضلة - يتطلب مصادقة
 *
 * Security: userId من الجلسة فقط
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serviceId, productId } = body;

    if (!serviceId && !productId) {
      return NextResponse.json(
        { success: false, error: 'يجب تحديد الخدمة أو المنتج' },
        { status: 400 }
      );
    }

    const wishlistRepository = getWishlistRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط
    // التحقق من عدم وجود العنصر مسبقاً
    const exists = await wishlistRepository.existsByUserAndItem(user.id, serviceId, productId);

    if (exists) {
      return NextResponse.json(
        { success: false, error: 'العنصر موجود مسبقاً في المفضلة' },
        { status: 400 }
      );
    }

    // إضافة للمفضلة
    await wishlistRepository.create({
      userId: user.id,
      serviceId: serviceId || null,
      productId: productId || null,
    });

    return NextResponse.json({
      success: true,
      message: 'تمت الإضافة للمفضلة',
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الإضافة للمفضلة' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist
 * حذف من المفضلة - يتطلب مصادقة
 *
 * Security: userId من الجلسة فقط + التحقق من الملكية
 */
export async function DELETE(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العنصر مطلوب' },
        { status: 400 }
      );
    }

    const wishlistRepository = getWishlistRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط + التحقق من الملكية
    await wishlistRepository.removeByUserAndId(user.id, id);

    return NextResponse.json({
      success: true,
      message: 'تم الحذف من المفضلة',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الحذف من المفضلة' },
      { status: 500 }
    );
  }
}
