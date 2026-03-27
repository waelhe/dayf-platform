/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wishlist Check API
 * التحقق من المفضلة
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWishlistRepository } from '@/features/marketplace/infrastructure/repositories';

// GET - التحقق إذا كانت الخدمة/المنتج في المفضلة
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const productId = searchParams.get('productId');

    if (!serviceId && !productId) {
      return NextResponse.json({
        success: true,
        isFavorite: false,
        itemId: null,
      });
    }

    const wishlistRepository = getWishlistRepository();
    const item = await wishlistRepository.findByUserAndItem(userId, serviceId, productId);

    return NextResponse.json({
      success: true,
      isFavorite: item !== null,
      itemId: item?.id || null,
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
