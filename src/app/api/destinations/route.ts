/**
 * Destinations API Route - GET/POST /api/destinations
 *
 * GET: قائمة الوجهات (عام)
 * POST: إنشاء وجهة جديدة (يتطلب صلاحية Admin)
 *
 * Security: ownerId يُؤخذ من الجلسة فقط
 * الوجهات تُنشأ فقط من قبل المسؤولين
 */

import { NextRequest, NextResponse } from 'next/server';
import { DestinationService } from '@/features/tourism';
import { DestinationType, Role } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * GET /api/destinations
 * قائمة الوجهات - عام
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      type: searchParams.get('type') as DestinationType | undefined,
      city: searchParams.get('city') || undefined,
      search: searchParams.get('search') || undefined,
      isVerified: searchParams.get('verified') === 'true' ? true : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await DestinationService.listDestinations(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing destinations:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الوجهات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/destinations
 * إنشاء وجهة جديدة - يتطلب صلاحية Admin
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

    // ✅ SECURITY: فقط Admin يمكنه إنشاء وجهات
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإنشاء وجهات - يتطلب صلاحية مسؤول' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.description || !body.city) {
      return NextResponse.json(
        { error: 'الاسم والنوع والوصف والمدينة مطلوبة' },
        { status: 400 }
      );
    }

    // Validate images
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'يجب إضافة صورة واحدة على الأقل' },
        { status: 400 }
      );
    }

    // ✅ SECURITY: ownerId من الجلسة فقط + isVerified = true for Admin
    const destination = await DestinationService.createDestination({
      name: body.name,
      type: body.type as DestinationType,
      description: body.description,
      shortDesc: body.shortDesc,
      city: body.city,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      images: body.images,
      coverImage: body.coverImage,
      highlights: body.highlights,
      bestTimeToVisit: body.bestTimeToVisit,
      entryFee: body.entryFee,
      openingHours: body.openingHours,
      duration: body.duration,
      ownerId: user.id, // ✅ من الجلسة فقط
      companyId: body.companyId,
    });

    return NextResponse.json(destination, { status: 201 });
  } catch (error) {
    console.error('Error creating destination:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الوجهة' },
      { status: 500 }
    );
  }
}
