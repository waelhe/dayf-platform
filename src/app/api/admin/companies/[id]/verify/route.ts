/**
 * POST /api/admin/companies/[id]/verify
 * التحقق من شركة
 * يتطلب صلاحية مدير
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';
import { requireAdmin, AuthError } from '@/lib/auth/middleware';

/**
 * POST /api/admin/companies/[id]/verify
 * التحقق من شركة
 * @requires ADMIN or SUPER_ADMIN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من صلاحية المدير
    const authResult = await requireAdmin(request);
    const { id } = await params;
    
    // التحقق من الشركة
    const company = await CompanyService.verifyCompany(id, authResult.user.id);
    
    // تسجيل النشاط
    console.log(`[Admin] ${authResult.user.id} verified company ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'تم التحقق من الشركة بنجاح',
      company,
    });
  } catch (error) {
    console.error('Error verifying company:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق من الشركة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
