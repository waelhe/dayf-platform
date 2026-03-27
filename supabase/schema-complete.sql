-- ============================================
-- Dayf Platform - Complete Database Schema
-- مخطط قاعدة البيانات الكامل لمنصة ضيف
-- ============================================
-- 
-- تعليمات التنفيذ:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى SQL Editor
-- 3. انسخ هذا الملف بالكامل
-- 4. اضغط Run
--
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('GUEST', 'USER', 'HOST', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE membership_level AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE oauth_provider AS ENUM ('GOOGLE', 'APPLE', 'FACEBOOK');
CREATE TYPE otp_type AS ENUM ('LOGIN', 'REGISTER', 'VERIFY', 'RESET_PASSWORD');
CREATE TYPE verification_type AS ENUM ('IDENTITY', 'PHONE', 'EMAIL', 'ADDRESS', 'BUSINESS');
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE company_type AS ENUM ('HOTEL', 'TOUR_OPERATOR', 'TRANSPORT', 'RESTAURANT', 'SHOP', 'TRAVEL_AGENCY', 'CAR_RENTAL', 'EVENT_ORGANIZER', 'OTHER');
CREATE TYPE company_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE employee_role AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'VIEWER');
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

CREATE TYPE destination_type AS ENUM ('CITY', 'HISTORICAL_SITE', 'NATURAL_LANDMARK', 'RELIGIOUS_SITE', 'MUSEUM', 'BEACH', 'MOUNTAIN', 'PARK', 'MARKET', 'OTHER');
CREATE TYPE activity_type AS ENUM ('TOUR', 'EXPERIENCE', 'WORKSHOP', 'ADVENTURE', 'CULTURAL', 'RELAXATION', 'FOOD_TOUR', 'PHOTOGRAPHY', 'WATER_SPORT', 'OTHER');
CREATE TYPE tour_type AS ENUM ('CITY_TOUR', 'DAY_TRIP', 'MULTI_DAY', 'ADVENTURE', 'CULTURAL', 'RELIGIOUS', 'FOOD_TOUR', 'NATURE', 'CUSTOM');

CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

CREATE TYPE escrow_status AS ENUM ('PENDING', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED');
CREATE TYPE escrow_transaction_type AS ENUM ('FUND', 'RELEASE', 'REFUND', 'PARTIAL_REFUND', 'FEE');

CREATE TYPE review_status AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED');
CREATE TYPE review_type AS ENUM ('SERVICE', 'ACTIVITY', 'DESTINATION', 'PRODUCT', 'COMPANY');
CREATE TYPE reviewer_level AS ENUM ('NEW_REVIEWER', 'ACTIVE_REVIEWER', 'EXPERT_REVIEWER', 'TRUSTED_REVIEWER');
CREATE TYPE review_source AS ENUM ('BOOKING', 'COMMUNITY', 'MARKETPLACE', 'DIRECT');
CREATE TYPE travel_phase AS ENUM ('BEFORE', 'DURING', 'AFTER');

CREATE TYPE dispute_type AS ENUM ('BOOKING_ISSUE', 'PRODUCT_ISSUE', 'PAYMENT_ISSUE', 'SERVICE_QUALITY', 'CANCELLATION', 'REFUND_REQUEST', 'OTHER');
CREATE TYPE dispute_status AS ENUM ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED');
CREATE TYPE dispute_decision AS ENUM ('BUYER_FAVOR', 'PROVIDER_FAVOR', 'SPLIT', 'NO_ACTION');

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- بيانات الدخول
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  
  -- المعلومات الأساسية
  first_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  date_of_birth TIMESTAMP WITH TIME ZONE,
  gender gender,
  nationality TEXT,
  
  -- معلومات الموقع
  country TEXT,
  city TEXT,
  address TEXT,
  
  -- الحالة
  status user_status NOT NULL DEFAULT 'PENDING',
  role user_role NOT NULL DEFAULT 'USER',
  email_verified TIMESTAMP WITH TIME ZONE,
  phone_verified TIMESTAMP WITH TIME ZONE,
  
  -- العضوية
  membership_level membership_level NOT NULL DEFAULT 'BRONZE',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  
  -- التفضيلات
  language TEXT NOT NULL DEFAULT 'ar',
  preferred_currency TEXT NOT NULL DEFAULT 'SYP',
  notification_settings TEXT,
  
  -- التواريخ
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- SESSIONS & OAUTH
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider oauth_provider NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  type otp_type NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(phone, code, type)
);

CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);

CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'PENDING',
  
  -- الوثائق
  document_type TEXT,
  document_url TEXT,
  document_number TEXT,
  
  -- التحقق
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX idx_user_verifications_type ON user_verifications(type);
CREATE INDEX idx_user_verifications_status ON user_verifications(status);

-- ============================================
-- COMPANIES
-- ============================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type company_type NOT NULL,
  description TEXT,
  
  -- معلومات التواصل
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- الموقع
  country TEXT,
  city TEXT,
  address TEXT,
  
  -- الوثائق
  logo TEXT,
  cover_image TEXT,
  commercial_reg TEXT,
  tax_number TEXT,
  documents TEXT,
  
  -- الحالة
  status company_status NOT NULL DEFAULT 'PENDING',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- إحصائيات
  total_services INTEGER NOT NULL DEFAULT 0,
  total_products INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  rating FLOAT NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  
  -- المالك
  owner_id UUID NOT NULL REFERENCES users(id),
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_owner_id ON companies(owner_id);

CREATE TABLE IF NOT EXISTS company_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role employee_role NOT NULL DEFAULT 'STAFF',
  permissions TEXT,
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_employees_company_id ON company_employees(company_id);
CREATE INDEX idx_company_employees_user_id ON company_employees(user_id);

CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role employee_role NOT NULL DEFAULT 'STAFF',
  token TEXT UNIQUE NOT NULL,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX idx_company_invitations_email ON company_invitations(email);
CREATE INDEX idx_company_invitations_token ON company_invitations(token);

-- ============================================
-- DESTINATIONS & ACTIVITIES
-- ============================================

CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type destination_type NOT NULL,
  description TEXT NOT NULL,
  short_desc TEXT,
  
  -- الموقع
  country TEXT NOT NULL DEFAULT 'سوريا',
  city TEXT NOT NULL,
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  
  -- الصور
  images TEXT NOT NULL,
  cover_image TEXT,
  
  -- التفاصيل
  highlights TEXT,
  best_time_to_visit TEXT,
  entry_fee FLOAT DEFAULT 0,
  opening_hours TEXT,
  duration TEXT,
  
  -- إحصائيات
  rating FLOAT NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  visit_count INTEGER NOT NULL DEFAULT 0,
  
  -- حالة التحقق
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  
  -- المالك
  owner_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_destinations_type ON destinations(type);
CREATE INDEX idx_destinations_city ON destinations(city);
CREATE INDEX idx_destinations_is_verified ON destinations(is_verified);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  short_desc TEXT,
  
  -- الموقع
  destination_id UUID REFERENCES destinations(id),
  location TEXT NOT NULL,
  meeting_point TEXT,
  latitude FLOAT,
  longitude FLOAT,
  
  -- التفاصيل
  duration INTEGER NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  min_participants INTEGER NOT NULL DEFAULT 1,
  difficulty_level TEXT,
  age_restriction TEXT,
  
  -- السعر
  price FLOAT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SYP',
  price_per_person BOOLEAN NOT NULL DEFAULT true,
  discount_price FLOAT,
  
  -- الصور
  images TEXT NOT NULL,
  cover_image TEXT,
  video_url TEXT,
  
  -- التضمينات والاستثناءات
  included TEXT,
  excluded TEXT,
  requirements TEXT,
  
  -- الجدولة
  availability TEXT,
  cancellation_policy TEXT,
  
  -- إحصائيات
  rating FLOAT NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  booking_count INTEGER NOT NULL DEFAULT 0,
  
  -- حالة التحقق
  status company_status NOT NULL DEFAULT 'PENDING',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- المالك
  owner_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_destination_id ON activities(destination_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_is_featured ON activities(is_featured);

CREATE TABLE IF NOT EXISTS activity_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  booked_count INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  price FLOAT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(activity_id, date, start_time)
);

