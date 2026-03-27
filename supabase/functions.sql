-- ============================================
-- Dayf Platform - PostgreSQL RPC Functions
-- دوال قاعدة البيانات الذرية للمنصة
-- ============================================
-- تم تنفيذ هذه الدوال بنجاح في Supabase
-- تاریخ: 2025-01-09

-- ============================================
-- ESCROW ATOMIC OPERATIONS
-- عمليات الضمان الذرية
-- ============================================

/**
 * Escrow Fund - تمويل الضمان
 * عملية ذرية لتمويل حساب الضمان
 * الأنواع: TEXT (لأن الجداول تستخدم TEXT وليس UUID)
 */
CREATE OR REPLACE FUNCTION escrow_fund(
  p_escrow_id TEXT,
  p_buyer_id TEXT,
  p_amount DOUBLE PRECISION,
  p_platform_fee DOUBLE PRECISION,
  p_payment_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
  v_net_amount DOUBLE PRECISION;
  v_auto_release_at TIMESTAMP;
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
  
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, metadata, from_user_id, created_at)
  VALUES (
    gen_random_uuid()::text, 
    p_escrow_id, 
    'FUND', 
    p_amount, 
    'SYP', 
    'تمويل حساب الضمان', 
    p_payment_metadata, 
    p_buyer_id, 
    NOW()
  );
  
  IF p_platform_fee > 0 THEN
    INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, created_at)
    VALUES (
      gen_random_uuid()::text, 
      p_escrow_id, 
      'FEE', 
      p_platform_fee, 
      'SYP', 
      'رسوم المنصة', 
      NOW()
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

/**
 * Escrow Release - إطلاق الضمان
 * عملية ذرية لإطلاق المبلغ للمزود
 */
CREATE OR REPLACE FUNCTION escrow_release(
  p_escrow_id TEXT,
  p_provider_id TEXT,
  p_net_amount DOUBLE PRECISION,
  p_released_by TEXT,
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
  
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, to_user_id, created_at)
  VALUES (
    gen_random_uuid()::text, 
    p_escrow_id, 
    'RELEASE', 
    p_net_amount, 
    'SYP', 
    COALESCE(p_notes, 'إطلاق المبلغ للمزود'), 
    p_provider_id, 
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'escrow_status', 'RELEASED', 
    'released_to', p_provider_id
  );
END;
$$;

/**
 * Escrow Refund - استرداد الضمان
 * عملية ذرية لاسترداد المبلغ للمشتري
 */
CREATE OR REPLACE FUNCTION escrow_refund(
  p_escrow_id TEXT,
  p_buyer_id TEXT,
  p_amount DOUBLE PRECISION,
  p_reason TEXT,
  p_partial_amount DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
  v_refund_amount DOUBLE PRECISION;
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
  
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, to_user_id, created_at)
  VALUES (
    gen_random_uuid()::text, 
    p_escrow_id, 
    v_tx_type, 
    v_refund_amount, 
    'SYP', 
    p_reason, 
    p_buyer_id, 
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'escrow_status', v_new_status, 
    'refunded_amount', v_refund_amount
  );
END;
$$;

-- ============================================
-- SOFT DELETE SUPPORT
-- دعم الحذف الناعم
-- ============================================

ALTER TABLE escrows ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- AUDIT LOGGING
-- سجل التدقيق
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);

-- ============================================
-- HELPER FUNCTIONS
-- دوال مساعدة
-- ============================================

CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY 
  SELECT tablename::TEXT 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY tablename;
END;
$$;
