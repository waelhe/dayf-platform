/**
 * Review Stats API Route - GET /api/reviews/stats/[referenceId]
 * 
 * إحصائيات المراجعات لخدمة/نشاط/وجهة/منتج
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReviewStats } from '@/features/reviews/infrastructure/review-service';
import { ReviewType } from '@/core/types/enums';

interface RouteParams {
  params: Promise<{ referenceId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { referenceId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ReviewType;

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'مطلوب نوع المرجع (type)' },
        { status: 400 }
      );
    }

    const stats = await getReviewStats(referenceId, type);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
