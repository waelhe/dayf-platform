/**
 * Review Helpful API Route - POST/DELETE /api/reviews/[id]/helpful
 * 
 * POST: التصويت "مفيد" على مراجعة
 * DELETE: إلغاء التصويت
 */

import { NextRequest, NextResponse } from 'next/server';
import { markHelpful, removeHelpfulVote } from '@/features/reviews/infrastructure/review-service';

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

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'مطلوب معرف المستخدم' },
        { status: 400 }
      );
    }

    const isHelpful = body.isHelpful !== false; // default to true

    const result = await markHelpful(reviewId, body.userId, isHelpful);

    return NextResponse.json({
      success: true,
      data: {
        helpfulCount: result.helpfulCount,
        userHelpful: isHelpful,
      },
    });
  } catch (error) {
    console.error('Error marking helpful:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ في التصويت';
    
    if (errorMessage === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'المراجعة غير موجودة' },
        { status: 404 }
      );
    }
    
    if (errorMessage === 'CANNOT_VOTE_OWN_REVIEW') {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك التصويت على مراجعتك' },
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
    const { id: reviewId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'مطلوب معرف المستخدم' },
        { status: 400 }
      );
    }

    const result = await removeHelpfulVote(reviewId, userId);

    return NextResponse.json({
      success: true,
      data: {
        helpfulCount: result.helpfulCount,
        userHelpful: false,
      },
    });
  } catch (error) {
    console.error('Error removing helpful vote:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في إلغاء التصويت' },
      { status: 500 }
    );
  }
}
