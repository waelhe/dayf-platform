/**
 * Companies API Route - GET/POST /api/companies
 *
 * GET: قائمة الشركات (عام)
 * POST: إنشاء شركة جديدة (يتطلب مصادقة)
 *
 * Security: ownerId يُؤخذ من الجلسة فقط
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/features/companies';
import type { CompanyType, CompanyStatus } from '@/features/companies/types';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

// Helper to validate and convert company type from string
function toCompanyType(value: string | null): CompanyType | undefined {
  if (!value) return undefined;
  const validTypes: CompanyType[] = ['HOTEL', 'TOUR_OPERATOR', 'TRANSPORT', 'RESTAURANT', 'SHOP', 'TRAVEL_AGENCY', 'CAR_RENTAL', 'EVENT_ORGANIZER', 'OTHER'];
  return validTypes.includes(value as CompanyType) ? (value as CompanyType) : undefined;
}

// Helper to validate and convert company status from string  
function toCompanyStatus(value: string | null): CompanyStatus | undefined {
  if (!value) return undefined;
  const validStatuses: CompanyStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'];
  return validStatuses.includes(value as CompanyStatus) ? (value as CompanyStatus) : undefined;
}

// GET /api/companies - List companies
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      type: toCompanyType(searchParams.get('type')),
      status: toCompanyStatus(searchParams.get('status')),
      city: searchParams.get('city') || undefined,
      verified: searchParams.get('verified') === 'true' ? true : 
                searchParams.get('verified') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };
    
    const result = await CompanyService.listCompanies(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing companies:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الشركات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies
 * إنشاء شركة جديدة - يتطلب مصادقة
 *
 * Security: ownerId من الجلسة فقط
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'اسم الشركة ونوعها مطلوبان' },
        { status: 400 }
      );
    }

    // Validate company type
    const companyType = toCompanyType(body.type);
    if (!companyType) {
      return NextResponse.json(
        { error: 'نوع الشركة غير صالح' },
        { status: 400 }
      );
    }

    // ✅ SECURITY: ownerId من الجلسة فقط
    const company = await CompanyService.createCompany(user.id, {
      name: body.name,
      type: companyType,
      description: body.description,
      email: body.email,
      phone: body.phone,
      website: body.website,
      country: body.country,
      city: body.city,
      address: body.address,
      commercialReg: body.commercialReg,
      taxNumber: body.taxNumber,
      documents: body.documents,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الشركة' },
      { status: 500 }
    );
  }
}
