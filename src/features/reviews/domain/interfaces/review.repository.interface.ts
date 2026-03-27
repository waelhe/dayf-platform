/**
 * Review Repository Interface
 * واجهة مستودع المراجعات
 * 
 * Defines the contract for review data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import {
  ReviewStatus,
  ReviewType,
  ReviewerLevel,
  ReviewSource,
  TravelPhase,
  BookingStatus,
} from '@/core/types/enums';

// Re-export enums
export { ReviewStatus, ReviewType, ReviewerLevel, ReviewSource, TravelPhase, BookingStatus };

// ============================================
// Entity Interfaces (camelCase)
// ============================================

/**
 * Review entity interface
 * واجهة كيان المراجعة
 */
export interface Review extends BaseEntity {
  /** Type of entity being reviewed */
  type: ReviewType;
  
  /** ID of the entity being reviewed */
  referenceId: string;
  
  /** Associated booking ID (if any) */
  bookingId: string | null;
  
  /** Source of the review */
  source: ReviewSource;
  
  /** Travel phase when review was written */
  travelPhase: TravelPhase | null;
  
  /** Author user ID */
  authorId: string;
  
  /** Review title */
  title: string | null;
  
  /** Review content */
  content: string;
  
  /** Overall rating */
  rating: number;
  
  /** Cleanliness rating */
  cleanliness: number | null;
  
  /** Location rating */
  location: number | null;
  
  /** Value rating */
  value: number | null;
  
  /** Service rating */
  serviceRating: number | null;
  
  /** Amenities rating */
  amenities: number | null;
  
  /** Communication rating */
  communication: number | null;
  
  /** Review status */
  status: ReviewStatus;
  
  /** Is verified (from booking) */
  isVerified: boolean;
  
  /** Number of helpful votes */
  helpfulCount: number;
  
  /** Number of replies */
  replyCount: number;
  
  /** Date of visit */
  visitDate: Date | string | null;
}

/**
 * Review Photo entity interface
 * واجهة كيان صورة المراجعة
 */
export interface ReviewPhoto extends BaseEntity {
  /** Review ID */
  reviewId: string;
  
  /** Photo URL */
  url: string;
  
  /** Photo caption */
  caption: string | null;
  
  /** Display order */
  order: number;
}

/**
 * Review Helpful entity interface
 * واجهة كيان التصويت المفيد
 */
export interface ReviewHelpful extends BaseEntity {
  /** Review ID */
  reviewId: string;
  
  /** User ID */
  userId: string;
  
  /** Is helpful vote */
  isHelpful: boolean;
}

/**
 * Review Reply entity interface
 * واجهة كيان رد المراجعة
 */
export interface ReviewReply extends BaseEntity {
  /** Review ID */
  reviewId: string;
  
  /** Author user ID */
  authorId: string;
  
  /** Author display name */
  authorName: string;
  
  /** Author role */
  authorRole: string;
  
  /** Reply content */
  content: string;
  
  /** Updated at timestamp */
  updatedAt: Date | string;
}

/**
 * Reviewer Profile entity interface
 * واجهة كيان ملف المراجع
 */
export interface ReviewerProfile extends BaseEntity {
  /** User ID */
  userId: string;
  
  /** Reviewer level */
  level: ReviewerLevel;
  
  /** Badges (JSON string or array) */
  badges: string | null;
  
  /** Total reviews count */
  totalReviews: number;
  
  /** Total helpful votes received */
  totalHelpful: number;
  
  /** Total photos uploaded */
  totalPhotos: number;
  
  /** Cities visited (JSON string or array) */
  citiesVisited: string | null;
}

// ============================================
// Extended Types (with relations)
// ============================================

/**
 * Review with author information
 * المراجعة مع معلومات المؤلف
 */
export interface ReviewWithAuthor extends Review {
  author: {
    id: string;
    displayName: string;
    avatar: string | null;
    reviewerProfile?: {
      level: ReviewerLevel;
      badges: string | null;
    } | null;
  };
}

/**
 * Review with all relations
 * المراجعة مع جميع العلاقات
 */
export interface ReviewWithRelations extends Review {
  author: {
    id: string;
    name: string;
    avatar: string | null;
    level?: ReviewerLevel;
    badges?: string[];
  };
  photos: ReviewPhoto[];
  replies: ReviewReply[];
  userHelpful?: boolean;
}

// ============================================
// Filter & Stats Types
// ============================================

/**
 * Review filters
 * فلاتر المراجعات
 */
