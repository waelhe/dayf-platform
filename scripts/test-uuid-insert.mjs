import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testUUIDInsert() {
  console.log('🧪 اختبار إدخال بـ UUID صحيح:\n');
  
  const testData = {
    table_name: 'test_table',
    record_id: generateUUID(),  // UUID صحيح
    action: 'INSERT',
    new_values: { test: true },
    changed_by: null,
    ip_address: null,
    user_agent: null
  };
  
  console.log('📝 البيانات:', testData);
  
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(testData)
    .select()
    .single();
  
  if (error) {
    console.log('❌ خطأ:', error.message);
  } else {
    console.log('✅ تم الإدخال بنجاح!');
    console.log('   ID:', data.id);
    
    // Clean up
    await supabase.from('audit_logs').delete().eq('id', data.id);
    console.log('✅ تم الحذف');
  }
  
  // الآن نختبر إنشاء booking
  console.log('\n🧪 اختبار إنشاء booking:\n');
  
  // إنشاء profile أولاً
  const testUserId = generateUUID();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      uid: testUserId,
      display_name: 'مستخدم اختبار'
    })
    .select()
    .single();
  
  if (profileError) {
    console.log('❌ خطأ إنشاء profile:', profileError.message);
    return;
  }
  console.log('✅ تم إنشاء profile:', profile.id);
  
  // الحصول على service
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .limit(1)
    .single();
  
  if (!service) {
    console.log('❌ لا توجد خدمات');
    return;
  }
  console.log('✅ خدمة:', service.id);
  
  // محاولة إنشاء booking
  const bookingId = generateUUID();
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      id: bookingId,
      user_id: testUserId,
      service_id: service.id,
      check_in: new Date().toISOString(),
      check_out: new Date(Date.now() + 86400000).toISOString(),
      guests: 2,
      total_price: 100,
      status: 'PENDING'
    })
    .select()
    .single();
  
  if (bookingError) {
    console.log('❌ خطأ إنشاء booking:', bookingError.message);
    console.log('   التفاصيل:', bookingError.details);
  } else {
    console.log('✅ تم إنشاء booking:', booking.id);
    
    // Clean up
    await supabase.from('bookings').delete().eq('id', booking.id);
    await supabase.from('profiles').delete().eq('id', testUserId);
    console.log('✅ تم تنظيف البيانات التجريبية');
  }
}

testUUIDInsert().catch(console.error);
