// Activity Service - خدمة إدارة الأنشطة السياحية

import { randomBytes } from 'crypto';
import { getActivityRepository, getActivityAvailabilityRepository } from './repositories';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { ActivityType, CompanyStatus } from '@/core/types/enums';
import type { Activity, ActivityFilters, ActivityAvailability } from './domain/interfaces';
import { TABLES } from '@/lib/supabase';
import { DatabaseError } from '@/core/database';

// ============================================
// Types
// ============================================

export interface CreateActivityInput {
  title: string;
  type: ActivityType;
  description: string;
  shortDesc?: string;
  destinationId?: string;
  location: string;
  meetingPoint?: string;
  latitude?: number;
  longitude?: number;
  duration: number; // بالدقائق
  maxParticipants?: number;
  minParticipants?: number;
  difficultyLevel?: string;
  ageRestriction?: string;
  price: number;
  currency?: string;
  pricePerPerson?: boolean;
  discountPrice?: number;
  images: string[];
  coverImage?: string;
  videoUrl?: string;
  included?: string[];
  excluded?: string[];
  requirements?: string[];
  availability?: Record<string, unknown>;
  cancellationPolicy?: string;
  ownerId?: string;
  companyId?: string;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  shortDesc?: string;
  destinationId?: string;
  location?: string;
  meetingPoint?: string;
  latitude?: number;
  longitude?: number;
  duration?: number;
  maxParticipants?: number;
  minParticipants?: number;
  difficultyLevel?: string;
  ageRestriction?: string;
  price?: number;
  discountPrice?: number;
  images?: string[];
  coverImage?: string;
  videoUrl?: string;
  included?: string[];
  excluded?: string[];
  requirements?: string[];
  availability?: Record<string, unknown>;
  cancellationPolicy?: string;
  isFeatured?: boolean;
}

export interface ActivityResponse {
  id: string;
  title: string;
  slug: string;
  type: ActivityType;
  description: string;
  shortDesc: string | null;
  destinationId: string | null;
  location: string;
  meetingPoint: string | null;
  latitude: number | null;
  longitude: number | null;
  duration: number;
  maxParticipants: number;
  minParticipants: number;
  difficultyLevel: string | null;
  ageRestriction: string | null;
  price: number;
  currency: string;
  pricePerPerson: boolean;
  discountPrice: number | null;
  images: string[];
  coverImage: string | null;
  videoUrl: string | null;
  included: string[];
  excluded: string[];
  requirements: string[];
  availability: Record<string, unknown> | null;
  cancellationPolicy: string | null;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  status: CompanyStatus;
  isFeatured: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AvailabilitySlot {
  id: string;
  activityId: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  isAvailable: boolean;
  price: number | null;
}

// ============================================
// Slug Generation
// ============================================

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const randomSuffix = randomBytes(4).toString('hex');
  return `${baseSlug}-${randomSuffix}`;
}

// ============================================
// Activity Service
// ============================================

