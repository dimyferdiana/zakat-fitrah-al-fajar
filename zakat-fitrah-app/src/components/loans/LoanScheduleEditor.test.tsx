import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoanScheduleEditor } from './LoanScheduleEditor';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ error: null })), success: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

describe('LoanScheduleEditor', () => {
  let root: Root; let container: HTMLDivElement; let query: QueryClient;
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.clearAllMocks();
    container = document.createElement('div'); document.body.append(container);
    root = createRoot(container); query = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });
  afterEach(async () => { await act(async () => root.unmount()); query.clear(); container.remove(); });
  it('requires review before saving the exact schedule', async () => {
    await act(async () => root.render(<QueryClientProvider client={query}><LoanScheduleEditor loanId="loan" principal={1000} plannedDate="2026-01-01" schedule={[{ dueDate:'2026-01-08',amount:500 },{ dueDate:'2026-02-08',amount:500 }]} /></QueryClientProvider>));
    const button = (text: string) => [...container.querySelectorAll('button')].find(item => item.textContent === text)!;
    expect(button('Simpan jadwal').disabled).toBe(true);
    await act(async () => button('Tinjau perubahan').click());
    expect(button('Simpan jadwal').disabled).toBe(false);
    await act(async () => { button('Simpan jadwal').click(); await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(mocks.rpc).toHaveBeenCalledWith('loan_update_draft_schedule',{ p_loan:'loan',p_schedule:[{dueDate:'2026-01-08',amount:500},{dueDate:'2026-02-08',amount:500}] });
  });
  it('blocks review when the schedule does not match the principal', async () => {
    await act(async () => root.render(<QueryClientProvider client={query}><LoanScheduleEditor loanId="loan" principal={1000} plannedDate="2026-01-01" schedule={[{ dueDate:'2026-01-08',amount:999 }]} /></QueryClientProvider>));
    const button = [...container.querySelectorAll('button')].find(item => item.textContent === 'Tinjau perubahan')!;
    await act(async () => button.click());
    expect(mocks.error).toHaveBeenCalledWith('Jumlah angsuran harus sama dengan pokok');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
