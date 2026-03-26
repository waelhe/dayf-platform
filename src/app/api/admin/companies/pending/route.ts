// API Route: /api/admin/companies/pending
// GET - List pending companies for verification

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';
import { CompanyStatus } from '@/core/types/enums';

// GET /api/admin/companies/pending
export async function GET(request: NextRequest) {
  try {
    // TODO: Check admin permission
    
    const result = await CompanyService.listCompanies({
      status: CompanyStatus.PENDING,
      limit: 50,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing pending companies:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الشركات المعلقة' },
      { status: 500 }
    );
  }
}
