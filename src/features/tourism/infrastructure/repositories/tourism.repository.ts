/**
 * Tourism Repository Implementation
 * تنفيذ مستودع السياحة
 * 
 * Implements tourism repositories using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES } from '@/lib/supabase';
import { DatabaseError } from '@/core/database';
import {
  Destination,
  Activity,
  Tour,
  ActivityAvailability,
  DestinationFilters,
  ActivityFilters,
  TourFilters,
  IDestinationRepository,
  IActivityRepository,
  ITourRepository,
  IActivityAvailabilityRepository,
} from '../domain/interfaces';
import {
  DestinationType,
  ActivityType,
  TourType,
  CompanyStatus,
} from '@/core/types/enums';

// ============================================
// Supabase Types (snake_case)
// ============================================

/**
 * Supabase Destination row
 * صف الوجهة في Supabase
 */
interface SupabaseDestination {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  short_desc: string | null;
  country: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string;
  cover_image: string | null;
  highlights: string | null;
  best_time_to_visit: string | null;
  entry_fee: number | null;
  opening_hours: string | null;
  duration: string | null;
  rating: number;
  review_count: number;
  view_count: number;
  visit_count: number;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  owner_id: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Activity row
 * صف النشاط في Supabase
 */
interface SupabaseActivity {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  short_desc: string | null;
  destination_id: string | null;
  location: string;
  meeting_point: string | null;
  latitude: number | null;
  longitude: number | null;
  duration: number;
  max_participants: number;
  min_participants: number;
  difficulty_level: string | null;
  age_restriction: string | null;
  price: number;
  currency: string;
  price_per_person: boolean;
  discount_price: number | null;
  images: string;
  cover_image: string | null;
  video_url: string | null;
  included: string | null;
  excluded: string | null;
  requirements: string | null;
  availability: string | null;
  cancellation_policy: string | null;
  rating: number;
  review_count: number;
  booking_count: number;
  status: string;
  is_featured: boolean;
  owner_id: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Tour row
 * صف الجولة في Supabase
 */
interface SupabaseTour {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  short_desc: string | null;
  start_location: string;
  end_location: string;
  duration_days: number;
  duration_nights: number;
  max_participants: number;
  min_participants: number;
  difficulty_level: string | null;
  price: number;
  currency: string;
  price_per_person: boolean;
  discount_price: number | null;
  images: string;
  cover_image: string | null;
  included: string | null;
  excluded: string | null;
  requirements: string | null;
  cancellation_policy: string | null;
  rating: number;
  review_count: number;
  booking_count: number;
  status: string;
  is_featured: boolean;
  owner_id: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Activity Availability row
 * صف توفر النشاط في Supabase
 */
interface SupabaseActivityAvailability {
  id: string;
  activity_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  is_available: boolean;
  price: number | null;
  created_at: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse JSON string safely
 */
function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

/**
 * Parse JSON object safely
 */
function parseJsonObject<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// ============================================
// Destination Repository Implementation
// ============================================

/**
 * Destination Repository
 * مستودع الوجهات
 */
export class DestinationRepository extends BaseRepository<Destination> implements IDestinationRepository {
  constructor() {
    super(TABLES.DESTINATIONS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Destination {
    const dbRow = row as unknown as SupabaseDestination;

    return {
      id: dbRow.id,
      name: dbRow.name,
      slug: dbRow.slug,
      type: dbRow.type as DestinationType,
      description: dbRow.description,
      shortDesc: dbRow.short_desc,
      country: dbRow.country,
      city: dbRow.city,
      address: dbRow.address,
      latitude: dbRow.latitude,
      longitude: dbRow.longitude,
      images: parseJsonArray(dbRow.images),
      coverImage: dbRow.cover_image,
      highlights: parseJsonArray(dbRow.highlights),
      bestTimeToVisit: dbRow.best_time_to_visit,
      entryFee: dbRow.entry_fee,
      openingHours: parseJsonObject<Record<string, string>>(dbRow.opening_hours),
      duration: dbRow.duration,
      rating: dbRow.rating,
      reviewCount: dbRow.review_count,
      viewCount: dbRow.view_count,
      visitCount: dbRow.visit_count,
      isVerified: dbRow.is_verified,
      verifiedAt: dbRow.verified_at,
      verifiedBy: dbRow.verified_by,
      ownerId: dbRow.owner_id,
      companyId: dbRow.company_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Destination>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.name !== undefined) row.name = entity.name;
    if (entity.slug !== undefined) row.slug = entity.slug;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.shortDesc !== undefined) row.short_desc = entity.shortDesc;
    if (entity.country !== undefined) row.country = entity.country;
    if (entity.city !== undefined) row.city = entity.city;
    if (entity.address !== undefined) row.address = entity.address;
    if (entity.latitude !== undefined) row.latitude = entity.latitude;
    if (entity.longitude !== undefined) row.longitude = entity.longitude;
    if (entity.images !== undefined) row.images = JSON.stringify(entity.images);
    if (entity.coverImage !== undefined) row.cover_image = entity.coverImage;
    if (entity.highlights !== undefined) row.highlights = JSON.stringify(entity.highlights);
    if (entity.bestTimeToVisit !== undefined) row.best_time_to_visit = entity.bestTimeToVisit;
    if (entity.entryFee !== undefined) row.entry_fee = entity.entryFee;
    if (entity.openingHours !== undefined) row.opening_hours = JSON.stringify(entity.openingHours);
    if (entity.duration !== undefined) row.duration = entity.duration;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.reviewCount !== undefined) row.review_count = entity.reviewCount;
    if (entity.viewCount !== undefined) row.view_count = entity.viewCount;
    if (entity.visitCount !== undefined) row.visit_count = entity.visitCount;
    if (entity.isVerified !== undefined) row.is_verified = entity.isVerified;
    if (entity.verifiedAt !== undefined) row.verified_at = entity.verifiedAt;
    if (entity.verifiedBy !== undefined) row.verified_by = entity.verifiedBy;
    if (entity.ownerId !== undefined) row.owner_id = entity.ownerId;
    if (entity.companyId !== undefined) row.company_id = entity.companyId;

    return row;
  }

