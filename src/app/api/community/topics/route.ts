/**
 * Community Topics API Route - GET/POST /api/community/topics
 *
 * GET: قائمة المواضيع (عام)
 * POST: إنشاء موضوع جديد (يتطلب مصادقة)
 *
 * Security: authorId يُؤخذ من الجلسة فقط
 * لمنع تزوير هوية الكاتب
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopicRepository } from '@/features/community/infrastructure/repositories';
import { getAuthUser, AuthError } from '@/lib/auth/middleware';
import { Role } from '@/core/types/enums';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/community/topics
 * قائمة المواضيع - عام
 */
export async function GET(request: NextRequest) {
  try {
    const topicRepo = getTopicRepository();
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId') || searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const topics = await topicRepo.findWithAuthor({
      categoryId: categoryId || undefined,
      limit,
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المواضيع' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/topics
 * إنشاء موضوع جديد - يتطلب مصادقة
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

    const topicRepo = getTopicRepository();
    const body = await request.json();
    const { title, content, categoryId, subCategoryId, isOfficial } = body;

    // التحقق من البيانات المطلوبة
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى والتصنيف مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صلاحية isOfficial (فقط Admin يمكنه تعيينها)
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    const finalIsOfficial = isAdmin && isOfficial ? true : false;

    // ✅ SECURITY: authorId من الجلسة فقط
    const topic = await topicRepo.create({
      title,
      content,
      authorId: user.id,
      categoryId,
      subCategoryId: subCategoryId || null,
      isOfficial: finalIsOfficial,
      likesCount: 0,
      repliesCount: 0,
    });

    // Get topic with author info
    const topicWithAuthor = await topicRepo.findByIdWithAuthor(topic.id);

    return NextResponse.json({
      id: topic.id,
      topic: topicWithAuthor,
      message: 'تم إنشاء الموضوع بنجاح'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: 'فشل في إنشاء الموضوع' },
      { status: 500 }
    );
  }
}
