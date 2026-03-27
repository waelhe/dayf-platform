/**
 * Orders API Route - GET/POST /api/orders
 * 
 * GET: قائمة طلبات المستخدم
 * POST: إنشاء طلب جديد (يتطلب مصادقة)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderRepository, getOrderItemRepository } from '@/features/orders/infrastructure/repositories';
import { getCartRepository, getCartItemRepository, getProductRepository } from '@/features/marketplace/infrastructure/repositories';
import { OrderStatus } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { createOrderSchema, formatZodError, paginationSchema } from '@/lib/validation/schemas';

/**
 * GET /api/orders
 * قائمة طلبات المستخدم
 * @requires AUTH
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const orderRepo = getOrderRepository();
    const { searchParams } = new URL(request.url);
    
    // التحقق من صحة معاملات التصفح
    const validatedParams = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: formatZodError(validatedParams.error) },
        { status: 400 }
      );
    }

    const all = searchParams.get('all');

    // المسؤولون فقط يمكنهم رؤية جميع الطلبات
    if (all === 'true' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      const orders = await orderRepo.findAll();
      return NextResponse.json({ orders, total: orders.length });
    }

    // المستخدمون العاديون يرون طلباتهم فقط
    const orders = await orderRepo.findByUserWithItems(user.id);
    return NextResponse.json({ orders, total: orders.length });
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'فشل في جلب الطلبات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * إنشاء طلب جديد
 * @requires AUTH
 * @security userId من الجلسة فقط - حماية من IDOR
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const orderRepo = getOrderRepository();
    const productRepo = getProductRepository();
    const cartRepo = getCartRepository();
    const cartItemRepo = getCartItemRepository();
    
    const body = await request.json();

    // التحقق من صحة البيانات باستخدام Zod
    const validatedData = createOrderSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    // ⚠️ SECURITY: نستخدم user.id من الجلسة فقط
    // لا نقبل body.userId أبداً
    const { items, shippingInfo } = validatedData.data;

    // التحقق من المنتجات وحساب المجموع
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = await productRepo.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `المنتج ${item.productId} غير موجود` },
          { status: 400 }
        );
      }
      
      // التحقق من الكمية المتاحة
      if (product.stock !== null && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `الكمية المطلوبة غير متاحة للمنتج ${product.name}` },
          { status: 400 }
        );
      }
      
      const price = product.price;
      total += price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      });
    }

    // إنشاء الطلب مع user.id من الجلسة
    const order = await orderRepo.createWithItems(
      {
        userId: user.id, // ✅ من الجلسة فقط - حماية من IDOR
        total,
        status: OrderStatus.PENDING,
        escrowId: null,
      },
      orderItems
    );

    // تفريغ سلة المستخدم بعد الطلب الناجح
    const carts = await cartRepo.findByUserId(user.id);
    if (carts.length > 0) {
      const cart = carts[0];
      await cartItemRepo.deleteByCartId(cart.id);
    }

    // تسجيل النشاط
    console.log(`[Orders] User ${user.id} created order ${order.id} with ${items.length} items`);

    return NextResponse.json({ 
      order,
      shippingInfo,
      message: 'تم إنشاء الطلب بنجاح'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'فشل في إنشاء الطلب' },
      { status: 500 }
    );
  }
}
