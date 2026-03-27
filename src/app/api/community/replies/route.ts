import { NextRequest, NextResponse } from 'next/server';
import { getTopicRepository, getReplyRepository } from '@/features/community/infrastructure/repositories';

// GET /api/community/replies - Get replies for a topic
export async function GET(request: NextRequest) {
  try {
    const replyRepo = getReplyRepository();
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
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
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}

// POST /api/community/replies - Create reply
export async function POST(request: NextRequest) {
  try {
    const replyRepo = getReplyRepository();
    const topicRepo = getTopicRepository();
    
    const body = await request.json();
    const { topicId, content, authorId } = body;

    if (!topicId || !content || !authorId) {
      return NextResponse.json(
        { error: 'topicId, content, and authorId are required' },
        { status: 400 }
      );
    }

    // Create reply
    const reply = await replyRepo.create({
      topicId,
      content,
      authorId,
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
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}
