/**
 * Review Feature Types - نظام المراجعات (TripAdvisor Style)
 * 
 * يحتوي على جميع الأنواع المطلوبة لنظام المراجعات المتقدم
 */

// ============================================
// Re-export Prisma enums (for server) and define compatible types (for client)
// ============================================

// These types are compatible with Prisma enums but work in client components
export type ReviewType = 'SERVICE' | 'ACTIVITY' | 'DESTINATION' | 'PRODUCT' | 'COMPANY';
export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REJECTED';
export type ReviewerLevel = 'NEW_REVIEWER' | 'ACTIVE_REVIEWER' | 'EXPERT_REVIEWER' | 'TRUSTED_REVIEWER';
export type ReviewSource = 'BOOKING' | 'COMMUNITY' | 'MARKETPLACE' | 'DIRECT';
export type TravelPhase = 'BEFORE' | 'DURING' | 'AFTER';

// ============================================
// Core Types
// ============================================

export interface Review {
  id: string;
  type: ReviewType;
  referenceId: string;
  bookingId: string | null;
  source: ReviewSource;          // مصدر المراجعة
  travelPhase: TravelPhase | null; // مرحلة السفر
  authorId: string;
  title: string | null;
  content: string;
  rating: number;
  cleanliness: number | null;
  location: number | null;
  value: number | null;
  serviceRating: number | null;
  amenities: number | null;
  communication: number | null;
  status: ReviewStatus;
  isVerified: boolean;
  helpfulCount: number;
  replyCount: number;
  visitDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  url: string;
  caption: string | null;
  order: number;
  createdAt: Date;
}

