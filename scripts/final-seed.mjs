import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🌱 إنشاء البيانات بشكل صحيح\n');

const uuid = {
  user1: '550e8400-e29b-41d4-a716-446655440001',
  user2: '550e8400-e29b-41d4-a716-446655440002',
  provider: '550e8400-e29b-41d4-a716-446655440003',
  service: '550e8400-e29b-41d4-a716-446655440004',
  booking: '550e8400-e29b-41d4-a716-446655440005',
  review: '550e8400-e29b-41d4-a716-446655440007',
  photo: '550e8400-e29b-41d4-a716-446655440008',
  reply: '550e8400-e29b-41d4-a716-446655440009',
  topic: '550e8400-e29b-41d4-a716-446655440011'
};

async function seed() {
  // 1. إنشاء profiles مع uid
  console.log('📊 1. إنشاء profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .upsert([
      { id: uuid.user1, uid: uuid.user1, display_name: 'أحمد السياح', role: 'USER' },
      { id: uuid.user2, uid: uuid.user2, display_name: 'سارة المسافرة', role: 'USER' },
      { id: uuid.provider, uid: uuid.provider, display_name: 'فندق الشام', role: 'PROVIDER' }
    ], { onConflict: 'id' })
    .select();
  
  console.log(profilesError ? `   ❌ ${profilesError.message}` : `   ✅ تم إنشاء ${profiles?.length} ملف`);
  
  if (profilesError) return;

  // 2. إنشاء reviewer_profiles
  console.log('📊 2. إنشاء reviewer_profiles...');
  const { error: reviewerError } = await supabase
    .from('reviewer_profiles')
    .upsert([
      { user_id: uuid.user1, level: 'ACTIVE_REVIEWER', total_reviews: 5, helpful_votes: 12 },
      { user_id: uuid.user2, level: 'NEW_REVIEWER', total_reviews: 1, helpful_votes: 2 }
    ], { onConflict: 'user_id' });
  
  console.log(reviewerError ? `   ❌ ${reviewerError.message}` : '   ✅ تم');

  // 3. إنشاء service
  console.log('📊 3. إنشاء service...');
  const { error: serviceError } = await supabase
    .from('services')
    .upsert({
      id: uuid.service,
      title: 'شقة فاخرة في دمشق',
      description: 'شقة جميلة في قلب دمشق',
      location: 'دمشق، سوريا',
      price: 150000,
      type: 'apartment',
      amenities: '{wifi,ac,kitchen}',
      features: '{city_view}',
      main_category_id: 'lodging',
      host_id: uuid.provider,
      host_name: 'فندق الشام',
      images: '{https://example.com/1.jpg}'
    }, { onConflict: 'id' });
  
  console.log(serviceError ? `   ❌ ${serviceError.message}` : '   ✅ تم');

  // 4. إنشاء booking
  console.log('📊 4. إنشاء booking...');
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
  
  console.log(bookingError ? `   ❌ ${bookingError.message}` : '   ✅ تم');

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
      content: 'كانت الإقامة ممتازة! المكان نظيف والموقع رائع.',
      rating: 4.5,
      status: 'PUBLISHED',
      is_verified: true
    }, { onConflict: 'id' });
  
  console.log(reviewError ? `   ❌ ${reviewError.message}` : '   ✅ تم');

  // 6. إنشاء review_photo
  console.log('📊 6. إنشاء review_photo...');
  const { error: photoError } = await supabase
    .from('review_photos')
    .upsert({
      id: uuid.photo,
      review_id: uuid.review,
      url: 'https://example.com/review-photo.jpg',
      order: 1
    }, { onConflict: 'id' });
  
  console.log(photoError ? `   ❌ ${photoError.message}` : '   ✅ تم');

  // 7. إنشاء review_reply
  console.log('📊 7. إنشاء review_reply...');
  const { error: replyError } = await supabase
    .from('review_replies')
    .upsert({
      id: uuid.reply,
      review_id: uuid.review,
      author_id: uuid.provider,
      author_name: 'فندق الشام',
      author_role: 'PROVIDER',
      content: 'شكراً لك على تقييمك الرائع!'
    }, { onConflict: 'id' });
  
  console.log(replyError ? `   ❌ ${replyError.message}` : '   ✅ تم');

  // 8. إنشاء topic
  console.log('📊 8. إنشاء topic...');
  const { error: topicError } = await supabase
    .from('topics')
    .upsert({
      id: uuid.topic,
      title: 'أفضل الأماكن للزيارة في دمشق',
      content: 'ما هي أفضل الأماكن التي تنصحون بزيارتها؟',
      author_id: uuid.user1,
      category_id: 'travel_tips'
    }, { onConflict: 'id' });
  
  console.log(topicError ? `   ❌ ${topicError.message}` : '   ✅ تم');

  // التحقق من البيانات
  console.log('\n📊 التحقق من البيانات:');
  
  const { data: reviewCheck } = await supabase
    .from('reviews')
    .select(`id, rating, content, author:profiles!reviews_author_id_fkey(display_name)`)
    .eq('id', uuid.review)
    .single();
  
  if (reviewCheck) {
    console.log('   ✅ Review JOIN يعمل:', reviewCheck);
  }

  const { data: profileCheck } = await supabase
    .from('profiles')
    .select(`id, display_name, reviewer_profile:reviewer_profiles(level, total_reviews)`)
    .eq('id', uuid.user1)
    .single();
  
  if (profileCheck) {
    console.log('   ✅ Profile JOIN يعمل:', profileCheck);
  }

  console.log('\n✅ انتهى بنجاح!');
}

seed().catch(console.error);
