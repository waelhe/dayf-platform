/**
 * Wishlist Item API Route - DELETE/GET /api/wishlist/[id]
 *
 * DELETE: حذف عنصر من المفضلة
 * GET: التحقق إذا كان العنصر في المفضلة
 *
 * Security: userId يُؤخذ من الجلسة فقط - حماية من IDOR
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWishlistRepository } from '@/features/marketplace/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/wishlist/[id]
 * حذف عنصر من المفضلة - يتطلب مصادقة
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const wishlistRepository = getWishlistRepository();

    // ✅ SECURITY: استخدام user.id من الجلسة فقط
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

/**
 * GET /api/wishlist/[id]
 * التحقق إذا كان العنصر في المفضلة - يتطلب مصادقة
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const wishlistRepository = getWishlistRepository();

    // التحقق إذا كان العنصر موجوداً في مفضلة المستخدم
    const item = await wishlistRepository.findById(id);

    // ✅ SECURITY: التحقق من الملكية
    const isFavorite = item !== null && item.userId === user.id;

    return NextResponse.json({
      success: true,
      isFavorite,
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
