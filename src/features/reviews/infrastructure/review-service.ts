/**
 * Review Service - خدمة المراجعات
 * 
 * تحتوي على جميع عمليات المراجعات: إنشاء، قراءة، تحديث، حذف
 * بالإضافة إلى الإحصائيات والتصويت والمستويات
 * 
 * Uses Repository Pattern for data access.
 */

import {
  getReviewRepository,
  getReviewPhotoRepository,
  getReviewHelpfulRepository,
  getReviewReplyRepository,
  getReviewerProfileRepository,
} from './repositories';
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewFilterOptions,
  CreateReplyInput,
} from '../types';
import type {
  Review,
  ReviewWithRelations,
  ReviewPaginationResult,
  ReviewStats,
  ReviewPhoto,
  ReviewReply,
  ReviewerProfile,
} from './interfaces';
import {
  ReviewStatus,
  ReviewType,
  ReviewerLevel,
  ReviewSource,
  TravelPhase,
} from '@/core/types/enums';

// ============================================
// Helper Functions
// ============================================

/**
 * حساب التقييم العام من المعايير المتعددة
 */
function calculateOverallRating(input: CreateReviewInput | UpdateReviewInput): number {
  const criteria = [
    input.cleanliness,
    input.location,
    input.value,
    input.serviceRating,
    input.amenities,
    input.communication,
  ].filter((v): v is number => v !== undefined && v !== null);

  if (criteria.length === 0) return 0;

  const sum = criteria.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / criteria.length) * 10) / 10; // تقريب لعشرية واحدة
}

/**
 * تحديد مستوى المراجع بناءً على عدد المراجعات
 */
function determineReviewerLevel(totalReviews: number): ReviewerLevel {
  if (totalReviews >= 15) return ReviewerLevel.EXPERT_REVIEWER;
  if (totalReviews >= 5) return ReviewerLevel.ACTIVE_REVIEWER;
  return ReviewerLevel.NEW_REVIEWER;
}

/**
 * تحديد مصدر المراجعة تلقائياً
 */
function determineReviewSource(type: ReviewType, bookingId?: string): ReviewSource {
  if (bookingId) {
    return ReviewSource.BOOKING;
  }
  
  // تحديد المصدر بناءً على النوع
  switch (type) {
    case ReviewType.PRODUCT:
      return ReviewSource.MARKETPLACE;
    case ReviewType.DESTINATION:
    case ReviewType.ACTIVITY:
      return ReviewSource.COMMUNITY;
    default:
      return ReviewSource.DIRECT;
  }
}

// ============================================
// CRUD Operations
// ============================================

/**
 * إنشاء مراجعة جديدة - نظام مفتوح
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const reviewRepo = getReviewRepository();
  
  // التحقق من عدم وجود مراجعة سابقة لنفس المرجع من نفس المستخدم
  const existingReview = await reviewRepo.findByAuthorAndReference(
    input.authorId,
    input.referenceId,
    input.type
  );

  if (existingReview) {
    throw new Error('REVIEW_ALREADY_EXISTS');
  }

  // التحقق من التوثيق (هل يوجد حجز مكتمل؟)
  let isVerified = false;
  let bookingId = input.bookingId || null;
  
  if (input.bookingId) {
    const verification = await checkVerifiedBooking(input.authorId, input.referenceId, input.type);
    isVerified = verification.isVerified;
  } else {
    // إذا لم يُحدد bookingId، نتحقق تلقائياً
    const verification = await checkVerifiedBooking(input.authorId, input.referenceId, input.type);
    isVerified = verification.isVerified;
    if (verification.bookingId) {
      bookingId = verification.bookingId;
    }
  }

  // تحديد مصدر المراجعة
  const source = input.source || determineReviewSource(input.type, bookingId || undefined);

  const rating = calculateOverallRating(input);

  // Create review
  const review = await reviewRepo.create({
    type: input.type,
    referenceId: input.referenceId,
    bookingId,
    source,
    travelPhase: input.travelPhase || null,
    authorId: input.authorId,
    title: input.title || null,
    content: input.content,
    rating,
    cleanliness: input.cleanliness || null,
    location: input.location || null,
    value: input.value || null,
    serviceRating: input.serviceRating || null,
    amenities: input.amenities || null,
    communication: input.communication || null,
    isVerified,
    visitDate: input.visitDate || null,
    status: ReviewStatus.PUBLISHED,
    helpfulCount: 0,
    replyCount: 0,
  });

  // Create photos if provided
  if (input.photos && input.photos.length > 0) {
    const photoRepo = getReviewPhotoRepository();
    for (let index = 0; index < input.photos.length; index++) {
      const photo = input.photos[index];
      await photoRepo.create({
        reviewId: review.id,
        url: photo.url,
        caption: photo.caption || null,
        order: photo.order || index,
      });
    }
  }

  // تحديث ملف المراجع
  await updateReviewerProfile(input.authorId);

  // تحديث تقييم الخدمة/المنتج
  await updateReferenceRating(input.referenceId, input.type);

  return review;
}

/**
 * تحديث مراجعة موجودة
 */
