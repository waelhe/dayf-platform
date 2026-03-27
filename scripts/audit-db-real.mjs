import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jqzpxxsrdcdgimiimbqx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditDatabase() {
  console.log('🔍 فحص قاعدة البيانات الفعلي...\n');
  
  // 1. فحص الجداول الموجودة
  const tables = ['profiles', 'users', 'sessions', 'companies', 'services', 'bookings', 'escrows', 'reviews', 'disputes', 'products', 'orders', 'topics', 'replies', 'review_photos', 'review_helpful', 'review_replies', 'reviewer_profiles'];
  
  console.log('📊 فحص الجداول:');
  const tableStats = {};
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
        tableStats[table] = { error: error.message };
      } else {
        console.log(`  ✅ ${table}: ${count} سجل`);
        tableStats[table] = { count };
      }
    } catch (e) {
      console.log(`  ⚠️ ${table}: ${e.message}`);
      tableStats[table] = { error: e.message };
    }
  }
  
  // 2. فحص هيكل profiles
  console.log('\n📋 فحص هيكل profiles:');
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
  if (profilesError) {
    console.log(`  ❌ خطأ: ${profilesError.message}`);
  } else if (profiles && profiles.length > 0) {
    console.log(`  الأعمدة: ${Object.keys(profiles[0]).join(', ')}`);
  } else {
    console.log('  ⚠️ الجدول فارغ - فحص الأعمدة عبر insert وهمي...');
    // نجرب insert وهمي لمعرفة الأعمدة
    const { error: insertError } = await supabase.from('profiles').insert({}).select();
    if (insertError) {
      console.log(`  رسالة الخطأ: ${insertError.message}`);
    }
  }
  
  // 3. فحص Foreign Keys عبر joins
  console.log('\n🔗 فحص العلاقات:');
  
  // bookings -> profiles
  const { data: bookingsWithUsers, error: bError } = await supabase
    .from('bookings')
    .select('id, guest_id, profiles!bookings_guest_id_fkey(id)')
    .limit(1);
  if (bError) {
    console.log(`  ❌ bookings -> profiles: ${bError.message}`);
  } else {
    console.log(`  ✅ bookings -> profiles: يعمل`);
  }
  
  // reviews -> profiles
  const { data: reviewsWithAuthors, error: rError } = await supabase
    .from('reviews')
    .select('id, author_id, profiles!reviews_author_id_fkey(id)')
    .limit(1);
  if (rError) {
    console.log(`  ❌ reviews -> profiles: ${rError.message}`);
  } else {
    console.log(`  ✅ reviews -> profiles: يعمل`);
  }
  
  // escrows -> profiles
  const { data: escrowsWithUsers, error: eError } = await supabase
    .from('escrows')
    .select('id, buyer_id, profiles!escrows_buyer_id_fkey(id)')
    .limit(1);
  if (eError) {
    console.log(`  ❌ escrows -> profiles: ${eError.message}`);
  } else {
    console.log(`  ✅ escrows -> profiles: يعمل`);
  }
  
  // topics -> profiles
  const { data: topicsWithAuthors, error: tError } = await supabase
    .from('topics')
    .select('id, author_id, profiles!topics_author_id_fkey(id)')
    .limit(1);
  if (tError) {
    console.log(`  ❌ topics -> profiles: ${tError.message}`);
  } else {
    console.log(`  ✅ topics -> profiles: يعمل`);
  }
  
  // 4. فحص RPC functions
  console.log('\n⚡ فحص دوال RPC:');
  const { data: tablesData, error: rpcError } = await supabase.rpc('get_table_names');
  if (rpcError) {
    console.log(`  ❌ get_table_names: ${rpcError.message}`);
  } else {
    console.log(`  ✅ get_table_names: ${tablesData?.length || 0} جدول`);
  }
  
  // 5. فحص escrow_fund function
  console.log('\n💰 فحص دوال Escrow:');
  // نجرب استدعاء الدالة بدون معاملات حقيقية
  const { error: fundError } = await supabase.rpc('escrow_fund', {
    p_escrow_id: 'test-id',
    p_buyer_id: 'test-id',
    p_amount: 0,
    p_platform_fee: 0
  });
  if (fundError) {
    if (fundError.message.includes('not found') || fundError.message.includes('PENDING')) {
      console.log(`  ✅ escrow_fund: الدالة موجودة وتعمل (الخطأ متوقع)`);
    } else {
      console.log(`  ⚠️ escrow_fund: ${fundError.message}`);
    }
  } else {
    console.log(`  ✅ escrow_fund: يعمل`);
  }
  
  // 6. فحص مشاكل تكامل البيانات
  console.log('\n🔍 فحص مشاكل تكامل البيانات:');
  
  // bookings بدون guest صالح
  const { data: orphanBookings, error: obError } = await supabase
    .from('bookings')
    .select('id, guest_id')
    .limit(10);
  if (orphanBookings && orphanBookings.length > 0) {
    console.log(`  ✅ bookings موجودة: ${orphanBookings.length}`);
  }
  
  // escrows بدون buyer صالح
  const { data: orphanEscrows, error: oeError } = await supabase
    .from('escrows')
    .select('id, buyer_id, provider_id, status')
    .limit(10);
  if (orphanEscrows && orphanEscrows.length > 0) {
    console.log(`  ✅ escrows موجودة: ${orphanEscrows.length}`);
    orphanEscrows.forEach(e => {
      console.log(`     - ${e.id?.substring(0,8)}: buyer=${e.buyer_id?.substring(0,8)} provider=${e.provider_id?.substring(0,8)} status=${e.status}`);
    });
  }
  
  // 7. فحص types في الجداول
  console.log('\n📋 فحص أنواع الأعمدة:');
  
  // فحص نوع id في profiles
  const { data: profileSample, error: psError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  if (profileSample && profileSample.length > 0) {
    const id = profileSample[0].id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    console.log(`  profiles.id: ${id} (${isUUID ? 'UUID' : 'TEXT'})`);
  }
  
  console.log('\n✅ انتهى الفحص');
  
  return tableStats;
}

auditDatabase().catch(console.error);
