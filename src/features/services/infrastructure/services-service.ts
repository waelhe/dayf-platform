/**
 * Services Service - خدمة الخدمات السياحية
 * Version: Supabase
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Service } from '../types';

// Parse service from Supabase
function parseServiceFromDB(dbService: Record<string, unknown>): Service {
  return {
    id: dbService.id as string,
    mainCategoryId: dbService.main_category_id as string,
    subCategoryId: dbService.sub_category_id as string | undefined,
    subSubCategoryId: dbService.sub_sub_category_id as string | undefined,
    title: dbService.title as string,
    description: dbService.description as string,
    location: dbService.location as string,
    price: dbService.price as number,
    originalPrice: dbService.original_price as number | undefined,
    rating: (dbService.rating as number) || 0,
    reviews: (dbService.reviews as number) || 0,
    views: (dbService.views as number) || 0,
    images: Array.isArray(dbService.images) ? dbService.images as string[] : [],
    type: dbService.type as string,
    amenities: Array.isArray(dbService.amenities) ? dbService.amenities as string[] : [],
    features: Array.isArray(dbService.features) ? dbService.features as string[] : [],
    maxGuests: (dbService.max_guests as number) || 4,
    bedrooms: (dbService.bedrooms as number) || 1,
    beds: (dbService.beds as number) || 1,
    baths: (dbService.baths as number) || 1,
    hostId: dbService.host_id as string | undefined,
    hostName: dbService.host_name as string | undefined,
    hostAvatar: dbService.host_avatar as string | undefined,
    isSuperhost: (dbService.is_superhost as boolean) || false,
    isPopular: (dbService.is_popular as boolean) || false,
  };
}

// Convert service to database format
function serviceToDB(service: Omit<Service, 'id'>): Record<string, unknown> {
  return {
    title: service.title,
    description: service.description ?? '',
    location: service.location,
    price: service.price,
    original_price: service.originalPrice ?? null,
    rating: service.rating ?? 0,
    reviews: service.reviews ?? 0,
    views: service.views ?? 0,
    images: service.images || [],
    type: service.type,
    amenities: service.amenities ?? [],
    features: service.features ?? [],
    main_category_id: service.mainCategoryId,
    sub_category_id: service.subCategoryId ?? null,
    sub_sub_category_id: service.subSubCategoryId ?? null,
    host_id: service.hostId ?? null,
    host_name: service.hostName ?? null,
    host_avatar: service.hostAvatar ?? null,
    is_superhost: service.isSuperhost ?? false,
    is_popular: service.isPopular ?? false,
    max_guests: service.maxGuests ?? 4,
    bedrooms: service.bedrooms ?? 1,
    beds: service.beds ?? 1,
    baths: service.baths ?? 1,
  };
}

export const servicesService = {
  // Get all services
  async getAll(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return (data || []).map(parseServiceFromDB);
  },

  // Get service by ID
  async getById(id: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return parseServiceFromDB(data);
  },

  // Get services by category
  async getByCategory(categoryId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('main_category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services by category:', error);
      return [];
    }

    return (data || []).map(parseServiceFromDB);
  },

  // Get services by host
  async getByHost(hostId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services by host:', error);
      return [];
    }

    return (data || []).map(parseServiceFromDB);
  },

  // Create service
  async create(data: Omit<Service, 'id'>): Promise<Service> {
    const id = `svc_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
    const dbData = { id, ...serviceToDB(data) };

    const { error } = await supabaseAdmin
      .from('services')
      .insert(dbData);

    if (error) {
      console.error('Error creating service:', error);
      throw error;
    }

    return parseServiceFromDB(dbData);
  },

  // Update service
  async update(id: string, data: Partial<Service>): Promise<Service> {
    const updateData: Record<string, unknown> = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.location) updateData.location = data.location;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.images) updateData.images = data.images;
    if (data.amenities) updateData.amenities = data.amenities;
    if (data.features) updateData.features = data.features;

    const { error } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error('Service not found after update');
    return updated;
  },

  // Delete service
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  // Search services
  async search(query: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching services:', error);
      return [];
    }

    return (data || []).map(parseServiceFromDB);
  },

  // Get popular services
  async getPopular(limit: number = 10): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .or('is_popular.eq.true,rating.gte.4.8')
      .order('rating', { ascending: false })
      .order('reviews', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular services:', error);
      return [];
    }

    return (data || []).map(parseServiceFromDB);
  },

  // Increment views
  async incrementViews(id: string): Promise<void> {
    const { data: current } = await supabase
      .from('services')
      .select('views')
      .eq('id', id)
      .single();

    const newViews = (current?.views || 0) + 1;

    await supabaseAdmin
      .from('services')
      .update({ views: newViews })
      .eq('id', id);
  },

  // Get services by sub-category
  async getBySubCategory(mainCategoryId: string, subCategoryId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('main_category_id', mainCategoryId)
      .eq('sub_category_id', subCategoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services by sub-category:', error);
      return [];
    }

    return (data || []).map(parseServiceFromDB);
  },

  // Get count by category
  async getCountByCategory(categoryId: string): Promise<number> {
    const { count, error } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('main_category_id', categoryId);

    if (error) {
      console.error('Error counting services:', error);
      return 0;
    }

    return count || 0;
  },
};

export type { Service };
