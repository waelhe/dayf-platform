import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🔍 فحص هيكل bookings و reviews\n');

// فحص أعمدة bookings
console.log('📊 أعمدة bookings:');
const { error: bookError } = await supabase
  .from('bookings')
  .select('*')
  .limit(0);

if (bookError) {
  console.log('  الخطأ:', bookError.message);
} else {
  console.log('  الجدول قابل للقراءة');
}

// فحص أعمدة reviews
console.log('\n📊 أعمدة reviews:');
const { data: revCols, error: revError } = await supabase
  .from('reviews')
  .select('id, type, reference_id, author_id, title, content, rating, status')
  .limit(0);

console.log(revError ? `  الخطأ: ${revError.message}` : '  الجدول قابل للقراءة');

// محاولة إدخال بيانات بدون الأعمدة المتسببة في المشكلة
console.log('\n📊 محاولة إنشاء booking بدون trigger...');

// نحتاج لتعطيل الـ trigger أو إدخال البيانات بطريقة أخرى
// دعنا نجرب RPC أو SQL مباشرة

// بدلاً من ذلك، دعنا نتحقق من البيانات الموجودة
console.log('\n📊 البيانات الموجودة حالياً:');

const { data: profiles } = await supabase.from('profiles').select('id, display_name');
console.log(`Profiles: ${profiles?.length || 0}`);

const { data: services } = await supabase.from('services').select('id, title');
console.log(`Services: ${services?.length || 0}`);

const { data: topics } = await supabase.from('topics').select('id, title');
console.log(`Topics: ${topics?.length || 0}`);

const { data: reviewerProfiles } = await supabase.from('reviewer_profiles').select('user_id, level');
console.log(`Reviewer Profiles: ${reviewerProfiles?.length || 0}`);

// اختبار JOIN كامل
console.log('\n📊 اختبار JOIN الكامل:');
const { data: fullJoin, error: joinError } = await supabase
  .from('profiles')
  .select(`
    id,
    display_name,
    reviewer_profile:reviewer_profiles(
      level,
      total_reviews,
      helpful_votes,
      badges
    )
  `)
  .eq('id', '550e8400-e29b-41d4-a716-446655440001')
  .single();

if (joinError) {
  console.log('  ❌ خطأ:', joinError.message);
} else {
  console.log('  ✅ JOIN يعمل!');
  console.log('  البيانات:', JSON.stringify(fullJoin, null, 2));
}

console.log('\n✅ انتهى');
