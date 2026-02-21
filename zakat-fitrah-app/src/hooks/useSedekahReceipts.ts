import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type SedekahReceiptRow =
  Database['public']['Tables']['bukti_sedekah']['Row'];

export type SedekahReceiptUpdate =
  Database['public']['Tables']['bukti_sedekah']['Update'];

const QUERY_KEY = 'bukti-sedekah-list';

// ──────────────────────────────────────────────────────────────
// Fetch list
// ──────────────────────────────────────────────────────────────
export function useSedekahReceiptsList() {
  return useQuery<SedekahReceiptRow[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bukti_sedekah')
        .select(
          'id, receipt_number, category, category_key, donor_id, donor_name, donor_address, donor_phone, amount, tanggal, notes, created_by, created_at, updated_at',
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as SedekahReceiptRow[];
    },
  });
}

// ──────────────────────────────────────────────────────────────
// Update existing receipt
// ──────────────────────────────────────────────────────────────
export function useUpdateSedekahReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: SedekahReceiptUpdate;
    }) => {
      const { error } = await supabase
        .from('bukti_sedekah')
        .update(payload as never)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ──────────────────────────────────────────────────────────────
// Delete receipt
// ──────────────────────────────────────────────────────────────
export function useDeleteSedekahReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bukti_sedekah')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
