/**
 * User Reviews API Route - GET /api/reviews/user/[userId]
 * 
 * مراجعات المستخدم مع ملفه كمراجع
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserReviews, getReviewerProfile } from '@/features/reviews/infrastructure/review-service';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const [reviews, profile] = await Promise.all([
      getUserReviews(userId, page, limit),
      getReviewerProfile(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        profile: profile ? {
          level: profile.level,
          badges: profile.badges ? JSON.parse(profile.badges) : [],
          totalReviews: profile.totalReviews,
          totalHelpful: profile.totalHelpful,
          totalPhotos: profile.totalPhotos,
          citiesVisited: profile.citiesVisited ? JSON.parse(profile.citiesVisited) : [],
        } : null,
        ...reviews,
      },
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب مراجعات المستخدم' },
      { status: 500 }
    );
  }
}
