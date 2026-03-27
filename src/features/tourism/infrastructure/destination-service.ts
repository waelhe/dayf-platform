// Destination Service - خدمة إدارة الوجهات السياحية

import { randomBytes } from 'crypto';
import { getDestinationRepository } from './repositories';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { DestinationType, CompanyStatus } from '@/core/types/enums';
import type { Destination, DestinationFilters } from './domain/interfaces';
import { TABLES } from '@/lib/supabase';
import { DatabaseError } from '@/core/database';

// ============================================
// Types
// ============================================

export interface CreateDestinationInput {
  name: string;
  type: DestinationType;
  description: string;
  shortDesc?: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  coverImage?: string;
  highlights?: string[];
  bestTimeToVisit?: string;
  entryFee?: number;
  openingHours?: Record<string, string>;
  duration?: string;
}

export interface UpdateDestinationInput {
  name?: string;
  description?: string;
  shortDesc?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  coverImage?: string;
  highlights?: string[];
  bestTimeToVisit?: string;
  entryFee?: number;
  openingHours?: Record<string, string>;
  duration?: string;
}

export interface DestinationResponse {
  id: string;
  name: string;
  slug: string;
  type: DestinationType;
  description: string;
  shortDesc: string | null;
  country: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  coverImage: string | null;
  highlights: string[];
  bestTimeToVisit: string | null;
  entryFee: number | null;
  openingHours: Record<string, string> | null;
  duration: string | null;
  rating: number;
  reviewCount: number;
  viewCount: number;
  visitCount: number;
  isVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// Slug Generation
// ============================================

function generateSlug(name: string, city: string): string {
  const baseSlug = `${name}-${city}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const randomSuffix = randomBytes(4).toString('hex');
  return `${baseSlug}-${randomSuffix}`;
}

// ============================================
// Destination Service
// ============================================

export const DestinationService = {
  // ----------------------------------------
  // Create Destination
  // ----------------------------------------
  async createDestination(input: CreateDestinationInput): Promise<DestinationResponse> {
    const slug = generateSlug(input.name, input.city);
    const repository = getDestinationRepository();
    
    const destination = await repository.create({
      name: input.name,
      slug,
      type: input.type,
      description: input.description,
      shortDesc: input.shortDesc ?? null,
      country: 'سوريا', // Default country
      city: input.city,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      images: input.images,
      coverImage: input.coverImage ?? null,
      highlights: input.highlights ?? [],
      bestTimeToVisit: input.bestTimeToVisit ?? null,
      entryFee: input.entryFee ?? null,
      openingHours: input.openingHours ?? null,
      duration: input.duration ?? null,
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      visitCount: 0,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
      ownerId: null,
      companyId: null,
    });
    
    return this.toResponse(destination);
  },
  
  // ----------------------------------------
  // Get Destination by ID
  // ----------------------------------------
  async getDestinationById(id: string): Promise<DestinationResponse | null> {
    const repository = getDestinationRepository();
    const destination = await repository.findById(id);
    
    if (!destination) return null;
    
    // Increment view count
    await repository.incrementViewCount(id);
    
    return this.toResponse(destination);
  },
  
  // ----------------------------------------
  // Get Destination by Slug
  // ----------------------------------------
  async getDestinationBySlug(slug: string): Promise<DestinationResponse | null> {
    const repository = getDestinationRepository();
    const destination = await repository.findBySlug(slug);
    
    if (!destination) return null;
    
    // Increment view count
    await repository.incrementViewCount(destination.id);
    
    return this.toResponse(destination);
  },
  
  // ----------------------------------------
  // List Destinations
  // ----------------------------------------
  async listDestinations(filters: DestinationFilters = {}): Promise<{
    destinations: DestinationResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const repository = getDestinationRepository();
    const provider = getSupabaseProvider();
    
    // Build filters for repository
    const repoFilters: Record<string, unknown> = {};
    
    if (filters.type) {
      repoFilters.type = filters.type;
    }
    
    if (filters.city) {
      repoFilters.city = filters.city;
    }
    
    if (filters.isVerified !== undefined) {
      repoFilters.is_verified = filters.isVerified;
    }
    
    // Use provider for search and count
    const client = provider.getRawClient();
    
    // Build query
    let countQuery = client
      .from(TABLES.DESTINATIONS)
      .select('*', { count: 'exact', head: true });
    
    let dataQuery = client
      .from(TABLES.DESTINATIONS)
      .select('*');
    
    // Apply filters
    if (filters.type) {
      countQuery = countQuery.eq('type', filters.type);
      dataQuery = dataQuery.eq('type', filters.type);
    }
    
    if (filters.city) {
      countQuery = countQuery.eq('city', filters.city);
      dataQuery = dataQuery.eq('city', filters.city);
    }
    
    if (filters.isVerified !== undefined) {
      countQuery = countQuery.eq('is_verified', filters.isVerified);
      dataQuery = dataQuery.eq('is_verified', filters.isVerified);
    }
    
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      countQuery = countQuery.or(`name.ilike.${searchPattern},description.ilike.${searchPattern},city.ilike.${searchPattern}`);
      dataQuery = dataQuery.or(`name.ilike.${searchPattern},description.ilike.${searchPattern},city.ilike.${searchPattern}`);
    }
    
    // Get count
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw DatabaseError.fromError(countError, { table: TABLES.DESTINATIONS, operation: 'count' });
    }
    
    // Apply sorting and pagination
    dataQuery = dataQuery
      .order('is_verified', { ascending: false })
      .order('rating', { ascending: false })
      .order('view_count', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    const { data, error: dataError } = await dataQuery;
    
    if (dataError) {
      throw DatabaseError.fromError(dataError, { table: TABLES.DESTINATIONS, operation: 'listDestinations' });
    }
    
    const total = count || 0;
    
    return {
      destinations: (data || []).map((d: Record<string, unknown>) => this.toResponseFromRow(d)),
      total,
      page,
      limit,
    };
  },
  
  // ----------------------------------------
  // Get Featured Destinations
  // ----------------------------------------
  async getFeaturedDestinations(limit: number = 6): Promise<DestinationResponse[]> {
    const repository = getDestinationRepository();
    const destinations = await repository.findFeatured(limit);
    
    return destinations.map(d => this.toResponse(d));
  },
  
  // ----------------------------------------
  // Get Destinations by City
  // ----------------------------------------
  async getDestinationsByCity(city: string): Promise<DestinationResponse[]> {
    const repository = getDestinationRepository();
    const destinations = await repository.findByCity(city, true);
    
    return destinations.map(d => this.toResponse(d));
  },
  
  // ----------------------------------------
  // Get Syrian Cities with Destinations
  // ----------------------------------------
  async getCitiesWithDestinations(): Promise<{ city: string; count: number }[]> {
    const repository = getDestinationRepository();
    return repository.getCitiesWithCount();
  },
  
  // ----------------------------------------
  // Update Destination
  // ----------------------------------------
  async updateDestination(id: string, input: UpdateDestinationInput): Promise<DestinationResponse> {
    const repository = getDestinationRepository();
    
    const destination = await repository.update(id, {
      ...input,
      // Fields that need JSON conversion are handled in toRow
    });
    
    if (!destination) {
      throw new Error('Destination not found');
    }
    
    return this.toResponse(destination);
  },
  
  // ----------------------------------------
  // Verify Destination (Admin)
  // ----------------------------------------
  async verifyDestination(id: string, adminId: string): Promise<DestinationResponse> {
    const repository = getDestinationRepository();
    const destination = await repository.verify(id, adminId);
    
    return this.toResponse(destination);
  },
  
  // ----------------------------------------
  // Update Statistics
  // ----------------------------------------
  async updateStatistics(id: string): Promise<void> {
    const provider = getSupabaseProvider();
    const client = provider.getRawClient();
    const repository = getDestinationRepository();
    
    // Get review count and average rating
    const { data: reviewStats } = await client
      .from(TABLES.REVIEWS)
      .select('rating')
      .eq('type', 'DESTINATION')
      .eq('reference_id', id)
      .eq('status', 'PUBLISHED');
    
    const reviews = reviewStats || [];
    const reviewCount = reviews.length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: Record<string, unknown>) => sum + (r.rating as number), 0) / reviews.length
      : 0;
    
    await repository.updateStatistics(id, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });
  },
  
  // ----------------------------------------
  // Search Destinations
  // ----------------------------------------
  async searchDestinations(query: string, limit: number = 10): Promise<DestinationResponse[]> {
    const repository = getDestinationRepository();
    const destinations = await repository.search(query, limit);
    
    return destinations.map(d => this.toResponse(d));
  },
  
  // ----------------------------------------
  // Response Transformers
  // ----------------------------------------
  toResponse(destination: Destination): DestinationResponse {
    return {
      id: destination.id,
      name: destination.name,
      slug: destination.slug,
      type: destination.type,
      description: destination.description,
      shortDesc: destination.shortDesc,
      country: destination.country,
      city: destination.city,
      address: destination.address,
      latitude: destination.latitude,
      longitude: destination.longitude,
      images: destination.images,
      coverImage: destination.coverImage,
      highlights: destination.highlights,
      bestTimeToVisit: destination.bestTimeToVisit,
      entryFee: destination.entryFee,
      openingHours: destination.openingHours,
      duration: destination.duration,
      rating: destination.rating,
      reviewCount: destination.reviewCount,
      viewCount: destination.viewCount,
      visitCount: destination.visitCount,
      isVerified: destination.isVerified,
      createdAt: destination.createdAt,
      updatedAt: destination.updatedAt,
    };
  },
  
  toResponseFromRow(row: Record<string, unknown>): DestinationResponse {
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
      name: row.name as string,
      slug: row.slug as string,
      type: row.type as DestinationType,
      description: row.description as string,
      shortDesc: row.short_desc as string | null,
      country: row.country as string,
      city: row.city as string,
      address: row.address as string | null,
      latitude: row.latitude as number | null,
      longitude: row.longitude as number | null,
      images: parseJson(row.images as string | null),
      coverImage: row.cover_image as string | null,
      highlights: parseJson(row.highlights as string | null),
      bestTimeToVisit: row.best_time_to_visit as string | null,
      entryFee: row.entry_fee as number | null,
      openingHours: parseJsonObject<Record<string, string>>(row.opening_hours as string | null),
      duration: row.duration as string | null,
      rating: row.rating as number,
      reviewCount: row.review_count as number,
      viewCount: row.view_count as number,
      visitCount: row.visit_count as number,
      isVerified: row.is_verified as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  },
};

export default DestinationService;
