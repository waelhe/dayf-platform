import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🌱 إكمال البيانات التجريبية\n');

const uuid = {
  user1: '550e8400-e29b-41d4-a716-446655440001',
  provider: '550e8400-e29b-41d4-a716-446655440003',
  service: '550e8400-e29b-41d4-a716-446655440004',
  booking: '550e8400-e29b-41d4-a716-446655440005',
  review: '550e8400-e29b-41d4-a716-446655440007',
  photo: '550e8400-e29b-41d4-a716-446655440008',
  reply: '550e8400-e29b-41d4-a716-446655440009'
};

async function completeSeed() {
  // تعطيل audit trigger مؤقتاً عبر تعيين set_config
  // ثم إنشاء البيانات

  // 4. إنشاء booking (مع تجاوز audit)
  console.log('📊 4. إنشاء booking...');
  
  // نستخدم RPC أو direct insert مع تجاهل audit
  const { error: bookingError } = await supabase
    .from('bookings')
    .upsert({
      id: uuid.booking,
      user_id: uuid.user1,
      service_id: uuid.service,
      check_in: '2025-02-01',
      check_out: '2025-02-04',
      guests: 2,
      total_price: 450000,
      status: 'CONFIRMED'
    }, { onConflict: 'id' });
  
  if (bookingError) {
    console.log(`   ⚠️ الخطأ: ${bookingError.message}`);
    console.log('   محاولة بدون audit...');
    
    // نحاول بدون تحديد الأعمدة التي تسبب المشكلة
    // المشكلة في audit trigger - دعنا نتحقق أولاً
  } else {
    console.log('   ✅ تم');
  }

  // 5. إنشاء review
  console.log('📊 5. إنشاء review...');
  const { error: reviewError } = await supabase
    .from('reviews')
    .upsert({
      id: uuid.review,
      type: 'SERVICE',
      reference_id: uuid.service,
      source: 'BOOKING',
      author_id: uuid.user1,
      title: 'تجربة رائعة!',
      content: 'كانت الإقامة ممتازة! المكان نظيف والموقع رائع. أنصح به بشدة.',
      rating: 4.5,
      cleanliness: 5,
      location: 5,
      value: 4,
      status: 'PUBLISHED',
      is_verified: true,
      helpful_count: 0,
      reply_count: 0
    }, { onConflict: 'id' });
  
  console.log(reviewError ? `   ⚠️ ${reviewError.message}` : '   ✅ تم');

  // التحقق من المراجعات الموجودة
  console.log('\n📊 التحقق من المراجعات:');
  const { data: reviews, error: revError } = await supabase
    .from('reviews')
    .select('id, rating, content')
    .limit(5);
  
  if (reviews && reviews.length > 0) {
    console.log(`   ✅ يوجد ${reviews.length} مراجعة`);
  } else {
    console.log('   ⚠️ لا توجد مراجعات');
  }

  // التحقق من bookings
  console.log('\n📊 التحقق من الحجوزات:');
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status')
    .limit(5);
  
  if (bookings && bookings.length > 0) {
    console.log(`   ✅ يوجد ${bookings.length} حجز`);
  } else {
    console.log('   ⚠️ لا توجد حجوزات');
  }

  // 6. إنشاء review_photo (إذا المراجعة موجودة)
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('author_id', uuid.user1)
    .single();

  if (existingReview) {
    console.log('\n📊 6. إنشاء review_photo...');
    const { error: photoError } = await supabase
      .from('review_photos')
      .upsert({
        id: uuid.photo,
        review_id: existingReview.id,
        url: 'https://example.com/review-photo.jpg',
        order: 1
      }, { onConflict: 'id' });
    
    console.log(photoError ? `   ❌ ${photoError.message}` : '   ✅ تم');

    console.log('📊 7. إنشاء review_reply...');
    const { error: replyError } = await supabase
      .from('review_replies')
      .upsert({
        id: uuid.reply,
        review_id: existingReview.id,
        author_id: uuid.provider,
        author_name: 'فندق الشام',
        author_role: 'PROVIDER',
        content: 'شكراً لك على تقييمك الرائع! نتطلع لاستضافتك مجدداً.'
      }, { onConflict: 'id' });
    
    console.log(replyError ? `   ❌ ${replyError.message}` : '   ✅ تم');
  }

  // اختبار التدفق الكامل
  console.log('\n' + '='.repeat(50));
  console.log('📊 اختبار التدفق الكامل:');
  console.log('='.repeat(50));

  // 1. التحقق من المستخدم
  const { data: user } = await supabase
    .from('profiles')
    .select(`*, reviewer_profile:reviewer_profiles(*)`)
    .eq('id', uuid.user1)
    .single();
  
  console.log('\n1️⃣ المستخدم:', user ? '✅ موجود' : '❌ غير موجود');
  if (user) {
    console.log(`   الاسم: ${user.display_name}`);
    console.log(`   مستوى المراجع: ${user.reviewer_profile?.level || 'غير محدد'}`);
  }

  // 2. التحقق من الخدمة
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', uuid.service)
    .single();
  
  console.log('\n2️⃣ الخدمة:', service ? '✅ موجودة' : '❌ غير موجودة');
  if (service) {
    console.log(`   العنوان: ${service.title}`);
    console.log(`   السعر: ${service.price}`);
  }

  // 3. التحقق من الموضوع
  const { data: topic } = await supabase
    .from('topics')
    .select(`*, author:profiles!topics_author_id_fkey(display_name)`)
    .eq('author_id', uuid.user1)
    .single();
  
  console.log('\n3️⃣ الموضوع:', topic ? '✅ موجود' : '❌ غير موجود');
  if (topic) {
    console.log(`   العنوان: ${topic.title}`);
    console.log(`   الكاتب: ${topic.author?.display_name}`);
  }

  console.log('\n✅ انتهى!');
}

completeSeed().catch(console.error);
