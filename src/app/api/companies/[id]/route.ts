/**
 * Company API Route - GET/PUT/DELETE /api/companies/[id]
 *
 * GET: تفاصيل شركة (عام)
 * PUT: تحديث شركة (يتطلب ملكية - owner فقط)
 * DELETE: حذف شركة (يتطلب ملكية - owner فقط)
 *
 * Security: يستخدم verifyOwnership() من Resource Ownership Layer
 * لمنع ثغرات IDOR - فقط مالك الشركة أو المسؤول يمكنهم التعديل/الحذف
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';
import { CompanyStatus } from '@/core/types/enums';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/companies/[id]
 * تفاصيل شركة - عام (لا يحتاج مصادقة)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const company = await CompanyService.getCompanyById(id);

    if (!company) {
      return NextResponse.json(
        { error: 'الشركة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error getting company:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الشركة' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[id]
 * تحديث شركة - يتطلب ملكية (owner) أو Admin
 */
export async function PUT(
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
    const ownershipResult = await verifyOwnership('companies', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح لك بتعديل هذه الشركة' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // التحقق من وجود حقول محظورة
    const forbiddenFields = ['ownerId', 'verifiedAt', 'verifiedBy', 'status'];
    for (const field of forbiddenFields) {
      if (field in body) {
        delete body[field];
      }
    }

    const company = await CompanyService.updateCompany(id, body);

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الشركة' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]
 * حذف شركة (soft delete) - يتطلب ملكية (owner) أو Admin
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
    const ownershipResult = await verifyOwnership('companies', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح لك بحذف هذه الشركة' },
        { status: 403 }
      );
    }

    // Soft delete بتغيير الحالة إلى DELETED
    await CompanyService.updateCompany(id, {
      status: CompanyStatus.DELETED,
    });

    return NextResponse.json({ success: true, message: 'تم حذف الشركة' });
  } catch (error) {
    console.error('Error deleting company:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الشركة' },
      { status: 500 }
    );
  }
}

// دعم PATCH للتوافق
export const PATCH = PUT;
