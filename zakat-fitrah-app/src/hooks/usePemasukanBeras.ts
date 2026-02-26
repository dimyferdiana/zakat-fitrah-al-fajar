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

export type PemasukanBerasKategori =
  | 'fidyah_beras'
  | 'infak_sedekah_beras'
  | 'zakat_fitrah_beras'
  | 'maal_beras';

export interface PemasukanBeras {
  id: string;
  tahun_zakat_id: string;
  muzakki_id: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
  kategori: PemasukanBerasKategori;
  jumlah_beras_kg: number;
  tanggal: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface PemasukanBerasListParams {
  tahunZakatId?: string;
  kategori?: PemasukanBerasKategori | 'semua';
  page?: number;
  pageSize?: number;
}

interface CreatePemasukanInput {
  tahun_zakat_id: string;
  muzakki_id?: string;
  kategori: PemasukanBerasKategori;
  jumlah_beras_kg: number;
  tanggal: string;
  catatan?: string;
}

const DEFAULT_KAS_ACCOUNT_NAME = 'KAS';

async function resolveKASAccountId(): Promise<string> {
  const { data: account, error } = await (supabase
    .from('accounts')
    .select as any)('id')
    .eq('account_name', DEFAULT_KAS_ACCOUNT_NAME)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  if (!account?.id) {
    throw new Error('Akun default KAS tidak ditemukan');
  }

  return account.id as string;
}

async function convertBerasKgToRp(tahunZakatId: string, jumlahBerasKg: number): Promise<number> {
  const { data: tahunZakat, error } = await (supabase
    .from('tahun_zakat')
    .select as any)('nilai_beras_kg')
    .eq('id', tahunZakatId)
    .single();

  if (error) throw error;

  const nilaiBerasPerKg = Number(tahunZakat?.nilai_beras_kg || 0);
  if (!nilaiBerasPerKg || Number.isNaN(nilaiBerasPerKg)) {
    throw new Error('Nilai beras per kg pada tahun zakat tidak valid');
  }

  return jumlahBerasKg * nilaiBerasPerKg;
}

interface SyncPemasukanBerasLedgerInput {
  pemasukanBerasId: string;
  accountId: string;
  amountRp: number;
  tanggal: string;
  catatan?: string | null;
  createdBy: string;
}

export async function createPemasukanBerasLedgerEntry(input: SyncPemasukanBerasLedgerInput) {
  const { error } = await (supabase.from('account_ledger_entries').insert as any)({
    account_id: input.accountId,
    entry_type: 'IN',
    amount_rp: input.amountRp,
    running_balance_before_rp: 0,
    running_balance_after_rp: input.amountRp,
    entry_date: input.tanggal,
    effective_at: new Date().toISOString(),
    notes: input.catatan || null,
    source_pemasukan_beras_id: input.pemasukanBerasId,
    created_by: input.createdBy,
  });

  if (error) throw error;
}

export async function updatePemasukanBerasLedgerEntry(input: SyncPemasukanBerasLedgerInput) {
  const { data: existingLedger, error: existingLedgerError } = await (supabase
    .from('account_ledger_entries')
    .select as any)('id')
    .eq('source_pemasukan_beras_id', input.pemasukanBerasId)
    .maybeSingle();

  if (existingLedgerError) throw existingLedgerError;

  if (!existingLedger?.id) {
    await createPemasukanBerasLedgerEntry(input);
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
    .eq('source_pemasukan_beras_id', input.pemasukanBerasId);

  if (error) throw error;
}

export async function deletePemasukanBerasLedgerEntry(pemasukanBerasId: string) {
  const { data: existingLedger, error: existingLedgerError } = await (supabase
    .from('account_ledger_entries')
    .select as any)('id')
    .eq('source_pemasukan_beras_id', pemasukanBerasId)
    .maybeSingle();

  if (existingLedgerError) throw existingLedgerError;
  if (!existingLedger?.id) return;

  const { error } = await supabase
    .from('account_ledger_entries')
    .delete()
    .eq('id', existingLedger.id);

  if (error) throw error;
}

export function usePemasukanBerasList(params: PemasukanBerasListParams) {
  return useQuery({
    queryKey: ['pemasukan-beras', params],
    queryFn: async (): Promise<{ data: PemasukanBeras[]; count: number }> => {
      if (!params.tahunZakatId) {
        return { data: [], count: 0 };
      }
      if (OFFLINE_MODE) return offlineStore.getPemasukanBerasList(params);

      let query = supabase
        .from('pemasukan_beras')
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

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []) as unknown as PemasukanBeras[],
        count: count || 0,
      };
    },
  });
}

