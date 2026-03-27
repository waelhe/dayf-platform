-- تعديل audit trigger لقبول NULL أو UUID صحيح

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      NEW.id, 
      'INSERT', 
      to_jsonb(NEW),
      CASE 
        WHEN current_setting('request.jwt.claims', true)::jsonb->>'sub' IS NOT NULL 
        THEN (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
        ELSE NULL
      END,
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      NEW.id, 
      'UPDATE', 
      to_jsonb(OLD), 
      to_jsonb(NEW),
      CASE 
        WHEN current_setting('request.jwt.claims', true)::jsonb->>'sub' IS NOT NULL 
        THEN (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
        ELSE NULL
      END,
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
    VALUES (
      TG_TABLE_NAME, 
      OLD.id, 
      'DELETE', 
      to_jsonb(OLD),
      CASE 
        WHEN current_setting('request.jwt.claims', true)::jsonb->>'sub' IS NOT NULL 
        THEN (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
        ELSE NULL
      END,
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
