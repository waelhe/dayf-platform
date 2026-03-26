import { NextRequest, NextResponse } from 'next/server';
import {
  getCartRepository,
  getCartItemRepository,
} from '@/features/marketplace/infrastructure/repositories';

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const cartRepository = getCartRepository();

    // Get or create cart with items
    const cart = await cartRepository.findWithItemsByUserId(userId);

    if (!cart) {
      // Create a new cart for the user
      const newCart = await cartRepository.create({ userId });
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
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, quantity = 1 } = body;

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'userId and productId are required' },
        { status: 400 }
      );
    }

    const cartRepository = getCartRepository();
    const cartItemRepository = getCartItemRepository();

    // Get or create cart
    const cart = await cartRepository.getOrCreateForUser(userId);

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
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const cartRepository = getCartRepository();
    const cart = await cartRepository.findByUserId(userId);

    if (cart) {
      await cartRepository.clearCart(cart.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
