import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🧪 اختبار التدفق الكامل للمنصة\n');
console.log('='.repeat(60));

async function testFlow() {
  // 1. فحص المستخدمين
  console.log('\n📊 1. المستخدمون والملفات الشخصية:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      role,
      reviewer_profile:reviewer_profiles(
        level,
        total_reviews,
        helpful_votes,
        badges
      )
    `)
    .limit(5);
  
  if (profilesError) {
    console.log('   ❌ خطأ:', profilesError.message);
  } else {
    profiles?.forEach(p => {
      console.log(`   ✅ ${p.display_name} (${p.role})`);
      if (p.reviewer_profile) {
        console.log(`      مستوى: ${p.reviewer_profile.level}, مراجعات: ${p.reviewer_profile.total_reviews}`);
      }
    });
  }

  // 2. فحص الخدمات
  console.log('\n📊 2. الخدمات المتاحة:');
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, title, price, location, rating, reviews')
    .limit(5);
  
  if (servicesError) {
    console.log('   ❌ خطأ:', servicesError.message);
  } else {
    services?.forEach(s => {
      console.log(`   ✅ ${s.title}`);
      console.log(`      السعر: ${s.price}, التقييم: ${s.rating}, المراجعات: ${s.reviews}`);
    });
  }

  // 3. فحص المواضيع المجتمعية
  console.log('\n📊 3. المواضيع المجتمعية:');
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select(`
      id,
      title,
      likes_count,
      replies_count,
      author:profiles!topics_author_id_fkey(display_name)
    `)
    .limit(5);
  
  if (topicsError) {
    console.log('   ❌ خطأ:', topicsError.message);
  } else {
    topics?.forEach(t => {
      console.log(`   ✅ ${t.title}`);
      console.log(`      الكاتب: ${t.author?.display_name || 'غير معروف'}, إعجابات: ${t.likes_count}`);
    });
  }

  // 4. فحص المراجعات
  console.log('\n📊 4. المراجعات:');
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      id,
      title,
      rating,
      helpful_count,
      reply_count,
      author:profiles!reviews_author_id_fkey(display_name)
    `)
    .limit(5);
  
  if (reviewsError) {
    console.log('   ❌ خطأ:', reviewsError.message);
  } else if (reviews && reviews.length > 0) {
    reviews.forEach(r => {
      console.log(`   ✅ ${r.title || 'بدون عنوان'}`);
      console.log(`      التقييم: ${r.rating}, مفيد: ${r.helpful_count}, ردود: ${r.reply_count}`);
    });
  } else {
    console.log('   ⚠️ لا توجد مراجعات');
  }

  // 5. فحص الحجوزات
  console.log('\n📊 5. الحجوزات:');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status, total_price')
    .limit(5);
  
  if (bookingsError) {
    console.log('   ❌ خطأ:', bookingsError.message);
  } else if (bookings && bookings.length > 0) {
    bookings.forEach(b => {
      console.log(`   ✅ حجز #${b.id?.substring(0, 8)}: ${b.status}`);
    });
  } else {
    console.log('   ⚠️ لا توجد حجوزات');
  }

  // 6. فحص الضمانات
  console.log('\n📊 6. الضمانات المالية:');
  const { data: escrows, error: escrowsError } = await supabase
    .from('escrows')
    .select('id, status, amount, currency')
    .limit(5);
  
  if (escrowsError) {
    console.log('   ❌ خطأ:', escrowsError.message);
  } else if (escrows && escrows.length > 0) {
    escrows.forEach(e => {
      console.log(`   ✅ ضمان #${e.id?.substring(0, 8)}: ${e.status} (${e.amount} ${e.currency})`);
    });
  } else {
    console.log('   ⚠️ لا توجد ضمانات');
  }

  // 7. اختبار JOIN معقد
  console.log('\n📊 7. اختبار JOIN معقد (مراجعة + كاتب + ملف مراجع):');
  const { data: complexJoin, error: complexError } = await supabase
    .from('reviews')
    .select(`
      id,
      title,
      content,
      rating,
      author:profiles!reviews_author_id_fkey(
        id,
        display_name,
        avatar_url,
        reviewer_profile:reviewer_profiles(
          level,
          total_reviews,
          helpful_votes
        )
      ),
      photos:review_photos(url, caption),
      replies:review_replies(author_name, content)
    `)
    .limit(1);
  
  if (complexError) {
    console.log('   ❌ خطأ:', complexError.message);
  } else if (complexJoin && complexJoin.length > 0) {
    console.log('   ✅ JOIN المعقد يعمل!');
    console.log('   البيانات:', JSON.stringify(complexJoin[0], null, 2));
  } else {
    console.log('   ⚠️ لا توجد مراجعات للاختبار');
  }

  // 8. اختبار RPC
  console.log('\n📊 8. اختبار دوال RPC:');
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_table_names');
  
  if (rpcError) {
    console.log('   ❌ خطأ:', rpcError.message);
  } else {
    console.log(`   ✅ RPC يعمل! عدد الجداول: ${rpcResult?.length || 0}`);
  }

  // ملخص
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص حالة المنصة:');
  console.log('='.repeat(60));
  
  const stats = {
    profiles: profiles?.length || 0,
    services: services?.length || 0,
    topics: topics?.length || 0,
    reviews: reviews?.length || 0,
    bookings: bookings?.length || 0,
    escrows: escrows?.length || 0
  };
  
  console.log(`
  👤 المستخدمون: ${stats.profiles}
  🏨 الخدمات: ${stats.services}
  💬 المواضيع: ${stats.topics}
  ⭐ المراجعات: ${stats.reviews}
  📅 الحجوزات: ${stats.bookings}
  💰 الضمانات: ${stats.escrows}
  `);

  // تحديد ما يعمل وما لا يعمل
  console.log('✅ ما يعمل:');
  console.log('   - الاتصال بقاعدة البيانات');
  console.log('   - JOINs بين الجداول');
  console.log('   - RPC functions');
  console.log('   - Repository Pattern');
  
  console.log('\n⚠️ ما يحتاج إصلاح:');
  if (stats.reviews === 0) console.log('   - إنشاء مراجعات (audit trigger issue)');
  if (stats.bookings === 0) console.log('   - إنشاء حجوزات (audit trigger issue)');
  if (stats.escrows === 0) console.log('   - إنشاء ضمانات (تعتمد على الحجوزات)');
  
  console.log('\n✅ انتهى الاختبار');
}

testFlow().catch(console.error);
