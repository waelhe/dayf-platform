/**
 * Review Repository Implementation
 * تنفيذ مستودع المراجعات
 * 
 * Implements IReviewRepository using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES } from '@/lib/supabase';
import { DatabaseError } from '@/core/database';
import {
  Review,
  ReviewPhoto,
  ReviewHelpful,
  ReviewReply,
  ReviewerProfile,
  ReviewWithRelations,
  ReviewFilters,
  ReviewSortBy,
  ReviewPaginationResult,
  ReviewStats,
  IReviewRepository,
  IReviewPhotoRepository,
  IReviewHelpfulRepository,
  IReviewReplyRepository,
  IReviewerProfileRepository,
} from '../../domain/interfaces';
import {
  ReviewStatus,
  ReviewType,
  ReviewerLevel,
  BookingStatus,
} from '@/core/types/enums';

// ============================================
// Supabase Types (snake_case)
// ============================================

/**
 * Supabase Review row
 * صف المراجعة في Supabase
 */
interface SupabaseReview {
  id: string;
  type: string;
  reference_id: string;
  booking_id: string | null;
  source: string;
  travel_phase: string | null;
  author_id: string;
  title: string | null;
  content: string;
  rating: number;
  cleanliness: number | null;
  location: number | null;
  value: number | null;
  service_rating: number | null;
  amenities: number | null;
  communication: number | null;
  status: string;
  is_verified: boolean;
  helpful_count: number;
  reply_count: number;
  visit_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Review Photo row
 * صف صورة المراجعة في Supabase
 */
interface SupabaseReviewPhoto {
  id: string;
  review_id: string;
  url: string;
  caption: string | null;
  order: number;
  created_at: string;
}

/**
 * Supabase Review Helpful row
 * صف التصويت المفيد في Supabase
 */
interface SupabaseReviewHelpful {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

/**
 * Supabase Review Reply row
 * صف رد المراجعة في Supabase
 */
interface SupabaseReviewReply {
  id: string;
  review_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Reviewer Profile row
 * صف ملف المراجع في Supabase
 */
interface SupabaseReviewerProfile {
  id: string;
  user_id: string;
  level: string;
  badges: string | null;
  total_reviews: number;
  total_helpful: number;
  total_photos: number;
  cities_visited: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Review Repository Implementation
// ============================================

/**
 * Review Repository
 * مستودع المراجعات
 */
export class ReviewRepository extends BaseRepository<Review> implements IReviewRepository {
  constructor() {
    super(TABLES.REVIEWS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Review {
    const dbRow = row as unknown as SupabaseReview;

    return {
      id: dbRow.id,
      type: dbRow.type as ReviewType,
      referenceId: dbRow.reference_id,
      bookingId: dbRow.booking_id,
      source: dbRow.source as ReviewType,
      travelPhase: dbRow.travel_phase as ReviewType,
      authorId: dbRow.author_id,
      title: dbRow.title,
      content: dbRow.content,
      rating: dbRow.rating,
      cleanliness: dbRow.cleanliness,
      location: dbRow.location,
      value: dbRow.value,
      serviceRating: dbRow.service_rating,
      amenities: dbRow.amenities,
      communication: dbRow.communication,
      status: dbRow.status as ReviewStatus,
      isVerified: dbRow.is_verified,
      helpfulCount: dbRow.helpful_count,
      replyCount: dbRow.reply_count,
      visitDate: dbRow.visit_date,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Review>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.type !== undefined) row.type = entity.type;
    if (entity.referenceId !== undefined) row.reference_id = entity.referenceId;
    if (entity.bookingId !== undefined) row.booking_id = entity.bookingId;
    if (entity.source !== undefined) row.source = entity.source;
    if (entity.travelPhase !== undefined) row.travel_phase = entity.travelPhase;
    if (entity.authorId !== undefined) row.author_id = entity.authorId;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.content !== undefined) row.content = entity.content;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.cleanliness !== undefined) row.cleanliness = entity.cleanliness;
    if (entity.location !== undefined) row.location = entity.location;
    if (entity.value !== undefined) row.value = entity.value;
    if (entity.serviceRating !== undefined) row.service_rating = entity.serviceRating;
    if (entity.amenities !== undefined) row.amenities = entity.amenities;
    if (entity.communication !== undefined) row.communication = entity.communication;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.isVerified !== undefined) row.is_verified = entity.isVerified;
    if (entity.helpfulCount !== undefined) row.helpful_count = entity.helpfulCount;
    if (entity.replyCount !== undefined) row.reply_count = entity.replyCount;
    if (entity.visitDate !== undefined) row.visit_date = entity.visitDate;

