/**
 * Community Repository Interface
 * واجهة مستودع المجتمع
 * 
 * Defines the contract for community data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';

// ============================================
// Topic Entity Interface
// ============================================

/**
 * Topic entity interface
 * واجهة كيان الموضوع
 */
export interface Topic extends BaseEntity {
  /** Topic title */
  title: string;

  /** Topic content */
  content: string;

  /** Author (user) ID */
  authorId: string;

  /** Category ID */
  categoryId: string;

  /** Sub-category ID (optional) */
  subCategoryId: string | null;

  /** Number of likes */
  likesCount: number;

  /** Number of replies */
  repliesCount: number;

  /** Is this an official topic */
  isOfficial: boolean;
}

/**
 * Topic with author info
 * الموضوع مع معلومات الكاتب
 */
export interface TopicWithAuthor extends Topic {
  /** Author display name */
  authorName: string;

  /** Author avatar URL */
  authorAvatar: string | null;
}

// ============================================
// Reply Entity Interface
// ============================================

/**
 * Reply entity interface
 * واجهة كيان الرد
 */
export interface ReplyEntity extends BaseEntity {
  /** Topic ID this reply belongs to */
  topicId: string;

  /** Reply content */
  content: string;

  /** Author (user) ID */
  authorId: string;

  /** Number of likes */
  likesCount: number;
}

/**
 * Reply with author info
 * الرد مع معلومات الكاتب
 */
export interface ReplyWithAuthor extends ReplyEntity {
  /** Author display name */
  authorName: string;

  /** Author avatar URL */
  authorAvatar: string | null;
}

// ============================================
// Topic Filters
// ============================================

/**
 * Topic filters
 * فلاتر المواضيع
 */
export interface TopicFilters {
  categoryId?: string;
  authorId?: string;
  isOfficial?: boolean;
}

// ============================================
// Repository Interfaces
// ============================================

/**
 * Topic Repository Interface
 * واجهة مستودع المواضيع
 */
export interface ITopicRepository extends IRepository<Topic> {
  /**
   * Find topics with author info
   * البحث عن مواضيع مع معلومات الكاتب
   */
  findWithAuthor(options?: {
    categoryId?: string;
    limit?: number;
  }): Promise<TopicWithAuthor[]>;

  /**
   * Find topic by ID with author info
   * البحث عن موضوع بالمعرف مع معلومات الكاتب
   */
  findByIdWithAuthor(id: string): Promise<TopicWithAuthor | null>;

  /**
   * Increment likes count
   * زيادة عدد الإعجابات
   */
  incrementLikes(topicId: string): Promise<void>;

  /**
   * Increment replies count
   * زيادة عدد الردود
   */
  incrementReplies(topicId: string): Promise<void>;

  /**
   * Get topics count by category
   * الحصول على عدد المواضيع حسب الفئة
   */
  countByCategory(categoryId: string): Promise<number>;

  /**
   * Find topics by author
   * البحث عن مواضيع حسب الكاتب
   */
  findByAuthor(authorId: string): Promise<Topic[]>;
}

/**
 * Reply Repository Interface
 * واجهة مستودع الردود
 */
export interface IReplyRepository extends IRepository<ReplyEntity> {
  /**
   * Find replies with author info for a topic
   * البحث عن ردود مع معلومات الكاتب لموضوع معين
   */
  findWithAuthorByTopic(topicId: string): Promise<ReplyWithAuthor[]>;

  /**
   * Increment likes count
   * زيادة عدد الإعجابات
   */
  incrementLikes(replyId: string): Promise<void>;

  /**
   * Find replies by author
   * البحث عن ردود حسب الكاتب
   */
  findByAuthor(authorId: string): Promise<ReplyEntity[]>;

  /**
   * Count replies by topic
   * عدد الردود حسب الموضوع
   */
  countByTopic(topicId: string): Promise<number>;
}
