-- Migration: Create Missing Tables
-- Date: 2025-03-27
-- Purpose: إنشاء الجداول المفقودة التي اكتشفها الفحص الجذري

-- ============================================
-- 1. Tours Table - جدول الجولات السياحية
-- ============================================

CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_desc TEXT,
  type TEXT DEFAULT 'multi_day',
  duration_days INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SYP',
  discount_price DECIMAL(10,2),
  max_participants INT DEFAULT 10,
  min_participants INT DEFAULT 1,
  
  -- Locations
  destination_ids TEXT[],
  meeting_point TEXT,
  
  -- Content
  itinerary JSONB,
  included TEXT[],
  excluded TEXT[],
  requirements TEXT[],
  images TEXT[],
  cover_image TEXT,
  video_url TEXT,
  
  -- Availability
  availability JSONB,
  cancellation_policy TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Relations
  owner_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  
  -- Stats
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  booking_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tours
CREATE INDEX IF NOT EXISTS idx_tours_owner ON tours(owner_id);
CREATE INDEX IF NOT EXISTS idx_tours_company ON tours(company_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_type ON tours(type);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON tours(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_tours_slug ON tours(slug);

-- ============================================
-- 2. Order Items Table - جدول عناصر الطلبات
-- ============================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Product snapshot at time of order
  product_name TEXT NOT NULL,
  product_image TEXT,
  
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  
  -- Options/Variants
  options JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================
-- 3. User Verifications Table - جدول توثيق المستخدمين
-- ============================================

CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Verification type
  type TEXT NOT NULL, -- 'email', 'phone', 'identity', 'business'
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- Documents
  document_url TEXT,
  document_type TEXT,
  additional_documents JSONB,
  
  -- Review
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  notes TEXT,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_verifications
CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON user_verifications(type);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Tours RLS
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tours are viewable by everyone" ON tours
  FOR SELECT USING (status = 'published' OR auth.uid() = owner_id);

CREATE POLICY "Users can create tours" ON tours
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their tours" ON tours
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their tours" ON tours
  FOR DELETE USING (auth.uid() = owner_id);

-- Order Items RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items viewable by order owner" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- User Verifications RLS
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications" ON user_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own verifications" ON user_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Grant Permissions
-- ============================================

GRANT ALL ON tours TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON user_verifications TO authenticated;

GRANT SELECT ON tours TO anon;