CREATE INDEX idx_activity_availability_activity_id ON activity_availability(activity_id);
CREATE INDEX idx_activity_availability_date ON activity_availability(date);

-- ============================================
-- TOURS
-- ============================================

CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type tour_type NOT NULL,
  description TEXT NOT NULL,
  short_desc TEXT,
  
  -- التفاصيل
  duration_days INTEGER NOT NULL,
  duration_nights INTEGER NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 15,
  min_participants INTEGER NOT NULL DEFAULT 2,
  
  -- السعر
  price_per_person FLOAT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SYP',
  single_supplement FLOAT,
  
  -- الصور
  images TEXT NOT NULL,
  cover_image TEXT,
  
  -- التضمينات
  included TEXT,
  excluded TEXT,
  
  -- الجدولة
  departure_dates TEXT,
  cancellation_policy TEXT,
  
  -- إحصائيات
  rating FLOAT NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  booking_count INTEGER NOT NULL DEFAULT 0,
  
  -- حالة التحقق
  status company_status NOT NULL DEFAULT 'PENDING',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- المالك
  owner_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tours_type ON tours(type);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_is_featured ON tours(is_featured);

-- ============================================
-- SERVICES (LISTINGS)
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  price FLOAT NOT NULL,
  original_price FLOAT,
  rating FLOAT NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  images TEXT NOT NULL,
  type TEXT NOT NULL,
  amenities TEXT NOT NULL,
  features TEXT NOT NULL,
  main_category_id TEXT NOT NULL,
  sub_category_id TEXT,
  sub_sub_category_id TEXT,
  
  -- معلومات المضيف
  host_id UUID REFERENCES users(id),
  host_name TEXT,
  host_avatar TEXT,
  is_superhost BOOLEAN NOT NULL DEFAULT false,
  
  company_id UUID REFERENCES companies(id),
  
  -- خصائص الإقامة
  max_guests INTEGER NOT NULL DEFAULT 4,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  beds INTEGER NOT NULL DEFAULT 1,
  baths INTEGER NOT NULL DEFAULT 1,
  
  is_popular BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_main_category_id ON services(main_category_id);
CREATE INDEX idx_services_is_popular ON services(is_popular);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES users(id),
  host_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  check_in TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out TIMESTAMP WITH TIME ZONE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price FLOAT NOT NULL,
  status booking_status NOT NULL DEFAULT 'PENDING',
  escrow_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_host_id ON bookings(host_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- MARKETPLACE
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price FLOAT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  rating FLOAT NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES users(id),
  vendor_name TEXT,
  company_id UUID REFERENCES companies(id),
  stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total FLOAT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  escrow_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price FLOAT NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- ESCROW (FINANCIAL GUARANTEE)
-- ============================================

CREATE TABLE IF NOT EXISTS escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الأطراف
  buyer_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),
  
  -- المبلغ
  amount FLOAT NOT NULL,
  platform_fee FLOAT NOT NULL DEFAULT 0,
  net_amount FLOAT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SYP',
  
  -- الحالة
  status escrow_status NOT NULL DEFAULT 'PENDING',
  
  -- المرجع
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  
  -- التواريخ المهمة
  funded_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  auto_release_at TIMESTAMP WITH TIME ZONE,
  
  -- الملاحظات
  notes TEXT,
  release_notes TEXT,
  refund_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_escrows_buyer_id ON escrows(buyer_id);
