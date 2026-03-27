import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

async function testDirectInsert() {
  console.log('🧪 اختبار إدخال مباشر في audit_logs:\n');
  
  const testData = {
    table_name: 'test_table',
    record_id: 'test-record-' + Date.now(),
    action: 'INSERT',
    new_values: { test: true },
    changed_by: null,  // NULL صريح
    ip_address: null,
    user_agent: null
  };
  
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(testData)
    .select()
    .single();
  
  if (error) {
    console.log('❌ خطأ:', error.message);
    console.log('   التفاصيل:', error.details);
    console.log('   الرمز:', error.code);
  } else {
    console.log('✅ تم الإدخال بنجاح!');
    console.log('   ID:', data.id);
    
    // Clean up
    await supabase.from('audit_logs').delete().eq('id', data.id);
    console.log('✅ تم الحذف');
  }
}

testDirectInsert().catch(console.error);
