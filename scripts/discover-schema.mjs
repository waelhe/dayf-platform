import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

async function discoverSchema() {
  console.log('🔍 اكتشاف البنية الفعلية للجداول\n');

  const tables = ['profiles', 'services', 'bookings', 'escrows', 'reviews', 'review_photos', 'topics'];
  
  for (const table of tables) {
    console.log(`\n📊 ${table}:`);
    
    // محاولة إدخال صف فارغ لمعرفة الأعمدة المطلوبة
    const { error } = await supabase
      .from(table)
      .insert({})
      .select()
      .single();
    
    if (error) {
      // استخراج المعلومات من رسالة الخطأ
      const msg = error.message;
      
      // البحث عن الأعمدة المطلوبة
      if (msg.includes('null value')) {
        const match = msg.match(/column "([^"]+)"/);
        if (match) {
          console.log(`   مطلوب: ${match[1]}`);
        }
      }
      
      // البحث عن نوع البيانات
      if (msg.includes('type uuid')) {
        console.log(`   نوع المعرف: UUID`);
      }
      
      // البحث عن الأعمدة غير الموجودة
      if (msg.includes('Could not find')) {
        const match = msg.match(/'([^']+)'/);
        if (match) {
          console.log(`   ❌ عمود غير موجود: ${match[1]}`);
        }
      }
      
      console.log(`   الخطأ: ${msg.substring(0, 100)}...`);
    }
  }

  // فحص بني profiles بالتفصيل
  console.log('\n\n🔍 فحص تفصيلي لـ profiles:');
  const testProfile = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    uid: '550e8400-e29b-41d4-a716-446655440001',
    display_name: 'Test User',
    role: 'USER'
  };
  
  const { error: profileError } = await supabase
    .from('profiles')
    .insert(testProfile)
    .select();
  
  if (profileError) {
    console.log('   خطأ:', profileError.message);
  } else {
    console.log('   ✅ نجح الإدخال');
    // حذف الصف التجريبي
    await supabase.from('profiles').delete().eq('id', testProfile.id);
  }

  // فحص services
  console.log('\n🔍 فحص تفصيلي لـ services:');
  const testService = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Test Service',
    description: 'Test',
    location: 'Test',
    price: 100,
    type: 'apartment',
    amenities: 'wifi,ac',
    features: 'view',
    main_category_id: 'test'
  };
  
  const { error: serviceError } = await supabase
    .from('services')
    .insert(testService)
    .select();
  
  if (serviceError) {
    console.log('   خطأ:', serviceError.message);
  } else {
    console.log('   ✅ نجح الإدخال');
    await supabase.from('services').delete().eq('id', testService.id);
  }

  // فحص bookings
  console.log('\n🔍 فحص تفصيلي لـ bookings:');
  // أولاً نفحص الأعمدة الموجودة
  const { error: bookingError } = await supabase
    .from('bookings')
    .insert({})
    .select();
  
  if (bookingError) {
    console.log('   الخطأ:', bookingError.message);
    
    // استخراج اسم العمود المطلوب
    const match = bookingError.message.match(/column "([^"]+)"/);
    if (match) {
      console.log(`   أول عمود مطلوب: ${match[1]}`);
    }
  }
}

discoverSchema().catch(console.error);
