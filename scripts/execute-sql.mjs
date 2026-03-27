/**
 * Execute SQL Functions in Supabase
 * تنفيذ دوال SQL في Supabase
 */

import 'dotenv/config';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const sqlContent = fs.readFileSync('./supabase/functions.sql', 'utf-8');

console.log('🚀 Executing SQL in Supabase...\n');

// Execute SQL via Supabase REST API
async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
  });
  return response;
}

// Try direct SQL execution via Supabase SQL endpoint
async function executeSqlDirect() {
  // Split into logical chunks for execution
  const functions = [
    {
      name: 'escrow_fund',
      sql: `
CREATE OR REPLACE FUNCTION escrow_fund(
  p_escrow_id UUID,
  p_buyer_id UUID,
  p_amount DECIMAL(10,2),
  p_platform_fee DECIMAL(10,2),
  p_payment_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
  v_net_amount DECIMAL(10,2);
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
  UPDATE escrows SET status = 'FUNDED', funded_at = NOW(), auto_release_at = v_auto_release_at, updated_at = NOW() WHERE id = p_escrow_id;
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, metadata, from_user_id, created_at)
  VALUES (gen_random_uuid(), p_escrow_id, 'FUND', p_amount, 'SYP', 'تمويل حساب الضمان', p_payment_metadata, p_buyer_id, NOW());
  IF p_platform_fee > 0 THEN
    INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, created_at)
    VALUES (gen_random_uuid(), p_escrow_id, 'FEE', p_platform_fee, 'SYP', 'رسوم المنصة', NOW());
  END IF;
  RETURN jsonb_build_object('success', true, 'escrow_status', 'FUNDED', 'net_amount', v_net_amount, 'auto_release_at', v_auto_release_at);
END;
$$;`
    },
    {
      name: 'escrow_release',
      sql: `
CREATE OR REPLACE FUNCTION escrow_release(
  p_escrow_id UUID,
  p_provider_id UUID,
  p_net_amount DECIMAL(10,2),
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
  UPDATE escrows SET status = 'RELEASED', released_at = NOW(), release_notes = p_notes, updated_at = NOW() WHERE id = p_escrow_id;
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, to_user_id, created_at)
  VALUES (gen_random_uuid(), p_escrow_id, 'RELEASE', p_net_amount, 'SYP', COALESCE(p_notes, 'إطلاق المبلغ للمزود'), p_provider_id, NOW());
  RETURN jsonb_build_object('success', true, 'escrow_status', 'RELEASED', 'released_to', p_provider_id);
END;
$$;`
    },
    {
      name: 'escrow_refund',
      sql: `
CREATE OR REPLACE FUNCTION escrow_refund(
  p_escrow_id UUID,
  p_buyer_id UUID,
  p_amount DECIMAL(10,2),
  p_reason TEXT,
  p_partial_amount DECIMAL(10,2) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status TEXT;
  v_refund_amount DECIMAL(10,2);
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
  UPDATE escrows SET status = v_new_status, refunded_at = CASE WHEN v_new_status = 'REFUNDED' THEN NOW() ELSE refunded_at END, refund_reason = p_reason, updated_at = NOW() WHERE id = p_escrow_id;
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, to_user_id, created_at)
  VALUES (gen_random_uuid(), p_escrow_id, v_tx_type, v_refund_amount, 'SYP', p_reason, p_buyer_id, NOW());
  RETURN jsonb_build_object('success', true, 'escrow_status', v_new_status, 'refunded_amount', v_refund_amount);
END;
$$;`
    },
    {
      name: 'get_table_names',
      sql: `
CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT tablename::TEXT FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
END;
$$;`
    }
  ];

  const alterStatements = [
    'ALTER TABLE escrows ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE disputes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;'
  ];

  const createTableSQL = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);`;

  const indexSQL = `
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);`;

  console.log('📋 Executing via Supabase SQL API...\n');

  // Try to use the SQL execution endpoint
  // Note: This requires the database password which we don't have
  // So we'll try an alternative approach using the Supabase client
  
  console.log('⚠️ Direct SQL execution requires database password.');
  console.log('📌 Please execute the SQL manually in Supabase Dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/jqzpxxsrdcdgimiimbqx/sql/new');
  console.log('2. Copy the SQL from: supabase/functions.sql');
  console.log('3. Click "Run"\n');
  
  console.log('📄 SQL file location: ./supabase/functions.sql');
  console.log('📊 Total functions to create: 4');
  console.log('📊 Total ALTER statements: 6');
  console.log('📊 Total tables to create: 1\n');
}

executeSqlDirect();
