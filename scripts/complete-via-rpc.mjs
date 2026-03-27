import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🧪 اختبار التدفق الكامل عبر RPC\n');

const uuid = {
  user1: '550e8400-e29b-41d4-a716-446655440001',
  provider: '550e8400-e29b-41d4-a716-446655440003',
  escrow: '550e8400-e29b-41d4-a716-446655440099'  // UUID جديد
};

async function testFullFlow() {
  // 1. الحصول على خدمة موجودة
  console.log('📊 1. البحث عن خدمة...');
  const { data: services } = await supabase
    .from('services')
    .select('id, title, price, host_id')
    .limit(1);
  
  const service = services?.[0];
  if (!service) {
    console.log('   ❌ لا توجد خدمات');
    return;
  }
  console.log(`   ✅ ${service.title} - ${service.price}`);

  // 2. إنشاء escrow مباشرة (بدون trigger)
  console.log('\n📊 2. إنشاء escrow...');
  
  // أولاً نحاول إدخال escrow مباشرة
  const { error: insertError } = await supabase
    .from('escrows')
    .insert({
      id: uuid.escrow,
      buyer_id: uuid.user1,
      provider_id: service.host_id || uuid.provider,
      amount: service.price,
      platform_fee: service.price * 0.05,
      net_amount: service.price * 0.95,
      currency: 'SYP',
      status: 'PENDING',
      reference_type: 'service',
      reference_id: service.id
    });
  
  if (insertError) {
    console.log(`   ⚠️ Insert فشل: ${insertError.message}`);
    
    // نحاول إنشاء escrow عبر طريقة أخرى
    // ربما نحتاج لإنشائه بدون الـ audit trigger
  } else {
    console.log('   ✅ تم إنشاء الضمان!');
  }

  // 3. محاولة تمويل الضمان عبر RPC
  console.log('\n📊 3. تمويل الضمان عبر RPC...');
  
  // نحتاج لـ escrow في حالة PENDING أولاً
  // دعنا نتحقق من escrows الموجودة
  const { data: existingEscrows } = await supabase
    .from('escrows')
    .select('id, status')
    .limit(5);
  
  console.log(`   Escrows موجودة: ${existingEscrows?.length || 0}`);
  
  if (existingEscrows && existingEscrows.length > 0) {
    const pendingEscrow = existingEscrows.find(e => e.status === 'PENDING');
    
    if (pendingEscrow) {
      console.log(`   ✅ وجدت ضمان PENDING: ${pendingEscrow.id}`);
      
      // تمويل الضمان
      const { data: fundResult, error: fundError } = await supabase.rpc('escrow_fund', {
        p_escrow_id: pendingEscrow.id,
        p_buyer_id: uuid.user1,
        p_amount: 100000,
        p_platform_fee: 5000
      });
      
      console.log(fundError ? `   ❌ ${fundError.message}` : `   ✅ نتيجة التمويل: ${JSON.stringify(fundResult)}`);
    }
  }

  // 4. اختبار كامل للتدفق
  console.log('\n📊 4. ملخص البيانات الحالية:');
  
  const { data: profiles } = await supabase.from('profiles').select('id, display_name');
  const { data: reviewerProfiles } = await supabase.from('reviewer_profiles').select('user_id, level');
  const { data: allServices } = await supabase.from('services').select('id, title');
  const { data: topics } = await supabase.from('topics').select('id, title');
  const { data: escrows } = await supabase.from('escrows').select('id, status');
  const { data: bookings } = await supabase.from('bookings').select('id');
  const { data: reviews } = await supabase.from('reviews').select('id');
  
  console.log(`
   👤 المستخدمون: ${profiles?.length || 0}
   ⭐ ملفات المراجعين: ${reviewerProfiles?.length || 0}
   🏨 الخدمات: ${allServices?.length || 0}
   💬 المواضيع: ${topics?.length || 0}
   💰 الضمانات: ${escrows?.length || 0}
   📅 الحجوزات: ${bookings?.length || 0}
   📝 المراجعات: ${reviews?.length || 0}
  `);

  // 5. اختبار JOIN الكامل للمستخدم
  console.log('📊 5. اختبار JOIN للمستخدم:');
  const { data: userJoin } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      role,
      reviewer_profile:reviewer_profiles(
        level,
        total_reviews,
        helpful_votes,
        badges
      )
    `)
    .eq('id', uuid.user1)
    .single();
  
  if (userJoin) {
    console.log('   ✅ JOIN يعمل!');
    console.log(JSON.stringify(userJoin, null, 2));
  }

  console.log('\n✅ انتهى الاختبار');
}

testFullFlow().catch(console.error);
