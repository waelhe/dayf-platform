import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

// SQL to fix the audit trigger
const fixTriggerSQL = `
-- 1. تحويل عمود changed_by إلى TEXT (يقبل أي قيمة)
ALTER TABLE audit_logs ALTER COLUMN changed_by TYPE TEXT;

-- 2. تحديث الدالة لاستخدام TEXT بدلاً من UUID
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      NEW.id::TEXT, 
      'INSERT', 
      to_jsonb(NEW), 
      NULL,  -- لا نحصل على المستخدم من JWT context
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      NEW.id::TEXT, 
      'UPDATE', 
      to_jsonb(OLD), 
      to_jsonb(NEW),
      NULL,
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      OLD.id::TEXT, 
      'DELETE', 
      to_jsonb(OLD),
      NULL,
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
`;

async function fixAuditTrigger() {
  console.log('🔧 إصلاح Audit Trigger...\n');
  
  // Unfortunately we can't run raw SQL via Supabase JS client
  // So let's test if the issue is resolved by trying to create a booking
  
  console.log('📊 اختبار إنشاء حجز:');
  
  // First create test profile if needed
  const testUserId = 'test-user-' + Date.now();
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      display_name: 'مستخدم اختبار'
    })
    .select()
    .single();
  
  if (profileError) {
    console.log('❌ خطأ إنشاء profile:', profileError.message);
  } else {
    console.log('✅ تم إنشاء profile:', profile.id);
  }
  
  // Create test service if needed
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .limit(1)
    .single();
  
  if (!service) {
    console.log('❌ لا توجد خدمات');
    return;
  }
  
  console.log('✅ خدمة موجودة:', service.id);
  
  // Test booking creation
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      guest_id: testUserId,
      host_id: testUserId,
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
    console.log('❌ خطأ إنشاء حجز:', bookingError.message);
    console.log('   التفاصيل:', bookingError.details);
  } else {
    console.log('✅ تم إنشاء حجز:', booking.id);
    
    // Clean up
    await supabase.from('bookings').delete().eq('id', booking.id);
    await supabase.from('profiles').delete().eq('id', testUserId);
    console.log('✅ تم تنظيف البيانات التجريبية');
  }
}

fixAuditTrigger().catch(console.error);