  // ============================================
  // Destination Operations
  // ============================================

  async findBySlug(slug: string): Promise<Destination | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, slug });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, slug });
    }
  }

  async findByCity(city: string, isVerified = true): Promise<Destination[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .eq('city', city);

      if (isVerified) {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query.order('rating', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, city });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, city });
    }
  }

  async findFeatured(limit = 6): Promise<Destination[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findFeatured' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findFeatured' });
    }
  }

  async search(query: string, limit = 10): Promise<Destination[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('is_verified', true)
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,description.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, query, operation: 'search' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, query, operation: 'search' });
    }
  }

  async getCitiesWithCount(): Promise<Array<{ city: string; count: number }>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .rpc('get_destination_cities_count');

      if (error) {
        // Fallback: manually aggregate
        const { data: destinations, error: destError } = await client
          .from(this.tableName)
          .select('city')
          .eq('is_verified', true);

        if (destError) {
          throw DatabaseError.fromError(destError, { table: this.tableName, operation: 'getCitiesWithCount' });
        }

        // Count by city
        const cityCount = new Map<string, number>();
        for (const dest of destinations || []) {
          const city = dest.city as string;
          cityCount.set(city, (cityCount.get(city) || 0) + 1);
        }

        return Array.from(cityCount.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'getCitiesWithCount' });
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      const client = this.getClient();

      // Use raw SQL or RPC for atomic increment
      const { error } = await client
        .rpc('increment_destination_view_count', { destination_id: id });

      if (error) {
        // Fallback: fetch and update
        const { data: dest } = await client
          .from(this.tableName)
          .select('view_count')
          .eq('id', id)
          .single();

        if (dest) {
          await client
            .from(this.tableName)
            .update({ view_count: (dest.view_count as number) + 1 })
            .eq('id', id);
        }
      }
    } catch (error) {
      // Don't throw for view count errors, just log
      console.error('Error incrementing view count:', error);
    }
  }

  async updateStatistics(id: string, data: { rating?: number; reviewCount?: number }): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = { updated_at: now };
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.reviewCount !== undefined) updateData.review_count = data.reviewCount;

      const { error } = await client
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateStatistics' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateStatistics' });
    }
  }

  async verify(id: string, adminId: string): Promise<Destination> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .update({
          is_verified: true,
          verified_at: now,
          verified_by: adminId,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'verify' });
      }

      return this.toEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'verify' });
    }
  }
}