export interface ReviewFilters {
  referenceId?: string;
  type?: ReviewType;
  authorId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isVerified?: boolean;
  status?: ReviewStatus;
}

/**
 * Review sort options
 * خيارات ترتيب المراجعات
 */
export type ReviewSortBy = 'newest' | 'helpful' | 'highest' | 'lowest';

/**
 * Review pagination result
 * نتيجة صفحات المراجعات
 */
export interface ReviewPaginationResult {
  reviews: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Review statistics
 * إحصائيات المراجعات
 */
export interface ReviewStats {
  referenceId: string;
  type: ReviewType;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  criteriaAverages: {
    cleanliness: number | null;
    location: number | null;
    value: number | null;
    serviceRating: number | null;
    amenities: number | null;
    communication: number | null;
  };
  verifiedCount: number;
  photosCount: number;
  recentReviews: number;
}

/**
 * Can review result
 * نتيجة التحقق من إمكانية المراجعة
 */
export interface CanReviewResult {
  canReview: boolean;
  reason: 'COMPLETED_BOOKING' | 'OPEN_REVIEW' | 'ALREADY_REVIEWED' | 'NOT_AUTHORIZED';
  bookingId?: string;
  existingReview?: Review;
  isVerified?: boolean;
}

// ============================================
// Repository Interface
// ============================================

/**
 * Review Repository Interface
 * واجهة مستودع المراجعات
 */
export interface IReviewRepository extends IRepository<Review> {
  // ============================================
  // Review Operations
  // ============================================

  /**
   * Find reviews by reference ID
   * البحث عن مراجعات بواسطة المعرف المرجعي
   */
  findByReference(referenceId: string, type: ReviewType): Promise<Review[]>;

  /**
   * Find reviews by author ID
   * البحث عن مراجعات بواسطة المؤلف
   */
  findByAuthor(authorId: string): Promise<Review[]>;

  /**
   * Find review by author and reference
   * البحث عن مراجعة بواسطة المؤلف والمرجع
   */
  findByAuthorAndReference(
    authorId: string,
    referenceId: string,
    type: ReviewType
  ): Promise<Review | null>;

  /**
   * Find reviews with filters and pagination
   * البحث عن مراجعات مع فلاتر وترقيم الصفحات
   */
  findWithFilters(
    filters: ReviewFilters,
    sortBy: ReviewSortBy,
    page: number,
    limit: number,
    currentUserId?: string
  ): Promise<ReviewPaginationResult>;

  /**
   * Find review with all relations
   * البحث عن مراجعة مع جميع العلاقات
   */
  findWithRelations(reviewId: string, currentUserId?: string): Promise<ReviewWithRelations | null>;

  /**
   * Update review status
   * تحديث حالة المراجعة
   */
  updateStatus(reviewId: string, status: ReviewStatus): Promise<void>;

  /**
   * Update review rating
   * تحديث تقييم المراجعة
   */
  updateRating(reviewId: string, rating: number): Promise<void>;

  // ============================================
  // Photo Operations
  // ============================================

  /**
   * Create review photo
   * إنشاء صورة مراجعة
   */
  createPhoto(photo: Omit<ReviewPhoto, 'id' | 'createdAt'>): Promise<ReviewPhoto>;

  /**
   * Find photos by review ID
   * البحث عن صور بواسطة معرف المراجعة
   */
  findPhotosByReview(reviewId: string): Promise<ReviewPhoto[]>;

  /**
   * Count photos by author
   * عدد صور المؤلف
   */
  countPhotosByAuthor(authorId: string): Promise<number>;

  // ============================================
  // Helpful Operations
  // ============================================

