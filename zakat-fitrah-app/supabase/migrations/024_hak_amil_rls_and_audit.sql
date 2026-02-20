-- Migration 022: RLS and audit logging for hak amil configuration and snapshots
-- Purpose: Enforce role-based access and track all hak_amil_configs changes

-- =========================================
-- RLS ENABLEMENT
-- =========================================

ALTER TABLE public.hak_amil_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hak_amil_snapshots ENABLE ROW LEVEL SECURITY;

-- =========================================
-- HAK_AMIL_CONFIGS POLICIES
-- admin full access, petugas read-only
-- =========================================

DROP POLICY IF EXISTS "hak_amil_configs_select_admin_petugas_active" ON public.hak_amil_configs;
DROP POLICY IF EXISTS "hak_amil_configs_insert_admin_active" ON public.hak_amil_configs;
DROP POLICY IF EXISTS "hak_amil_configs_update_admin_active" ON public.hak_amil_configs;
DROP POLICY IF EXISTS "hak_amil_configs_delete_admin_active" ON public.hak_amil_configs;

CREATE POLICY "hak_amil_configs_select_admin_petugas_active"
  ON public.hak_amil_configs FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "hak_amil_configs_insert_admin_active"
  ON public.hak_amil_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  );

CREATE POLICY "hak_amil_configs_update_admin_active"
  ON public.hak_amil_configs FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  );

CREATE POLICY "hak_amil_configs_delete_admin_active"
  ON public.hak_amil_configs FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  );

-- =========================================
-- HAK_AMIL_SNAPSHOTS POLICIES
-- both admin/petugas can read report data
-- =========================================

DROP POLICY IF EXISTS "hak_amil_snapshots_select_admin_petugas_active" ON public.hak_amil_snapshots;
DROP POLICY IF EXISTS "hak_amil_snapshots_insert_admin_petugas_active" ON public.hak_amil_snapshots;
DROP POLICY IF EXISTS "hak_amil_snapshots_update_admin_active" ON public.hak_amil_snapshots;
DROP POLICY IF EXISTS "hak_amil_snapshots_delete_admin_active" ON public.hak_amil_snapshots;

CREATE POLICY "hak_amil_snapshots_select_admin_petugas_active"
  ON public.hak_amil_snapshots FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "hak_amil_snapshots_insert_admin_petugas_active"
  ON public.hak_amil_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "hak_amil_snapshots_update_admin_active"
  ON public.hak_amil_snapshots FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  );

CREATE POLICY "hak_amil_snapshots_delete_admin_active"
  ON public.hak_amil_snapshots FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() = 'admin'
  );

-- =========================================
-- AUDIT LOG TRIGGER FOR HAK_AMIL_CONFIGS
-- =========================================

CREATE OR REPLACE FUNCTION public.log_hak_amil_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid;
BEGIN
  actor_id := COALESCE(auth.uid(), NEW.updated_by, NEW.created_by, OLD.updated_by, OLD.created_by);

  IF actor_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
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

DROP TRIGGER IF EXISTS trg_log_hak_amil_config_changes ON public.hak_amil_configs;
CREATE TRIGGER trg_log_hak_amil_config_changes
AFTER INSERT OR UPDATE OR DELETE ON public.hak_amil_configs
FOR EACH ROW
EXECUTE FUNCTION public.log_hak_amil_config_changes();

COMMENT ON FUNCTION public.log_hak_amil_config_changes()
IS 'Audit logger for hak_amil_configs changes: stores old/new values, actor, and timestamp via audit_logs.created_at.';