    return row;
  }

  // ============================================
  // Review Operations
  // ============================================

  async findByReference(referenceId: string, type: ReviewType): Promise<Review[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('reference_id', referenceId)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, referenceId, type });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, referenceId, type });
    }
  }

  async findByAuthor(authorId: string): Promise<Review[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, authorId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, authorId });
    }
  }

  async findByAuthorAndReference(
    authorId: string,
    referenceId: string,
    type: ReviewType
  ): Promise<Review | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('author_id', authorId)
        .eq('reference_id', referenceId)
        .eq('type', type)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, authorId, referenceId, type });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, authorId, referenceId, type });
    }
  }

  async findWithFilters(
    filters: ReviewFilters,
    sortBy: ReviewSortBy,
    page: number,
    limit: number,
    currentUserId?: string
  ): Promise<ReviewPaginationResult> {
    try {
      const client = this.getClient();
      const offset = (page - 1) * limit;

      // Build the query
      let countQuery = client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      let dataQuery = client
        .from(this.tableName)
        .select(`
          *,
          photos:${TABLES.REVIEW_PHOTOS}(*),
          replies:${TABLES.REVIEW_REPLIES}(*),
          author:users!reviews_author_id_fkey(
            id,
            display_name,
            avatar,
            reviewer_profile:${TABLES.REVIEWER_PROFILES}(
              level,
              badges
            )
          )
          ${currentUserId ? `,helpfulVotes:${TABLES.REVIEW_HELPFUL}(is_helpful).user_id.eq.${currentUserId}` : ''}
        `);

      // Apply filters
      if (filters.referenceId) {
        countQuery = countQuery.eq('reference_id', filters.referenceId);
        dataQuery = dataQuery.eq('reference_id', filters.referenceId);
      }
      if (filters.type) {
        countQuery = countQuery.eq('type', filters.type);
        dataQuery = dataQuery.eq('type', filters.type);
      }
      if (filters.authorId) {
        countQuery = countQuery.eq('author_id', filters.authorId);
        dataQuery = dataQuery.eq('author_id', filters.authorId);
      }
      if (filters.rating !== undefined) {
        countQuery = countQuery.eq('rating', filters.rating);
        dataQuery = dataQuery.eq('rating', filters.rating);
      }
      if (filters.minRating !== undefined) {
        countQuery = countQuery.gte('rating', filters.minRating);
        dataQuery = dataQuery.gte('rating', filters.minRating);
      }
      if (filters.maxRating !== undefined) {
        countQuery = countQuery.lte('rating', filters.maxRating);
        dataQuery = dataQuery.lte('rating', filters.maxRating);
      }
      if (filters.isVerified !== undefined) {
        countQuery = countQuery.eq('is_verified', filters.isVerified);
        dataQuery = dataQuery.eq('is_verified', filters.isVerified);
      }
      if (filters.status) {
        countQuery = countQuery.eq('status', filters.status);
        dataQuery = dataQuery.eq('status', filters.status);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          dataQuery = dataQuery.order('created_at', { ascending: false });
          break;
        case 'helpful':
          dataQuery = dataQuery.order('helpful_count', { ascending: false });
          dataQuery = dataQuery.order('created_at', { ascending: false });
          break;
        case 'highest':
          dataQuery = dataQuery.order('rating', { ascending: false });
          dataQuery = dataQuery.order('created_at', { ascending: false });
          break;
        case 'lowest':
          dataQuery = dataQuery.order('rating', { ascending: true });
          dataQuery = dataQuery.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      dataQuery = dataQuery.range(offset, offset + limit - 1);

      // Execute queries
      const { count, error: countError } = await countQuery;
      const { data, error: dataError } = await dataQuery;

      if (countError) {
        throw DatabaseError.fromError(countError, { table: this.tableName, operation: 'count' });
      }
      if (dataError) {
        throw DatabaseError.fromError(dataError, { table: this.tableName, operation: 'findWithFilters' });
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      // Transform results
      const reviews: ReviewWithRelations[] = (data || []).map((row: Record<string, unknown>) => {
        const review = this.toEntity(row);
        const author = row.author as Record<string, unknown> | undefined;
        const photos = (row.photos as Array<Record<string, unknown>>) || [];
        const replies = (row.replies as Array<Record<string, unknown>>) || [];
        const helpfulVotes = (row.helpfulVotes as Array<Record<string, unknown>>) || [];

        return {
          ...review,
          author: {
            id: (author?.id as string) || '',
            name: (author?.display_name as string) || '',
            avatar: author?.avatar as string | null,
            level: (author?.reviewer_profile as Record<string, unknown>)?.level as ReviewerLevel | undefined,
            badges: (author?.reviewer_profile as Record<string, unknown>)?.badges
              ? JSON.parse((author?.reviewer_profile as Record<string, unknown>).badges as string)
              : undefined,
          },
          photos: photos.map(p => ({
            id: p.id as string,
            reviewId: p.review_id as string,
            url: p.url as string,
            caption: p.caption as string | null,
            order: p.order as number,
            createdAt: p.created_at as string,
          })),
          replies: replies.map(r => ({
            id: r.id as string,
            reviewId: r.review_id as string,
            authorId: r.author_id as string,
            authorName: r.author_name as string,
            authorRole: r.author_role as string,
            content: r.content as string,
            createdAt: r.created_at as string,
            updatedAt: r.updated_at as string,
          })),
          userHelpful: helpfulVotes.length > 0 ? helpfulVotes[0].is_helpful as boolean : undefined,
        };
      });

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findWithFilters' });
    }
  }

  async findWithRelations(reviewId: string, currentUserId?: string): Promise<ReviewWithRelations | null> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          photos:${TABLES.REVIEW_PHOTOS}(*),
          replies:${TABLES.REVIEW_REPLIES}(order(created_at.asc)),
          author:users!reviews_author_id_fkey(
            id,
            display_name,
            avatar,
            reviewer_profile:${TABLES.REVIEWER_PROFILES}(
              level,
              badges
            )
          )
          ${currentUserId ? `,helpfulVotes:${TABLES.REVIEW_HELPFUL}(is_helpful).user_id.eq.${currentUserId}` : ''}
        `)
        .eq('id', reviewId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId });
      }

      if (!data) return null;

      const review = this.toEntity(data);
      const author = data.author as Record<string, unknown> | undefined;
      const photos = (data.photos as Array<Record<string, unknown>>) || [];
      const replies = (data.replies as Array<Record<string, unknown>>) || [];
      const helpfulVotes = (data.helpfulVotes as Array<Record<string, unknown>>) || [];

      return {
        ...review,
        author: {
          id: (author?.id as string) || '',
          name: (author?.display_name as string) || '',
          avatar: author?.avatar as string | null,
          level: (author?.reviewer_profile as Record<string, unknown>)?.level as ReviewerLevel | undefined,
          badges: (author?.reviewer_profile as Record<string, unknown>)?.badges
            ? JSON.parse((author?.reviewer_profile as Record<string, unknown>).badges as string)
            : undefined,
        },
        photos: photos.map(p => ({
          id: p.id as string,
          reviewId: p.review_id as string,
          url: p.url as string,
          caption: p.caption as string | null,
          order: p.order as number,
          createdAt: p.created_at as string,
        })),
        replies: replies.map(r => ({
          id: r.id as string,
          reviewId: r.review_id as string,
          authorId: r.author_id as string,
          authorName: r.author_name as string,
          authorRole: r.author_role as string,
          content: r.content as string,
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
        })),
        userHelpful: helpfulVotes.length > 0 ? helpfulVotes[0].is_helpful as boolean : undefined,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId });
    }
  }

  async updateStatus(reviewId: string, status: ReviewStatus): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status,
          updated_at: now,
        })
        .eq('id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateStatus' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateStatus' });
    }
  }

  async updateRating(reviewId: string, rating: number): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          rating,
          updated_at: now,
        })
        .eq('id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateRating' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateRating' });
    }
  }

  // ============================================
  // Photo Operations
  // ============================================

  async createPhoto(photo: Omit<ReviewPhoto, 'id' | 'createdAt'>): Promise<ReviewPhoto> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(TABLES.REVIEW_PHOTOS)
        .insert({
          review_id: photo.reviewId,
          url: photo.url,
          caption: photo.caption,
          order: photo.order,
          created_at: now,
        })
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_PHOTOS, operation: 'createPhoto' });
      }

      return {
        id: data.id,
        reviewId: data.review_id,
        url: data.url,
        caption: data.caption,
        order: data.order,
        createdAt: data.created_at,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_PHOTOS, operation: 'createPhoto' });
    }
  }

  async findPhotosByReview(reviewId: string): Promise<ReviewPhoto[]> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(TABLES.REVIEW_PHOTOS)
        .select('*')
        .eq('review_id', reviewId)
        .order('order', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_PHOTOS, reviewId });
      }

      return (data || []).map(p => ({
        id: p.id,
        reviewId: p.review_id,
        url: p.url,
        caption: p.caption,
        order: p.order,
        createdAt: p.created_at,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_PHOTOS, reviewId });
    }
  }

  async countPhotosByAuthor(authorId: string): Promise<number> {
    try {
      const client = this.getClient();

      const { count, error } = await client
        .from(TABLES.REVIEW_PHOTOS)
        .select('*', { count: 'exact', head: true })
        .eq('review.author_id', authorId);

      if (error) {
        // Fallback: use a join-like query
        const { data: reviews } = await client
          .from(TABLES.REVIEWS)
          .select('id')
          .eq('author_id', authorId);

        if (!reviews || reviews.length === 0) return 0;

        const reviewIds = reviews.map(r => r.id);
        const { count: photoCount } = await client
          .from(TABLES.REVIEW_PHOTOS)
          .select('*', { count: 'exact', head: true })
          .in('review_id', reviewIds);

        return photoCount || 0;
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_PHOTOS, authorId });
    }
  }

  // ============================================
  // Helpful Operations
  // ============================================

  async upsertHelpfulVote(
    reviewId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<ReviewHelpful> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      // Check if vote exists
      const existing = await this.findHelpfulVote(reviewId, userId);

      if (existing) {
        // Update existing vote
        const { data, error } = await client
          .from(TABLES.REVIEW_HELPFUL)
          .update({
            is_helpful: isHelpful,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, operation: 'upsertHelpfulVote' });
        }

        return {
          id: data.id,
          reviewId: data.review_id,
          userId: data.user_id,
          isHelpful: data.is_helpful,
          createdAt: data.created_at,
        };
      } else {
        // Create new vote
        const { data, error } = await client
          .from(TABLES.REVIEW_HELPFUL)
          .insert({
            review_id: reviewId,
            user_id: userId,
            is_helpful: isHelpful,
            created_at: now,
          })
          .select()
          .single();

        if (error) {
          throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, operation: 'upsertHelpfulVote' });
        }

        return {
          id: data.id,
          reviewId: data.review_id,
          userId: data.user_id,
          isHelpful: data.is_helpful,
          createdAt: data.created_at,
        };
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, operation: 'upsertHelpfulVote' });
    }
  }

  async findHelpfulVote(reviewId: string, userId: string): Promise<ReviewHelpful | null> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(TABLES.REVIEW_HELPFUL)
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, reviewId, userId });
      }

      return data ? {
        id: data.id,
        reviewId: data.review_id,
        userId: data.user_id,
        isHelpful: data.is_helpful,
        createdAt: data.created_at,
      } : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, reviewId, userId });
    }
  }

  async deleteHelpfulVote(reviewId: string, userId: string): Promise<void> {
    try {
      const client = this.getClient();

      const { error } = await client
        .from(TABLES.REVIEW_HELPFUL)
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, reviewId, userId, operation: 'deleteHelpfulVote' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, reviewId, userId, operation: 'deleteHelpfulVote' });
    }
  }

  async countHelpfulVotes(reviewId: string, isHelpful = true): Promise<number> {
    try {
      const client = this.getClient();

      const { count, error } = await client
        .from(TABLES.REVIEW_HELPFUL)
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId)
        .eq('is_helpful', isHelpful);

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, reviewId, operation: 'countHelpfulVotes' });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, reviewId, operation: 'countHelpfulVotes' });
    }
  }

  async countTotalHelpfulReceived(authorId: string): Promise<number> {
    try {
      const client = this.getClient();

      // Get all reviews by author
      const { data: reviews, error: reviewsError } = await client
        .from(TABLES.REVIEWS)
        .select('id')
        .eq('author_id', authorId);

      if (reviewsError) {
        throw DatabaseError.fromError(reviewsError, { table: TABLES.REVIEWS, authorId });
      }

      if (!reviews || reviews.length === 0) return 0;

      const reviewIds = reviews.map(r => r.id);

      // Count helpful votes for those reviews
      const { count, error } = await client
        .from(TABLES.REVIEW_HELPFUL)
        .select('*', { count: 'exact', head: true })
        .in('review_id', reviewIds)
        .eq('is_helpful', true);

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, authorId, operation: 'countTotalHelpfulReceived' });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_HELPFUL, authorId, operation: 'countTotalHelpfulReceived' });
    }
  }

  async updateHelpfulCount(reviewId: string, count: number): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          helpful_count: count,
          updated_at: now,
        })
        .eq('id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateHelpfulCount' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateHelpfulCount' });
    }
  }

  // ============================================
  // Reply Operations
  // ============================================

  async createReply(reply: Omit<ReviewReply, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewReply> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(TABLES.REVIEW_REPLIES)
        .insert({
          review_id: reply.reviewId,
          author_id: reply.authorId,
          author_name: reply.authorName,
          author_role: reply.authorRole,
          content: reply.content,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_REPLIES, operation: 'createReply' });
      }

      return {
        id: data.id,
        reviewId: data.review_id,
        authorId: data.author_id,
        authorName: data.author_name,
        authorRole: data.author_role,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_REPLIES, operation: 'createReply' });
    }
  }

  async findRepliesByReview(reviewId: string): Promise<ReviewReply[]> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(TABLES.REVIEW_REPLIES)
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_REPLIES, reviewId });
      }

      return (data || []).map(r => ({
        id: r.id,
        reviewId: r.review_id,
        authorId: r.author_id,
        authorName: r.author_name,
        authorRole: r.author_role,
        content: r.content,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_REPLIES, reviewId });
    }
  }

  async countReplies(reviewId: string): Promise<number> {
    try {
      const client = this.getClient();

      const { count, error } = await client
        .from(TABLES.REVIEW_REPLIES)
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.REVIEW_REPLIES, reviewId, operation: 'countReplies' });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEW_REPLIES, reviewId, operation: 'countReplies' });
    }
  }

  async updateReplyCount(reviewId: string, count: number): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          reply_count: count,
          updated_at: now,
        })
        .eq('id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateReplyCount' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'updateReplyCount' });
    }
  }

  // ============================================
  // Reviewer Profile Operations
  // ============================================

  async findReviewerProfile(userId: string): Promise<ReviewerProfile | null> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(TABLES.REVIEWER_PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: TABLES.REVIEWER_PROFILES, userId });
      }

      return data ? {
        id: data.id,
        userId: data.user_id,
        level: data.level as ReviewerLevel,
        badges: data.badges,
        totalReviews: data.total_reviews,
        totalHelpful: data.total_helpful,
        totalPhotos: data.total_photos,
        citiesVisited: data.cities_visited,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEWER_PROFILES, userId });
    }
  }

  async upsertReviewerProfile(profile: Omit<ReviewerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewerProfile> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      // Check if profile exists
      const existing = await this.findReviewerProfile(profile.userId);

      if (existing) {
        // Update
        const { data, error } = await client
          .from(TABLES.REVIEWER_PROFILES)
          .update({
            level: profile.level,
            badges: profile.badges,
            total_reviews: profile.totalReviews,
            total_helpful: profile.totalHelpful,
            total_photos: profile.totalPhotos,
            cities_visited: profile.citiesVisited,
            updated_at: now,
          })
          .eq('user_id', profile.userId)
          .select()
          .single();

        if (error) {
          throw DatabaseError.fromError(error, { table: TABLES.REVIEWER_PROFILES, userId: profile.userId, operation: 'upsertReviewerProfile' });
        }

        return {
          id: data.id,
          userId: data.user_id,
          level: data.level as ReviewerLevel,
          badges: data.badges,
          totalReviews: data.total_reviews,
          totalHelpful: data.total_helpful,
          totalPhotos: data.total_photos,
          citiesVisited: data.cities_visited,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } else {
        // Create
        const { data, error } = await client
          .from(TABLES.REVIEWER_PROFILES)
          .insert({
            user_id: profile.userId,
            level: profile.level,
            badges: profile.badges,
            total_reviews: profile.totalReviews,
            total_helpful: profile.totalHelpful,
            total_photos: profile.totalPhotos,
            cities_visited: profile.citiesVisited,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          throw DatabaseError.fromError(error, { table: TABLES.REVIEWER_PROFILES, userId: profile.userId, operation: 'upsertReviewerProfile' });
        }

        return {
          id: data.id,
          userId: data.user_id,
          level: data.level as ReviewerLevel,
          badges: data.badges,
          totalReviews: data.total_reviews,
          totalHelpful: data.total_helpful,
          totalPhotos: data.total_photos,
          citiesVisited: data.cities_visited,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.REVIEWER_PROFILES, userId: profile.userId, operation: 'upsertReviewerProfile' });
    }
  }

  async countReviewsByAuthor(authorId: string, status?: ReviewStatus): Promise<number> {
    try {
      const client = this.getClient();

      let query = client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId);

      if (status) {
        query = query.eq('status', status);
      }

      const { count, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, authorId, operation: 'countReviewsByAuthor' });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, authorId, operation: 'countReviewsByAuthor' });
    }
  }

  // ============================================
  // Stats Operations
  // ============================================

  async getStats(referenceId: string, type: ReviewType): Promise<ReviewStats> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(this.tableName)
        .select(`
          rating,
          cleanliness,
          location,
          value,
          service_rating,
          amenities,
          communication,
          is_verified,
          created_at,
          photos:${TABLES.REVIEW_PHOTOS}(id)
        `)
        .eq('reference_id', referenceId)
        .eq('type', type)
        .eq('status', ReviewStatus.PUBLISHED);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, referenceId, type, operation: 'getStats' });
      }

      const reviews = data || [];
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return {
          referenceId,
          type,
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
          criteriaAverages: {
            cleanliness: null,
            location: null,
            value: null,
            serviceRating: null,
            amenities: null,
            communication: null,
          },
          verifiedCount: 0,
          photosCount: 0,
          recentReviews: 0,
        };
      }

      // Calculate averages
      const averageRating = Math.round(
        (reviews.reduce((sum, r) => sum + (r.rating as number), 0) / totalReviews) * 10
      ) / 10;

      // Rating distribution
      const ratingDistribution: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
      reviews.forEach(r => {
        const roundedRating = Math.round(r.rating as number);
        const key = String(Math.min(5, Math.max(1, roundedRating)));
        ratingDistribution[key]++;
      });

      // Criteria averages
      const criteriaAverages = {
        cleanliness: this.calculateCriteriaAverage(reviews, 'cleanliness'),
        location: this.calculateCriteriaAverage(reviews, 'location'),
        value: this.calculateCriteriaAverage(reviews, 'value'),
        serviceRating: this.calculateCriteriaAverage(reviews, 'service_rating'),
        amenities: this.calculateCriteriaAverage(reviews, 'amenities'),
        communication: this.calculateCriteriaAverage(reviews, 'communication'),
      };

      // Verified count
      const verifiedCount = reviews.filter(r => r.is_verified).length;

      // Photos count
      const photosCount = reviews.reduce((sum, r) => {
        const photos = r.photos as Array<unknown> || [];
        return sum + photos.length;
      }, 0);

      // Recent reviews (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReviews = reviews.filter(r => new Date(r.created_at as string) >= thirtyDaysAgo).length;

      return {
        referenceId,
        type,
        totalReviews,
        averageRating,
        ratingDistribution,
        criteriaAverages,
        verifiedCount,
        photosCount,
        recentReviews,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, referenceId, type, operation: 'getStats' });
    }
  }

  private calculateCriteriaAverage(
    reviews: Array<Record<string, unknown>>,
    field: string
  ): number | null {
    const values = reviews
      .map(r => r[field])
      .filter((v): v is number => v !== null && v !== undefined);

    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }

  // ============================================
  // Verification Operations
  // ============================================

  async checkCompletedBooking(userId: string, serviceId: string): Promise<{ bookingId: string } | null> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(TABLES.BOOKINGS)
        .select('id')
        .eq('guest_id', userId)
        .eq('service_id', serviceId)
        .eq('status', BookingStatus.COMPLETED)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: TABLES.BOOKINGS, userId, serviceId, operation: 'checkCompletedBooking' });
      }

      return data ? { bookingId: data.id } : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.BOOKINGS, userId, serviceId, operation: 'checkCompletedBooking' });
    }
  }

  async checkDeliveredOrder(userId: string, productId: string): Promise<{ orderId: string } | null> {
    try {
      const client = this.getClient();

      // First get orders by user with DELIVERED status
      const { data: orders, error: ordersError } = await client
        .from(TABLES.ORDERS)
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'DELIVERED');

      if (ordersError) {
        throw DatabaseError.fromError(ordersError, { table: TABLES.ORDERS, userId, operation: 'checkDeliveredOrder' });
      }

      if (!orders || orders.length === 0) return null;

      const orderIds = orders.map(o => o.id);

      // Check if product is in any of these orders
      const { data: orderItem, error: itemError } = await client
        .from(TABLES.ORDER_ITEMS)
        .select('order_id')
        .eq('product_id', productId)
        .in('order_id', orderIds)
        .limit(1)
        .single();

      if (itemError) {
        if (itemError.code === 'PGRST116') return null;
        throw DatabaseError.fromError(itemError, { table: TABLES.ORDER_ITEMS, productId, operation: 'checkDeliveredOrder' });
      }

      return orderItem ? { orderId: orderItem.order_id } : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.ORDER_ITEMS, productId, operation: 'checkDeliveredOrder' });
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let reviewRepositoryInstance: ReviewRepository | null = null;

/**
 * Get the ReviewRepository singleton instance
 * الحصول على مثيل مستودع المراجعات
 */
export function getReviewRepository(): ReviewRepository {
  if (!reviewRepositoryInstance) {
    reviewRepositoryInstance = new ReviewRepository();
  }
  return reviewRepositoryInstance;
}

// ============================================
// Review Photo Repository Implementation
// ============================================

/**
 * Review Photo Repository
 * مستودع صور المراجعات
 */
export class ReviewPhotoRepository extends BaseRepository<ReviewPhoto> implements IReviewPhotoRepository {
  constructor() {
    super(TABLES.REVIEW_PHOTOS, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): ReviewPhoto {
    const dbRow = row as unknown as SupabaseReviewPhoto;
    return {
      id: dbRow.id,
      reviewId: dbRow.review_id,
      url: dbRow.url,
      caption: dbRow.caption,
      order: dbRow.order,
      createdAt: dbRow.created_at,
    };
  }

  protected override toRow(entity: Partial<ReviewPhoto>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (entity.reviewId !== undefined) row.review_id = entity.reviewId;
    if (entity.url !== undefined) row.url = entity.url;
    if (entity.caption !== undefined) row.caption = entity.caption;
    if (entity.order !== undefined) row.order = entity.order;
    return row;
  }

  async findByReview(reviewId: string): Promise<ReviewPhoto[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('review_id', reviewId)
        .order('order', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId });
    }
  }

  async deleteByReview(reviewId: string): Promise<void> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('review_id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'deleteByReview' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'deleteByReview' });
    }
  }
}

let reviewPhotoRepositoryInstance: ReviewPhotoRepository | null = null;

export function getReviewPhotoRepository(): ReviewPhotoRepository {
  if (!reviewPhotoRepositoryInstance) {
    reviewPhotoRepositoryInstance = new ReviewPhotoRepository();
  }
  return reviewPhotoRepositoryInstance;
}

// ============================================
// Review Helpful Repository Implementation
// ============================================

/**
 * Review Helpful Repository
 * مستودع التصويتات المفيدة
 */
export class ReviewHelpfulRepository extends BaseRepository<ReviewHelpful> implements IReviewHelpfulRepository {
  constructor() {
    super(TABLES.REVIEW_HELPFUL, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): ReviewHelpful {
    const dbRow = row as unknown as SupabaseReviewHelpful;
    return {
      id: dbRow.id,
      reviewId: dbRow.review_id,
      userId: dbRow.user_id,
      isHelpful: dbRow.is_helpful,
      createdAt: dbRow.created_at,
    };
  }

  protected override toRow(entity: Partial<ReviewHelpful>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (entity.reviewId !== undefined) row.review_id = entity.reviewId;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.isHelpful !== undefined) row.is_helpful = entity.isHelpful;
    return row;
  }

  async findByReviewAndUser(reviewId: string, userId: string): Promise<ReviewHelpful | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, userId });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, userId });
    }
  }

  async countByReview(reviewId: string, isHelpful?: boolean): Promise<number> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      if (isHelpful !== undefined) {
        query = query.eq('is_helpful', isHelpful);
      }

      const { count, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'countByReview' });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'countByReview' });
    }
  }
}

let reviewHelpfulRepositoryInstance: ReviewHelpfulRepository | null = null;

export function getReviewHelpfulRepository(): ReviewHelpfulRepository {
  if (!reviewHelpfulRepositoryInstance) {
    reviewHelpfulRepositoryInstance = new ReviewHelpfulRepository();
  }
  return reviewHelpfulRepositoryInstance;
}

// ============================================
// Review Reply Repository Implementation
// ============================================

/**
 * Review Reply Repository
 * مستودع ردود المراجعات
 */
export class ReviewReplyRepository extends BaseRepository<ReviewReply> implements IReviewReplyRepository {
  constructor() {
    super(TABLES.REVIEW_REPLIES, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): ReviewReply {
    const dbRow = row as unknown as SupabaseReviewReply;
    return {
      id: dbRow.id,
      reviewId: dbRow.review_id,
      authorId: dbRow.author_id,
      authorName: dbRow.author_name,
      authorRole: dbRow.author_role,
      content: dbRow.content,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<ReviewReply>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (entity.reviewId !== undefined) row.review_id = entity.reviewId;
    if (entity.authorId !== undefined) row.author_id = entity.authorId;
    if (entity.authorName !== undefined) row.author_name = entity.authorName;
    if (entity.authorRole !== undefined) row.author_role = entity.authorRole;
    if (entity.content !== undefined) row.content = entity.content;
    return row;
  }

  async findByReview(reviewId: string): Promise<ReviewReply[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId });
    }
  }

  async countByReview(reviewId: string): Promise<number> {
    try {
      const client = this.getClient();
      const { count, error } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'countByReview' });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, reviewId, operation: 'countByReview' });
    }
  }
}

let reviewReplyRepositoryInstance: ReviewReplyRepository | null = null;

export function getReviewReplyRepository(): ReviewReplyRepository {
  if (!reviewReplyRepositoryInstance) {
    reviewReplyRepositoryInstance = new ReviewReplyRepository();
  }
  return reviewReplyRepositoryInstance;
}

// ============================================
// Reviewer Profile Repository Implementation
// ============================================

/**
 * Reviewer Profile Repository
 * مستودع ملفات المراجعين
 */
export class ReviewerProfileRepository extends BaseRepository<ReviewerProfile> implements IReviewerProfileRepository {
  constructor() {
    super(TABLES.REVIEWER_PROFILES, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): ReviewerProfile {
    const dbRow = row as unknown as SupabaseReviewerProfile;
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      level: dbRow.level as ReviewerLevel,
      badges: dbRow.badges,
      totalReviews: dbRow.total_reviews,
      totalHelpful: dbRow.total_helpful,
      totalPhotos: dbRow.total_photos,
      citiesVisited: dbRow.cities_visited,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<ReviewerProfile>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.level !== undefined) row.level = entity.level;
    if (entity.badges !== undefined) row.badges = entity.badges;
    if (entity.totalReviews !== undefined) row.total_reviews = entity.totalReviews;
    if (entity.totalHelpful !== undefined) row.total_helpful = entity.totalHelpful;
    if (entity.totalPhotos !== undefined) row.total_photos = entity.totalPhotos;
    if (entity.citiesVisited !== undefined) row.cities_visited = entity.citiesVisited;
    return row;
  }

  async findByUserId(userId: string): Promise<ReviewerProfile | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, userId });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }
}

let reviewerProfileRepositoryInstance: ReviewerProfileRepository | null = null;

export function getReviewerProfileRepository(): ReviewerProfileRepository {
  if (!reviewerProfileRepositoryInstance) {
    reviewerProfileRepositoryInstance = new ReviewerProfileRepository();
  }
  return reviewerProfileRepositoryInstance;
}
