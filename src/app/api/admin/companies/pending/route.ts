/**
 * GET /api/admin/companies/pending
 * قائمة الشركات المعلقة للتحقق
 * يتطلب صلاحية مدير
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';
import { CompanyStatus } from '@/core/types/enums';
import { requireAdmin, AuthError } from '@/lib/auth/middleware';
import { paginationSchema, formatZodError } from '@/lib/validation/schemas';

/**
 * GET /api/admin/companies/pending
 * جلب قائمة الشركات المعلقة للتحقق
 * @requires ADMIN or SUPER_ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحية المدير
    const authResult = await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    
    // التحقق من صحة معاملات التصفح
    const validatedParams = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    });
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: formatZodError(validatedParams.error) },
        { status: 400 }
      );
    }
    
    const result = await CompanyService.listCompanies({
      status: CompanyStatus.PENDING,
      limit: validatedParams.data.limit,
      page: validatedParams.data.page,
    });
    
    // تسجيل النشاط
    console.log(`[Admin] ${authResult.user.id} viewed pending companies`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing pending companies:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الشركات المعلقة' },
      { status: 500 }
    );
  }
}
