import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqzpxxsrdcdgimiimbqx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 التحقق من الواقع الفعلي عبر Supabase API\n');
  console.log('='.repeat(60));

  // 1. التحقق من وجود الجداول
  console.log('\n📊 1. اختبار الوصول للجداول:');
  
  const tablesToCheck = ['users', 'profiles', 'reviewer_profiles', 'reviews', 'review_photos', 'review_replies', 'review_helpful'];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count} صف`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: خطأ`);
    }
  }

  // 2. فحص أعمدة reviewer_profiles عبر RPC
  console.log('\n📊 2. فحص reviewer_profiles:');
  try {
    const { data, error } = await supabase
      .from('reviewer_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ خطأ: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('   الأعمدة الموجودة:');
      Object.keys(data[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof data[0][key]}`);
      });
    } else {
      console.log('   ⚠️ الجدول موجود لكن فارغ');
    }
  } catch (e) {
    console.log(`   ❌ استثناء: ${e.message}`);
  }

  // 3. فحص profiles
  console.log('\n📊 3. فحص profiles:');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .limit(3);
    
    if (error) {
      console.log(`   ❌ خطأ: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('   عينة من البيانات:');
      data.forEach(p => console.log(`   - ${p.id}: ${p.display_name}`));
    } else {
      console.log('   ⚠️ الجدول موجود لكن فارغ');
    }
  } catch (e) {
    console.log(`   ❌ استثناء: ${e.message}`);
  }

  // 4. اختبار JOIN من reviews
  console.log('\n📊 4. اختبار JOIN من reviews:');
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        author:profiles!reviews_author_id_fkey(
          id,
          display_name
        )
      `)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ خطأ في JOIN: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('   ✅ JOIN مع profiles يعمل');
      console.log(`   مثال: ${JSON.stringify(data[0])}`);
    } else {
      console.log('   ⚠️ لا توجد مراجعات');
    }
  } catch (e) {
    console.log(`   ❌ استثناء: ${e.message}`);
  }

  // 5. اختبار JOIN مع reviewer_profiles
  console.log('\n📊 5. اختبار JOIN مع reviewer_profiles:');
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        author:profiles!reviews_author_id_fkey(
          id,
          display_name,
          reviewer_profile:reviewer_profiles(
            level,
            total_reviews,
            total_helpful,
            badges
          )
        )
      `)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ خطأ في JOIN: ${error.message}`);
      console.log(`  这可能 يعني أن FK أو العلاقة غير موجودة`);
    } else if (data) {
      console.log('   ✅ JOIN مع reviewer_profiles يعمل!');
      console.log(`   مثال: ${JSON.stringify(data[0])}`);
    }
  } catch (e) {
    console.log(`   ❌ استثناء: ${e.message}`);
  }

  // 6. اختبار RPC للحصول على معلومات الجداول
  console.log('\n📊 6. استدعاء RPC get_table_names:');
  try {
    const { data, error } = await supabase.rpc('get_table_names');
    if (error) {
      console.log(`   ❌ خطأ: ${error.message}`);
    } else {
      console.log(`   ✅ عدد الجداول: ${data?.length || 0}`);
      // البحث عن الجداول المهمة
      const important = ['users', 'profiles', 'reviewer_profiles', 'reviews'];
      important.forEach(t => {
        const found = data?.find(d => d.table_name === t);
        console.log(`   - ${t}: ${found ? '✅ موجود' : '❌ غير موجود'}`);
      });
    }
  } catch (e) {
    console.log(`   ❌ استثناء: ${e.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ انتهى التحقق');
}

verifySchema().catch(console.error);
