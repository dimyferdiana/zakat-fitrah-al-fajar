import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  createHakAmilSnapshot,
  fetchBasisModeForTahun,
  mapKategoriToHakAmil,
  upsertHakAmilSnapshot,
} from '@/lib/hakAmilSnapshot';
import { offlineStore } from '@/lib/offlineStore';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

export type PemasukanUangKategori =
  | 'zakat_fitrah_uang'
  | 'fidyah_uang'
  | 'maal_penghasilan_uang'
  | 'infak_sedekah_uang';

export type AkunUang = 'kas' | 'bank';

export interface PemasukanUang {
  id: string;
  tahun_zakat_id: string;
  account_id?: string | null;
  muzakki_id: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
  kategori: PemasukanUangKategori;
  akun: AkunUang;
  jumlah_uang_rp: number;
  tanggal: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface PemasukanUangListParams {
  tahunZakatId?: string;
  kategori?: PemasukanUangKategori | 'semua';
  akun?: AkunUang | 'semua';
  page?: number;
  pageSize?: number;
}

interface CreatePemasukanInput {
  tahun_zakat_id: string;
  account_id: string;
  muzakki_id?: string;
  kategori: PemasukanUangKategori;
  akun: AkunUang;
  jumlah_uang_rp: number;
  tanggal: string;
  catatan?: string;
}

const DEFAULT_KAS_ACCOUNT_NAME = 'KAS';
const DEFAULT_BANK_ACCOUNT_NAME = 'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT';

async function resolveUangAccountId(akun: AkunUang, accountId: string): Promise<string> {
  if (accountId) return accountId;

  const preferredAccountName = akun === 'bank' ? DEFAULT_BANK_ACCOUNT_NAME : DEFAULT_KAS_ACCOUNT_NAME;
  const fallbackAccountName = DEFAULT_KAS_ACCOUNT_NAME;

  const { data: accounts, error } = await (supabase
    .from('accounts')
    .select as any)('id, account_name')
    .in('account_name', [preferredAccountName, fallbackAccountName])
    .eq('is_active', true);

  if (error) throw error;

  const matched = (accounts || []).find((account: { account_name: string }) => account.account_name === preferredAccountName)
    || (accounts || []).find((account: { account_name: string }) => account.account_name === fallbackAccountName);

  if (!matched?.id) {
    throw new Error(`Akun default tidak ditemukan untuk channel ${akun}`);
  }

  return matched.id as string;
}

interface SyncPemasukanUangLedgerInput {
  pemasukanUangId: string;
  accountId: string;
  amountRp: number;
  tanggal: string;
  catatan?: string | null;
  createdBy: string;
}

export async function createPemasukanUangLedgerEntry(input: SyncPemasukanUangLedgerInput) {
  const { error } = await (supabase.from('account_ledger_entries').insert as any)({
    account_id: input.accountId,
    entry_type: 'IN',
    amount_rp: input.amountRp,
    running_balance_before_rp: 0,
    running_balance_after_rp: input.amountRp,
    entry_date: input.tanggal,
    effective_at: new Date().toISOString(),
    notes: input.catatan || null,
    source_pemasukan_uang_id: input.pemasukanUangId,
    created_by: input.createdBy,
  });

  if (error) throw error;
}

export async function updatePemasukanUangLedgerEntry(input: SyncPemasukanUangLedgerInput) {
  const { data: existingLedger, error: existingLedgerError } = await (supabase
    .from('account_ledger_entries')
    .select as any)('id')
    .eq('source_pemasukan_uang_id', input.pemasukanUangId)
    .maybeSingle();

  if (existingLedgerError) throw existingLedgerError;

  if (!existingLedger?.id) {
    await createPemasukanUangLedgerEntry(input);
    return;
  }

  const { error } = await (supabase
    .from('account_ledger_entries')
    .update as any)({
      account_id: input.accountId,
      entry_type: 'IN',
      amount_rp: input.amountRp,
      running_balance_before_rp: 0,
      running_balance_after_rp: input.amountRp,
      entry_date: input.tanggal,
      effective_at: new Date().toISOString(),
      notes: input.catatan || null,
      updated_at: new Date().toISOString(),
      created_by: input.createdBy,
    })
    .eq('source_pemasukan_uang_id', input.pemasukanUangId);

  if (error) throw error;
}

export async function deletePemasukanUangLedgerEntry(pemasukanUangId: string) {
  const { data: existingLedger, error: existingLedgerError } = await (supabase
    .from('account_ledger_entries')
    .select as any)('id')
    .eq('source_pemasukan_uang_id', pemasukanUangId)
    .maybeSingle();

  if (existingLedgerError) throw existingLedgerError;
  if (!existingLedger?.id) return;

  const { error } = await supabase
    .from('account_ledger_entries')
    .delete()
    .eq('id', existingLedger.id);

  if (error) throw error;
}

export function usePemasukanUangList(params: PemasukanUangListParams) {
  return useQuery({
    queryKey: ['pemasukan-uang', params],
    queryFn: async (): Promise<{ data: PemasukanUang[]; count: number }> => {
      if (!params.tahunZakatId) {
        return { data: [], count: 0 };
      }
      if (OFFLINE_MODE) return offlineStore.getPemasukanUangList(params);

      let query = supabase
        .from('pemasukan_uang')
        .select(
          `*, muzakki:muzakki_id(id, nama_kk)`,
          { count: 'exact' }
        )
        .eq('tahun_zakat_id', params.tahunZakatId)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (params.kategori && params.kategori !== 'semua') {
        query = query.eq('kategori', params.kategori);
      }

      if (params.akun && params.akun !== 'semua') {
        query = query.eq('akun', params.akun);
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []) as unknown as PemasukanUang[],
        count: count || 0,
      };
    },
  });
}

