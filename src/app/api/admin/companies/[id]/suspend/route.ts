/**
 * POST /api/admin/companies/[id]/suspend
 * تعليق شركة
 * يتطلب صلاحية مدير
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';
import { requireAdmin, AuthError } from '@/lib/auth/middleware';
import { z } from 'zod';

// Zod validation schema
const suspendCompanySchema = z.object({
  reason: z.string().min(10, 'سبب التعليق يجب أن يكون 10 أحرف على الأقل').max(500),
});

/**
 * POST /api/admin/companies/[id]/suspend
 * تعليق شركة
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
    
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validatedData = suspendCompanySchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.success === false ? validatedData.error.issues[0]?.message : 'بيانات غير صالحة' },
        { status: 400 }
      );
    }
    
    // تعليق الشركة
    const company = await CompanyService.suspendCompany(id, validatedData.data.reason);
    
    // تسجيل النشاط
    console.log(`[Admin] ${authResult.user.id} suspended company ${id}: ${validatedData.data.reason}`);
    
    return NextResponse.json({
      success: true,
      message: 'تم تعليق الشركة',
      company,
    });
  } catch (error) {
    console.error('Error suspending company:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تعليق الشركة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
