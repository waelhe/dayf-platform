/**
 * Community Replies API Route - GET/POST /api/community/replies
 *
 * GET: قائمة الردود لموضوع (عام)
 * POST: إضافة رد جديد (يتطلب مصادقة)
 *
 * Security: authorId يُؤخذ من الجلسة فقط
 * لمنع تزوير هوية الكاتب
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopicRepository, getReplyRepository } from '@/features/community/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';

/**
 * GET /api/community/replies
 * قائمة الردود لموضوع - عام
 */
export async function GET(request: NextRequest) {
  try {
    const replyRepo = getReplyRepository();
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'معرف الموضوع مطلوب' },
        { status: 400 }
      );
    }

    const replies = await replyRepo.findWithAuthorByTopic(topicId);

    return NextResponse.json({
      replies,
      total: replies.length,
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الردود' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/replies
 * إضافة رد جديد - يتطلب مصادقة
 *
 * Security: authorId من الجلسة فقط
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

    const replyRepo = getReplyRepository();
    const topicRepo = getTopicRepository();

    const body = await request.json();
    const { topicId, content } = body;

    // التحقق من البيانات المطلوبة
    if (!topicId || !content) {
      return NextResponse.json(
        { error: 'معرف الموضوع والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من وجود الموضوع
    const topic = await topicRepo.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'الموضوع غير موجود' },
        { status: 404 }
      );
    }

    // ✅ SECURITY: authorId من الجلسة فقط
    const reply = await replyRepo.create({
      topicId,
      content,
      authorId: user.id,
      likesCount: 0,
    });

    // Update topic reply count
    await topicRepo.incrementReplies(topicId);

    // Get reply with author info
    const repliesWithAuthor = await replyRepo.findWithAuthorByTopic(topicId);
    const replyWithAuthor = repliesWithAuthor.find(r => r.id === reply.id);

    return NextResponse.json(replyWithAuthor || reply, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في إضافة الرد' },
      { status: 500 }
    );
  }
}
