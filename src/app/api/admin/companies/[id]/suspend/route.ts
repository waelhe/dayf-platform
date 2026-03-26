// API Route: /api/admin/companies/[id]/suspend
// POST - Suspend a company

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';

// POST /api/admin/companies/[id]/suspend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // TODO: Check admin permission
    
    if (!body.reason) {
      return NextResponse.json(
        { error: 'سبب التعليق مطلوب' },
        { status: 400 }
      );
    }
    
    const company = await CompanyService.suspendCompany(id, body.reason);
    
    return NextResponse.json({
      success: true,
      message: 'تم تعليق الشركة',
      company,
    });
  } catch (error: any) {
    console.error('Error suspending company:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تعليق الشركة' },
      { status: 500 }
    );
  }
}
