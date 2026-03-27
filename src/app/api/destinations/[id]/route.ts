/**
 * Destination API Route - GET/PUT/DELETE /api/destinations/[id]
 *
 * GET: تفاصيل وجهة (عام)
 * PUT: تحديث وجهة (يتطلب صلاحية Admin)
 * DELETE: حذف وجهة (يتطلب صلاحية Admin)
 *
 * Security: الوجهات هي محتوى عام، فقط المسؤولون يمكنهم التعديل
 */

import { NextRequest, NextResponse } from 'next/server';
import { DestinationService } from '@/features/tourism';
import { getAuthUser, requireAdmin, AuthError } from '@/lib/auth/middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/destinations/[id]
 * تفاصيل وجهة - عام (لا يحتاج مصادقة)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if it's a slug (contains hyphen and letters) or an ID
    const isSlug = id.includes('-') && /[a-z]/.test(id);

    const destination = isSlug
      ? await DestinationService.getDestinationBySlug(id)
      : await DestinationService.getDestinationById(id);

    if (!destination) {
      return NextResponse.json(
        { error: 'الوجهة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(destination);
  } catch (error) {
    console.error('Error getting destination:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الوجهة' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/destinations/[id]
 * تحديث وجهة - يتطلب صلاحية Admin فقط
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // التحقق من المصادقة وصلاحية Admin
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // فقط Admin يمكنه تعديل الوجهات
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - هذه الميزة للمسؤولين فقط' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Transform arrays if provided
    const updateData = { ...body };
    if (body.images) updateData.images = body.images;
    if (body.highlights) updateData.highlights = body.highlights;
    if (body.openingHours) updateData.openingHours = body.openingHours;

    const destination = await DestinationService.updateDestination(id, updateData);

    return NextResponse.json(destination);
  } catch (error) {
    console.error('Error updating destination:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الوجهة' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/destinations/[id]
 * حذف وجهة - يتطلب صلاحية Admin فقط
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // التحقق من المصادقة وصلاحية Admin
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // فقط Admin يمكنه حذف الوجهات
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - هذه الميزة للمسؤولين فقط' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await DestinationService.deleteDestination(id);

    return NextResponse.json({ success: true, message: 'تم حذف الوجهة' });
  } catch (error) {
    console.error('Error deleting destination:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الوجهة' },
      { status: 500 }
    );
  }
}

// دعم PATCH للتوافق
export const PATCH = PUT;
