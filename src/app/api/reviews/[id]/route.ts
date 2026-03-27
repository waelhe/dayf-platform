/**
 * Review API Route - GET/PUT/DELETE /api/reviews/[id]
 * 
 * GET: تفاصيل مراجعة واحدة
 * PUT: تحديث مراجعة
 * DELETE: حذف مراجعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReview, updateReview, deleteReview } from '@/features/reviews/infrastructure/review-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const review = await getReview(id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب المراجعة' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.authorId) {
      return NextResponse.json(
        { success: false, error: 'مطلوب معرف المستخدم' },
        { status: 400 }
      );
    }

    const review = await updateReview(id, body.authorId, {
      title: body.title,
      content: body.content,
      cleanliness: body.cleanliness,
      location: body.location,
      value: body.value,
      serviceRating: body.serviceRating,
      amenities: body.amenities,
      communication: body.communication,
      visitDate: body.visitDate ? new Date(body.visitDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating review:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث المراجعة';
    
    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }
    
    if (errorMessage === 'NOT_AUTHORIZED') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذه المراجعة' },
        { status: 403 }
      );
    }
    
    if (errorMessage === 'EDIT_PERIOD_EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'انتهت فترة التعديل (30 يوم)' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get('authorId');

    if (!authorId) {
      return NextResponse.json(
        { success: false, error: 'مطلوب معرف المستخدم' },
        { status: 400 }
      );
    }

    await deleteReview(id, authorId);

    return NextResponse.json({
      success: true,
      message: 'تم حذف المراجعة',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف المراجعة';
    
    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }
    
    if (errorMessage === 'NOT_AUTHORIZED') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف هذه المراجعة' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
