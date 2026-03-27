import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.jqzpxxsrdcdgimiimbqx:3240waels800@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function executeFix() {
  await client.connect();
  console.log('✅ متصل بقاعدة البيانات\n');
  
  // 1. تغيير نوع changed_by
  console.log('🔧 تغيير نوع changed_by من UUID إلى TEXT...');
  try {
    await client.query(`ALTER TABLE audit_logs ALTER COLUMN changed_by TYPE TEXT;`);
    console.log('   ✅ تم التغيير\n');
  } catch (e) {
    if (e.message.includes('already')) {
      console.log('   ℹ️ النوع已经是 TEXT\n');
    } else {
      console.log('   ❌ خطأ:', e.message, '\n');
    }
  }
  
  // 2. تحديث الـ trigger function
  console.log('🔧 تحديث audit_trigger_func...');
  const triggerFunc = `
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  BEGIN
    v_user_id := current_setting('request.jwt.claims', true)::jsonb->>'sub';
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', to_jsonb(NEW), v_user_id, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_user_id, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', to_jsonb(OLD), v_user_id, NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
`;
  
  try {
    await client.query(triggerFunc);
    console.log('   ✅ تم تحديث الدالة\n');
  } catch (e) {
    console.log('   ❌ خطأ:', e.message, '\n');
  }
  
  // 3. اختبار
  console.log('🧪 اختبار إنشاء booking...');
  
  const testUserId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  
  // إنشاء profile
  await client.query(`
    INSERT INTO profiles (id, uid, display_name)
    VALUES ($1, $1, 'مستخدم اختبار')
    ON CONFLICT (id) DO NOTHING
  `, [testUserId]);
  console.log('   ✅ تم إنشاء profile');
  
  // الحصول على service
  const { rows: [service] } = await client.query(`SELECT id FROM services LIMIT 1`);
  if (!service) {
    console.log('   ❌ لا توجد خدمات');
    await client.end();
    return;
  }
  
  // إنشاء booking
  const bookingId = 'b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  try {
    await client.query(`
      INSERT INTO bookings (id, user_id, service_id, check_in, check_out, guests, total_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      bookingId,
      testUserId,
      service.id,
      new Date().toISOString(),
      new Date(Date.now() + 86400000).toISOString(),
      2,
      100,
      'PENDING'
    ]);
    console.log('   ✅ تم إنشاء booking!');
    
    // تحقق من audit_logs
    const { rows: logs } = await client.query(`
      SELECT * FROM audit_logs WHERE record_id = $1
    `, [bookingId]);
    console.log(`   📋 audit_logs: ${logs.length} سجل`);
    
    // Clean up
    await client.query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
    await client.query(`DELETE FROM profiles WHERE id = $1`, [testUserId]);
    console.log('   ✅ تم التنظيف');
    
  } catch (e) {
    console.log('   ❌ خطأ:', e.message);
  }
  
  await client.end();
  console.log('\n✅ انتهى');
}

executeFix().catch(e => {
  console.error('❌ خطأ:', e.message);
  process.exit(1);
});
