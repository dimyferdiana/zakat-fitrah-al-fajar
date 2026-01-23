import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface DonorProfile {
  id: string;
  nama: string;
  alamat: string;
  no_telp: string | null;
  created_at: string;
  updated_at: string;
}

interface SearchDonorParams {
  query?: string; // Search by name or phone
}

interface CreateDonorInput {
  nama: string;
  alamat: string;
  no_telp?: string;
}

/**
 * Search existing donors by name or phone number
 * Used to prefill donor details when issuing a Sedekah receipt
 */
export function useSearchDonor(params: SearchDonorParams) {
  return useQuery({
    queryKey: ['search-donor', params.query],
    queryFn: async (): Promise<DonorProfile[]> => {
      if (!params.query || params.query.trim().length === 0) {
        return [];
      }

      const query = params.query.trim();

      // Search by name or phone in muzakki table
      const { data, error } = await supabase
        .from('muzakki')
        .select('id, nama_kk as nama, alamat, no_telp, created_at, updated_at')
        .or(`nama_kk.ilike.%${query}%,no_telp.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching donors:', error);
        return [];
      }

      return (data || []) as unknown as DonorProfile[];
    },
    enabled: !!(params.query && params.query.trim().length > 0),
  });
}

/**
 * Get a single donor by ID
 */
export function useDonor(donorId: string | null) {
  return useQuery({
    queryKey: ['donor', donorId],
    queryFn: async (): Promise<DonorProfile | null> => {
      if (!donorId) return null;

      const { data, error } = await supabase
        .from('muzakki')
        .select('id, nama_kk as nama, alamat, no_telp, created_at, updated_at')
        .eq('id', donorId)
        .single();

      if (error) {
        console.error('Error fetching donor:', error);
        return null;
      }

      return data as unknown as DonorProfile;
    },
    enabled: !!donorId,
  });
}

/**
 * Create or update a donor profile
 * Checks if donor exists by name (and optionally phone), then creates/updates accordingly
 */
export function useUpsertDonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDonorInput) => {
      // Check if donor exists by name
      const { data: existingByName, error: searchError } = await supabase
        .from('muzakki')
        .select('id')
        .eq('nama_kk', input.nama)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingByName) {
        // Update existing donor
        const { data, error } = await (supabase
          .from('muzakki') as any)
          .update({
            alamat: input.alamat,
            no_telp: input.no_telp || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', (existingByName as any).id)
          .select('id, nama_kk as nama, alamat, no_telp, created_at, updated_at')
          .single();

        if (error) throw error;
        return data as DonorProfile;
      } else {
        // Create new donor
        const { data, error } = await (supabase
          .from('muzakki') as any)
          .insert({
            nama_kk: input.nama,
            alamat: input.alamat,
            no_telp: input.no_telp || null,
          })
          .select('id, nama_kk as nama, alamat, no_telp, created_at, updated_at')
          .single();

        if (error) throw error;
        return data as DonorProfile;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-donor'] });
      queryClient.invalidateQueries({ queryKey: ['donor'] });
    },
    onError: (error: any) => {
      console.error('Error upserting donor:', error);
      toast.error('Gagal menyimpan data donor: ' + error.message);
    },
  });
}
