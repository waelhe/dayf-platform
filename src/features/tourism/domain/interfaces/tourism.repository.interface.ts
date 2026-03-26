/**
 * Tourism Repository Interface
 * واجهة مستودع السياحة
 * 
 * Defines the contract for tourism data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import {
  DestinationType,
  ActivityType,
  TourType,
  CompanyStatus,
} from '@/core/types/enums';

// Re-export enums
export { DestinationType, ActivityType, TourType, CompanyStatus };

// ============================================
// Destination Entity Interface (camelCase)
// ============================================

/**
 * Destination entity interface
 * واجهة كيان الوجهة السياحية
 */
export interface Destination extends BaseEntity {
  /** Destination name */
  name: string;

  /** URL-friendly identifier */
  slug: string;

  /** Destination type */
  type: DestinationType;

  /** Full description */
  description: string;

  /** Short description */
  shortDesc: string | null;

  /** Country name */
  country: string;

  /** City name */
  city: string;

  /** Street address */
  address: string | null;

  /** Latitude coordinate */
  latitude: number | null;

  /** Longitude coordinate */
  longitude: number | null;

  /** Array of image URLs (JSON string in DB) */
  images: string[];

  /** Cover image URL */
  coverImage: string | null;

  /** Key highlights (JSON string in DB) */
  highlights: string[];

  /** Best time to visit description */
  bestTimeToVisit: string | null;

  /** Entry fee amount */
  entryFee: number | null;

  /** Opening hours (JSON string in DB) */
  openingHours: Record<string, string> | null;

  /** Suggested visit duration */
  duration: string | null;

  /** Average rating */
  rating: number;

  /** Number of reviews */
  reviewCount: number;

  /** Number of views */
  viewCount: number;

  /** Number of visits */
  visitCount: number;

  /** Is verified by admin */
  isVerified: boolean;

  /** Verification date */
  verifiedAt: Date | string | null;

  /** Admin who verified */
  verifiedBy: string | null;

  /** Owner user ID */
  ownerId: string | null;

  /** Company ID */
  companyId: string | null;
}

// ============================================
// Activity Entity Interface (camelCase)
// ============================================

/**
 * Activity entity interface
 * واجهة كيان النشاط السياحي
 */
export interface Activity extends BaseEntity {
  /** Activity title */
  title: string;

  /** URL-friendly identifier */
  slug: string;

  /** Activity type */
  type: ActivityType;

  /** Full description */
  description: string;

  /** Short description */
  shortDesc: string | null;

  /** Associated destination ID */
  destinationId: string | null;

  /** Location name */
  location: string;

  /** Meeting point description */
  meetingPoint: string | null;

  /** Latitude coordinate */
  latitude: number | null;

  /** Longitude coordinate */
  longitude: number | null;

  /** Duration in minutes */
  duration: number;

  /** Maximum participants */
  maxParticipants: number;

  /** Minimum participants */
  minParticipants: number;

  /** Difficulty level */
  difficultyLevel: string | null;

  /** Age restriction description */
  ageRestriction: string | null;

  /** Price amount */
  price: number;

  /** Currency code */
  currency: string;

  /** Is price per person */
  pricePerPerson: boolean;

  /** Discount price amount */
  discountPrice: number | null;

  /** Array of image URLs (JSON string in DB) */
  images: string[];

  /** Cover image URL */
  coverImage: string | null;

  /** Video URL */
  videoUrl: string | null;

  /** What's included (JSON string in DB) */
  included: string[];

  /** What's excluded (JSON string in DB) */
  excluded: string[];

  /** Requirements (JSON string in DB) */
  requirements: string[];

  /** Availability schedule (JSON string in DB) */
  availability: Record<string, unknown> | null;

  /** Cancellation policy description */
  cancellationPolicy: string | null;

  /** Average rating */
  rating: number;

  /** Number of reviews */
  reviewCount: number;

  /** Number of bookings */
  bookingCount: number;

