import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqzpxxsrdcdgimiimbqx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 فحص الأعمدة الفعلية\n');

  // إدخال صف تجريبي لمعرفة الأعمدة
  console.log('📊 محاولة إدخال صف تجريبي في reviewer_profiles:');
  
  // أولاً نحتاج profile
  const { data: profile } = await supabase
    .from('profiles')
    .insert({ 
      id: 'test-' + Date.now(),
      display_name: 'Test User'
    })
    .select()
    .single();

  if (profile) {
    console.log('   ✅ تم إنشاء profile تجريبي');
    
    // محاولة إدخال reviewer_profile
    const { data, error } = await supabase
      .from('reviewer_profiles')
      .insert({
        user_id: profile.id,
        level: 'NEW_REVIEWER'
      })
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ خطأ: ${error.message}`);
      console.log(`   التفاصيل: ${JSON.stringify(error.details)}`);
    } else {
      console.log('   ✅ تم الإدخال، الأعمدة:');
      Object.keys(data).forEach(k => console.log(`   - ${k}`));
      
      // حذف البيانات التجريبية
      await supabase.from('reviewer_profiles').delete().eq('user_id', profile.id);
    }
    
    // حذف profile التجريبي
    await supabase.from('profiles').delete().eq('id', profile.id);
  }

  // محاولة أخرى: استعلام بأعمدة مختلفة
  console.log('\n📊 تجربة أسماء أعمدة مختلفة:');
  
  const columnTests = [
    ['total_helpful'],
    ['helpful_votes'],
    ['total_votes'],
    ['helpful_count'],
    ['level', 'badges', 'total_reviews', 'total_photos']
  ];

  for (const cols of columnTests) {
    const { data, error } = await supabase
      .from('reviewer_profiles')
      .select(cols.join(', '))
      .limit(1);
    
    if (error) {
      console.log(`   ❌ ${cols.join(', ')}: ${error.message.split('\n')[0]}`);
    } else {
      console.log(`   ✅ ${cols.join(', ')}: يعمل!`);
    }
  }

  // فحص FK
  console.log('\n📊 فحص FK عبر محاولة إدخال بيانات خاطئة:');
  const { error: fkError } = await supabase
    .from('reviewer_profiles')
    .insert({
      user_id: 'non-existent-id-12345',
      level: 'NEW_REVIEWER'
    })
    .select()
    .single();
  
  if (fkError) {
    if (fkError.message.includes('foreign key') || fkError.message.includes('violates')) {
      console.log('   ✅ FK موجود - تم رفض الإدخال بمعرف غير موجود');
      console.log(`   الرسالة: ${fkError.message}`);
    } else {
      console.log(`   ⚠️ خطأ آخر: ${fkError.message}`);
    }
  } else {
    console.log('   ❌ لا يوجد FK - تم قبول معرف غير موجود!');
  }
}

checkColumns().catch(console.error);
