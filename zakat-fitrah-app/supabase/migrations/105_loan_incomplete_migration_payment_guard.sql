BEGIN;
-- A correction may reopen an ordinary loan as needs_reconciliation. This
-- validation applies only to loans that actually have a migration cutoff.
CREATE FUNCTION public.loan_guard_migrated_payment() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_cutoff DATE; v_balance BIGINT; v_count BIGINT; v_unknown BIGINT; v_total NUMERIC;
BEGIN
  IF NEW.status NOT IN ('pending','confirmed') THEN RETURN NEW; END IF;
  SELECT migration_cutoff,opening_balance INTO v_cutoff,v_balance FROM public.loans WHERE id=NEW.loan_id;
  -- Records at or before the cutoff are historical and do not affect the
  -- opening balance. Their correction is handled by the migration workflow.
  IF v_cutoff IS NULL OR NEW.payment_date<=v_cutoff THEN RETURN NEW; END IF;
  SELECT count(*),count(*) FILTER (WHERE opening_remaining IS NULL),sum(opening_remaining)
    INTO v_count,v_unknown,v_total FROM public.loan_installments WHERE loan_id=NEW.loan_id;
  IF v_balance IS NULL OR v_count=0 OR v_unknown>0 OR v_total IS DISTINCT FROM v_balance::numeric THEN
    RAISE EXCEPTION 'Saldo dan jadwal awal migrasi belum lengkap atau belum cocok' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER loan_guard_migrated_payment BEFORE INSERT OR UPDATE OF status ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.loan_guard_migrated_payment();
REVOKE ALL ON FUNCTION public.loan_guard_migrated_payment() FROM PUBLIC,anon,authenticated;
COMMIT;
