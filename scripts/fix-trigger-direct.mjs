import pg from 'pg';
const { Client } = pg;

async function fixTrigger() {
  // استخدام Direct Connection (المنفذ 5432 وليس Pooler 6543)
  const client = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,  // Pooler port
    database: 'postgres',
    user: 'postgres.jqzpxxsrdcdgimiimbqx',
    password: '3240waels800',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // 1. تعديل audit trigger function
    console.log('📊 1. تعديل audit trigger function...');
    
    const fixTriggerSQL = `
      CREATE OR REPLACE FUNCTION audit_trigger_func()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
          VALUES (
            TG_TABLE_NAME, 
            NEW.id::text, 
            'INSERT', 
            to_jsonb(NEW),
            NULL,
            NOW()
          );
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
          VALUES (
            TG_TABLE_NAME, 
            NEW.id::text, 
            'UPDATE', 
            to_jsonb(OLD), 
            to_jsonb(NEW),
            NULL,
            NOW()
          );
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
          VALUES (
            TG_TABLE_NAME, 
            OLD.id::text, 
            'DELETE', 
            to_jsonb(OLD),
            NULL,
            NOW()
          );
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$;
    `;
    
    await client.query(fixTriggerSQL);
    console.log('   ✅ تم تعديل الـ trigger function');

    // 2. تعديل audit_logs لقبول NULL في changed_by
    console.log('\n📊 2. تعديل audit_logs لقبول NULL...');
    await client.query(`
      ALTER TABLE audit_logs ALTER COLUMN changed_by DROP NOT NULL;
    `);
    console.log('   ✅ تم التعديل');

    // 3. إنشاء بيانات تجريبية
    console.log('\n📊 3. إنشاء بيانات تجريبية...');
    
    // الحصول على خدمة موجودة
    const { rows: services } = await client.query(`SELECT id FROM services LIMIT 1`);
    const serviceId = services[0]?.id;
    
    if (!serviceId) {
      console.log('   ❌ لا توجد خدمات');
      return;
    }
    
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const bookingId = '550e8400-e29b-41d4-a716-446655440005';
    const reviewId = '550e8400-e29b-41d4-a716-446655440007';
    
    // إنشاء booking
    await client.query(`
      INSERT INTO bookings (id, user_id, service_id, check_in, check_out, guests, total_price, status)
      VALUES ($1, $2, $3, '2025-02-01', '2025-02-04', 2, 450000, 'CONFIRMED')
      ON CONFLICT (id) DO NOTHING
    `, [bookingId, userId, serviceId]);
    console.log('   ✅ تم إنشاء الحجز');
    
    // إنشاء review
    await client.query(`
      INSERT INTO reviews (id, type, reference_id, source, author_id, title, content, rating, status, is_verified)
      VALUES ($1, 'SERVICE', $2, 'BOOKING', $3, 'تجربة رائعة!', 'خدمة ممتازة!', 4.5, 'PUBLISHED', true)
      ON CONFLICT (id) DO NOTHING
    `, [reviewId, serviceId, userId]);
    console.log('   ✅ تم إنشاء المراجعة');

    // التحقق
    console.log('\n📊 4. التحقق من البيانات...');
    const { rows: bookings } = await client.query(`SELECT COUNT(*) FROM bookings`);
    const { rows: reviews } = await client.query(`SELECT COUNT(*) FROM reviews`);
    
    console.log(`   الحجوزات: ${bookings[0].count}`);
    console.log(`   المراجعات: ${reviews[0].count}`);

    await client.end();
    console.log('\n✅ انتهى بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await client.end().catch(() => {});
  }
}

fixTrigger();