CREATE INDEX idx_escrows_provider_id ON escrows(provider_id);
CREATE INDEX idx_escrows_status ON escrows(status);
CREATE INDEX idx_escrows_reference ON escrows(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  
  -- نوع المعاملة
  type escrow_transaction_type NOT NULL,
  
  -- المبلغ
  amount FLOAT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SYP',
  
  -- التفاصيل
  description TEXT,
  metadata TEXT,
  
  -- من وإلى
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_escrow_transactions_escrow_id ON escrow_transactions(escrow_id);
CREATE INDEX idx_escrow_transactions_type ON escrow_transactions(type);

-- ============================================
-- DISPUTES
-- ============================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المرجع
  escrow_id UUID NOT NULL REFERENCES escrows(id),
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  
  -- الأطراف
  opened_by UUID NOT NULL REFERENCES users(id),
  against_user UUID NOT NULL REFERENCES users(id),
  
  -- النوع والسبب
  type dispute_type NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- الحالة
  status dispute_status NOT NULL DEFAULT 'OPEN',
  
  -- القرار
  decision dispute_decision,
  decision_reason TEXT,
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMP WITH TIME ZONE,
  
  -- التواريخ
  escalated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_disputes_escrow_id ON disputes(escrow_id);
CREATE INDEX idx_disputes_opened_by ON disputes(opened_by);
CREATE INDEX idx_disputes_against_user ON disputes(against_user);
CREATE INDEX idx_disputes_status ON disputes(status);

CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  
  -- المرسل
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,
  
  -- المحتوى
  message TEXT NOT NULL,
  attachments TEXT,
  
  -- هل هي رسالة داخلية
  is_internal BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);

CREATE TABLE IF NOT EXISTS dispute_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  
  -- الحدث
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- من قام بالحدث
  performed_by UUID REFERENCES users(id),
  performed_by_role TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispute_timeline_dispute_id ON dispute_timeline(dispute_id);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المرجع
  type review_type NOT NULL,
  reference_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  
  -- مصدر المراجعة ومرحلة السفر
  source review_source NOT NULL DEFAULT 'DIRECT',
  travel_phase travel_phase,
  
  -- الكاتب
  author_id UUID NOT NULL REFERENCES users(id),
  
  -- المحتوى
  title TEXT,
  content TEXT NOT NULL,
  
  -- التقييمات
  rating FLOAT NOT NULL,
  cleanliness FLOAT,
  location FLOAT,
  value FLOAT,
  service_rating FLOAT,
  amenities FLOAT,
  communication FLOAT,
  
  -- الحالة
  status review_status NOT NULL DEFAULT 'PUBLISHED',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- الإحصائيات
  helpful_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  
  -- التواريخ
  visit_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_reviews_author_id ON reviews(author_id);
CREATE INDEX idx_reviews_reference_id ON reviews(reference_id);
CREATE INDEX idx_reviews_type ON reviews(type);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_is_verified ON reviews(is_verified);

CREATE TABLE IF NOT EXISTS review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_photos_review_id ON review_photos(review_id);

CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX idx_review_helpful_user_id ON review_helpful(user_id);

CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_replies_review_id ON review_replies(review_id);

CREATE TABLE IF NOT EXISTS reviewer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  level reviewer_level NOT NULL DEFAULT 'NEW_REVIEWER',
  badges TEXT,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_helpful INTEGER NOT NULL DEFAULT 0,
  total_photos INTEGER NOT NULL DEFAULT 0,
  cities_visited TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviewer_profiles_user_id ON reviewer_profiles(user_id);
CREATE INDEX idx_reviewer_profiles_level ON reviewer_profiles(level);

-- ============================================
-- COMMUNITY
-- ============================================

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  category_id TEXT NOT NULL,
  sub_category_id TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  is_official BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_topics_author_id ON topics(author_id);
CREATE INDEX idx_topics_category_id ON topics(category_id);

CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_replies_topic_id ON replies(topic_id);
CREATE INDEX idx_replies_author_id ON replies(author_id);

-- ============================================
-- WISHLIST
-- ============================================

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, service_id, product_id)
);

CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_items_service_id ON wishlist_items(service_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- ============================================
-- ESCROW RPC FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION escrow_fund(
  p_escrow_id UUID,
  p_buyer_id UUID,
  p_amount FLOAT,
  p_platform_fee FLOAT,
  p_payment_metadata TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
  v_net_amount FLOAT;
  v_auto_release_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT status INTO v_current_status FROM escrows WHERE id = p_escrow_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not found');
  END IF;
  
  IF v_current_status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not in PENDING status');
  END IF;
  
  v_net_amount := p_amount - p_platform_fee;
  v_auto_release_at := NOW() + INTERVAL '7 days';
  
  UPDATE escrows SET
    status = 'FUNDED',
    funded_at = NOW(),
    auto_release_at = v_auto_release_at,
    updated_at = NOW()
  WHERE id = p_escrow_id;
  
  INSERT INTO escrow_transactions (
    id, escrow_id, type, amount, currency, description, metadata, from_user_id, created_at
  ) VALUES (
    gen_random_uuid(), p_escrow_id, 'FUND', p_amount, 'SYP',
    'تمويل حساب الضمان', p_payment_metadata, p_buyer_id, NOW()
  );
  
  IF p_platform_fee > 0 THEN
    INSERT INTO escrow_transactions (
      id, escrow_id, type, amount, currency, description, created_at
    ) VALUES (
      gen_random_uuid(), p_escrow_id, 'FEE', p_platform_fee, 'SYP', 'رسوم المنصة', NOW()
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'escrow_status', 'FUNDED',
    'net_amount', v_net_amount,
    'auto_release_at', v_auto_release_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION escrow_release(
  p_escrow_id UUID,
  p_provider_id UUID,
  p_net_amount FLOAT,
  p_released_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  SELECT status INTO v_current_status FROM escrows WHERE id = p_escrow_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not found');
  END IF;
  
  IF v_current_status != 'FUNDED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not in FUNDED status');
  END IF;
  
  UPDATE escrows SET
    status = 'RELEASED',
    released_at = NOW(),
    release_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_escrow_id;
  
  INSERT INTO escrow_transactions (
    id, escrow_id, type, amount, currency, description, to_user_id, created_at
  ) VALUES (
    gen_random_uuid(), p_escrow_id, 'RELEASE', p_net_amount, 'SYP',
    COALESCE(p_notes, 'إطلاق المبلغ للمزود'), p_provider_id, NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'escrow_status', 'RELEASED',
    'released_to', p_provider_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION escrow_refund(
  p_escrow_id UUID,
  p_buyer_id UUID,
  p_amount FLOAT,
  p_reason TEXT,
  p_partial_amount FLOAT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
  v_refund_amount FLOAT;
  v_new_status TEXT;
  v_tx_type TEXT;
BEGIN
  SELECT status INTO v_current_status FROM escrows WHERE id = p_escrow_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not found');
  END IF;
  
  IF v_current_status NOT IN ('FUNDED', 'DISPUTED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow cannot be refunded');
  END IF;
  
  IF p_partial_amount IS NOT NULL AND p_partial_amount < p_amount THEN
    v_refund_amount := p_partial_amount;
    v_new_status := v_current_status;
    v_tx_type := 'PARTIAL_REFUND';
  ELSE
    v_refund_amount := p_amount;
    v_new_status := 'REFUNDED';
    v_tx_type := 'REFUND';
  END IF;
  
  UPDATE escrows SET
    status = v_new_status,
    refunded_at = CASE WHEN v_new_status = 'REFUNDED' THEN NOW() ELSE refunded_at END,
    refund_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_escrow_id;
  
  INSERT INTO escrow_transactions (
    id, escrow_id, type, amount, currency, description, to_user_id, created_at
  ) VALUES (
    gen_random_uuid(), p_escrow_id, v_tx_type, v_refund_amount, 'SYP',
    p_reason, p_buyer_id, NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'escrow_status', v_new_status,
    'refunded_amount', v_refund_amount
  );
END;
$$;

-- ============================================
-- AUDIT LOGGING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), 
            COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub', 'system'), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
            COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub', 'system'), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD),
            COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub', 'system'), NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS escrows_audit_trigger ON escrows;
CREATE TRIGGER escrows_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON escrows
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS escrow_transactions_audit_trigger ON escrow_transactions;
CREATE TRIGGER escrow_transactions_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON escrow_transactions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS bookings_audit_trigger ON bookings;
CREATE TRIGGER bookings_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS reviews_audit_trigger ON reviews;
CREATE TRIGGER reviews_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::TEXT FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
END;
$$;

-- ============================================
-- COMPLETE
-- ============================================
-- تم إنشاء جميع الجداول بنجاح!
-- All tables created successfully!
