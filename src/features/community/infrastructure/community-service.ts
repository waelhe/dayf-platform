/**
 * Community Service
 * خدمة المجتمع
 * 
 * Provides business logic for community features (topics and replies).
 * Uses repository pattern for data access.
 */

import { getTopicRepository, getReplyRepository } from './repositories';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { DatabaseError } from '@/core/database';
import type { TopicWithAuthor, ReplyWithAuthor } from './repositories';
import type { MemberProfile } from '../types';

// ============================================
// Community Service
// ============================================

export const communityService = {
  // ============================================
  // Member Profile Operations
  // ============================================

  /**
   * Get member profile by user ID
   * الحصول على ملف العضو بواسطة معرف المستخدم
   */
  getMemberProfile: async (userId: string): Promise<MemberProfile | null> => {
    try {
      const client = getSupabaseProvider().getRawClient();

      // Get user info from profiles table
      const { data: user, error: userError } = await client
        .from('profiles')
        .select('id, display_name, avatar, loyalty_points, created_at')
        .eq('id', userId)
        .single();

      if (userError || !user) return null;

      // Get topics count
      const topicRepo = getTopicRepository();
      const topicsCount = await topicRepo.count({ filters: { author_id: userId } });

      // Get replies count
      const replyRepo = getReplyRepository();
      const repliesCount = await replyRepo.count({ filters: { author_id: userId } });

      return {
        id: user.id,
        displayName: user.display_name,
        photoURL: user.avatar ?? undefined,
        reputationPoints: user.loyalty_points,
        createdAt: user.created_at,
        topicsCount,
        repliesCount,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { context: 'getMemberProfile', userId });
    }
  },

  // ============================================
  // Topic Operations
  // ============================================

  /**
   * Get topics with optional category filter
   * الحصول على المواضيع مع فلتر فئة اختياري
   */
  getTopics: async (categoryId?: string, maxLimit: number = 20): Promise<TopicWithAuthor[]> => {
    const topicRepo = getTopicRepository();
    return topicRepo.findWithAuthor({ categoryId, limit: maxLimit });
  },

  /**
   * Get topic by ID
   * الحصول على موضوع بواسطة المعرف
   */
  getTopicById: async (id: string): Promise<TopicWithAuthor | null> => {
    const topicRepo = getTopicRepository();
    return topicRepo.findByIdWithAuthor(id);
  },

  /**
   * Create a new topic
   * إنشاء موضوع جديد
   */
  createTopic: async (data: {
    title: string;
    content: string;
    authorId: string;
    categoryId: string;
    subCategoryId?: string;
    isOfficial?: boolean;
  }): Promise<string> => {
    const topicRepo = getTopicRepository();
    const topic = await topicRepo.create({
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId ?? null,
      isOfficial: data.isOfficial ?? false,
      likesCount: 0,
      repliesCount: 0,
    });

    return topic.id;
  },

  /**
   * Update topic
   * تحديث الموضوع
   */
  updateTopic: async (topicId: string, content: string): Promise<void> => {
    const topicRepo = getTopicRepository();
    await topicRepo.update(topicId, { content });
  },

  // ============================================
  // Reply Operations
  // ============================================

  /**
   * Get replies for a topic
   * الحصول على الردود لموضوع معين
   */
  getReplies: async (topicId: string): Promise<ReplyWithAuthor[]> => {
    const replyRepo = getReplyRepository();
    return replyRepo.findWithAuthorByTopic(topicId);
  },

  /**
   * Create a reply
   * إنشاء رد جديد
   */
  createReply: async (data: {
    topicId: string;
    content: string;
    authorId: string;
  }): Promise<string> => {
    try {
      const replyRepo = getReplyRepository();
      const topicRepo = getTopicRepository();

      // Create reply
      const reply = await replyRepo.create({
        topicId: data.topicId,
        content: data.content,
        authorId: data.authorId,
        likesCount: 0,
      });

      // Increment topic replies count
      await topicRepo.incrementReplies(data.topicId);

      return reply.id;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { context: 'createReply', data });
    }
  },

  /**
   * Update reply
   * تحديث الرد
   */
  updateReply: async (replyId: string, content: string): Promise<void> => {
    const replyRepo = getReplyRepository();
    await replyRepo.update(replyId, { content });
  },

  // ============================================
  // Like Operations
  // ============================================

  /**
   * Like a topic
   * إعجاب بموضوع
   */
  likeTopic: async (topicId: string, authorId: string): Promise<void> => {
    try {
      const client = getSupabaseProvider().getRawClient();
      const topicRepo = getTopicRepository();

      // Increment topic likes
      await topicRepo.incrementLikes(topicId);

      // Increment author loyalty points (profiles table)
      await client
        .from('profiles')
        .eq('id', authorId);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { context: 'likeTopic', topicId, authorId });
    }
  },

  /**
   * Like a reply
   * إعجاب برد
   */
  likeReply: async (replyId: string, authorId: string): Promise<void> => {
    try {
      const client = getSupabaseProvider().getRawClient();
      const replyRepo = getReplyRepository();

      // Increment reply likes
      await replyRepo.incrementLikes(replyId);

      // Increment author loyalty points (profiles table)
      await client
        .from('profiles')
        .update({ loyalty_points: client.rpc('increment', { x: 2 }) })
        .eq('id', authorId);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { context: 'likeReply', replyId, authorId });
    }
  },

  // ============================================
  // Statistics Operations
  // ============================================

  /**
   * Get topics count by category
   * الحصول على عدد المواضيع حسب الفئة
   */
  getTopicsCountByCategory: async (categoryId: string): Promise<number> => {
    const topicRepo = getTopicRepository();
    return topicRepo.countByCategory(categoryId);
  },

  /**
   * Get top contributors
   * الحصول على أفضل المساهمين
   */
  getTopContributors: async (limit: number = 5): Promise<MemberProfile[]> => {
    try {
      const client = getSupabaseProvider().getRawClient();

      // Get profiles with topics or replies, ordered by loyalty points
      const { data: users, error } = await client
        .from('profiles')
        .select('id, display_name, avatar, loyalty_points, created_at')
        .order('loyalty_points', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { context: 'getTopContributors' });
      }

      // Get counts for each user
      const topicRepo = getTopicRepository();
      const replyRepo = getReplyRepository();

      const contributors = await Promise.all(
        (users || []).map(async (user) => {
          const topicsCount = await topicRepo.count({ filters: { author_id: user.id } });
          const repliesCount = await replyRepo.count({ filters: { author_id: user.id } });

          return {
            id: user.id,
            displayName: user.display_name,
            photoURL: user.avatar || undefined,
            reputationPoints: user.loyalty_points,
            createdAt: user.created_at,
            topicsCount,
            repliesCount,
          };
        })
      );

      return contributors;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { context: 'getTopContributors' });
    }
  },
};
