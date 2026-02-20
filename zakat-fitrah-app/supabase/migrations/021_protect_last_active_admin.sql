-- Migration 021: Protect last active admin from deactivation/demotion/deletion
-- This is an authoritative DB-level guard for task 10.13.

CREATE OR REPLACE FUNCTION public.prevent_last_active_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_active_admins integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'admin'
       AND OLD.is_active = true
       AND (
         NEW.role <> 'admin'
         OR NEW.is_active = false
       ) THEN
      SELECT COUNT(*)
      INTO remaining_active_admins
      FROM public.users
      WHERE role = 'admin'
        AND is_active = true
        AND id <> OLD.id;

      IF remaining_active_admins = 0 THEN
        RAISE EXCEPTION 'Cannot deactivate or demote the last active admin'
          USING ERRCODE = 'P0001',
                HINT = 'Create or reactivate another admin before changing this account.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' AND OLD.is_active = true THEN
      SELECT COUNT(*)
      INTO remaining_active_admins
      FROM public.users
      WHERE role = 'admin'
        AND is_active = true
        AND id <> OLD.id;

      IF remaining_active_admins = 0 THEN
        RAISE EXCEPTION 'Cannot delete the last active admin'
          USING ERRCODE = 'P0001',
                HINT = 'Create or reactivate another admin before deleting this account.';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_active_admin_update ON public.users;
CREATE TRIGGER trg_prevent_last_active_admin_update
BEFORE UPDATE OF role, is_active ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_active_admin_change();

DROP TRIGGER IF EXISTS trg_prevent_last_active_admin_delete ON public.users;
CREATE TRIGGER trg_prevent_last_active_admin_delete
BEFORE DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_active_admin_change();

COMMENT ON FUNCTION public.prevent_last_active_admin_change()
IS 'Prevents operations that would leave the system with zero active admins.';