interface UpdatePemasukanInput extends CreatePemasukanInput {
  id: string;
}

export function useCreatePemasukanUang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePemasukanInput) => {
      if (OFFLINE_MODE) return offlineStore.addPemasukanUang(input) as any;
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (!userId) {
        throw new Error('User tidak terautentikasi');
      }

      const payload = {
        ...input,
        account_id: input.account_id,
        muzakki_id: input.muzakki_id || null,
        catatan: input.catatan || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase.from('pemasukan_uang').insert as any)(payload)
        .select('*')
        .single();

      if (error) throw error;

      try {
        const accountId = await resolveUangAccountId(input.akun, input.account_id);
        await createPemasukanUangLedgerEntry({
          pemasukanUangId: data.id,
          accountId,
          amountRp: input.jumlah_uang_rp,
          tanggal: input.tanggal,
          catatan: input.catatan || null,
          createdBy: userId,
        });
      } catch (ledgerSyncError) {
        await supabase.from('pemasukan_uang').delete().eq('id', data.id);
        throw ledgerSyncError;
      }

      // Create hak amil snapshot for this transaction
      const hakAmilKategori = mapKategoriToHakAmil(input.kategori);
      if (hakAmilKategori && data?.id) {
        try {
          const basisMode = await fetchBasisModeForTahun(input.tahun_zakat_id);
          await createHakAmilSnapshot({
            tahunZakatId: input.tahun_zakat_id,
            kategori: hakAmilKategori,
            tanggal: input.tanggal,
            grossAmount: input.jumlah_uang_rp,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_uang',
            sourceId: data.id,
            catatan: input.catatan,
            createdBy: userId,
          });
        } catch (snapshotError) {
          console.error('Failed to create hak amil snapshot:', snapshotError);
          // Don't fail the entire transaction if snapshot fails
        }
      }

      return data as PemasukanUang;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
      toast.success('Pemasukan uang berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan pemasukan: ${error.message}`);
    },
  });
}

export function useUpdatePemasukanUang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePemasukanInput) => {
      if (OFFLINE_MODE) { offlineStore.updatePemasukanUang(input.id, input); return offlineStore.getPemasukanUangList({}).data.find(p => p.id === input.id) as any; }
      const { id, ...updateData } = input;
      const payload = {
        ...updateData,
        account_id: updateData.account_id,
        muzakki_id: updateData.muzakki_id || null,
        catatan: updateData.catatan || null,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from('pemasukan_uang')
        .update as any)(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      const accountId = await resolveUangAccountId(updateData.akun, updateData.account_id);
      await updatePemasukanUangLedgerEntry({
        pemasukanUangId: id,
        accountId,
        amountRp: updateData.jumlah_uang_rp,
        tanggal: updateData.tanggal,
        catatan: updateData.catatan || null,
        createdBy: data.created_by,
      });

      const hakAmilKategori = mapKategoriToHakAmil(updateData.kategori);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (hakAmilKategori) {
        try {
          const basisMode = await fetchBasisModeForTahun(updateData.tahun_zakat_id);
          await upsertHakAmilSnapshot({
            tahunZakatId: updateData.tahun_zakat_id,
            kategori: hakAmilKategori,
            tanggal: updateData.tanggal,
            grossAmount: updateData.jumlah_uang_rp,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_uang',
            sourceId: id,
            catatan: updateData.catatan,
            createdBy: userId,
          });
        } catch (snapshotError) {
          console.error('Failed to update hak amil snapshot:', snapshotError);
        }
      }

      return data as PemasukanUang;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
      toast.success('Pemasukan uang berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui pemasukan: ${error.message}`);
    },
  });
}

export function useDeletePemasukanUang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (OFFLINE_MODE) { offlineStore.deletePemasukanUang(id); return id; }
      await supabase
        .from('hak_amil_snapshots')
        .delete()
        .eq('pemasukan_uang_id', id);

      await deletePemasukanUangLedgerEntry(id);

      const { error } = await supabase
        .from('pemasukan_uang')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
      toast.success('Pemasukan uang berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus pemasukan: ${error.message}`);
    },
  });
}
