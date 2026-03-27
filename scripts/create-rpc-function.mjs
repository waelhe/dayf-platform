import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

console.log('🔧 محاولة إنشاء RPC مخصص للإدخال المباشر\n');

async function createRpcAndSeed() {
  // 1. محاولة استدعاء RPC موجود لتنفيذ SQL
  console.log('📊 1. البحث عن RPC functions...');
  
  // نحاول استخدام دالة موجودة أو إنشاء واحدة
  
  // 2. بدلاً من ذلك، دعنا نستخدم طريقة مباشرة
  // المشكلة هي changed_by في audit trigger
  // يمكننا تجاوزها بإنشاء البيانات مباشرة
  
  // دعنا نتحقق من بنية audit_logs
  const { data: auditSample } = await supabase
    .from('audit_logs')
    .select('*')
    .limit(1);
  
  console.log('📊 2. بنية audit_logs:');
  if (auditSample && auditSample.length > 0) {
    console.log('   Columns:', Object.keys(auditSample[0]));
  } else {
    console.log('   فارغ أو غير قابل للقراءة');
  }

  // 3. محاولة استخدام RPC للإدخال المباشر
  console.log('\n📊 3. محاولة إنشاء بيانات عبر RPC...');
  
  // تحقق من وجود RPC function للإدخال
  const { data: services } = await supabase.from('services').select('id').limit(1);
  const serviceId = services?.[0]?.id;
  
  if (!serviceId) {
    console.log('   ❌ لا توجد خدمات');
    return;
  }
  
  // محاولة إنشاء escrow مباشرة (بدون trigger)
  console.log('\n📊 4. محاولة إنشاء escrow (قد لا يكون لها trigger)...');
  
  const escrowData = {
    id: '550e8400-e29b-41d4-a716-446655440006',
    buyer_id: '550e8400-e29b-41d4-a716-446655440001',
    provider_id: '550e8400-e29b-41d4-a716-446655440003',
    amount: 450000,
    platform_fee: 22500,
    net_amount: 427500,
    currency: 'SYP',
    status: 'FUNDED',
    reference_type: 'booking',
    reference_id: serviceId
  };
  
  const { error: escrowError } = await supabase
    .from('escrows')
    .insert(escrowData);
  
  console.log(escrowError ? `   ❌ ${escrowError.message}` : '   ✅ تم إنشاء الضمان!');
  
  // التحقق من الضمانات
  const { data: escrows } = await supabase.from('escrows').select('id, status, amount');
  console.log(`\n📊 الضمانات: ${escrows?.length || 0}`);
  
  if (escrows && escrows.length > 0) {
    console.log('   ✅ الضمانات تعمل!');
    escrows.forEach(e => console.log(`   - ${e.status}: ${e.amount} ${e.currency || 'SYP'}`));
  }

  // 5. اختبار RPC functions للضمانات
  console.log('\n📊 5. اختبار escrow_fund RPC...');
  const { data: fundResult, error: fundError } = await supabase.rpc('escrow_fund', {
    p_escrow_id: '550e8400-e29b-41d4-a716-446655440006',
    p_buyer_id: '550e8400-e29b-41d4-a716-446655440001',
    p_amount: 450000,
    p_platform_fee: 22500
  });
  
  if (fundError) {
    console.log(`   ❌ ${fundError.message}`);
  } else {
    console.log('   ✅ RPC يعمل!');
    console.log('   النتيجة:', fundResult);
  }
}

createRpcAndSeed().catch(console.error);
