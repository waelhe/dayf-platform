/**
 * Community Repository Implementation
 * تنفيذ مستودع المجتمع
 * 
 * Implements ITopicRepository and IReplyRepository using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES } from '@/lib/supabase';
import { DatabaseError } from '@/core/database';
import type {
  Topic,
  TopicWithAuthor,
  ReplyEntity,
  ReplyWithAuthor,
  ITopicRepository,
  IReplyRepository,
} from '../../domain/interfaces';

// ============================================
// Supabase Types (Local Definitions)
// ============================================

/**
 * Topic row in Supabase (snake_case)
 * صف الموضوع في Supabase
 */
interface SupabaseTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  sub_category_id: string | null;
  likes_count: number;
  replies_count: number;
  is_official: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Reply row in Supabase (snake_case)
 * صف الرد في Supabase
 */
interface SupabaseReply {
  id: string;
  topic_id: string;
  content: string;
  author_id: string;
  likes_count: number;
  created_at: string;
  updated_at: string | null;
}

/**
 * User row for author info
 * صف المستخدم لمعلومات الكاتب
 */
interface SupabaseUser {
  display_name: string;
  avatar: string | null;
}

// ============================================
// Topic Repository
// ============================================

/**
 * Topic Repository
 * مستودع المواضيع
 */
export class TopicRepository extends BaseRepository<Topic> implements ITopicRepository {
  constructor() {
    super(TABLES.TOPICS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Topic {
    const dbRow = row as unknown as SupabaseTopic;

    return {
      id: dbRow.id,
      title: dbRow.title,
      content: dbRow.content,
      authorId: dbRow.author_id,
      categoryId: dbRow.category_id,
      subCategoryId: dbRow.sub_category_id,
      likesCount: dbRow.likes_count,
      repliesCount: dbRow.replies_count,
      isOfficial: dbRow.is_official,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Topic>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.title !== undefined) row.title = entity.title;
    if (entity.content !== undefined) row.content = entity.content;
    if (entity.authorId !== undefined) row.author_id = entity.authorId;
    if (entity.categoryId !== undefined) row.category_id = entity.categoryId;
    if (entity.subCategoryId !== undefined) row.sub_category_id = entity.subCategoryId;
    if (entity.likesCount !== undefined) row.likes_count = entity.likesCount;
    if (entity.repliesCount !== undefined) row.replies_count = entity.repliesCount;
    if (entity.isOfficial !== undefined) row.is_official = entity.isOfficial;

    return row;
  }

  // ============================================
  // Topic-Specific Repository Methods
  // ============================================

  /**
   * Find topics with author info
   * البحث عن مواضيع مع معلومات الكاتب
   */
  async findWithAuthor(options?: {
    categoryId?: string;
    limit?: number;
  }): Promise<TopicWithAuthor[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select(`
          *,
          author:users (
            display_name,
            avatar
          )
        `)
        .order('created_at', { ascending: false });

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, options });
      }

      return (data || []).map(row => this.toTopicWithAuthor(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, options });
    }
  }

  /**
   * Find topic by ID with author info
   * البحث عن موضوع بالمعرف مع معلومات الكاتب
   */
  async findByIdWithAuthor(id: string): Promise<TopicWithAuthor | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          author:users (
            display_name,
            avatar
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, id });
      }

      return data ? this.toTopicWithAuthor(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id });
    }
  }

  /**
   * Increment likes count
   * زيادة عدد الإعجابات
   */
  async incrementLikes(topicId: string): Promise<void> {
    try {
      const client = this.getClient();

      // Use RPC or raw query for atomic increment
      const { error } = await client.rpc('increment_topic_likes', { topic_id: topicId });

      // If RPC doesn't exist, fallback to manual update
      if (error && error.code === 'PGRST202') {
        // Fallback: Get current count and update
        const { data: topic } = await client
          .from(this.tableName)
          .select('likes_count')
          .eq('id', topicId)
          .single();

        if (topic) {
          await client
            .from(this.tableName)
            .update({ likes_count: (topic.likes_count || 0) + 1 })
            .eq('id', topicId);
        }
      } else if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, topicId, operation: 'incrementLikes' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, topicId, operation: 'incrementLikes' });
    }
  }

  /**
   * Increment replies count
   * زيادة عدد الردود
   */
  async incrementReplies(topicId: string): Promise<void> {
    try {
      const client = this.getClient();

      // Fallback: Get current count and update
      const { data: topic } = await client
        .from(this.tableName)
        .select('replies_count')
        .eq('id', topicId)
        .single();

      if (topic) {
        await client
          .from(this.tableName)
          .update({ replies_count: (topic.replies_count || 0) + 1 })
          .eq('id', topicId);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, topicId, operation: 'incrementReplies' });
    }
  }

  /**
   * Get topics count by category
   * الحصول على عدد المواضيع حسب الفئة
   */
  async countByCategory(categoryId: string): Promise<number> {
    return this.count({ filters: { category_id: categoryId } });
  }

  /**
   * Find topics by author
   * البحث عن مواضيع حسب الكاتب
   */
  async findByAuthor(authorId: string): Promise<Topic[]> {
    return this.findMany({ filters: { author_id: authorId } });
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toTopicWithAuthor(row: Record<string, unknown>): TopicWithAuthor {
    const dbRow = row as SupabaseTopic & { author: SupabaseUser };

    return {
      id: dbRow.id,
      title: dbRow.title,
      content: dbRow.content,
      authorId: dbRow.author_id,
      categoryId: dbRow.category_id,
      subCategoryId: dbRow.sub_category_id,
      likesCount: dbRow.likes_count,
      repliesCount: dbRow.replies_count,
      isOfficial: dbRow.is_official,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
      authorName: dbRow.author?.display_name || 'Unknown',
      authorAvatar: dbRow.author?.avatar || null,
    };
  }
}

