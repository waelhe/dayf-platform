/**
 * Reviews API Route - GET/POST /api/reviews
 * 
 * GET: قائمة المراجعات مع الفلترة والترتيب
 * POST: إنشاء مراجعة جديدة (يتطلب مصادقة)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReviews, createReview } from '@/features/reviews/infrastructure/review-service';
import { ReviewType, ReviewSource, TravelPhase } from '@/core/types/enums';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { createReviewSchema, formatZodError } from '@/lib/validation/schemas';

/**
 * GET /api/reviews
 * قائمة المراجعات مع الفلترة والترتيب
 * عام - لا يتطلب مصادقة
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const options = {
      referenceId: searchParams.get('referenceId') || undefined,
      type: searchParams.get('type') as ReviewType | undefined,
      authorId: searchParams.get('authorId') || undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      maxRating: searchParams.get('maxRating') ? parseFloat(searchParams.get('maxRating')!) : undefined,
      isVerified: searchParams.get('isVerified') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as 'newest' | 'helpful' | 'highest' | 'lowest') || 'newest',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50),
    };

    // الحصول على معرف المستخدم الحالي (للتحقق من التصويت)
    const user = await getAuthUser(request);
    const currentUserId = user?.id || undefined;

    const result = await getReviews(options, currentUserId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب المراجعات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * إنشاء مراجعة جديدة
 * @requires AUTH
 * @security authorId يؤخذ من الجلسة فقط - لا نقبل body.authorId
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة - إلزامي
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // التحقق من صحة البيانات باستخدام Zod
    const validatedData = createReviewSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    // إنشاء المراجعة مع استخدام معرف المستخدم من الجلسة
    // ⚠️ SECURITY: authorId يتم أخذه من الجلسة فقط، لا نقبل body.authorId
    const review = await createReview({
      type: validatedData.data.type,
      referenceId: validatedData.data.referenceId,
      bookingId: validatedData.data.bookingId,
      source: validatedData.data.source,
      travelPhase: validatedData.data.travelPhase,
      title: validatedData.data.title,
      content: validatedData.data.content,
      rating: validatedData.data.rating,
      cleanliness: validatedData.data.cleanliness,
      location: validatedData.data.location,
      value: validatedData.data.value,
      serviceRating: validatedData.data.serviceRating,
      amenities: validatedData.data.amenities,
      communication: validatedData.data.communication,
      visitDate: validatedData.data.visitDate,
      photos: validatedData.data.photos,
      authorId: user.id, // ✅ من الجلسة فقط - حماية من IDOR
    });

    // تسجيل النشاط
    console.log(`[Reviews] User ${user.id} created review ${review.id} for ${validatedData.data.type}:${validatedData.data.referenceId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: review.id,
          rating: review.rating,
          isVerified: review.isVerified,
          message: 'تم نشر مراجعتك بنجاح',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء المراجعة';
    
    if (errorMessage === 'REVIEW_ALREADY_EXISTS') {
      return NextResponse.json(
        { success: false, error: 'لقد قمت بتقييم هذه الخدمة مسبقاً', code: 'REVIEW_ALREADY_EXISTS' },
        { status: 400 }
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
