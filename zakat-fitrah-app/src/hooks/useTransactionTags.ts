import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { offlineStore } from '@/lib/offlineStore';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

export interface TransactionTag {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Query: Active tags only (is_active=true), ordered by name
export function useTransactionTags() {
  return useQuery({
    queryKey: ['transaction_tags'],
    queryFn: async (): Promise<TransactionTag[]> => {
      if (OFFLINE_MODE) {
        return offlineStore.transactionTags.filter((t) => t.is_active);
      }

      const { data, error } = await (supabase
        .from('transaction_tags')
        .select as any)('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []) as TransactionTag[];
    },
  });
}

// Query: All tags (active + inactive)
export function useAllTransactionTags() {
  return useQuery({
    queryKey: ['transaction_tags', 'all'],
    queryFn: async (): Promise<TransactionTag[]> => {
      if (OFFLINE_MODE) {
        return offlineStore.transactionTags;
      }

      const { data, error } = await (supabase
        .from('transaction_tags')
        .select as any)('*')
        .order('name');

      if (error) throw error;
      return (data || []) as TransactionTag[];
    },
  });
}

// Mutation: Add a new tag
export function useAddTransactionTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      if (input.name.length > 50) {
        throw new Error('Nama tag maksimal 50 karakter');
      }

      if (OFFLINE_MODE) {
        const newTag = {
          id: `tag-${Date.now()}`,
          name: input.name,
          description: input.description ?? null,
          color: input.color ?? null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        offlineStore.transactionTags.push(newTag);
        return newTag;
      }

      const { data, error } = await (supabase.from('transaction_tags').insert as any)({
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? null,
        is_active: true,
      })
        .select('*')
        .single();

      if (error) throw error;
      return data as TransactionTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction_tags'] });
      toast.success('Tag berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan tag: ${error.message}`);
    },
  });
}

// Mutation: Deactivate a tag (set is_active = false)
export function useDeactivateTransactionTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (OFFLINE_MODE) {
        const tag = offlineStore.transactionTags.find((t) => t.id === id);
        if (tag) {
          tag.is_active = false;
          tag.updated_at = new Date().toISOString();
        }
        return id;
      }

      const { error } = await (supabase.from('transaction_tags').update as any)({
        is_active: false,
      }).eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction_tags'] });
      toast.success('Tag dinonaktifkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menonaktifkan tag: ${error.message}`);
    },
  });
}
