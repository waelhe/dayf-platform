/**
 * Product API Route - GET/PATCH/DELETE /api/marketplace/products/[id]
 *
 * GET: تفاصيل منتج (عام)
 * PATCH: تحديث منتج (يتطلب ملكية - vendor فقط)
 * DELETE: حذف منتج (يتطلب ملكية - vendor فقط)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط البائع أو المسؤول يمكنهم التعديل/الحذف
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductRepository } from '@/features/marketplace/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/marketplace/products/[id]
 * تفاصيل منتج - عام (لا يحتاج مصادقة)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const productRepository = getProductRepository();
    const product = await productRepository.findByIdWithVendor(id);

    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المنتج' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/marketplace/products/[id]
 * تحديث منتج - يتطلب ملكية (vendor) أو Admin
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

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('products', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح لك بتعديل هذا المنتج' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // حماية الحقول المحظورة
    const forbiddenFields = ['vendorId', 'id'];
    for (const field of forbiddenFields) {
      if (field in body) {
        delete body[field];
      }
    }

    const productRepository = getProductRepository();
    const product = await productRepository.update(id, body);

    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    // Fetch with vendor info
    const productWithVendor = await productRepository.findByIdWithVendor(id);

    return NextResponse.json({ product: productWithVendor || product });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في تحديث المنتج' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketplace/products/[id]
 * حذف منتج - يتطلب ملكية (vendor) أو Admin
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

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('products', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح لك بحذف هذا المنتج' },
        { status: 403 }
      );
    }

    const productRepository = getProductRepository();
    const success = await productRepository.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في حذف المنتج' },
      { status: 500 }
    );
  }
}
