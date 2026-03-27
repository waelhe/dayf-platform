/**
 * Supabase Client Configuration
 * إعداد عميل Supabase
 * 
 * Provides configured Supabase clients for both client-side and server-side usage.
 * Includes type definitions for database tables and helper functions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Environment Configuration
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// ============================================
// Table Names Constants
// ============================================

/**
 * Database table names
 * أسماء جداول قاعدة البيانات
 */
export const TABLES = {
  // Auth & Users
  USERS: 'profiles', // ✅ Supabase uses 'profiles' not 'users'
  SESSIONS: 'sessions',
  OTP_CODES: 'otp_codes',
  OAUTH_ACCOUNTS: 'oauth_accounts',
  USER_VERIFICATIONS: 'user_verifications',
  
  // Companies
  COMPANIES: 'companies',
  COMPANY_EMPLOYEES: 'company_employees',
  COMPANY_INVITATIONS: 'company_invitations',
  
  // Tourism
  DESTINATIONS: 'destinations',
  ACTIVITIES: 'activities',
  ACTIVITY_AVAILABILITY: 'activity_availability',
  TOURS: 'tours',
  TOUR_DESTINATIONS: 'tour_destinations',
  TOUR_DAYS: 'tour_days',
  TOUR_ACTIVITIES: 'tour_activities',
  TOUR_AVAILABILITY: 'tour_availability',
  
  // Marketplace
  PRODUCTS: 'products',
  CARTS: 'cart', // ✅ Supabase uses 'cart' not 'carts'
  CART_ITEMS: 'cart_items',
  
  // Community
  TOPICS: 'topics',
  REPLIES: 'replies',
  
  // Bookings & Services
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  
  // Orders
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  
  // Financial
  ESCROWS: 'escrows',
  ESCROW_TRANSACTIONS: 'escrow_transactions',
  
  // Disputes
  DISPUTES: 'disputes',
  DISPUTE_MESSAGES: 'dispute_messages',
  DISPUTE_TIMELINE: 'dispute_timeline',
  
  // Reviews
  REVIEWS: 'reviews',
  REVIEW_PHOTOS: 'review_photos',
  REVIEW_HELPFUL: 'review_helpful',
  REVIEW_REPLIES: 'review_replies',
  REVIEWER_PROFILES: 'reviewer_profiles',
  
  // Wishlist
  WISHLIST_ITEMS: 'wishlist', // ✅ Supabase uses 'wishlist' not 'wishlist_items'
} as const;

// ============================================
// Supabase Client Instances
// ============================================

/**
 * Client-side Supabase client (uses anon key)
 * عميل Supabase للواجهة الأمامية
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client (uses service role key)
 * عميل Supabase للخادم مع صلاحيات كاملة
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get the appropriate Supabase client
 * الحصول على عميل Supabase المناسب
 */
export function getSupabaseClient(): SupabaseClient {
  // Return admin client for server-side operations
  return supabaseAdmin;
}

/**
 * Check database connection health
 * التحقق من صحة اتصال قاعدة البيانات
 */
export async function checkConnection(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  try {
    const startTime = Date.now();
    
    // Simple query to check connection
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      // If table doesn't exist, that's still a connection success
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return { healthy: true, latency };
      }
      return { healthy: false, latency, error: error.message };
    }
    
    return { healthy: true, latency };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown connection error' 
    };
  }
}

// ============================================
// Database Types (snake_case for Supabase)
// ============================================

/**
 * User row in Supabase (snake_case)
 * صف المستخدم في Supabase
 */
