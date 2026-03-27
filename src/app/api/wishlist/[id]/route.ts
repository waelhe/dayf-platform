/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wishlist Item API
 * API لعنصر المفضلة
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWishlistRepository } from '@/features/marketplace/infrastructure/repositories';

// DELETE - حذف عنصر من المفضلة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const wishlistRepository = getWishlistRepository();
    await wishlistRepository.removeByUserAndId(userId, id);

    return NextResponse.json({
      success: true,
      message: 'تم الحذف من المفضلة',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الحذف من المفضلة' },
      { status: 500 }
    );
  }
}

// GET - التحقق إذا كان العنصر في المفضلة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const wishlistRepository = getWishlistRepository();

    // Check if the item exists and belongs to the user
    const item = await wishlistRepository.findById(id);

    const isFavorite = item !== null && item.userId === userId;

    return NextResponse.json({
      success: true,
      isFavorite,
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