export async function updateReview(
  reviewId: string,
  authorId: string,
  input: UpdateReviewInput
): Promise<Review> {
  const reviewRepo = getReviewRepository();
  
  const review = await reviewRepo.findById(reviewId);

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  if (review.authorId !== authorId) {
    throw new Error('NOT_AUTHORIZED');
  }

  // التحقق من فترة التعديل (30 يوم)
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation > 30) {
    throw new Error('EDIT_PERIOD_EXPIRED');
  }

  const rating = calculateOverallRating(input);

  const updatedReview = await reviewRepo.update(reviewId, {
    ...input,
    rating: rating || review.rating,
  });

  // تحديث تقييم المرجع
  await updateReferenceRating(review.referenceId, review.type);

  return updatedReview!;
}

/**
 * حذف مراجعة (soft delete)
 */
export async function deleteReview(reviewId: string, authorId: string): Promise<void> {
  const reviewRepo = getReviewRepository();
  
  const review = await reviewRepo.findById(reviewId);

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  if (review.authorId !== authorId) {
    throw new Error('NOT_AUTHORIZED');
  }

  await reviewRepo.updateStatus(reviewId, ReviewStatus.HIDDEN);

  // تحديث ملف المراجع
  await updateReviewerProfile(authorId);

  // تحديث تقييم المرجع
  await updateReferenceRating(review.referenceId, review.type);
}

/**
 * الحصول على مراجعة واحدة
 */
export async function getReview(reviewId: string): Promise<ReviewWithRelations | null> {
  const reviewRepo = getReviewRepository();
  return reviewRepo.findWithRelations(reviewId);
}

/**
 * الحصول على قائمة المراجعات مع الفلترة والترتيب
 */
export async function getReviews(
  options: ReviewFilterOptions,
  currentUserId?: string
): Promise<ReviewPaginationResult> {
  const reviewRepo = getReviewRepository();
  
  const {
    referenceId,
    type,
    authorId,
    rating,
    minRating,
    maxRating,
    isVerified,
    status = ReviewStatus.PUBLISHED,
    sortBy = 'newest',
    page = 1,
    limit = 10,
  } = options;

  const filters = {
    referenceId,
    type,
    authorId,
    rating,
    minRating,
    maxRating,
    isVerified,
    status,
  };

  return reviewRepo.findWithFilters(filters, sortBy, page, limit, currentUserId);
}

// ============================================
// Stats & Verification
// ============================================

/**
 * الحصول على إحصائيات المراجعات
 */
export async function getReviewStats(
  referenceId: string,
  type: ReviewType
): Promise<ReviewStats> {
  const reviewRepo = getReviewRepository();
  return reviewRepo.getStats(referenceId, type);
}

/**
 * التحقق من إمكانية كتابة مراجعة - نظام مفتوح مثل TripAdvisor
 * 
 * أي شخص يمكنه كتابة مراجعة، والمراجعات الموثقة تُميز بشارة
 */
export async function canReview(
  userId: string,
  referenceId: string,
  type: ReviewType
): Promise<{
  canReview: boolean;
  reason: 'COMPLETED_BOOKING' | 'OPEN_REVIEW' | 'ALREADY_REVIEWED' | 'NOT_AUTHORIZED';
  bookingId?: string;
  existingReview?: Review;
  isVerified?: boolean;
}> {
  const reviewRepo = getReviewRepository();
  
  // التحقق من وجود مراجعة سابقة (لا يمكن مراجعة نفس الشيء مرتين)
  const existingReview = await reviewRepo.findByAuthorAndReference(userId, referenceId, type);

  if (existingReview) {
    return {
      canReview: false,
      reason: 'ALREADY_REVIEWED',
      existingReview,
    };
  }

  // 🎯 نظام مفتوح: أي شخص يمكنه المراجعة
  // لكن نتحقق من وجود حجز مكتمل للتمييز كـ "موثق"
  
  const verificationResult = await checkVerifiedBooking(userId, referenceId, type);

  // يمكن دائماً المراجعة، لكن مع أو بدون توثيق
  return {
    canReview: true,
    reason: verificationResult.isVerified ? 'COMPLETED_BOOKING' : 'OPEN_REVIEW',
    bookingId: verificationResult.bookingId,
    isVerified: verificationResult.isVerified,
  };
}

/**
 * التحقق من وجود حجز مكتمل للتمييز كمراجعة موثقة
 */
export async function checkVerifiedBooking(
  userId: string,
  referenceId: string,
  type: ReviewType
): Promise<{ isVerified: boolean; bookingId?: string }> {
  const reviewRepo = getReviewRepository();
  
  // للخدمات والأنشطة: التحقق من الحجز
  if (type === ReviewType.SERVICE || type === ReviewType.ACTIVITY) {
    const booking = await reviewRepo.checkCompletedBooking(userId, referenceId);
    if (booking) {
      return { isVerified: true, bookingId: booking.bookingId };
    }
  }

  // للمنتجات: التحقق من طلب مكتمل
  if (type === ReviewType.PRODUCT) {
    const order = await reviewRepo.checkDeliveredOrder(userId, referenceId);
    if (order) {
      return { isVerified: true, bookingId: order.orderId };
    }
  }

  // للوجهات والشركات: يمكن التحقق من زيارة سابقة (تطوير مستقبلي)
  return { isVerified: false };
}

