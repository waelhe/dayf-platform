import { NextRequest, NextResponse } from 'next/server';
import { getOrderRepository, getOrderItemRepository } from '@/features/orders/infrastructure/repositories';
import { getCartRepository, getCartItemRepository, getProductRepository } from '@/features/marketplace/infrastructure/repositories';
import { OrderStatus } from '@/core/types/enums';

// GET /api/orders - Get orders by user or all (admin)
export async function GET(request: NextRequest) {
  try {
    const orderRepo = getOrderRepository();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const all = searchParams.get('all');

    if (all === 'true') {
      // Admin: get all orders - would need a separate method in repository
      const orders = await orderRepo.findAll();
      return NextResponse.json({ orders, total: orders.length });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const orders = await orderRepo.findByUserWithItems(userId);
    return NextResponse.json({ orders, total: orders.length });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const orderRepo = getOrderRepository();
    const productRepo = getProductRepository();
    const cartRepo = getCartRepository();
    const cartItemRepo = getCartItemRepository();
    
    const body = await request.json();
    const { userId, items, shippingInfo } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'userId and items array are required' },
        { status: 400 }
      );
    }

    // Get product prices and calculate total
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = await productRepo.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const price = product.price;
      total += price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      });
    }

    // Create order with items
    const order = await orderRepo.createWithItems(
      {
        userId,
        total,
        status: OrderStatus.PENDING,
        escrowId: null,
      },
      orderItems
    );

    // Clear user's cart after successful order
    const carts = await cartRepo.findByUserId(userId);
    if (carts.length > 0) {
      const cart = carts[0];
      await cartItemRepo.deleteByCartId(cart.id);
    }

    return NextResponse.json({ 
      order,
      shippingInfo,
      message: 'تم إنشاء الطلب بنجاح'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء الطلب' },
      { status: 500 }
    );
  }
}