export const ActivityService = {
  // ----------------------------------------
  // Create Activity
  // ----------------------------------------
  async createActivity(input: CreateActivityInput): Promise<ActivityResponse> {
    const slug = generateSlug(input.title);
    const repository = getActivityRepository();
    
    const activity = await repository.create({
      title: input.title,
      slug,
      type: input.type,
      description: input.description,
      shortDesc: input.shortDesc ?? null,
      destinationId: input.destinationId ?? null,
      location: input.location,
      meetingPoint: input.meetingPoint ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      duration: input.duration,
      maxParticipants: input.maxParticipants ?? 10,
      minParticipants: input.minParticipants ?? 1,
      difficultyLevel: input.difficultyLevel ?? null,
      ageRestriction: input.ageRestriction ?? null,
      price: input.price,
      currency: input.currency ?? 'SYP',
      pricePerPerson: input.pricePerPerson ?? true,
      discountPrice: input.discountPrice ?? null,
      images: input.images,
      coverImage: input.coverImage ?? null,
      videoUrl: input.videoUrl ?? null,
      included: input.included ?? [],
      excluded: input.excluded ?? [],
      requirements: input.requirements ?? [],
      availability: input.availability ?? null,
      cancellationPolicy: input.cancellationPolicy ?? null,
      rating: 0,
      reviewCount: 0,
      bookingCount: 0,
      status: CompanyStatus.PENDING,
      isFeatured: false,
      ownerId: input.ownerId ?? null,
      companyId: input.companyId ?? null,
    });
    
    return this.toResponse(activity);
  },
  
  // ----------------------------------------
  // Get Activity by ID
  // ----------------------------------------
  async getActivityById(id: string): Promise<ActivityResponse | null> {
    const repository = getActivityRepository();
    const activity = await repository.findById(id);
    
    return activity ? this.toResponse(activity) : null;
  },
  
  // ----------------------------------------
  // Get Activity by Slug
  // ----------------------------------------
  async getActivityBySlug(slug: string): Promise<ActivityResponse | null> {
    const repository = getActivityRepository();
    const activity = await repository.findBySlug(slug);
    
    return activity ? this.toResponse(activity) : null;
  },
  
  // ----------------------------------------
  // List Activities
  // ----------------------------------------
  async listActivities(filters: ActivityFilters = {}): Promise<{
    activities: ActivityResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const provider = getSupabaseProvider();
    const client = provider.getRawClient();
    
    // Build query
    let countQuery = client
      .from(TABLES.ACTIVITIES)
      .select('*', { count: 'exact', head: true });
    
    let dataQuery = client
      .from(TABLES.ACTIVITIES)
      .select('*');
    
    // Apply filters
    if (filters.type) {
      countQuery = countQuery.eq('type', filters.type);
      dataQuery = dataQuery.eq('type', filters.type);
    }
    
    if (filters.destinationId) {
      countQuery = countQuery.eq('destination_id', filters.destinationId);
      dataQuery = dataQuery.eq('destination_id', filters.destinationId);
    }
    
    if (filters.status) {
      countQuery = countQuery.eq('status', filters.status);
      dataQuery = dataQuery.eq('status', filters.status);
    }
    
    if (filters.isFeatured !== undefined) {
      countQuery = countQuery.eq('is_featured', filters.isFeatured);
      dataQuery = dataQuery.eq('is_featured', filters.isFeatured);
    }
    
    if (filters.minPrice !== undefined) {
      countQuery = countQuery.gte('price', filters.minPrice);
      dataQuery = dataQuery.gte('price', filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
      countQuery = countQuery.lte('price', filters.maxPrice);
      dataQuery = dataQuery.lte('price', filters.maxPrice);
    }
    
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      countQuery = countQuery.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},location.ilike.${searchPattern}`);
      dataQuery = dataQuery.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},location.ilike.${searchPattern}`);
    }
    
    // Get count
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw DatabaseError.fromError(countError, { table: TABLES.ACTIVITIES, operation: 'count' });
    }
    
    // Apply sorting and pagination
    dataQuery = dataQuery
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })
      .order('booking_count', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    const { data, error: dataError } = await dataQuery;
    
    if (dataError) {
      throw DatabaseError.fromError(dataError, { table: TABLES.ACTIVITIES, operation: 'listActivities' });
    }
    
    const total = count || 0;
    
    return {
      activities: (data || []).map((a: Record<string, unknown>) => this.toResponseFromRow(a)),
      total,
      page,
      limit,
    };
  },
  
  // ----------------------------------------
  // Get Featured Activities
  // ----------------------------------------
  async getFeaturedActivities(limit: number = 8): Promise<ActivityResponse[]> {
    const repository = getActivityRepository();
    const activities = await repository.findFeatured(limit);
    
    return activities.map(a => this.toResponse(a));
  },
  
  // ----------------------------------------
  // Get Activities by Destination
  // ----------------------------------------
  async getActivitiesByDestination(destinationId: string): Promise<ActivityResponse[]> {
    const repository = getActivityRepository();
    const activities = await repository.findByDestination(destinationId, CompanyStatus.ACTIVE);
    
    return activities.map(a => this.toResponse(a));
  },
  
  // ----------------------------------------
  // Update Activity
  // ----------------------------------------
  async updateActivity(id: string, input: UpdateActivityInput): Promise<ActivityResponse> {
    const repository = getActivityRepository();
    
    const activity = await repository.update(id, {
      ...input,
    });
    
    if (!activity) {
      throw new Error('Activity not found');
    }
    
    return this.toResponse(activity);
  },
  
  // ----------------------------------------
  // Approve Activity (Admin)
  // ----------------------------------------
  async approveActivity(id: string): Promise<ActivityResponse> {
    const repository = getActivityRepository();
    const activity = await repository.approve(id);
    
    return this.toResponse(activity);
  },
  
  // ----------------------------------------
  // Availability Management
  // ----------------------------------------
  async setAvailability(
    activityId: string,
    slots: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      maxCapacity: number;
      price?: number;
    }>
  ): Promise<ActivityAvailability[]> {
    const availabilityRepository = getActivityAvailabilityRepository();
    const provider = getSupabaseProvider();
    const client = provider.getRawClient();
    
    // Delete existing slots for the same dates
    const dates = slots.map(s => s.date);
    await availabilityRepository.deleteByActivityAndDates(activityId, dates);
    
    // Create new slots
    const now = new Date().toISOString();
    const slotsData = slots.map(slot => ({
      activity_id: activityId,
      date: slot.date.toISOString().split('T')[0],
      start_time: slot.startTime,
      end_time: slot.endTime,
      max_capacity: slot.maxCapacity,
      booked_count: 0,
      is_available: true,
      price: slot.price ?? null,
      created_at: now,
    }));
    
    const { data, error } = await client
      .from(TABLES.ACTIVITY_AVAILABILITY)
      .insert(slotsData)
      .select();
    
    if (error) {
      throw DatabaseError.fromError(error, { table: TABLES.ACTIVITY_AVAILABILITY, operation: 'setAvailability' });
    }
    
    return (data || []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      activityId: s.activity_id as string,
      date: s.date as string,
      startTime: s.start_time as string,
      endTime: s.end_time as string,
      maxCapacity: s.max_capacity as number,
      bookedCount: s.booked_count as number,
      isAvailable: s.is_available as boolean,
      price: s.price as number | null,
      createdAt: s.created_at as string,
    }));
  },
  
  // ----------------------------------------
  // Get Available Slots
  // ----------------------------------------
  async getAvailableSlots(
    activityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilitySlot[]> {
    const availabilityRepository = getActivityAvailabilityRepository();
    const slots = await availabilityRepository.findByActivityAndDateRange(
      activityId,
      startDate,
      endDate
    );
    
    return slots.map(s => ({
      id: s.id,
      activityId: s.activityId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      maxCapacity: s.maxCapacity,
      bookedCount: s.bookedCount,
      isAvailable: s.isAvailable,
      price: s.price,
    }));
  },
  
  // ----------------------------------------
  // Book Slot
  // ----------------------------------------
  async bookSlot(slotId: string, participants: number): Promise<boolean> {
    const availabilityRepository = getActivityAvailabilityRepository();
    return availabilityRepository.updateBookedCount(slotId, participants);
  },
  
  // ----------------------------------------
  // Update Statistics
  // ----------------------------------------
  async updateStatistics(id: string): Promise<void> {
    const provider = getSupabaseProvider();
    const client = provider.getRawClient();
    const repository = getActivityRepository();
    
    // Get review stats
    const { data: reviewStats } = await client
      .from(TABLES.REVIEWS)
      .select('rating')
      .eq('type', 'ACTIVITY')
      .eq('reference_id', id)
      .eq('status', 'PUBLISHED');
    
    const reviews = reviewStats || [];
    const reviewCount = reviews.length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: Record<string, unknown>) => sum + (r.rating as number), 0) / reviews.length
      : 0;
    
    // Get booking count
    const { count: bookingCount } = await client
      .from(TABLES.BOOKINGS)
      .select('*', { count: 'exact', head: true })
      .eq('service_id', id);
    
    await repository.updateStatistics(id, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
      bookingCount: bookingCount || 0,
    });
  },
  
  // ----------------------------------------
  // Search Activities
  // ----------------------------------------
  async searchActivities(query: string, limit: number = 10): Promise<ActivityResponse[]> {
    const repository = getActivityRepository();
    const activities = await repository.search(query, limit);
    
    return activities.map(a => this.toResponse(a));
  },
  
  // ----------------------------------------
  // Response Transformers
  // ----------------------------------------
  toResponse(activity: Activity): ActivityResponse {
    return {
      id: activity.id,
      title: activity.title,
      slug: activity.slug,
      type: activity.type,
      description: activity.description,
      shortDesc: activity.shortDesc,
      destinationId: activity.destinationId,
      location: activity.location,
      meetingPoint: activity.meetingPoint,
      latitude: activity.latitude,
      longitude: activity.longitude,
      duration: activity.duration,
      maxParticipants: activity.maxParticipants,
      minParticipants: activity.minParticipants,
      difficultyLevel: activity.difficultyLevel,
      ageRestriction: activity.ageRestriction,
      price: activity.price,
      currency: activity.currency,
      pricePerPerson: activity.pricePerPerson,
      discountPrice: activity.discountPrice,
      images: activity.images,
      coverImage: activity.coverImage,
      videoUrl: activity.videoUrl,
      included: activity.included,
      excluded: activity.excluded,
      requirements: activity.requirements,
      availability: activity.availability,
      cancellationPolicy: activity.cancellationPolicy,
      rating: activity.rating,
      reviewCount: activity.reviewCount,
      bookingCount: activity.bookingCount,
      status: activity.status,
      isFeatured: activity.isFeatured,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  },
  
  toResponseFromRow(row: Record<string, unknown>): ActivityResponse {
    // Parse JSON fields
    const parseJson = (value: string | null): string[] => {
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    };
    
    const parseJsonObject = <T>(value: string | null): T | null => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    };
    
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      type: row.type as ActivityType,
      description: row.description as string,
      shortDesc: row.short_desc as string | null,
      destinationId: row.destination_id as string | null,
      location: row.location as string,
      meetingPoint: row.meeting_point as string | null,
      latitude: row.latitude as number | null,
      longitude: row.longitude as number | null,
      duration: row.duration as number,
      maxParticipants: row.max_participants as number,
      minParticipants: row.min_participants as number,
      difficultyLevel: row.difficulty_level as string | null,
      ageRestriction: row.age_restriction as string | null,
      price: row.price as number,
      currency: row.currency as string,
      pricePerPerson: row.price_per_person as boolean,
      discountPrice: row.discount_price as number | null,
      images: parseJson(row.images as string | null),
      coverImage: row.cover_image as string | null,
      videoUrl: row.video_url as string | null,
      included: parseJson(row.included as string | null),
      excluded: parseJson(row.excluded as string | null),
      requirements: parseJson(row.requirements as string | null),
      availability: parseJsonObject<Record<string, unknown>>(row.availability as string | null),
      cancellationPolicy: row.cancellation_policy as string | null,
      rating: row.rating as number,
      reviewCount: row.review_count as number,
      bookingCount: row.booking_count as number,
      status: row.status as CompanyStatus,
      isFeatured: row.is_featured as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  },
};

export default ActivityService;
