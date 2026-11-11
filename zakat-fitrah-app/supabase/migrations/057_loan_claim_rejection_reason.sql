BEGIN;
DROP FUNCTION public.loan_customer_payment_history();
CREATE FUNCTION public.loan_customer_payment_history()
RETURNS TABLE (id UUID, loan_id UUID, payment_date DATE, amount BIGINT, status TEXT, rejection_reason TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.loan_id, p.payment_date, p.amount, p.status,
    CASE WHEN p.status = 'rejected' THEN p.reason ELSE NULL END
  FROM public.loan_payments p JOIN public.loans l ON l.id = p.loan_id
  JOIN public.loan_customers c ON c.id = l.customer_id
  WHERE c.auth_user_id = auth.uid() AND c.is_active AND l.status IN ('active', 'paid');
$$;
REVOKE ALL ON FUNCTION public.loan_customer_payment_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_customer_payment_history() TO authenticated;
COMMIT;