// ============================================
// Activity Repository Implementation
// ============================================

/**
 * Activity Repository
 * مستودع الأنشطة
 */
export class ActivityRepository extends BaseRepository<Activity> implements IActivityRepository {
  constructor() {
    super(TABLES.ACTIVITIES, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Activity {
    const dbRow = row as unknown as SupabaseActivity;

    return {
      id: dbRow.id,
      title: dbRow.title,
      slug: dbRow.slug,
      type: dbRow.type as ActivityType,
      description: dbRow.description,
      shortDesc: dbRow.short_desc,
      destinationId: dbRow.destination_id,
      location: dbRow.location,
      meetingPoint: dbRow.meeting_point,
      latitude: dbRow.latitude,
      longitude: dbRow.longitude,
      duration: dbRow.duration,
      maxParticipants: dbRow.max_participants,
      minParticipants: dbRow.min_participants,
      difficultyLevel: dbRow.difficulty_level,
      ageRestriction: dbRow.age_restriction,
      price: dbRow.price,
      currency: dbRow.currency,
      pricePerPerson: dbRow.price_per_person,
      discountPrice: dbRow.discount_price,
      images: parseJsonArray(dbRow.images),
      coverImage: dbRow.cover_image,
      videoUrl: dbRow.video_url,
      included: parseJsonArray(dbRow.included),
      excluded: parseJsonArray(dbRow.excluded),
      requirements: parseJsonArray(dbRow.requirements),
      availability: parseJsonObject<Record<string, unknown>>(dbRow.availability),
      cancellationPolicy: dbRow.cancellation_policy,
      rating: dbRow.rating,
      reviewCount: dbRow.review_count,
      bookingCount: dbRow.booking_count,
      status: dbRow.status as CompanyStatus,
      isFeatured: dbRow.is_featured,
      ownerId: dbRow.owner_id,
      companyId: dbRow.company_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Activity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.title !== undefined) row.title = entity.title;
    if (entity.slug !== undefined) row.slug = entity.slug;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.shortDesc !== undefined) row.short_desc = entity.shortDesc;
    if (entity.destinationId !== undefined) row.destination_id = entity.destinationId;
    if (entity.location !== undefined) row.location = entity.location;
    if (entity.meetingPoint !== undefined) row.meeting_point = entity.meetingPoint;
    if (entity.latitude !== undefined) row.latitude = entity.latitude;
    if (entity.longitude !== undefined) row.longitude = entity.longitude;
    if (entity.duration !== undefined) row.duration = entity.duration;
    if (entity.maxParticipants !== undefined) row.max_participants = entity.maxParticipants;
    if (entity.minParticipants !== undefined) row.min_participants = entity.minParticipants;
    if (entity.difficultyLevel !== undefined) row.difficulty_level = entity.difficultyLevel;
    if (entity.ageRestriction !== undefined) row.age_restriction = entity.ageRestriction;
    if (entity.price !== undefined) row.price = entity.price;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.pricePerPerson !== undefined) row.price_per_person = entity.pricePerPerson;
    if (entity.discountPrice !== undefined) row.discount_price = entity.discountPrice;
    if (entity.images !== undefined) row.images = JSON.stringify(entity.images);
    if (entity.coverImage !== undefined) row.cover_image = entity.coverImage;
    if (entity.videoUrl !== undefined) row.video_url = entity.videoUrl;
    if (entity.included !== undefined) row.included = JSON.stringify(entity.included);
    if (entity.excluded !== undefined) row.excluded = JSON.stringify(entity.excluded);
    if (entity.requirements !== undefined) row.requirements = JSON.stringify(entity.requirements);
    if (entity.availability !== undefined) row.availability = JSON.stringify(entity.availability);
    if (entity.cancellationPolicy !== undefined) row.cancellation_policy = entity.cancellationPolicy;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.reviewCount !== undefined) row.review_count = entity.reviewCount;
    if (entity.bookingCount !== undefined) row.booking_count = entity.bookingCount;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.isFeatured !== undefined) row.is_featured = entity.isFeatured;
    if (entity.ownerId !== undefined) row.owner_id = entity.ownerId;
    if (entity.companyId !== undefined) row.company_id = entity.companyId;

    return row;
  }

  // ============================================
  // Activity Operations
  // ============================================

  async findBySlug(slug: string): Promise<Activity | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, slug });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, slug });
    }
  }

  async findByDestination(destinationId: string, status?: CompanyStatus): Promise<Activity[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .eq('destination_id', destinationId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('rating', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, destinationId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, destinationId });
    }
  }

  async findFeatured(limit = 8): Promise<Activity[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('status', CompanyStatus.ACTIVE)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findFeatured' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findFeatured' });
    }
  }

  async search(query: string, limit = 10): Promise<Activity[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('status', CompanyStatus.ACTIVE)
        .or(`title.ilike.%${query}%,location.ilike.%${query}%,description.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, query, operation: 'search' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, query, operation: 'search' });
    }
  }

  async updateStatistics(id: string, data: { rating?: number; reviewCount?: number; bookingCount?: number }): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = { updated_at: now };
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.reviewCount !== undefined) updateData.review_count = data.reviewCount;
      if (data.bookingCount !== undefined) updateData.booking_count = data.bookingCount;

      const { error } = await client
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateStatistics' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateStatistics' });
    }
  }

  async approve(id: string): Promise<Activity> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .update({
          status: CompanyStatus.ACTIVE,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'approve' });
      }

      return this.toEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'approve' });
    }
  }
}

// ============================================
// Tour Repository Implementation
// ============================================

/**
 * Tour Repository
 * مستودع الجولات
 */
export class TourRepository extends BaseRepository<Tour> implements ITourRepository {
  constructor() {
    super(TABLES.TOURS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Tour {
    const dbRow = row as unknown as SupabaseTour;

    return {
      id: dbRow.id,
      title: dbRow.title,
      slug: dbRow.slug,
      type: dbRow.type as TourType,
      description: dbRow.description,
      shortDesc: dbRow.short_desc,
      startLocation: dbRow.start_location,
      endLocation: dbRow.end_location,
      durationDays: dbRow.duration_days,
      durationNights: dbRow.duration_nights,
      maxParticipants: dbRow.max_participants,
      minParticipants: dbRow.min_participants,
      difficultyLevel: dbRow.difficulty_level,
      price: dbRow.price,
      currency: dbRow.currency,
      pricePerPerson: dbRow.price_per_person,
      discountPrice: dbRow.discount_price,
      images: parseJsonArray(dbRow.images),
      coverImage: dbRow.cover_image,
      included: parseJsonArray(dbRow.included),
      excluded: parseJsonArray(dbRow.excluded),
      requirements: parseJsonArray(dbRow.requirements),
      cancellationPolicy: dbRow.cancellation_policy,
      rating: dbRow.rating,
      reviewCount: dbRow.review_count,
      bookingCount: dbRow.booking_count,
      status: dbRow.status as CompanyStatus,
      isFeatured: dbRow.is_featured,
      ownerId: dbRow.owner_id,
      companyId: dbRow.company_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Tour>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.title !== undefined) row.title = entity.title;
    if (entity.slug !== undefined) row.slug = entity.slug;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.shortDesc !== undefined) row.short_desc = entity.shortDesc;
    if (entity.startLocation !== undefined) row.start_location = entity.startLocation;
    if (entity.endLocation !== undefined) row.end_location = entity.endLocation;
    if (entity.durationDays !== undefined) row.duration_days = entity.durationDays;
    if (entity.durationNights !== undefined) row.duration_nights = entity.durationNights;
    if (entity.maxParticipants !== undefined) row.max_participants = entity.maxParticipants;
    if (entity.minParticipants !== undefined) row.min_participants = entity.minParticipants;
    if (entity.difficultyLevel !== undefined) row.difficulty_level = entity.difficultyLevel;
    if (entity.price !== undefined) row.price = entity.price;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.pricePerPerson !== undefined) row.price_per_person = entity.pricePerPerson;
    if (entity.discountPrice !== undefined) row.discount_price = entity.discountPrice;
    if (entity.images !== undefined) row.images = JSON.stringify(entity.images);
    if (entity.coverImage !== undefined) row.cover_image = entity.coverImage;
    if (entity.included !== undefined) row.included = JSON.stringify(entity.included);
    if (entity.excluded !== undefined) row.excluded = JSON.stringify(entity.excluded);
    if (entity.requirements !== undefined) row.requirements = JSON.stringify(entity.requirements);
    if (entity.cancellationPolicy !== undefined) row.cancellation_policy = entity.cancellationPolicy;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.reviewCount !== undefined) row.review_count = entity.reviewCount;
    if (entity.bookingCount !== undefined) row.booking_count = entity.bookingCount;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.isFeatured !== undefined) row.is_featured = entity.isFeatured;
    if (entity.ownerId !== undefined) row.owner_id = entity.ownerId;
    if (entity.companyId !== undefined) row.company_id = entity.companyId;

    return row;
  }

  // ============================================
  // Tour Operations
  // ============================================

  async findBySlug(slug: string): Promise<Tour | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, slug });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, slug });
    }
  }

  async findByType(type: TourType, status?: CompanyStatus): Promise<Tour[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .eq('type', type);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('rating', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, type });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, type });
    }
  }

  async findFeatured(limit = 8): Promise<Tour[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('status', CompanyStatus.ACTIVE)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findFeatured' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findFeatured' });
    }
  }

  async search(query: string, limit = 10): Promise<Tour[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('status', CompanyStatus.ACTIVE)
        .or(`title.ilike.%${query}%,start_location.ilike.%${query}%,description.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, query, operation: 'search' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, query, operation: 'search' });
    }
  }

  async updateStatistics(id: string, data: { rating?: number; reviewCount?: number; bookingCount?: number }): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = { updated_at: now };
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.reviewCount !== undefined) updateData.review_count = data.reviewCount;
      if (data.bookingCount !== undefined) updateData.booking_count = data.bookingCount;

      const { error } = await client
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateStatistics' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateStatistics' });
    }
  }

  async approve(id: string): Promise<Tour> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .update({
          status: CompanyStatus.ACTIVE,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'approve' });
      }

      return this.toEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'approve' });
    }
  }
}

