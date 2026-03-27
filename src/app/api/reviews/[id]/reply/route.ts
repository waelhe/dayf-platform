/**
 * Review Reply API Route - POST /api/reviews/[id]/reply
 * 
 * POST: إضافة رد على مراجعة (للمزودين والإدارة)
 */

import { NextRequest, NextResponse } from 'next/server';
import { addReply } from '@/features/reviews/infrastructure/review-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: reviewId } = await params;
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.authorId || !body.authorName || !body.content) {
      return NextResponse.json(
        { success: false, error: 'بيانات ناقصة' },
        { status: 400 }
      );
    }

    // التحقق من طول المحتوى
    if (body.content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'الرد يجب أن لا يتجاوز 500 حرف' },
        { status: 400 }
      );
    }

    const reply = await addReply({
      reviewId,
      authorId: body.authorId,
      authorName: body.authorName,
      authorRole: body.authorRole || 'PROVIDER',
      content: body.content,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: reply.id,
        authorName: reply.authorName,
        authorRole: reply.authorRole,
        content: reply.content,
        createdAt: reply.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ في إضافة الرد';
    
    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