  /** Activity status */
  status: CompanyStatus;

  /** Is featured */
  isFeatured: boolean;

  /** Owner user ID */
  ownerId: string | null;

  /** Company ID */
  companyId: string | null;
}

// ============================================
// Tour Entity Interface (camelCase)
// ============================================

/**
 * Tour entity interface
 * واجهة كيان الجولة السياحية
 */
export interface Tour extends BaseEntity {
  /** Tour title */
  title: string;

  /** URL-friendly identifier */
  slug: string;

  /** Tour type */
  type: TourType;

  /** Full description */
  description: string;

  /** Short description */
  shortDesc: string | null;

  /** Starting location */
  startLocation: string;

  /** Ending location */
  endLocation: string;

  /** Number of days */
  durationDays: number;

  /** Number of nights */
  durationNights: number;

  /** Maximum participants */
  maxParticipants: number;

  /** Minimum participants */
  minParticipants: number;

  /** Difficulty level */
  difficultyLevel: string | null;

  /** Price amount */
  price: number;

  /** Currency code */
  currency: string;

  /** Price per person or group */
  pricePerPerson: boolean;

  /** Discount price */
  discountPrice: number | null;

  /** Array of image URLs */
  images: string[];

  /** Cover image URL */
  coverImage: string | null;

  /** What's included */
  included: string[];

  /** What's excluded */
  excluded: string[];

  /** Requirements */
  requirements: string[];

  /** Cancellation policy */
  cancellationPolicy: string | null;

  /** Average rating */
  rating: number;

  /** Number of reviews */
  reviewCount: number;

  /** Number of bookings */
  bookingCount: number;

  /** Tour status */
  status: CompanyStatus;

  /** Is featured */
  isFeatured: boolean;

  /** Owner user ID */
  ownerId: string | null;

  /** Company ID */
  companyId: string | null;
}

// ============================================
// Activity Availability Entity Interface
// ============================================

/**
 * Activity availability slot interface
 * واجهة فترة توفر النشاط
 */
export interface ActivityAvailability extends BaseEntity {
  /** Activity ID */
  activityId: string;

  /** Slot date */
  date: Date | string;

  /** Start time (HH:MM format) */
  startTime: string;

  /** End time (HH:MM format) */
  endTime: string;

  /** Maximum capacity */
  maxCapacity: number;

  /** Number of booked slots */
  bookedCount: number;

  /** Is slot available */
  isAvailable: boolean;

  /** Override price for this slot */
  price: number | null;
}

// ============================================
// Filter Types
// ============================================

/**
 * Destination filters
 * فلاتر الوجهات
 */
export interface DestinationFilters {
  type?: DestinationType;
  city?: string;
  country?: string;
  isVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Activity filters
 * فلاتر الأنشطة
 */
export interface ActivityFilters {
  type?: ActivityType;
  destinationId?: string;
  city?: string;
  status?: CompanyStatus;
  isFeatured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

/**
 * Tour filters
 * فلاتر الجولات
 */
export interface TourFilters {
  type?: TourType;
  status?: CompanyStatus;
  isFeatured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  page?: number;
  limit?: number;
}

// ============================================
// Extended Types (with relations)
// ============================================

/**
 * Destination with activities
 * الوجهة مع الأنشطة
 */
export interface DestinationWithActivities extends Destination {
  activities: Activity[];
}

/**
 * Activity with destination
 * النشاط مع الوجهة
 */
export interface ActivityWithDestination extends Activity {
  destination: Destination | null;
}

// ============================================
// Repository Interfaces
// ============================================

/**
 * Destination Repository Interface
 * واجهة مستودع الوجهات
 */
export interface IDestinationRepository extends IRepository<Destination> {
  /**
   * Find destination by slug
   * البحث عن وجهة بواسطة الرابط
   */
  findBySlug(slug: string): Promise<Destination | null>;

  /**
   * Find destinations by city
   * البحث عن وجهات بواسطة المدينة
   */
  findByCity(city: string, isVerified?: boolean): Promise<Destination[]>;

