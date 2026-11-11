import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PersonIdentityDialog } from './PersonIdentityDialog';
import type { MuzakkiMaster } from '@/hooks/useMuzakki';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: 'ok', error: null })), success: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

const person: MuzakkiMaster = { id: 'person-1', nama_kk: 'Nama Lama', alamat: 'Alamat', no_telp: null,
  nik: null, rt: null, rw: null, jenis_kelamin: null, tanggal_lahir: null, keterangan: null, user_id: null,
  jenis_identitas: 'belum_diverifikasi', identitas_terverifikasi: false, aktif: true };

describe('person identity verification', () => {
  let root: Root;
  let container: HTMLDivElement;
  let queryClient: QueryClient;
  const onClose = vi.fn();
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.clearAllMocks();
    container = document.createElement('div'); document.body.append(container);
    root = createRoot(container); queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });
  afterEach(async () => { await act(async () => { root.unmount(); }); queryClient.clear(); container.remove(); });

  it('verifies the selected existing person by ID', async () => {
    await act(async () => { root.render(<QueryClientProvider client={queryClient}><PersonIdentityDialog person={person} onClose={onClose} /></QueryClientProvider>); });
    const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes('Konfirmasi sebagai individu'));
    expect(button).toBeDefined();
    await act(async () => { button!.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(mocks.rpc).toHaveBeenCalledWith('loan_confirm_individual', { p_person_id: 'person-1', p_name: 'Nama Lama' });
  });

  it('marks a household without creating or moving a family member', async () => {
    await act(async () => { root.render(<QueryClientProvider client={queryClient}><PersonIdentityDialog person={person} onClose={onClose} /></QueryClientProvider>); });
    const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes('Konfirmasi sebagai rumah tangga'));
    expect(button).toBeDefined();
    await act(async () => { button!.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith('person_confirm_household', { p_person_id: 'person-1' });
  });
});
