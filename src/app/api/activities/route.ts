/**
 * Activities API Route - GET/POST /api/activities
 *
 * GET: قائمة الأنشطة (عام)
 * POST: إنشاء نشاط جديد (يتطلب صلاحية Host أو Admin)
 *
 * Security: ownerId يُؤخذ من الجلسة فقط
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/features/tourism';
import { ActivityType, CompanyStatus, Role } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * GET /api/activities
 * قائمة الأنشطة - عام
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      type: searchParams.get('type') as ActivityType | undefined,
      destinationId: searchParams.get('destinationId') || undefined,
      status: searchParams.get('status') as CompanyStatus | undefined,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await ActivityService.listActivities(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing activities:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأنشطة' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities
 * إنشاء نشاط جديد - يتطلب مصادقة وصلاحية
 *
 * Security: ownerId من الجلسة فقط
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية إنشاء الأنشطة
    const canCreateActivity =
      user.role === Role.HOST ||
      user.role === Role.PROVIDER ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN;

    if (!canCreateActivity) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإنشاء أنشطة - يجب أن تكون مضيفاً' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type || !body.description || !body.location || !body.price) {
      return NextResponse.json(
        { error: 'العنوان والنوع والوصف والموقع والسعر مطلوبة' },
        { status: 400 }
      );
    }

    // Validate duration
    if (!body.duration || body.duration < 15) {
      return NextResponse.json(
        { error: 'المدة يجب أن تكون 15 دقيقة على الأقل' },
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

    // ✅ SECURITY: ownerId من الجلسة فقط
    const activity = await ActivityService.createActivity({
      title: body.title,
      type: body.type as ActivityType,
      description: body.description,
      shortDesc: body.shortDesc,
      destinationId: body.destinationId,
      location: body.location,
      meetingPoint: body.meetingPoint,
      latitude: body.latitude,
      longitude: body.longitude,
      duration: body.duration,
      maxParticipants: body.maxParticipants,
      minParticipants: body.minParticipants,
      difficultyLevel: body.difficultyLevel,
      ageRestriction: body.ageRestriction,
      price: body.price,
      currency: body.currency,
      pricePerPerson: body.pricePerPerson,
      discountPrice: body.discountPrice,
      images: body.images,
      coverImage: body.coverImage,
      videoUrl: body.videoUrl,
      included: body.included,
      excluded: body.excluded,
      requirements: body.requirements,
      availability: body.availability,
      cancellationPolicy: body.cancellationPolicy,
      ownerId: user.id, // ✅ من الجلسة فقط
      companyId: body.companyId,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء النشاط' },
      { status: 500 }
    );
  }
}
