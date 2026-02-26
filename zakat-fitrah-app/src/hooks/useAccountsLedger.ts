import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type {
  Account,
  AccountChannel,
  AccountLedgerEntry,
  AccountLedgerEntryType,
  Json,
} from '@/types/database.types';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
const OFFLINE_MUTATION_ERROR = 'Mode offline belum mendukung perubahan data akun/ledger.';

function throwOfflineMutationError(): never {
  throw new Error(OFFLINE_MUTATION_ERROR);
}

export interface AccountsListFilters {
  is_active?: boolean;
  account_channel?: AccountChannel | 'semua';
}

export interface AccountLedgerFilters {
  entry_type?: AccountLedgerEntryType | 'semua';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateAccountInput {
  account_name: string;
  account_channel: AccountChannel;
  is_active?: boolean;
  metadata?: Json;
  sort_order?: number;
}

export interface UpdateAccountInput {
  id: string;
  account_name?: string;
  account_channel?: AccountChannel;
  is_active?: boolean;
  metadata?: Json;
  sort_order?: number;
}

export interface CreateManualLedgerEntryInput {
  account_id: string;
  entry_type: AccountLedgerEntryType;
  amount_rp: number;
  entry_date?: string;
  effective_at?: string;
  notes?: string;
  reference_no?: string;
  manual_reconciliation_ref?: string;
}

export function useAccountsList(filters?: AccountsListFilters) {
  return useQuery({
    queryKey: ['accounts-list', filters],
    queryFn: async (): Promise<Account[]> => {
      if (OFFLINE_MODE) return [];

      let query = supabase
        .from('accounts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('account_name', { ascending: true });

      if (typeof filters?.is_active === 'boolean') {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.account_channel && filters.account_channel !== 'semua') {
        query = query.eq('account_channel', filters.account_channel);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as Account[];
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      if (OFFLINE_MODE) {
        throwOfflineMutationError();
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const payload = {
        ...input,
        metadata: input.metadata ?? {},
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase.from('accounts').insert as any)(payload)
        .select('*')
        .single();

      if (error) throw error;

      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      toast.success('Akun berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan akun');
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAccountInput) => {
      if (OFFLINE_MODE) {
        throwOfflineMutationError();
      }

      const { id, ...updateData } = input;
      const payload = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase
        .from('accounts')
        .update as any)(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      toast.success('Akun berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui akun');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      if (OFFLINE_MODE) {
        throwOfflineMutationError();
      }

      const { count, error: countError } = await supabase
        .from('account_ledger_entries')
        .select('id', { head: true, count: 'exact' })
        .eq('account_id', accountId);

      if (countError) throw countError;
      if ((count || 0) > 0) {
        throw new Error('Akun tidak dapat dihapus karena sudah memiliki entri ledger.');
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      return accountId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      toast.success('Akun berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus akun');
    },
  });
}

export function useAccountLedger(accountId?: string, filters?: AccountLedgerFilters) {
  return useQuery({
    queryKey: ['account-ledger', accountId, filters],
    enabled: Boolean(accountId),
    queryFn: async (): Promise<{ data: AccountLedgerEntry[]; count: number }> => {
      if (!accountId || OFFLINE_MODE) {
        return { data: [], count: 0 };
      }

      let query = supabase
        .from('account_ledger_entries')
        .select('*', { count: 'exact' })
        .eq('account_id', accountId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.entry_type && filters.entry_type !== 'semua') {
        query = query.eq('entry_type', filters.entry_type);
      }

      if (filters?.date_from) {
        query = query.gte('entry_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('entry_date', filters.date_to);
      }

      if (filters?.search) {
        const search = filters.search.trim();
        if (search) {
          query = query.or(`notes.ilike.%${search}%,reference_no.ilike.%${search}%,manual_reconciliation_ref.ilike.%${search}%`);
        }
      }

      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []) as AccountLedgerEntry[],
        count: count || 0,
      };
    },
  });
}

export function useCreateManualLedgerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateManualLedgerEntryInput) => {
      if (OFFLINE_MODE) {
        throwOfflineMutationError();
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      if (!userId) {
        throw new Error('User tidak terautentikasi');
      }

      if (input.amount_rp <= 0) {
        throw new Error('Nominal harus lebih besar dari 0');
      }

      const { data: latestEntryRaw, error: latestError } = await supabase
        .from('account_ledger_entries')
        .select('running_balance_after_rp')
        .eq('account_id', input.account_id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) throw latestError;

      const latestEntry = latestEntryRaw as { running_balance_after_rp: number | null } | null;

      const runningBalanceBefore = Number(latestEntry?.running_balance_after_rp || 0);
      const runningBalanceAfter =
        input.entry_type === 'IN'
          ? runningBalanceBefore + input.amount_rp
          : input.entry_type === 'OUT'
            ? runningBalanceBefore - input.amount_rp
            : runningBalanceBefore;

      const now = new Date();
      const payload = {
        account_id: input.account_id,
        entry_type: input.entry_type,
        amount_rp: input.amount_rp,
        running_balance_before_rp: runningBalanceBefore,
        running_balance_after_rp: runningBalanceAfter,
        entry_date: input.entry_date || now.toISOString().slice(0, 10),
        effective_at: input.effective_at || now.toISOString(),
        notes: input.notes || null,
        reference_no: input.reference_no || null,
        manual_reconciliation_ref:
          input.manual_reconciliation_ref || `manual-${input.account_id}-${Date.now()}`,
        created_by: userId,
        updated_at: now.toISOString(),
      };

      const { data, error } = await (supabase
        .from('account_ledger_entries')
        .insert as any)(payload)
        .select('*')
        .single();

      if (error) throw error;

      return data as AccountLedgerEntry;
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['account-ledger', entry.account_id] });
      queryClient.invalidateQueries({ queryKey: ['account-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-balances'] });
      toast.success('Entri ledger manual berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan entri ledger manual');
    },
  });
}

/** Fetch the current balance for every account in one query (uses the account_latest_balances view). */
export function useAllAccountsBalances() {
  return useQuery({
    queryKey: ['accounts-balances'],
    queryFn: async (): Promise<Record<string, number>> => {
      if (OFFLINE_MODE) return {};

      const { data, error } = await (supabase
        .from('account_latest_balances')
        .select as any)('account_id, current_balance');

      if (error) throw error;

      const map: Record<string, number> = {};
      for (const row of (data || []) as { account_id: string; current_balance: number | null }[]) {
        map[row.account_id] = Number(row.current_balance ?? 0);
      }
      return map;
    },
  });
}