// ============================================
// Activity Availability Repository Implementation
// ============================================

/**
 * Activity Availability Repository
 * مستودع توفر الأنشطة
 */
export class ActivityAvailabilityRepository extends BaseRepository<ActivityAvailability> implements IActivityAvailabilityRepository {
  constructor() {
    super(TABLES.ACTIVITY_AVAILABILITY, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): ActivityAvailability {
    const dbRow = row as unknown as SupabaseActivityAvailability;

    return {
      id: dbRow.id,
      activityId: dbRow.activity_id,
      date: dbRow.date,
      startTime: dbRow.start_time,
      endTime: dbRow.end_time,
      maxCapacity: dbRow.max_capacity,
      bookedCount: dbRow.booked_count,
      isAvailable: dbRow.is_available,
      price: dbRow.price,
      createdAt: dbRow.created_at,
    };
  }

  protected override toRow(entity: Partial<ActivityAvailability>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.activityId !== undefined) row.activity_id = entity.activityId;
    if (entity.date !== undefined) row.date = entity.date;
    if (entity.startTime !== undefined) row.start_time = entity.startTime;
    if (entity.endTime !== undefined) row.end_time = entity.endTime;
    if (entity.maxCapacity !== undefined) row.max_capacity = entity.maxCapacity;
    if (entity.bookedCount !== undefined) row.booked_count = entity.bookedCount;
    if (entity.isAvailable !== undefined) row.is_available = entity.isAvailable;
    if (entity.price !== undefined) row.price = entity.price;

    return row;
  }

