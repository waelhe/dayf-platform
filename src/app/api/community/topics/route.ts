import { NextRequest, NextResponse } from 'next/server';
import { getTopicRepository, getReplyRepository } from '@/features/community/infrastructure/repositories';
import { getUserRepository } from '@/features/auth/infrastructure/repositories/user.repository';

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
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const topicRepo = getTopicRepository();
    const userRepo = getUserRepository();
    
    const body = await request.json();
    const { title, content, authorId, categoryId, subCategoryId, isOfficial } = body;

    if (!title || !content || !authorId || !categoryId) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى والتصنيف مطلوبة' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await userRepo.findById(authorId);

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const topic = await topicRepo.create({
      title,
      content,
      authorId,
      categoryId,
      subCategoryId: subCategoryId || null,
      isOfficial: isOfficial || false,
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
    return NextResponse.json(
      { error: 'فشل في إنشاء الموضوع' },
      { status: 500 }
    );
  }
}
