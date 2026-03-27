/**
 * Service API Route - GET/PATCH/DELETE /api/services/[id]
 *
 * GET: تفاصيل خدمة (عام)
 * PATCH: تحديث خدمة (يتطلب ملكية - host فقط)
 * DELETE: حذف خدمة (يتطلب ملكية - host فقط)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط المضيف يمكنه تعديل/حذف خدمته
 */

import { NextRequest, NextResponse } from 'next/server';
import { servicesService } from '@/features/services/infrastructure/services-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/services/[id]
 * تفاصيل خدمة - عام (لا يحتاج مصادقة)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const service = await servicesService.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/services/[id]
 * تحديث خدمة - يتطلب ملكية (host)
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
        { error: 'Unauthorized - Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('services', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح لك بتعديل هذه الخدمة', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const service = await servicesService.update(id, body);

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services/[id]
 * حذف خدمة - يتطلب ملكية (host) أو Admin
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
        { error: 'Unauthorized - Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ✅ ROOT: استخدام verifyOwnership من Resource Ownership Layer
    const ownershipResult = await verifyOwnership('services', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح لك بحذف هذه الخدمة', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await servicesService.delete(id);

    return NextResponse.json({ success: true, message: 'تم حذف الخدمة' });
  } catch (error) {
    console.error('Error deleting service:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}

// دعم PUT للتوافق مع الكود القديم
export const PUT = PATCH;