  // ============================================
  // Availability Operations
  // ============================================

  async findByActivityAndDateRange(
    activityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ActivityAvailability[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('activity_id', activityId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .eq('is_available', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, activityId, operation: 'findByActivityAndDateRange' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, activityId, operation: 'findByActivityAndDateRange' });
    }
  }

  async updateBookedCount(id: string, participants: number): Promise<boolean> {
    try {
      const client = this.getClient();

      // First get the current slot
      const { data: slot, error: fetchError } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !slot) {
        return false;
      }

      const currentBooked = slot.booked_count as number;
      const maxCapacity = slot.max_capacity as number;

      if (currentBooked + participants > maxCapacity) {
        return false;
      }

      const newBookedCount = currentBooked + participants;
      const isAvailable = newBookedCount < maxCapacity;

      const { error: updateError } = await client
        .from(this.tableName)
        .update({
          booked_count: newBookedCount,
          is_available: isAvailable,
        })
        .eq('id', id);

      if (updateError) {
        throw DatabaseError.fromError(updateError, { table: this.tableName, id, operation: 'updateBookedCount' });
      }

      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'updateBookedCount' });
    }
  }

  async deleteByActivityAndDates(activityId: string, dates: Date[]): Promise<void> {
    try {
      const client = this.getClient();
      const dateStrings = dates.map(d => d.toISOString().split('T')[0]);

      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('activity_id', activityId)
        .in('date', dateStrings);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, activityId, operation: 'deleteByActivityAndDates' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, activityId, operation: 'deleteByActivityAndDates' });
    }
  }
}