  /**
   * Find featured destinations
   * البحث عن الوجهات المميزة
   */
  findFeatured(limit?: number): Promise<Destination[]>;

  /**
   * Search destinations
   * البحث عن وجهات
   */
  search(query: string, limit?: number): Promise<Destination[]>;

  /**
   * Get cities with destination count
   * الحصول على المدن مع عدد الوجهات
   */
  getCitiesWithCount(): Promise<Array<{ city: string; count: number }>>;

  /**
   * Increment view count
   * زيادة عدد المشاهدات
   */
  incrementViewCount(id: string): Promise<void>;

  /**
   * Update statistics
   * تحديث الإحصائيات
   */
  updateStatistics(id: string, data: {
    rating?: number;
    reviewCount?: number;
  }): Promise<void>;

  /**
   * Verify destination
   * التحقق من الوجهة
   */
  verify(id: string, adminId: string): Promise<Destination>;
}

/**
 * Activity Repository Interface
 * واجهة مستودع الأنشطة
 */
export interface IActivityRepository extends IRepository<Activity> {
  /**
   * Find activity by slug
   * البحث عن نشاط بواسطة الرابط
   */
  findBySlug(slug: string): Promise<Activity | null>;

  /**
   * Find activities by destination
   * البحث عن أنشطة بواسطة الوجهة
   */
  findByDestination(destinationId: string, status?: CompanyStatus): Promise<Activity[]>;

  /**
   * Find featured activities
   * البحث عن الأنشطة المميزة
   */
  findFeatured(limit?: number): Promise<Activity[]>;

  /**
   * Search activities
   * البحث عن أنشطة
   */
  search(query: string, limit?: number): Promise<Activity[]>;

  /**
   * Update statistics
   * تحديث الإحصائيات
   */
  updateStatistics(id: string, data: {
    rating?: number;
    reviewCount?: number;
    bookingCount?: number;
  }): Promise<void>;

  /**
   * Approve activity
   * الموافقة على النشاط
   */
  approve(id: string): Promise<Activity>;
}

/**
 * Tour Repository Interface
 * واجهة مستودع الجولات
 */
export interface ITourRepository extends IRepository<Tour> {
  /**
   * Find tour by slug
   * البحث عن جولة بواسطة الرابط
   */
  findBySlug(slug: string): Promise<Tour | null>;

  /**
   * Find tours by type
   * البحث عن جولات بواسطة النوع
   */
  findByType(type: TourType, status?: CompanyStatus): Promise<Tour[]>;

  /**
   * Find featured tours
   * البحث عن الجولات المميزة
   */
  findFeatured(limit?: number): Promise<Tour[]>;

  /**
   * Search tours
   * البحث عن جولات
   */
  search(query: string, limit?: number): Promise<Tour[]>;

  /**
   * Update statistics
   * تحديث الإحصائيات
   */
  updateStatistics(id: string, data: {
    rating?: number;
    reviewCount?: number;
    bookingCount?: number;
  }): Promise<void>;

  /**
   * Approve tour
   * الموافقة على الجولة
   */
  approve(id: string): Promise<Tour>;
}

/**
 * Activity Availability Repository Interface
 * واجهة مستودع توفر الأنشطة
 */
export interface IActivityAvailabilityRepository extends IRepository<ActivityAvailability> {
  /**
   * Find availability slots for activity in date range
   * البحث عن فترات التوفر لنشاط في نطاق زمني
   */
  findByActivityAndDateRange(
    activityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ActivityAvailability[]>;

  /**
   * Update booked count
   * تحديث عدد الحجوزات
   */
  updateBookedCount(id: string, participants: number): Promise<boolean>;

  /**
   * Delete slots by activity and dates
   * حذف الفترات بواسطة النشاط والتواريخ
   */
  deleteByActivityAndDates(activityId: string, dates: Date[]): Promise<void>;
}
