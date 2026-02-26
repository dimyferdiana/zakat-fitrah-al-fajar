import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Rekonsiliasi {
  id: string;
  tahun_zakat_id: string;
  jenis: 'uang' | 'beras';
  akun?: 'kas' | 'bank';
  jumlah_uang_rp?: number;
  jumlah_beras_kg?: number;
  tanggal: string;
  catatan: string;
  created_by: string;
  created_at: string;
  tahun_zakat?: {
    tahun_hijriah: string;
    tahun_masehi: number;
  };
  users?: {
    nama_lengkap: string;
  };
}

export interface CreateRekonsiliasiInput {
  tahun_zakat_id: string;
  jenis: 'uang' | 'beras';
  akun?: 'kas' | 'bank';
  jumlah: number; // Will be mapped to jumlah_uang_rp or jumlah_beras_kg
  tanggal: string;
  catatan: string;
}

const DEFAULT_KAS_ACCOUNT_NAME = 'KAS';
const DEFAULT_BANK_ACCOUNT_NAME = 'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT';

async function resolveRekonsiliasiAccountId(jenis: 'uang' | 'beras', akun?: 'kas' | 'bank'): Promise<string> {
  const preferredAccountName = jenis === 'uang'
    ? (akun === 'bank' ? DEFAULT_BANK_ACCOUNT_NAME : DEFAULT_KAS_ACCOUNT_NAME)
    : DEFAULT_KAS_ACCOUNT_NAME;

  const { data: accounts, error } = await (supabase
    .from('accounts')
    .select as any)('id, account_name')
    .in('account_name', [preferredAccountName, DEFAULT_KAS_ACCOUNT_NAME])
    .eq('is_active', true);

  if (error) throw error;

  const matched = (accounts || []).find((account: { account_name: string }) => account.account_name === preferredAccountName)
    || (accounts || []).find((account: { account_name: string }) => account.account_name === DEFAULT_KAS_ACCOUNT_NAME);

  if (!matched?.id) {
    throw new Error('Akun default rekonsiliasi tidak ditemukan');
  }

  return matched.id as string;
}

async function resolveRekonsiliasiAmountRp(input: CreateRekonsiliasiInput): Promise<number> {
  if (input.jenis === 'uang') {
    return input.jumlah;
  }

  const { data: tahunZakat, error } = await (supabase
    .from('tahun_zakat')
    .select as any)('nilai_beras_kg')
    .eq('id', input.tahun_zakat_id)
    .single();

  if (error) throw error;

  const nilaiBerasPerKg = Number(tahunZakat?.nilai_beras_kg || 0);
  if (!nilaiBerasPerKg || Number.isNaN(nilaiBerasPerKg)) {
    throw new Error('Nilai beras per kg pada tahun zakat tidak valid');
  }

  return input.jumlah * nilaiBerasPerKg;
}

export async function createRekonsiliasiLedgerEntry(input: {
  rekonsiliasiId: string;
  accountId: string;
  amountRp: number;
  tanggal: string;
  catatan: string;
  createdBy: string;
}) {
  const manualRef = `MANUAL-REKONSILIASI-${input.rekonsiliasiId}`;

  const { error } = await (supabase.from('account_ledger_entries').insert as any)({
    account_id: input.accountId,
    entry_type: 'REKONSILIASI',
    amount_rp: input.amountRp,
    running_balance_before_rp: 0,
    running_balance_after_rp: 0,
    entry_date: input.tanggal,
    effective_at: new Date().toISOString(),
    notes: input.catatan || null,
    source_rekonsiliasi_id: input.rekonsiliasiId,
    manual_reconciliation_ref: manualRef,
    created_by: input.createdBy,
  });

  if (error) throw error;
}

export async function deleteRekonsiliasiLedgerEntry(rekonsiliasiId: string) {
  const { data: existingLedger, error: existingLedgerError } = await (supabase
    .from('account_ledger_entries')
    .select as any)('id')
    .eq('source_rekonsiliasi_id', rekonsiliasiId)
    .maybeSingle();

  if (existingLedgerError) throw existingLedgerError;
  if (!existingLedger?.id) return;

  const { error } = await supabase
    .from('account_ledger_entries')
    .delete()
    .eq('id', existingLedger.id);

  if (error) throw error;
}

