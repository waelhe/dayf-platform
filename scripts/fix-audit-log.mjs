import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

// هذا الـ SQL يجب تنفيذه يدوياً في Supabase Dashboard
const fixSQL = `
-- إصلاح audit_logs: تغيير changed_by من UUID إلى TEXT
ALTER TABLE audit_logs ALTER COLUMN changed_by TYPE TEXT;

-- تحديث الـ trigger function لاستخدام TEXT
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- محاولة الحصول على user_id من JWT claims
  BEGIN
    v_user_id := current_setting('request.jwt.claims', true)::jsonb->>'sub';
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      NEW.id::TEXT, 
      'INSERT', 
      to_jsonb(NEW), 
      v_user_id,
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
      v_user_id,
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
      v_user_id,
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
`;

console.log('📋 SQL يجب تنفيذه يدوياً في Supabase Dashboard:');
console.log('='.repeat(60));
console.log(fixSQL);
console.log('='.repeat(60));
console.log('\n📌 الخطوات:');
console.log('1. افتح Supabase Dashboard');
console.log('2. اذهب إلى SQL Editor');
console.log('3. انسخ والصق الـ SQL أعلاه');
console.log('4. اضغط Run');
