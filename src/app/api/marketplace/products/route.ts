/**
 * Products API Route - GET/POST /api/marketplace/products
 *
 * GET: قائمة المنتجات (عام)
 * POST: إنشاء منتج جديد (يتطلب مصادقة + صلاحية Provider)
 *
 * Security: vendorId يُؤخذ من الجلسة فقط - حماية من IDOR
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductRepository } from '@/features/marketplace/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { Role } from '@/core/types/enums';

/**
 * GET /api/marketplace/products
 * قائمة المنتجات - عام
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    const productRepository = getProductRepository();

    let products;
    if (vendorId) {
      products = await productRepository.findByVendor(vendorId);
    } else {
      products = await productRepository.findMany({
        sort: { field: 'created_at', direction: 'desc' },
      });
    }

    // Transform products to include vendor field for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product,
      vendor: product.vendorName || product.vendorId,
    }));

    return NextResponse.json({
      products: transformedProducts,
      total: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المنتجات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/products
 * إنشاء منتج جديد - يتطلب مصادقة + صلاحية Provider
 *
 * Security: vendorId من الجلسة فقط
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

    // ✅ SECURITY: التحقق من صلاحية إنشاء المنتجات
    const canCreateProduct =
      user.role === Role.PROVIDER ||
      user.role === Role.HOST ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN;

    if (!canCreateProduct) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإنشاء منتجات - يجب أن تكون مزوداً' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, price, category, location, image } = body;

    if (!name || !description || !price || !category || !location || !image) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة: الاسم، الوصف، السعر، التصنيف، الموقع، الصورة' },
        { status: 400 }
      );
    }

    const productRepository = getProductRepository();

    // ✅ SECURITY: vendorId من الجلسة فقط - لا نقبل body.vendorId
    const product = await productRepository.create({
      name,
      description,
      price: parseFloat(price),
      category,
      location,
      image,
      vendorId: user.id, // ✅ من الجلسة فقط - حماية من IDOR
      rating: 0,
      reviews: 0,
      vendorName: user.displayName || null,
      companyId: null,
    });

    // Fetch the product with vendor info
    const productWithVendor = await productRepository.findByIdWithVendor(product.id);

    return NextResponse.json({ product: productWithVendor || product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في إنشاء المنتج' },
      { status: 500 }
    );
  }
}