// ============================================
// Reply Repository
// ============================================

/**
 * Reply Repository
 * مستودع الردود
 */
export class ReplyRepository extends BaseRepository<ReplyEntity> implements IReplyRepository {
  constructor() {
    super(TABLES.REPLIES, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): ReplyEntity {
    const dbRow = row as unknown as SupabaseReply;

    return {
      id: dbRow.id,
      topicId: dbRow.topic_id,
      content: dbRow.content,
      authorId: dbRow.author_id,
      likesCount: dbRow.likes_count,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<ReplyEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.topicId !== undefined) row.topic_id = entity.topicId;
    if (entity.content !== undefined) row.content = entity.content;
    if (entity.authorId !== undefined) row.author_id = entity.authorId;
    if (entity.likesCount !== undefined) row.likes_count = entity.likesCount;

    return row;
  }

  // ============================================
  // Reply-Specific Repository Methods
  // ============================================

  /**
   * Find replies with author info for a topic
   * البحث عن ردود مع معلومات الكاتب لموضوع معين
   */
  async findWithAuthorByTopic(topicId: string): Promise<ReplyWithAuthor[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          author:users (
            display_name,
            avatar
          )
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, topicId });
      }

      return (data || []).map(row => this.toReplyWithAuthor(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, topicId });
    }
  }

  /**
   * Increment likes count
   * زيادة عدد الإعجابات
   */
  async incrementLikes(replyId: string): Promise<void> {
    try {
      const client = this.getClient();

      // Fallback: Get current count and update
      const { data: reply } = await client
        .from(this.tableName)
        .select('likes_count')
        .eq('id', replyId)
        .single();

      if (reply) {
        await client
          .from(this.tableName)
          .update({ likes_count: (reply.likes_count || 0) + 1 })
          .eq('id', replyId);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, replyId, operation: 'incrementLikes' });
    }
  }

  /**
   * Find replies by author
   * البحث عن ردود حسب الكاتب
   */
  async findByAuthor(authorId: string): Promise<ReplyEntity[]> {
    return this.findMany({ filters: { author_id: authorId } });
  }

  /**
   * Count replies by topic
   * عدد الردود حسب الموضوع
   */
  async countByTopic(topicId: string): Promise<number> {
    return this.count({ filters: { topic_id: topicId } });
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toReplyWithAuthor(row: Record<string, unknown>): ReplyWithAuthor {
    const dbRow = row as SupabaseReply & { author: SupabaseUser };

    return {
      id: dbRow.id,
      topicId: dbRow.topic_id,
      content: dbRow.content,
      authorId: dbRow.author_id,
      likesCount: dbRow.likes_count,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
      authorName: dbRow.author?.display_name || 'Unknown',
      authorAvatar: dbRow.author?.avatar || null,
    };
  }
}

// ============================================
// Singleton Instances
// ============================================

let topicRepositoryInstance: TopicRepository | null = null;
let replyRepositoryInstance: ReplyRepository | null = null;

/**
 * Get the TopicRepository singleton instance
 * الحصول على مثيل مستودع المواضيع
 */
export function getTopicRepository(): TopicRepository {
  if (!topicRepositoryInstance) {
    topicRepositoryInstance = new TopicRepository();
  }
  return topicRepositoryInstance;
}

/**
 * Get the ReplyRepository singleton instance
 * الحصول على مثيل مستودع الردود
 */
export function getReplyRepository(): ReplyRepository {
  if (!replyRepositoryInstance) {
    replyRepositoryInstance = new ReplyRepository();
  }
  return replyRepositoryInstance;
}
