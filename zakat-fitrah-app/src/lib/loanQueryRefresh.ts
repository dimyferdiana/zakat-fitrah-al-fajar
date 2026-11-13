import type { QueryClient } from '@tanstack/react-query';

// Active projections refetch and inactive pages become stale after mutations.
const keys = new Set(['staff-loans','staff-loan-detail','staff-loan-selected','loan-customers-page','loan-customer-detail','loan-customer-loans','loan-customer-account-status','loan-customer-obligations','loan-payment-history','loan-payment-picker','loan-claim-queue','loan-claim-documents','loan-dashboard-current','loan-collectibility-status','loan-customer-collectibility','customer-loans','customer-portal-profile','loan-followups','loan-draft-controls','loan-draft-readiness']);
export function refreshLoanProjections(client: QueryClient) {
  return client.invalidateQueries({ predicate: query => typeof query.queryKey[0] === 'string' && keys.has(query.queryKey[0]) });
}