// Query: Get all rekonsiliasi with filters
export function useRekonsiliasiList(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['rekonsiliasi-list', tahunZakatId],
    queryFn: async () => {
      let query = supabase
        .from('rekonsiliasi')
        .select(`
          *,
          tahun_zakat:tahun_zakat_id (tahun_hijriah, tahun_masehi),
          users:created_by (nama_lengkap)
        `)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (tahunZakatId) {
        query = query.eq('tahun_zakat_id', tahunZakatId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Rekonsiliasi[];
    },
  });
}

// Query: Get rekonsiliasi summary by tahun
export function useRekonsiliasiSummary(tahunZakatId: string) {
  return useQuery({
    queryKey: ['rekonsiliasi-summary', tahunZakatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rekonsiliasi')
        .select('jenis, jumlah_uang_rp, jumlah_beras_kg')
        .eq('tahun_zakat_id', tahunZakatId);

      if (error) throw error;

      // Calculate totals
      const summary = {
        total_uang: 0,
        total_beras: 0,
      };

      data.forEach((item: any) => {
        if (item.jenis === 'uang' && item.jumlah_uang_rp) {
          summary.total_uang += Number(item.jumlah_uang_rp);
        }
        if (item.jenis === 'beras' && item.jumlah_beras_kg) {
          summary.total_beras += Number(item.jumlah_beras_kg);
        }
      });

      return summary;
    },
  });
}

// Mutation: Create new rekonsiliasi
export function useCreateRekonsiliasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRekonsiliasiInput) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if ((userData as any)?.role !== 'admin') {
        throw new Error('Only admin can create rekonsiliasi');
      }

      const accountId = await resolveRekonsiliasiAccountId(input.jenis, input.akun);

      const { data, error } = await (supabase
        .from('rekonsiliasi')
        .insert as any)({
          tahun_zakat_id: input.tahun_zakat_id,
          jenis: input.jenis,
          akun: input.jenis === 'uang' ? input.akun : null,
          account_id: accountId,
          jumlah_uang_rp: input.jenis === 'uang' ? input.jumlah : null,
          jumlah_beras_kg: input.jenis === 'beras' ? input.jumlah : null,
          tanggal: input.tanggal,
          catatan: input.catatan,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      try {
        const amountRp = await resolveRekonsiliasiAmountRp(input);
        await createRekonsiliasiLedgerEntry({
          rekonsiliasiId: (data as { id: string }).id,
          accountId,
          amountRp,
          tanggal: input.tanggal,
          catatan: input.catatan,
          createdBy: user.id,
        });
      } catch (ledgerSyncError) {
        await supabase.from('rekonsiliasi').delete().eq('id', (data as { id: string }).id);
        throw ledgerSyncError;
      }

      // Create hak amil snapshot for reconciliation
      // Note: Rekonsiliasi is treated as an adjustment (negative impact on net)
      // We don't calculate hak amil directly on rekonsiliasi itself
      // but it affects the net calculation for other categories
      // This is a design choice - we only snapshot actual income, not adjustments
      // If needed in the future, this can be expanded

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rekonsiliasi-list'] });
      queryClient.invalidateQueries({ queryKey: ['rekonsiliasi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Rekonsiliasi berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan rekonsiliasi');
    },
  });
}

// Mutation: Delete rekonsiliasi (admin only)
export function useDeleteRekonsiliasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if ((userData as any)?.role !== 'admin') {
        throw new Error('Only admin can delete rekonsiliasi');
      }

      await deleteRekonsiliasiLedgerEntry(id);

      const { error } = await supabase
        .from('rekonsiliasi')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rekonsiliasi-list'] });
      queryClient.invalidateQueries({ queryKey: ['rekonsiliasi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Rekonsiliasi berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus rekonsiliasi');
    },
  });
}
