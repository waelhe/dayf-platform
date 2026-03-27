// API Route: /api/companies/[id]/employees
// GET - List employees
// POST - Invite employee

import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService, CompanyService } from '@/features/companies';
import { COMPANY_PERMISSIONS } from '@/features/companies/types';

// GET /api/companies/[id]/employees - List employees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الموظفين' },
      { status: 500 }
    );
  }
}

// POST /api/companies/[id]/employees - Invite employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // TODO: Get userId from session
    const userId = 'demo-user';
    
    // Check permission
    const hasPermission = await CompanyService.checkUserPermission(
      id,
      userId,
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
    
    const invitation = await EmployeeService.inviteEmployee(id, userId, {
      email: body.email,
      role: body.role,
      permissions: body.permissions,
    });
    
    return NextResponse.json(invitation, { status: 201 });
  } catch (error: any) {
    console.error('Error inviting employee:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال الدعوة' },
      { status: 500 }
    );
  }
}
