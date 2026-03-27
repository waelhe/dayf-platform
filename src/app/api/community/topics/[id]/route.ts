/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Topic Details API Route
 *
 * GET /api/community/topics/[id]
 * Returns a single topic with its replies
 */

import { NextRequest, NextResponse } from 'next/server';
import { communityService } from '@/features/community';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Get topic
    const topic = await communityService.getTopicById(id);

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get replies
    const replies = await communityService.getReplies(id);

    return NextResponse.json({
      topic,
      replies
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}
