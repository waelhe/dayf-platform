// API Route: /api/companies/[id]
// GET - Get company by ID
// PUT - Update company

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';

// GET /api/companies/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

// PUT /api/companies/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // TODO: Check user permission
    // For now, allow update
    
    const company = await CompanyService.updateCompany(id, body);
    
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الشركة' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: Check user permission (only owner can delete)
    
    // Soft delete by changing status
    const company = await CompanyService.updateCompany(id, {
      // @ts-ignore - status handled in service
      status: 'DELETED',
    });
    
    return NextResponse.json({ success: true, message: 'تم حذف الشركة' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الشركة' },
      { status: 500 }
    );
  }
}
