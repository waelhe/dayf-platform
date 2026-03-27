/**
 * Company Employees API Route - GET/POST /api/companies/[id]/employees
 *
 * GET: قائمة الموظفين (يتطلب ملكية الشركة)
 * POST: دعوة موظف جديد (يتطلب صلاحية OWNER/MANAGER)
 *
 * Security: يستخدم getAuthUser() و verifyOwnership()
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService, CompanyService } from '@/features/companies';
import { COMPANY_PERMISSIONS } from '@/features/companies/types';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/core/auth/resource-ownership';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/companies/[id]/employees
 * قائمة الموظفين - يتطلب ملكية الشركة أو Admin
 */
export async function GET(
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

    // ✅ ROOT: التحقق من ملكية الشركة
    const ownershipResult = await verifyOwnership('companies', id, user.id, user.role);

    if (!ownershipResult.isOwner) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'غير مصرح بالوصول لهذه الشركة' },
        { status: 403 }
      );
    }

    const [employees, invitations] = await Promise.all([
      EmployeeService.listEmployees(id),
      EmployeeService.listPendingInvitations(id),
    ]);

    return NextResponse.json({
      employees,
      pendingInvitations: invitations,
    });
  } catch (error) {
    console.error('Error listing employees:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الموظفين' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies/[id]/employees
 * دعوة موظف جديد - يتطلب صلاحية OWNER/MANAGER
 */
export async function POST(
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
    const body = await request.json();

    // ✅ SECURITY: التحقق من صلاحية دعوة الموظفين
    const hasPermission = await CompanyService.checkUserPermission(
      id,
      user.id,
      COMPANY_PERMISSIONS.INVITE_EMPLOYEE
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لدعوة موظفين' },
        { status: 403 }
      );
    }

    // Validate input
    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني والدور مطلوبان' },
        { status: 400 }
      );
    }

    // ✅ SECURITY: invitedBy من الجلسة فقط
    const invitation = await EmployeeService.inviteEmployee(id, user.id, {
      email: body.email,
      role: body.role,
      permissions: body.permissions,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: unknown) {
    console.error('Error inviting employee:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال الدعوة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
