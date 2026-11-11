import { loanPosition, type LoanPosition } from './loanCalculations';

export interface ReportLoan {
  id: string; number: string; customer_id: string; name: string; category_id: string | null; category: string; purpose: string;
  principal: number; status: 'draft' | 'active' | 'paid' | 'cancelled' | 'needs_reconciliation'; disbursement_date: string | null;
  region: { rt?: string | null; rw?: string | null; alamat?: string | null } | null;
  migration_cutoff: string | null; opening_balance: number | null; historical_incomplete: boolean;
  disbursement: { date: string; amount: number } | null;
  installments: { dueDate: string; amount: number; opening_remaining: number | null }[];
  payments: { id: string; date: string; amount: number; status: 'confirmed' | 'pending' | 'rejected' | 'cancelled' }[];
  followups: { promise_date: string | null; promise_amount: number | null; next_followup_date: string | null }[];
  has_contract: boolean;
}
export interface ReportFilters { from: string; to: string; asOf: string; category: string; customer: string; region: string; status: string; }
export interface ReportRow { loan: ReportLoan; position: LoanPosition | null; positionStatus: string; incomplete: boolean; disbursed: number; paid: number; region: string; }
export interface ReportGroup { key: string; loans: number; customers: number; disbursed: number; paid: number; remaining: number; overdue: number; incomplete: number; }

export function regionLabel(region: ReportLoan['region']): string {
  const rt = region?.rt?.trim(), rw = region?.rw?.trim();
  if (!rt && !rw) return 'Wilayah belum diisi';
  return `RT ${rt || '-'} / RW ${rw || '-'}`;
}
export function reportRows(loans: ReportLoan[], filter: ReportFilters): ReportRow[] {
  return loans.flatMap(loan => {
    const region = regionLabel(loan.region);
    if ((filter.category && loan.category_id !== filter.category) || (filter.customer && !`${loan.name} ${loan.number}`.toLocaleLowerCase('id-ID').includes(filter.customer.toLocaleLowerCase('id-ID'))) || (filter.region && region !== filter.region)) return [];
    const hasStarted = !!loan.disbursement_date && loan.disbursement_date <= filter.asOf;
    const unknownDate = !!loan.migration_cutoff && !loan.disbursement_date;
    let position: LoanPosition | null = null;
    const schedule = loan.installments.map(i => ({ dueDate: i.dueDate, amount: Number(i.amount) }));
    const validOpening = !loan.migration_cutoff || (loan.opening_balance !== null && loan.installments.every(i => i.opening_remaining !== null) && loan.installments.reduce((sum,i) => sum + Number(i.opening_remaining),0) === Number(loan.opening_balance));
    const validPrincipal = schedule.reduce((sum,i) => sum + i.amount,0) === Number(loan.principal);
    if ((hasStarted || unknownDate) && loan.status !== 'draft' && loan.status !== 'cancelled' && schedule.length && validOpening && validPrincipal && (!loan.migration_cutoff || loan.migration_cutoff <= filter.asOf)) {
      try {
        position = loanPosition(schedule,loan.payments.filter(p => !loan.migration_cutoff || p.date > loan.migration_cutoff).map(p => ({ ...p, amount:Number(p.amount) })),filter.asOf,
          loan.migration_cutoff ? loan.installments.map(i => Number(i.opening_remaining)) : undefined);
      } catch { position = null; }
    }
    const incomplete = loan.status !== 'draft' && loan.status !== 'cancelled' && (hasStarted || unknownDate) && !position;
    const positionStatus = loan.status === 'draft' ? 'draft' : loan.status === 'cancelled' ? 'cancelled' : !hasStarted && !unknownDate ? 'belum_dicairkan' : incomplete ? 'perlu_rekonsiliasi' : position!.remaining > 0 ? 'active' : 'paid';
    if (filter.status && filter.status !== positionStatus) return [];
    const disbursed = loan.disbursement && loan.disbursement.date >= filter.from && loan.disbursement.date <= filter.to ? Number(loan.disbursement.amount) : 0;
    const paid = loan.payments.filter(p => p.status === 'confirmed' && p.date >= filter.from && p.date <= filter.to).reduce((sum,p) => sum + Number(p.amount),0);
    return [{loan,position,positionStatus,incomplete,disbursed,paid,region}];
  });
}
export function groupReport(rows: ReportRow[], key: (row: ReportRow) => string): ReportGroup[] {
  const groups = new Map<string, { item: ReportGroup; ids: Set<string> }>();
  for (const row of rows) {
    const name = key(row); const current = groups.get(name) ?? { item:{key:name,loans:0,customers:0,disbursed:0,paid:0,remaining:0,overdue:0,incomplete:0}, ids:new Set<string>() };
    current.item.loans++; current.ids.add(row.loan.customer_id); current.item.disbursed += row.disbursed; current.item.paid += row.paid;
    current.item.remaining += row.position?.remaining ?? 0; current.item.overdue += row.position?.overdue ?? 0; current.item.incomplete += Number(row.incomplete);
    groups.set(name,current);
  }
  return [...groups.values()].map(({item,ids}) => ({...item,customers:ids.size})).sort((a,b) => b.remaining-a.remaining || a.key.localeCompare(b.key));
}
export function csvCell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  const first = [...text].find(char => char.charCodeAt(0) > 32 && char.charCodeAt(0) !== 0xfeff);
  if (first && '=+-@'.includes(first)) text = `'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}
export function reportCsv(headers: string[], rows: (string | number | null)[][]): string {
  return '\uFEFF' + [headers,...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
