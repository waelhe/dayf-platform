/**
 * Can Review API Route - GET /api/reviews/can-review
 * 
 * التحقق من إمكانية كتابة مراجعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { canReview } from '@/features/reviews/infrastructure/review-service';
import { ReviewType } from '@/core/types/enums';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const referenceId = searchParams.get('referenceId');
    const type = searchParams.get('type') as ReviewType;

    if (!userId || !referenceId || !type) {
      return NextResponse.json(
        { success: false, error: 'مطلوب: userId, referenceId, type' },
        { status: 400 }
      );
    }

    const result = await canReview(userId, referenceId, type);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking can review:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق' },
      { status: 500 }
    );
  }
}
