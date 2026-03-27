import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🌱 بدء إنشاء البيانات التجريبية...\n');

// معرفات ثابتة للربط
const ids = {
  user1: 'user-test-001',
  user2: 'user-test-002', 
  user3: 'user-test-003',
  provider1: 'provider-test-001',
  service1: 'svc-test-001',
  booking1: 'book-test-001',
  escrow1: 'esc-test-001',
  review1: 'rev-test-001'
};

async function seed() {
  console.log('📊 1. إنشاء المستخدمين والملفات الشخصية...');
  
  // إنشاء profiles (المستخدمين)
  const { error: profilesError } = await supabase
    .from('profiles')
    .upsert([
      {
        id: ids.user1,
        display_name: 'أحمد السياح',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad',
        role: 'USER'
      },
      {
        id: ids.user2,
        display_name: 'سارة المسافرة',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
        role: 'USER'
      },
      {
        id: ids.provider1,
        display_name: 'فندق الشام',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hotel',
        role: 'PROVIDER'
      }
    ], { onConflict: 'id' });

  if (profilesError) {
    console.log('   ❌ خطأ:', profilesError.message);
  } else {
    console.log('   ✅ تم إنشاء 3 ملفات شخصية');
  }

  // إنشاء reviewer_profiles
  console.log('\n📊 2. إنشاء ملفات المراجعين...');
  const { error: reviewerError } = await supabase
    .from('reviewer_profiles')
    .upsert([
      {
        user_id: ids.user1,
        level: 'ACTIVE_REVIEWER',
        badges: 'verified,early_adopter',
        total_reviews: 5,
        helpful_votes: 12
      },
      {
        user_id: ids.user2,
        level: 'NEW_REVIEWER',
        badges: null,
        total_reviews: 1,
        helpful_votes: 2
      }
    ], { onConflict: 'user_id' });

  if (reviewerError) {
    console.log('   ❌ خطأ:', reviewerError.message);
  } else {
    console.log('   ✅ تم إنشاء 2 ملف مراجع');
  }

  // إنشاء service
  console.log('\n📊 3. إنشاء الخدمات...');
  const { error: serviceError } = await supabase
    .from('services')
    .upsert({
      id: ids.service1,
      title: 'شقة فاخرة في دمشق القديمة',
      description: 'شقة جميلة في قلب دمشق القديمة مع إطلالة رائعة',
      location: 'دمشق، سوريا',
      price: 150000,
      original_price: 200000,
      rating: 4.5,
      reviews: 10,
      views: 150,
      images: JSON.stringify(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']),
      type: 'apartment',
      amenities: JSON.stringify(['wifi', 'ac', 'kitchen']),
      features: JSON.stringify(['city_view', 'historic_area']),
      main_category_id: 'lodging',
      host_id: ids.provider1,
      host_name: 'فندق الشام',
      is_superhost: true,
      max_guests: 4,
      bedrooms: 2,
      beds: 2,
      baths: 1
    }, { onConflict: 'id' });

  if (serviceError) {
    console.log('   ❌ خطأ:', serviceError.message);
  } else {
    console.log('   ✅ تم إنشاء الخدمة');
  }

  // إنشاء booking
  console.log('\n📊 4. إنشاء الحجز...');
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 10);

  const { error: bookingError } = await supabase
    .from('bookings')
    .upsert({
      id: ids.booking1,
      guest_id: ids.user1,
      host_id: ids.provider1,
      service_id: ids.service1,
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      guests: 2,
      total_price: 450000,
      status: 'CONFIRMED'
    }, { onConflict: 'id' });

  if (bookingError) {
    console.log('   ❌ خطأ:', bookingError.message);
  } else {
    console.log('   ✅ تم إنشاء الحجز');
  }

  // إنشاء escrow
  console.log('\n📊 5. إنشاء الضمان المالي...');
  const { error: escrowError } = await supabase
    .from('escrows')
    .upsert({
      id: ids.escrow1,
      buyer_id: ids.user1,
      provider_id: ids.provider1,
      amount: 450000,
      platform_fee: 22500,
      net_amount: 427500,
      currency: 'SYP',
      status: 'FUNDED',
      reference_type: 'booking',
      reference_id: ids.booking1,
      funded_at: new Date().toISOString(),
      auto_release_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'id' });

  if (escrowError) {
    console.log('   ❌ خطأ:', escrowError.message);
  } else {
    console.log('   ✅ تم إنشاء الضمان');
  }

  // إنشاء review
  console.log('\n📊 6. إنشاء المراجعة...');
  const { error: reviewError } = await supabase
    .from('reviews')
    .upsert({
      id: ids.review1,
      type: 'SERVICE',
      reference_id: ids.service1,
      booking_id: ids.booking1,
      source: 'BOOKING',
      travel_phase: 'AFTER',
      author_id: ids.user1,
      title: 'تجربة رائعة!',
      content: 'كانت الإقامة ممتازة، المكان نظيف والموقع رائع. أنصح به بشدة!',
      rating: 4.5,
      cleanliness: 5,
      location: 5,
      value: 4,
      service_rating: 4,
      amenities: 4,
      communication: 5,
      status: 'PUBLISHED',
      is_verified: true,
      helpful_count: 5,
      reply_count: 1
    }, { onConflict: 'id' });

  if (reviewError) {
    console.log('   ❌ خطأ:', reviewError.message);
  } else {
    console.log('   ✅ تم إنشاء المراجعة');
  }

  // إنشاء review_photo
  console.log('\n📊 7. إنشاء صور المراجعة...');
  const { error: photoError } = await supabase
    .from('review_photos')
    .upsert({
      id: 'photo-test-001',
      review_id: ids.review1,
      url: 'https://example.com/review-photo.jpg',
      caption: 'إطلالة رائعة من الشقة',
      order: 1
    }, { onConflict: 'id' });

  if (photoError) {
    console.log('   ❌ خطأ:', photoError.message);
  } else {
    console.log('   ✅ تم إنشاء صورة المراجعة');
  }

  // إنشاء review_reply
  console.log('\n📊 8. إنشاء رد المراجعة...');
  const { error: replyError } = await supabase
    .from('review_replies')
    .upsert({
      id: 'reply-test-001',
      review_id: ids.review1,
      author_id: ids.provider1,
      author_name: 'فندق الشام',
      author_role: 'PROVIDER',
      content: 'شكراً لك على تقييمك الرائع! نتطلع لاستضافتك مجدداً.'
    }, { onConflict: 'id' });

  if (replyError) {
    console.log('   ❌ خطأ:', replyError.message);
  } else {
    console.log('   ✅ تم إنشاء رد المراجعة');
  }

  // إنشاء review_helpful
  console.log('\n📊 9. إنشاء تصويت مفيد...');
  const { error: helpfulError } = await supabase
    .from('review_helpful')
    .upsert({
      id: 'helpful-test-001',
      review_id: ids.review1,
      user_id: ids.user2,
      is_helpful: true
    }, { onConflict: 'id' });

  if (helpfulError) {
    console.log('   ❌ خطأ:', helpfulError.message);
  } else {
    console.log('   ✅ تم إنشاء التصويت');
  }

  // إنشاء topic
  console.log('\n📊 10. إنشاء موضوع مجتمعي...');
  const { error: topicError } = await supabase
    .from('topics')
    .upsert({
      id: 'topic-test-001',
      title: 'أفضل الأماكن للزيارة في دمشق',
      content: 'ما هي أفضل الأماكن التي تنصحون بزيارتها في دمشق القديمة؟',
      author_id: ids.user1,
      category_id: 'travel_tips',
      likes_count: 3,
      replies_count: 2,
      is_official: false
    }, { onConflict: 'id' });

  if (topicError) {
    console.log('   ❌ خطأ:', topicError.message);
  } else {
    console.log('   ✅ تم إنشاء الموضوع');
  }

  // إنشاء reply على الموضوع
  console.log('\n📊 11. إنشاء رد على الموضوع...');
  const { error: topicReplyError } = await supabase
    .from('replies')
    .upsert({
      id: 'reply-topic-001',
      topic_id: 'topic-test-001',
      content: 'أنصح بزيارة الجامع الأموي وسوق الحميدية، أماكن رائعة!',
      author_id: ids.user2,
      likes_count: 1
    }, { onConflict: 'id' });

  if (topicReplyError) {
    console.log('   ❌ خطأ:', topicReplyError.message);
  } else {
    console.log('   ✅ تم إنشاء الرد');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ انتهى إنشاء البيانات التجريبية');
  console.log('='.repeat(50));
}

seed().catch(console.error);