export interface ReviewHelpful {
  id: string;
  reviewId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: Date;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  authorId: string;
  authorName: string;
  authorRole: 'PROVIDER' | 'ADMIN' | 'USER';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewerProfile {
  id: string;
  userId: string;
  level: ReviewerLevel;
  badges: string[] | null;
  totalReviews: number;
  totalHelpful: number;
  totalPhotos: number;
  citiesVisited: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Extended Types (with relations)
// ============================================

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

export interface ReviewWithAuthor extends Review {
  author: {
    id: string;
    displayName: string;
    avatar: string | null;
  };
  photos: ReviewPhoto[];
  _count?: {
    helpfulVotes: number;
    replies: number;
  };
}

// ============================================
// Input Types
// ============================================

export interface CreateReviewInput {
  type: ReviewType;
  referenceId: string;
  bookingId?: string;
  source?: ReviewSource;        // مصدر المراجعة
  travelPhase?: TravelPhase;    // مرحلة السفر
  title?: string;
  content: string;
  cleanliness?: number;
  location?: number;
  value?: number;
  serviceRating?: number;
  amenities?: number;
  communication?: number;
  visitDate?: Date;
  photos?: CreateReviewPhotoInput[];
  authorId: string;
}

export interface CreateReviewPhotoInput {
  url: string;
  caption?: string;
  order?: number;
}

export interface UpdateReviewInput {
  title?: string;
  content?: string;
  cleanliness?: number;
  location?: number;
  value?: number;
  serviceRating?: number;
  amenities?: number;
  communication?: number;
  visitDate?: Date;
}

export interface CreateReplyInput {
  reviewId: string;
  authorId: string;
  authorName: string;
  authorRole: 'PROVIDER' | 'ADMIN' | 'USER';
  content: string;
}

// ============================================
// Query Types
// ============================================

export interface ReviewFilterOptions {
  referenceId?: string;
  type?: ReviewType;
  authorId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isVerified?: boolean;
  status?: ReviewStatus;
  sortBy?: 'newest' | 'helpful' | 'highest' | 'lowest';
  page?: number;
  limit?: number;
}

export interface ReviewPaginationResult {
  reviews: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Stats Types
// ============================================

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

export interface CanReviewResult {
  canReview: boolean;
  reason: CanReviewReason;
  bookingId?: string;
  existingReview?: Review;
  isVerified?: boolean;  // هل المراجعة ستكون موثقة؟
}

export type CanReviewReason = 
  | 'COMPLETED_BOOKING'  // حجز مكتمل - مراجعة موثقة
  | 'OPEN_REVIEW'        // مراجعة مفتوحة - بدون حجز
  | 'ALREADY_REVIEWED'   // سبق المراجعة
  | 'NOT_AUTHORIZED';    // غير مصرح

// ============================================
// Reviewer Level Types
// ============================================

export const REVIEWER_LEVELS = {
  NEW_REVIEWER: {
    name: 'مراجع جديد',
    nameEn: 'New Reviewer',
    minReviews: 1,
    maxReviews: 4,
    badge: '🥉',
  },
  ACTIVE_REVIEWER: {
    name: 'مراجع نشط',
    nameEn: 'Active Reviewer',
    minReviews: 5,
    maxReviews: 14,
    badge: '🥈',
  },
  EXPERT_REVIEWER: {
    name: 'مراجع خبير',
    nameEn: 'Expert Reviewer',
    minReviews: 15,
    maxReviews: Infinity,
    badge: '🥇',
  },
  TRUSTED_REVIEWER: {
    name: 'مراجع موثوق',
    nameEn: 'Trusted Reviewer',
    minReviews: 0,
    maxReviews: Infinity,
    badge: '⭐',
  },
} as const;

export const REVIEW_SOURCES = {
  BOOKING: {
    name: 'حجز خدمة',
    nameEn: 'Booking',
    description: 'مراجعة من حجز مكتمل',
  },
  COMMUNITY: {
    name: 'المجتمع',
    nameEn: 'Community',
    description: 'مراجعة من أدلة السفر أو النقاشات',
  },
  MARKETPLACE: {
    name: 'السوق',
    nameEn: 'Marketplace',
    description: 'مراجعة منتج أو بائع',
  },
  DIRECT: {
    name: 'مراجعة مباشرة',
    nameEn: 'Direct',
    description: 'مراجعة بدون حجز مسبق',
  },
} as const;

export const TRAVEL_PHASES = {
  BEFORE: {
    name: 'قبل السفر',
    nameEn: 'Before Travel',
    icon: '📋',
    description: 'تخطيط وتوقعات',
  },
  DURING: {
    name: 'أثناء السفر',
    nameEn: 'During Travel',
    icon: '🗺️',
    description: 'انطباعات لحظية',
  },
  AFTER: {
    name: 'بعد السفر',
    nameEn: 'After Travel',
    icon: '✈️',
    description: 'تجربة شاملة',
  },
} as const;

export const REVIEW_BADGES = {
  VERIFIED_BOOKING: {
    name: 'حجز موثق',
    nameEn: 'Verified Booking',
    icon: '✓',
    color: 'green',
    description: 'هذا المراجع حجز هذه الخدمة فعلياً',
  },
  PHOTO_CONTRIBUTOR: {
    name: 'مساهم بالصور',
    nameEn: 'Photo Contributor',
    icon: '📷',
    color: 'blue',
  },
  HELPFUL_REVIEWER: {
    name: 'مراجع مفيد',
    nameEn: 'Helpful Reviewer',
    icon: '👍',
    color: 'orange',
  },
  FREQUENT_TRAVELER: {
    name: 'مسافر دائم',
    nameEn: 'Frequent Traveler',
    icon: '✈️',
    color: 'purple',
  },
} as const;

// ============================================
// Criteria Labels
// ============================================

export const RATING_CRITERIA = {
  cleanliness: {
    name: 'النظافة',
    nameEn: 'Cleanliness',
    icon: '🧹',
    description: 'نظافة المكان والمرافق',
  },
  location: {
    name: 'الموقع',
    nameEn: 'Location',
    icon: '📍',
    description: 'ملاءمة الموقع وقربه من المعالم',
  },
  value: {
    name: 'القيمة',
    nameEn: 'Value',
    icon: '💰',
    description: 'قيمة الخدمة مقارنة بالسعر',
  },
  serviceRating: {
    name: 'الخدمة',
    nameEn: 'Service',
    icon: '⭐',
    description: 'جودة الخدمة المقدمة',
  },
  amenities: {
    name: 'المرافق',
    nameEn: 'Amenities',
    icon: '🏠',
    description: 'توفر وجودة المرافق',
  },
  communication: {
    name: 'التواصل',
    nameEn: 'Communication',
    icon: '💬',
    description: 'سرعة وفعالية التواصل',
  },
} as const;

export type RatingCriteria = keyof typeof RATING_CRITERIA;
