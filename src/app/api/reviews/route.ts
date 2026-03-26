/**
 * Reviews API Route - GET/POST /api/reviews
 * 
 * GET: قائمة المراجعات مع الفلترة والترتيب
 * POST: إنشاء مراجعة جديدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReviews, createReview } from '@/features/reviews/infrastructure/review-service';
import { ReviewType } from '@/core/types/enums';

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
    // TODO: Get from session/auth
    const currentUserId = searchParams.get('currentUserId') || undefined;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.type || !body.referenceId || !body.content || !body.authorId) {
      return NextResponse.json(
        { success: false, error: 'بيانات ناقصة' },
        { status: 400 }
      );
    }

    // التحقق من طول المحتوى
    if (body.content.length < 50) {
      return NextResponse.json(
        { success: false, error: 'المحتوى يجب أن يكون 50 حرف على الأقل' },
        { status: 400 }
      );
    }

    if (body.content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'المحتوى يجب أن لا يتجاوز 2000 حرف' },
        { status: 400 }
      );
    }

    const review = await createReview({
      type: body.type as ReviewType,
      referenceId: body.referenceId,
      bookingId: body.bookingId,
      title: body.title,
      content: body.content,
      cleanliness: body.cleanliness,
      location: body.location,
      value: body.value,
      serviceRating: body.serviceRating,
      amenities: body.amenities,
      communication: body.communication,
      visitDate: body.visitDate ? new Date(body.visitDate) : undefined,
      photos: body.photos,
      authorId: body.authorId,
    });

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

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