interface UpdatePemasukanInput extends CreatePemasukanInput {
  id: string;
}

export function useCreatePemasukanBeras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePemasukanInput) => {
      if (OFFLINE_MODE) return offlineStore.addPemasukanBeras(input) as any;
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (!userId) {
        throw new Error('User tidak terautentikasi');
      }

      const accountId = await resolveKASAccountId();

      const payload = {
        ...input,
        account_id: accountId,
        muzakki_id: input.muzakki_id || null,
        catatan: input.catatan || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('pemasukan_beras').insert as any)(payload)
        .select('*')
        .single();

      if (error) throw error;

      try {
        const amountRp = await convertBerasKgToRp(input.tahun_zakat_id, input.jumlah_beras_kg);
        await createPemasukanBerasLedgerEntry({
          pemasukanBerasId: data.id,
          accountId,
          amountRp,
          tanggal: input.tanggal,
          catatan: input.catatan || null,
          createdBy: userId,
        });
      } catch (ledgerSyncError) {
        await supabase.from('pemasukan_beras').delete().eq('id', data.id);
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
            grossAmount: input.jumlah_beras_kg,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_beras',
            sourceId: data.id,
            catatan: input.catatan,
            createdBy: userId,
          });
        } catch (snapshotError) {
          console.error('Failed to create hak amil snapshot:', snapshotError);
          // Don't fail the entire transaction if snapshot fails
        }
      }

      return data as PemasukanBeras;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-beras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
      toast.success('Pemasukan beras berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan pemasukan: ${error.message}`);
    },
  });
}

export function useUpdatePemasukanBeras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePemasukanInput) => {
      if (OFFLINE_MODE) { offlineStore.updatePemasukanBeras(input.id, input); return offlineStore.getPemasukanBerasList({}).data.find(p => p.id === input.id) as any; }
      const { id, ...updateData } = input;
      const accountId = await resolveKASAccountId();
      const payload = {
        ...updateData,
        account_id: accountId,
        muzakki_id: updateData.muzakki_id || null,
        catatan: updateData.catatan || null,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from('pemasukan_beras')
        .update as any)(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      const amountRp = await convertBerasKgToRp(updateData.tahun_zakat_id, updateData.jumlah_beras_kg);
      await updatePemasukanBerasLedgerEntry({
        pemasukanBerasId: id,
        accountId,
        amountRp,
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
            grossAmount: updateData.jumlah_beras_kg,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_beras',
            sourceId: id,
            catatan: updateData.catatan,
            createdBy: userId,
          });
        } catch (snapshotError) {
          console.error('Failed to update hak amil snapshot:', snapshotError);
        }
      }

      return data as PemasukanBeras;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-beras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
      toast.success('Pemasukan beras berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui pemasukan: ${error.message}`);
    },
  });
}

export function useDeletePemasukanBeras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (OFFLINE_MODE) { offlineStore.deletePemasukanBeras(id); return id; }
      await supabase
        .from('hak_amil_snapshots')
        .delete()
        .eq('pemasukan_beras_id', id);

      await deletePemasukanBerasLedgerEntry(id);

      const { error } = await supabase
        .from('pemasukan_beras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-beras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
      toast.success('Pemasukan beras berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus pemasukan: ${error.message}`);
    },
  });
}