// ============================================
// Helpful Votes
// ============================================

/**
 * التصويت "مفيد" على مراجعة
 */
export async function markHelpful(
  reviewId: string,
  userId: string,
  isHelpful: boolean = true
): Promise<{ helpfulCount: number }> {
  const reviewRepo = getReviewRepository();
  
  // التحقق من وجود المراجعة
  const review = await reviewRepo.findById(reviewId);

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  // لا يمكن التصويت على مراجعاتك
  if (review.authorId === userId) {
    throw new Error('CANNOT_VOTE_OWN_REVIEW');
  }

  // Upsert التصويت
  await reviewRepo.upsertHelpfulVote(reviewId, userId, isHelpful);

  // تحديث عدد الأصوات في المراجعة
  const helpfulCount = await reviewRepo.countHelpfulVotes(reviewId, true);
  await reviewRepo.updateHelpfulCount(reviewId, helpfulCount);

  // تحديث ملف المراجع (إجمالي الأصوات المفيدة)
  await updateReviewerProfile(review.authorId);

  return { helpfulCount };
}

/**
 * إلغاء التصويت
 */
export async function removeHelpfulVote(
  reviewId: string,
  userId: string
): Promise<{ helpfulCount: number }> {
  const reviewRepo = getReviewRepository();
  
  await reviewRepo.deleteHelpfulVote(reviewId, userId);

  const helpfulCount = await reviewRepo.countHelpfulVotes(reviewId, true);
  await reviewRepo.updateHelpfulCount(reviewId, helpfulCount);

  const review = await reviewRepo.findById(reviewId);
  if (review) {
    await updateReviewerProfile(review.authorId);
  }

  return { helpfulCount };
}

// ============================================
// Replies
// ============================================

/**
 * إضافة رد على مراجعة
 */
export async function addReply(input: CreateReplyInput): Promise<ReviewReply> {
  const reviewRepo = getReviewRepository();
  
  const review = await reviewRepo.findById(input.reviewId);

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  const reply = await reviewRepo.createReply({
    reviewId: input.reviewId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    content: input.content,
  });

  // تحديث عدد الردود
  const replyCount = await reviewRepo.countReplies(input.reviewId);
  await reviewRepo.updateReplyCount(input.reviewId, replyCount);

  return reply;
}

// ============================================
// Reviewer Profile
// ============================================

/**
 * تحديث ملف المراجع
 */
export async function updateReviewerProfile(userId: string): Promise<void> {
  const reviewRepo = getReviewRepository();
  
  const [totalReviews, totalHelpful, totalPhotos] = await Promise.all([
    reviewRepo.countReviewsByAuthor(userId, ReviewStatus.PUBLISHED),
    reviewRepo.countTotalHelpfulReceived(userId),
    reviewRepo.countPhotosByAuthor(userId),
  ]);

  // تحديد المستوى
  let level = determineReviewerLevel(totalReviews);

  // ترقية لمراجع موثوق إذا وصل 50 صوت مفيد
  if (totalHelpful >= 50) {
    level = ReviewerLevel.TRUSTED_REVIEWER;
  }

  // حساب الشارات
  const badges: string[] = [];
  if (totalPhotos >= 10) badges.push('PHOTO_CONTRIBUTOR');
  if (totalHelpful >= 25) badges.push('HELPFUL_REVIEWER');

  // Upsert الملف
  await reviewRepo.upsertReviewerProfile({
    userId,
    level,
    badges: badges.length > 0 ? JSON.stringify(badges) : null,
    totalReviews,
    totalHelpful,
    totalPhotos,
    citiesVisited: null,
  });
}

/**
 * تحديث تقييم المرجع (خدمة/منتج/نشاط)
 */
async function updateReferenceRating(referenceId: string, type: ReviewType): Promise<void> {
  const reviewRepo = getReviewRepository();
  const stats = await reviewRepo.getStats(referenceId, type);

  // Note: This would require a service repository to update the service/product ratings
  // For now, we'll just update the stats in the reviews table
  // In a full implementation, we would update the service/product table here
  if (type === ReviewType.SERVICE) {
    // TODO: Update service rating via service repository
    // await serviceRepo.updateRating(referenceId, stats.averageRating, stats.totalReviews);
  }
}

/**
 * الحصول على مراجعات المستخدم
 */
export async function getUserReviews(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ReviewPaginationResult> {
  return getReviews({ authorId: userId, sortBy: 'newest', page, limit });
}

/**
 * الحصول على ملف المراجع
 */
export async function getReviewerProfile(userId: string): Promise<ReviewerProfile | null> {
  const reviewRepo = getReviewRepository();
  return reviewRepo.findReviewerProfile(userId);
}
