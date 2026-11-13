import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { refreshLoanProjections } from './loanQueryRefresh';

describe('refreshLoanProjections', () => {
  it('marks every affected page stale without invalidating unrelated data', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    const affected = [['staff-loans','a',1],['staff-loans','b',2],['loan-payment-history'],['loan-claim-queue'],['loan-dashboard-current','overview'],['loan-dashboard-current','report'],['loan-customer-detail','id'],['staff-loan-detail','id']];
    for (const key of affected) client.setQueryData(key,{version:1});
    client.setQueryData(['unrelated'],{version:1});
    await refreshLoanProjections(client);
    for (const key of affected) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false);
    client.clear();
  });
});