  /**
   * Create or update helpful vote
   * إنشاء أو تحديث تصويت مفيد
   */
  upsertHelpfulVote(
    reviewId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<ReviewHelpful>;

  /**
   * Find helpful vote
   * البحث عن تصويت مفيد
   */
  findHelpfulVote(reviewId: string, userId: string): Promise<ReviewHelpful | null>;

  /**
   * Delete helpful vote
   * حذف تصويت مفيد
   */
  deleteHelpfulVote(reviewId: string, userId: string): Promise<void>;

  /**
   * Count helpful votes for review
   * عدد التصويتات المفيدة للمراجعة
   */
  countHelpfulVotes(reviewId: string, isHelpful?: boolean): Promise<number>;

  /**
   * Count total helpful votes received by author
   * عدد إجمالي التصويتات المفيدة التي تلقاها المؤلف
   */
  countTotalHelpfulReceived(authorId: string): Promise<number>;

  /**
   * Update helpful count on review
   * تحديث عدد التصويتات المفيدة على المراجعة
   */
  updateHelpfulCount(reviewId: string, count: number): Promise<void>;

  // ============================================
  // Reply Operations
  // ============================================

  /**
   * Create reply
   * إنشاء رد
   */
  createReply(reply: Omit<ReviewReply, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewReply>;

  /**
   * Find replies by review ID
   * البحث عن ردود بواسطة معرف المراجعة
   */
  findRepliesByReview(reviewId: string): Promise<ReviewReply[]>;

  /**
   * Count replies for review
   * عدد الردود للمراجعة
   */
  countReplies(reviewId: string): Promise<number>;

  /**
   * Update reply count on review
   * تحديث عدد الردود على المراجعة
   */
  updateReplyCount(reviewId: string, count: number): Promise<void>;

  // ============================================
  // Reviewer Profile Operations
  // ============================================

  /**
   * Find reviewer profile
   * البحث عن ملف المراجع
   */
  findReviewerProfile(userId: string): Promise<ReviewerProfile | null>;

  /**
   * Upsert reviewer profile
   * إنشاء أو تحديث ملف المراجع
   */
  upsertReviewerProfile(profile: Omit<ReviewerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewerProfile>;

  /**
   * Count reviews by author
   * عدد مراجعات المؤلف
   */
  countReviewsByAuthor(authorId: string, status?: ReviewStatus): Promise<number>;

  // ============================================
  // Stats Operations
  // ============================================

  /**
   * Get review statistics
   * الحصول على إحصائيات المراجعات
   */
  getStats(referenceId: string, type: ReviewType): Promise<ReviewStats>;

  // ============================================
  // Verification Operations
  // ============================================

  /**
   * Check for completed booking
   * التحقق من وجود حجز مكتمل
   */
  checkCompletedBooking(userId: string, serviceId: string): Promise<{ bookingId: string } | null>;

  /**
   * Check for delivered order
   * التحقق من وجود طلب تم تسليمه
   */
  checkDeliveredOrder(userId: string, productId: string): Promise<{ orderId: string } | null>;
}

// ============================================
// Review Photo Repository Interface
// ============================================

/**
 * Review Photo Repository Interface
 * واجهة مستودع صور المراجعات
 */
export interface IReviewPhotoRepository extends IRepository<ReviewPhoto> {
  /**
   * Find photos by review ID
   * البحث عن صور بواسطة معرف المراجعة
   */
  findByReview(reviewId: string): Promise<ReviewPhoto[]>;

  /**
   * Delete photos by review ID
   * حذف صور بواسطة معرف المراجعة
   */
  deleteByReview(reviewId: string): Promise<void>;
}

// ============================================
// Review Helpful Repository Interface
// ============================================

/**
 * Review Helpful Repository Interface
 * واجهة مستودع التصويتات المفيدة
 */
export interface IReviewHelpfulRepository extends IRepository<ReviewHelpful> {
  /**
   * Find vote by review and user
   * البحث عن تصويت بواسطة المراجعة والمستخدم
   */
  findByReviewAndUser(reviewId: string, userId: string): Promise<ReviewHelpful | null>;

  /**
   * Count helpful votes for review
   * عدد التصويتات المفيدة للمراجعة
   */
  countByReview(reviewId: string, isHelpful?: boolean): Promise<number>;
}

// ============================================
// Review Reply Repository Interface
// ============================================

/**
 * Review Reply Repository Interface
 * واجهة مستودع ردود المراجعات
 */
export interface IReviewReplyRepository extends IRepository<ReviewReply> {
  /**
   * Find replies by review ID
   * البحث عن ردود بواسطة معرف المراجعة
   */
  findByReview(reviewId: string): Promise<ReviewReply[]>;

  /**
   * Count replies for review
   * عدد الردود للمراجعة
   */
  countByReview(reviewId: string): Promise<number>;
}

// ============================================
// Reviewer Profile Repository Interface
// ============================================

/**
 * Reviewer Profile Repository Interface
 * واجهة مستودع ملفات المراجعين
 */
export interface IReviewerProfileRepository extends IRepository<ReviewerProfile> {
  /**
   * Find profile by user ID
   * البحث عن ملف بواسطة معرف المستخدم
   */
  findByUserId(userId: string): Promise<ReviewerProfile | null>;
}
