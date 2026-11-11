BEGIN;
-- A row policy cannot hide private columns such as staff notes. Customers get
-- an explicit projection; staff keep access to the underlying table.
DROP POLICY loans_read ON public.loans;
CREATE POLICY loans_read ON public.loans FOR SELECT TO authenticated USING (public.loan_is_staff());

CREATE FUNCTION public.loan_customer_loans()
RETURNS TABLE (id UUID, loan_number TEXT, status TEXT, principal BIGINT, migration_cutoff DATE, loan_installments JSONB)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id,l.loan_number,l.status,l.principal,l.migration_cutoff,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('due_date',i.due_date,'amount',i.amount,
      'opening_remaining',i.opening_remaining,'installment_number',i.installment_number)
      ORDER BY i.installment_number) FROM public.loan_installments i WHERE i.loan_id=l.id),'[]'::jsonb)
  FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id
  WHERE c.auth_user_id=auth.uid() AND c.is_active AND l.status IN ('active','paid')
  ORDER BY l.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.loan_customer_loans() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_customer_loans() TO authenticated;
COMMIT;
