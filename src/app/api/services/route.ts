/**
 * Services API Route - GET/POST /api/services
 *
 * GET: قائمة الخدمات (عام)
 * POST: إنشاء خدمة جديدة (يتطلب مصادقة + صلاحية Host)
 *
 * Security: hostId يُؤخذ من الجلسة فقط
 * لمنع تزوير ملكية الخدمة
 */

import { NextRequest, NextResponse } from 'next/server';
import { servicesService } from '@/features/services/infrastructure/services-service';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { Role } from '@/core/types/enums';

/**
 * GET /api/services
 * قائمة الخدمات - عام
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const hostId = searchParams.get('host');
    const query = searchParams.get('q');
    const popular = searchParams.get('popular');
    const limit = parseInt(searchParams.get('limit') || '20');

    let services;

    if (query) {
      services = await servicesService.search(query);
    } else if (categoryId) {
      services = await servicesService.getByCategory(categoryId);
    } else if (hostId) {
      services = await servicesService.getByHost(hostId);
    } else if (popular === 'true') {
      services = await servicesService.getPopular(limit);
    } else {
      services = await servicesService.getAll();
    }

    return NextResponse.json({
      services,
      total: services.length,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الخدمات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/services
 * إنشاء خدمة جديدة - يتطلب مصادقة
 *
 * Security: hostId من الجلسة فقط
 * فقط Host أو Admin يمكنه إنشاء خدمات
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

    // التحقق من صلاحية إنشاء الخدمات
    const canCreateService = 
      user.role === Role.HOST ||
      user.role === Role.PROVIDER ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN;

    if (!canCreateService) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإنشاء خدمات - يجب أن تكون مضيفاً' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'location', 'price', 'images', 'type', 'mainCategoryId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `الحقل مطلوب: ${field}` },
          { status: 400 }
        );
      }
    }

    // ✅ SECURITY: hostId من الجلسة فقط
    const service = await servicesService.create({
      title: body.title,
      description: body.description || '',
      location: body.location,
      price: Number(body.price),
      rating: body.rating || 0,
      reviews: body.reviews || 0,
      views: 0,
      images: body.images,
      type: body.type,
      amenities: body.amenities || [],
      features: body.features || [],
      mainCategoryId: body.mainCategoryId,
      subCategoryId: body.subCategoryId,
      hostId: user.id, // ✅ من الجلسة فقط
      maxGuests: body.maxGuests || 4,
      bedrooms: body.bedrooms || 1,
      beds: body.beds || 1,
      baths: body.baths || 1,
      isSuperhost: false,
      isPopular: false,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في إنشاء الخدمة' },
      { status: 500 }
    );
  }
}
