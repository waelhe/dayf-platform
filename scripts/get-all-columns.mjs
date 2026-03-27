import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

async function getColumns() {
  console.log('🔍 الأعمدة الفعلية في reviewer_profiles:\n');
  
  // تجربة كل الأسماء المحتملة
  const allPossibleCols = [
    'id', 'user_id', 'level', 'badges',
    'total_reviews', 'total_helpful', 'helpful_votes', 
    'total_photos', 'total_images', 'photos_count',
    'cities_visited', 'created_at', 'updated_at'
  ];
  
  const foundCols = [];
  
  for (const col of allPossibleCols) {
    const { error } = await supabase
      .from('reviewer_profiles')
      .select(col)
      .limit(1);
    
    if (!error) {
      foundCols.push(col);
      console.log(`   ✅ ${col}`);
    }
  }
  
  console.log(`\n📊 الأعمدة الموجودة: ${foundCols.join(', ')}`);
  
  // الآن نجرب query بكل الأعمدة الصحيحة
  console.log('\n🔍 تجربة JOIN بالأعمدة الصحيحة:');
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      author:profiles!reviews_author_id_fkey(
        id,
        display_name,
        reviewer_profile:reviewer_profiles(
          ${foundCols.filter(c => c !== 'id' && c !== 'user_id').join(', ')}
        )
      )
    `)
    .limit(1);
  
  if (error) {
    console.log(`   ❌ خطأ: ${error.message}`);
  } else {
    console.log(`   ✅ JOIN يعمل!`);
  }
}

getColumns().catch(console.error);