// ============================================
// Singleton Instances
// ============================================

let destinationRepository: DestinationRepository | null = null;
let activityRepository: ActivityRepository | null = null;
let tourRepository: TourRepository | null = null;
let activityAvailabilityRepository: ActivityAvailabilityRepository | null = null;

/**
 * Get Destination Repository instance
 * الحصول على مثيل مستودع الوجهات
 */
export function getDestinationRepository(): DestinationRepository {
  if (!destinationRepository) {
    destinationRepository = new DestinationRepository();
  }
  return destinationRepository;
}

/**
 * Get Activity Repository instance
 * الحصول على مثيل مستودع الأنشطة
 */
export function getActivityRepository(): ActivityRepository {
  if (!activityRepository) {
    activityRepository = new ActivityRepository();
  }
  return activityRepository;
}

/**
 * Get Tour Repository instance
 * الحصول على مثيل مستودع الجولات
 */
export function getTourRepository(): TourRepository {
  if (!tourRepository) {
    tourRepository = new TourRepository();
  }
  return tourRepository;
}

/**
 * Get Activity Availability Repository instance
 * الحصول على مثيل مستودع توفر الأنشطة
 */
export function getActivityAvailabilityRepository(): ActivityAvailabilityRepository {
  if (!activityAvailabilityRepository) {
    activityAvailabilityRepository = new ActivityAvailabilityRepository();
  }
  return activityAvailabilityRepository;
}
