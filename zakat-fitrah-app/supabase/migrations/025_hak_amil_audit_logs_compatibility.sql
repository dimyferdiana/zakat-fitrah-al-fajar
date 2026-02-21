-- =========================================
-- HAK AMIL AUDIT LOGS COMPATIBILITY PATCH
-- =========================================
-- Fixes production environments where audit_logs was created without old_data/new_data columns.

BEGIN;

-- Ensure expected audit columns exist for hak amil trigger inserts
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS old_data JSONB,
  ADD COLUMN IF NOT EXISTS new_data JSONB;

-- Recreate trigger function with safer actor resolution per operation
CREATE OR REPLACE FUNCTION public.log_hak_amil_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    actor_id := COALESCE(auth.uid(), NEW.updated_by, NEW.created_by);

    IF actor_id IS NULL THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      actor_id,
      'INSERT_HAK_AMIL_CONFIG',
      'hak_amil_configs',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    actor_id := COALESCE(auth.uid(), NEW.updated_by, NEW.created_by, OLD.updated_by, OLD.created_by);

    IF actor_id IS NULL THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      actor_id,
      'UPDATE_HAK_AMIL_CONFIG',
      'hak_amil_configs',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    actor_id := COALESCE(auth.uid(), OLD.updated_by, OLD.created_by);

    IF actor_id IS NULL THEN
      RETURN OLD;
    END IF;

    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      actor_id,
      'DELETE_HAK_AMIL_CONFIG',
      'hak_amil_configs',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMIT;
