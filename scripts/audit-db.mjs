import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdXB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjg3ODMsImV4cCI6MjA2NDc0NDc4M30.YOUR_KEY'
);

async function auditDatabase() {
  console.log('🔍 فحص قاعدة البيانات الفعلي...\n');
  
  // 1. فحص الجداول الموجودة
  const tables = ['profiles', 'users', 'sessions', 'companies', 'services', 'bookings', 'escrows', 'reviews', 'disputes', 'products', 'orders', 'topics', 'replies'];
  
  console.log('📊 فحص الجداول:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: ${count} سجل`);
      }
    } catch (e) {
      console.log(`  ⚠️ ${table}: ${e.message}`);
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
    console.log('  ⚠️ الجدول فارغ');
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
  
  // 4. فحص RPC functions
  console.log('\n⚡ فحص دوال RPC:');
  const { data: tablesData, error: rpcError } = await supabase.rpc('get_table_names');
  if (rpcError) {
    console.log(`  ❌ get_table_names: ${rpcError.message}`);
  } else {
    console.log(`  ✅ get_table_names: ${tablesData?.length || 0} جدول`);
  }
  
  console.log('\n✅ انتهى الفحص');
}

auditDatabase().catch(console.error);
