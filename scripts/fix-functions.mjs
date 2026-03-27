import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.jqzpxxsrdcdgimiimbqx',
  password: '3240waels800',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('🔧 Fixing function type casting...\n');
  
  // Check escrows table structure
  const columns = await client.query(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'escrows'
    ORDER BY ordinal_position;
  `);
  
  console.log('📊 escrows table structure:');
  columns.rows.forEach(r => console.log(`   ${r.column_name}: ${r.data_type} (${r.udt_name})`));
  
  // Fix the functions with proper type casting
  const fixedFunctions = `
-- Fixed escrow_fund with proper types
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
  SELECT status INTO v_current_status FROM escrows WHERE id = p_escrow_id::uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not found');
  END IF;
  
  IF v_current_status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not in PENDING status');
  END IF;
  
  v_net_amount := p_amount - p_platform_fee;
  v_auto_release_at := NOW() + INTERVAL '7 days';
  
  UPDATE escrows SET status = 'FUNDED', funded_at = NOW(), auto_release_at = v_auto_release_at, updated_at = NOW() WHERE id = p_escrow_id::uuid;
  
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, metadata, from_user_id, created_at)
  VALUES (gen_random_uuid(), p_escrow_id::uuid, 'FUND', p_amount, 'SYP', 'تمويل حساب الضمان', p_payment_metadata, p_buyer_id::uuid, NOW());
  
  IF p_platform_fee > 0 THEN
    INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, created_at)
    VALUES (gen_random_uuid(), p_escrow_id::uuid, 'FEE', p_platform_fee, 'SYP', 'رسوم المنصة', NOW());
  END IF;
  
  RETURN jsonb_build_object('success', true, 'escrow_status', 'FUNDED', 'net_amount', v_net_amount, 'auto_release_at', v_auto_release_at);
END;
$$;

-- Fixed escrow_release
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
  SELECT status INTO v_current_status FROM escrows WHERE id = p_escrow_id::uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not found');
  END IF;
  
  IF v_current_status != 'FUNDED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escrow not in FUNDED status');
  END IF;
  
  UPDATE escrows SET status = 'RELEASED', released_at = NOW(), release_notes = p_notes, updated_at = NOW() WHERE id = p_escrow_id::uuid;
  
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, to_user_id, created_at)
  VALUES (gen_random_uuid(), p_escrow_id::uuid, 'RELEASE', p_net_amount, 'SYP', COALESCE(p_notes, 'إطلاق المبلغ للمزود'), p_provider_id::uuid, NOW());
  
  RETURN jsonb_build_object('success', true, 'escrow_status', 'RELEASED', 'released_to', p_provider_id);
END;
$$;

-- Fixed escrow_refund
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
  SELECT status INTO v_current_status FROM escrows WHERE id = p_escrow_id::uuid;
  
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
  
  UPDATE escrows SET status = v_new_status, refunded_at = CASE WHEN v_new_status = 'REFUNDED' THEN NOW() ELSE refunded_at END, refund_reason = p_reason, updated_at = NOW() WHERE id = p_escrow_id::uuid;
  
  INSERT INTO escrow_transactions (id, escrow_id, type, amount, currency, description, to_user_id, created_at)
  VALUES (gen_random_uuid(), p_escrow_id::uuid, v_tx_type, v_refund_amount, 'SYP', p_reason, p_buyer_id::uuid, NOW());
  
  RETURN jsonb_build_object('success', true, 'escrow_status', v_new_status, 'refunded_amount', v_refund_amount);
END;
$$;
`;
  
  await client.query(fixedFunctions);
  console.log('\n✅ Functions fixed with proper type casting!');
  
  await client.end();
}

main();