export interface SupabaseUser {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  avatar: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  status: string;
  role: string;
  email_verified: string | null;
  phone_verified: string | null;
  membership_level: string;
  loyalty_points: number;
  language: string;
  preferred_currency: string;
  notification_settings: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Session row in Supabase (snake_case)
 * صف الجلسة في Supabase
 */
export interface SupabaseSession {
  id: string;
  user_id: string;
  token: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * OTP Code row in Supabase (snake_case)
 * صف رمز التحقق في Supabase
 */
export interface SupabaseOTPCode {
  id: string;
  phone: string;
  code: string;
  type: string;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

/**
 * OAuth Account row in Supabase (snake_case)
 * صف حساب OAuth في Supabase
 */
export interface SupabaseOAuthAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Company row in Supabase (snake_case)
 * صف الشركة في Supabase
 */
export interface SupabaseCompany {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  logo: string | null;
  cover_image: string | null;
  commercial_reg: string | null;
  tax_number: string | null;
  documents: string | null;
  status: string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  total_services: number;
  total_products: number;
  total_bookings: number;
  rating: number;
  review_count: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Company Employee row in Supabase (snake_case)
 * صف موظف الشركة في Supabase
 */
export interface SupabaseCompanyEmployee {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  permissions: string | null;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Company Invitation row in Supabase (snake_case)
 * صف دعوة الشركة في Supabase
 */
export interface SupabaseCompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service row in Supabase (snake_case)
 * صف الخدمة في Supabase
 */
export interface SupabaseService {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  original_price: number | null;
  rating: number;
  reviews: number;
  views: number;
  images: string;
  type: string;
  amenities: string;
  features: string;
  main_category_id: string;
  sub_category_id: string | null;
  sub_sub_category_id: string | null;
  host_id: string | null;
  host_name: string | null;
  host_avatar: string | null;
  is_superhost: boolean;
  company_id: string | null;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Booking row in Supabase (snake_case)
 * صف الحجز في Supabase
 */
export interface SupabaseBooking {
  id: string;
  guest_id: string;
  host_id: string;
  service_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  escrow_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Product row in Supabase (snake_case)
 * صف المنتج في Supabase
 */
export interface SupabaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  vendor_id: string;
  vendor_name: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Review row in Supabase (snake_case)
 * صف المراجعة في Supabase
 */
export interface SupabaseReview {
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
 * Escrow row in Supabase (snake_case)
 * صف الضمان في Supabase
 */
export interface SupabaseEscrow {
  id: string;
  buyer_id: string;
  provider_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  status: string;
  reference_type: string;
  reference_id: string;
  funded_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  auto_release_at: string | null;
  notes: string | null;
  release_notes: string | null;
  refund_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dispute row in Supabase (snake_case)
 * صف النزاع في Supabase
 */
export interface SupabaseDispute {
  id: string;
  escrow_id: string;
  reference_type: string;
  reference_id: string;
  opened_by: string;
  against_user: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  decision: string | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Topic row in Supabase (snake_case)
 * صف الموضوع في Supabase
 */
export interface SupabaseTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  sub_category_id: string | null;
  likes_count: number;
  replies_count: number;
  is_official: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Reply row in Supabase (snake_case)
 * صف الرد في Supabase
 */
export interface SupabaseReply {
  id: string;
  topic_id: string;
  content: string;
  author_id: string;
  likes_count: number;
  created_at: string;
  updated_at: string | null;
}

/**
 * Order row in Supabase (snake_case)
 * صف الطلب في Supabase
 */
export interface SupabaseOrder {
  id: string;
  user_id: string;
  total: number;
  status: string;
  escrow_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Order Item row in Supabase (snake_case)
 * صف عنصر الطلب في Supabase
 */
export interface SupabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

/**
 * Destination row in Supabase (snake_case)
 * صف الوجهة في Supabase
 */
export interface SupabaseDestination {
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
 * Activity row in Supabase (snake_case)
 * صف النشاط في Supabase
 */
export interface SupabaseActivity {
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

// ============================================
// Legacy Types (for backward compatibility)
// ============================================

export interface Service {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  original_price?: number;
  rating: number;
  reviews: number;
  views?: number;
  images: string[];
  type: string;
  amenities?: string[];
  features?: string[];
  main_category_id: string;
  sub_category_id?: string;
  sub_sub_category_id?: string;
  host_id?: string;
  host_name?: string;
  host_avatar?: string;
  is_superhost?: boolean;
  is_popular?: boolean;
  max_guests?: number;
  bedrooms?: number;
  beds?: number;
  baths?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  service_id: string;
  service_title: string;
  user_id: string;
  user_email: string;
  provider_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  location?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  images?: string[];
  vendor_id?: string;
  vendor_name?: string;
  company_id?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Topic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  category_id: string;
  sub_category_id?: string;
  likes_count: number;
  replies_count: number;
  is_official?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Reply {
  id: string;
  topic_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  likes_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  type: 'service' | 'product' | 'destination' | 'activity';
  reference_id: string;
  booking_id?: string;
  source: 'direct' | 'post_stay' | 'verified_purchase';
  travel_phase?: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  title?: string;
  content: string;
  rating: number;
  cleanliness?: number;
  location?: number;
  value?: number;
  service_rating?: number;
  amenities?: number;
  communication?: number;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  helpful_count: number;
  reply_count: number;
  visit_date?: string;
  photos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  photo_url?: string;
  role: 'user' | 'provider' | 'admin';
  language: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  reputation_points?: number;
  badges?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  name: string;
  location?: string;
  price: number;
  rating?: number;
  image?: string;
  created_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_email?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  created_at?: string;
  updated_at?: string;
}
