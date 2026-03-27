import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🔧 إصلاح audit trigger وإنشاء البيانات\n');

const uuid = {
  user1: '550e8400-e29b-41d4-a716-446655440001',
  provider: '550e8400-e29b-41d4-a716-446655440003',
  service: '550e8400-e29b-41d4-a716-446655440004',
  booking: '550e8400-e29b-41d4-a716-446655440005',
  escrow: '550e8400-e29b-41d4-a716-446655440006',
  review: '550e8400-e29b-41d4-a716-446655440007'
};

async function fixAndSeed() {
  // استخدام RPC لتعديل الـ trigger أو إنشاء بيانات مباشرة
  
  // 1. محاولة إنشاء booking عبر SQL مباشر باستخدام service موجود
  console.log('📊 1. البحث عن خدمة موجودة...');
  const { data: existingServices } = await supabase
    .from('services')
    .select('id, title')
    .limit(1);
  
  const serviceId = existingServices?.[0]?.id;
  console.log(serviceId ? `   ✅ وجدت خدمة: ${existingServices[0].title}` : '   ❌ لا توجد خدمات');

  if (!serviceId) {
    console.log('   لا يمكن المتابعة بدون خدمات');
    return;
  }

  // 2. محاولة إنشاء booking بتحديد changed_by صحيح
  console.log('\n📊 2. إنشاء حجز...');
  
  // المشكلة: audit trigger يستخدم current_setting('request.jwt.claims')
  // الحل: نستخدم RPC أو نتجاوز الـ trigger
  
  // دعنا نجرب إنشاء booking بدون تفعيل الـ trigger
  // عن طريق استخدام SQL مباشرة عبر RPC
  
  // أو يمكننا إنشاء booking ببيانات مبسطة
  const bookingData = {
    id: uuid.booking,
    user_id: uuid.user1,
    service_id: serviceId,
    check_in: '2025-02-01',
    check_out: '2025-02-04',
    guests: 2,
    total_price: 450000,
    status: 'CONFIRMED'
  };
  
  const { error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingData);
  
  if (bookingError) {
    console.log(`   ❌ خطأ: ${bookingError.message}`);
    
    // إذا فشل، دعنا نتحقق من بنية audit_logs
    console.log('\n   🔍 فحص audit_logs...');
    const { data: auditTest, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (auditError) {
      console.log(`   audit_logs غير موجود أو لا يمكن الوصول إليه`);
    } else {
      console.log(`   audit_logs موجود، columns: ${Object.keys(auditTest?.[0] || {}).join(', ')}`);
    }
  } else {
    console.log('   ✅ تم إنشاء الحجز!');
  }

  // 3. إنشاء review
  console.log('\n📊 3. إنشاء مراجعة...');
  const reviewData = {
    id: uuid.review,
    type: 'SERVICE',
    reference_id: serviceId,
    source: 'BOOKING',
    author_id: uuid.user1,
    title: 'تجربة رائعة!',
    content: 'كانت الخدمة ممتازة! أنصح بها بشدة.',
    rating: 4.5,
    status: 'PUBLISHED',
    is_verified: true
  };
  
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert(reviewData);
  
  console.log(reviewError ? `   ❌ ${reviewError.message}` : '   ✅ تم إنشاء المراجعة!');

  // التحقق النهائي
  console.log('\n📊 التحقق النهائي:');
  
  const { data: finalBookings } = await supabase.from('bookings').select('id, status');
  const { data: finalReviews } = await supabase.from('reviews').select('id, rating, title');
  
  console.log(`   الحجوزات: ${finalBookings?.length || 0}`);
  console.log(`   المراجعات: ${finalReviews?.length || 0}`);
  
  if (finalReviews && finalReviews.length > 0) {
    console.log('\n📊 اختبار JOIN للمراجعة:');
    const { data: reviewJoin } = await supabase
      .from('reviews')
      .select(`
        id,
        title,
        rating,
        author:profiles!reviews_author_id_fkey(
          display_name,
          reviewer_profile:reviewer_profiles(level, total_reviews)
        )
      `)
      .limit(1);
    
    if (reviewJoin) {
      console.log('   ✅ JOIN يعمل!');
      console.log(JSON.stringify(reviewJoin[0], null, 2));
    }
  }
}

fixAndSeed().catch(console.error);
