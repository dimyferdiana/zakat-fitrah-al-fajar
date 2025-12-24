import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TahunZakat {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateTahunZakatInput {
  tahun_hijriah: string;
  tahun_masehi: number;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
  is_active: boolean;
}

interface UpdateTahunZakatInput extends CreateTahunZakatInput {
  id: string;
}

// Fetch list of tahun_zakat
export function useTahunZakatList() {
  return useQuery({
    queryKey: ['tahun-zakat-list'],
    queryFn: async (): Promise<TahunZakat[]> => {
      const { data, error } = await supabase
        .from('tahun_zakat')
        .select('*')
        .order('tahun_masehi', { ascending: false });

      if (error) throw error;
      return (data || []) as TahunZakat[];
    },
  });
}

// Create new tahun_zakat
export function useCreateTahunZakat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTahunZakatInput) => {
      // If setting as active, deactivate all others first
      if (input.is_active) {
        await (supabase.from('tahun_zakat').update as any)({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data, error } = await (supabase.from('tahun_zakat').insert as any)({
        tahun_hijriah: input.tahun_hijriah,
        tahun_masehi: input.tahun_masehi,
        nilai_beras_kg: input.nilai_beras_kg,
        nilai_uang_rp: input.nilai_uang_rp,
        is_active: input.is_active,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tahun-zakat-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Tahun zakat berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan tahun zakat: ${error.message}`);
    },
  });
}

// Update tahun_zakat
export function useUpdateTahunZakat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTahunZakatInput) => {
      // If setting as active, deactivate all others first
      if (input.is_active) {
        await (supabase.from('tahun_zakat').update as any)({ is_active: false }).neq('id', input.id);
      }

      const { data, error } = await (supabase.from('tahun_zakat').update as any)({
        tahun_hijriah: input.tahun_hijriah,
        tahun_masehi: input.tahun_masehi,
        nilai_beras_kg: input.nilai_beras_kg,
        nilai_uang_rp: input.nilai_uang_rp,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', input.id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tahun-zakat-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Tahun zakat berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui tahun zakat: ${error.message}`);
    },
  });
}

// Toggle active status
export function useToggleTahunZakatActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Deactivate all others first
      await (supabase.from('tahun_zakat').update as any)({ is_active: false }).neq('id', id);

      // Activate the selected one
      const { data, error } = await (supabase.from('tahun_zakat').update as any)({
        is_active: true,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tahun-zakat-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Tahun zakat aktif berhasil diubah');
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah tahun zakat aktif: ${error.message}`);
    },
  });
}

// Check if tahun has transactions
export function useCheckTahunHasTransactions(tahunId: string | null) {
  return useQuery({
    queryKey: ['tahun-has-transactions', tahunId],
    queryFn: async (): Promise<boolean> => {
      if (!tahunId) return false;

      const { count: pembayaranCount } = await supabase
        .from('pembayaran_zakat')
        .select('*', { count: 'exact', head: true })
        .eq('tahun_zakat_id', tahunId);

      const { count: distribusiCount } = await supabase
        .from('distribusi_zakat')
        .select('*', { count: 'exact', head: true })
        .eq('tahun_zakat_id', tahunId);

      return (pembayaranCount || 0) > 0 || (distribusiCount || 0) > 0;
    },
    enabled: !!tahunId,
  });
}
