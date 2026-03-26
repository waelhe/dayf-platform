// API Route: /api/admin/companies/[id]/verify
// POST - Verify a company

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';

// POST /api/admin/companies/[id]/verify
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: Get admin ID from session
    const adminId = 'admin-user';
    
    const company = await CompanyService.verifyCompany(id, adminId);
    
    return NextResponse.json({
      success: true,
      message: 'تم التحقق من الشركة بنجاح',
      company,
    });
  } catch (error: any) {
    console.error('Error verifying company:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التحقق من الشركة' },
      { status: 500 }
    );
  }
}
