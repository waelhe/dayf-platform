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

async function testFullFlow() {
  console.log('🧪 اختبار التدفق الكامل عبر API:\n');
  
  const testUserId = generateUUID();
  const bookingId = generateUUID();
  
  // 1. إنشاء profile
  console.log('1️⃣ إنشاء profile...');
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
    console.log('   ❌', profileError.message);
    return;
  }
  console.log('   ✅', profile.id);
  
  // 2. الحصول على service
  const { data: service } = await supabase
    .from('services')
    .select('id, host_id')
    .limit(1)
    .single();
  
  if (!service) {
    console.log('   ❌ لا توجد خدمات');
    return;
  }
  console.log('   ✅ خدمة:', service.id);
  
  // 3. إنشاء booking
  console.log('\n2️⃣ إنشاء booking...');
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
    console.log('   ❌', bookingError.message);
    console.log('   📋 التفاصيل:', bookingError.details);
    console.log('   📋 الرمز:', bookingError.code);
    
    // تنظيف
    await supabase.from('profiles').delete().eq('id', testUserId);
    return;
  }
  console.log('   ✅', booking.id);
  
  // 4. التحقق من audit_logs
  console.log('\n3️⃣ التحقق من audit_logs...');
  const { data: logs, error: logsError } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('record_id', bookingId);
  
  if (logsError) {
    console.log('   ❌', logsError.message);
  } else if (logs && logs.length > 0) {
    console.log('   ✅ وجد', logs.length, 'سجل');
    console.log('   📋 Action:', logs[0].action);
  } else {
    console.log('   ⚠️ لا توجد سجلات audit');
  }
  
  // 5. إنشاء escrow
  console.log('\n4️⃣ إنشاء escrow...');
  const escrowId = generateUUID();
  const { data: escrow, error: escrowError } = await supabase
    .from('escrows')
    .insert({
      id: escrowId,
      buyer_id: testUserId,
      provider_id: service.host_id || testUserId,
      amount: 100,
      platform_fee: 10,
      net_amount: 90,
      currency: 'SYP',
      status: 'PENDING',
      reference_type: 'BOOKING',
      reference_id: bookingId
    })
    .select()
    .single();
  
  if (escrowError) {
    console.log('   ❌', escrowError.message);
    console.log('   📋 الرمز:', escrowError.code);
  } else {
    console.log('   ✅', escrow.id);
  }
  
  // تنظيف
  console.log('\n🧹 تنظيف...');
  if (escrow) await supabase.from('escrows').delete().eq('id', escrow.id);
  await supabase.from('bookings').delete().eq('id', bookingId);
  await supabase.from('profiles').delete().eq('id', testUserId);
  console.log('   ✅ تم');
  
  console.log('\n✅ انتهى الاختبار');
}

testFullFlow().catch(console.error);
