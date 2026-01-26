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

      try {
        // Search by name or phone in muzakki table
        // Use ilike (case-insensitive) with % wildcards for partial match
        const { data, error } = await supabase
          .from('muzakki')
          .select('id, nama_kk, alamat, no_telp, created_at, updated_at')
          .or(`nama_kk.ilike.%${query}%,no_telp.ilike.%${query}%`)
          .limit(10);

        if (error) {
          console.error('Error searching donors:', error);
          return [];
        }

        return (data || []).map((row: any) => ({
          id: row.id,
          nama: row.nama_kk,
          alamat: row.alamat,
          no_telp: row.no_telp,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));
      } catch (err) {
        console.error('Exception searching donors:', err);
        return [];
      }
    },
    enabled: !!(params.query && params.query.trim().length > 0),
    retry: 1,
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
        .select('id, nama_kk, alamat, no_telp, created_at, updated_at')
        .eq('id', donorId)
        .single();

      if (error) {
        console.error('Error fetching donor:', error);
        return null;
      }

      const row = data as any;
      return {
        id: row.id,
        nama: row.nama_kk,
        alamat: row.alamat,
        no_telp: row.no_telp,
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as DonorProfile;
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
      // Check if donor exists by name (limit to 1 to handle duplicates)
      const { data: existingRecords, error: searchError } = await supabase
        .from('muzakki')
        .select('id')
        .eq('nama_kk', input.nama)
        .limit(1);

      if (searchError) throw searchError;

      const existingByName = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

      if (existingByName) {
        // Update existing donor
        const donorId = (existingByName as any).id;
        if (!donorId) {
          throw new Error('Donor ID not found after search');
        }

        const { error } = await (supabase
          .from('muzakki') as any)
          .update({
            alamat: input.alamat,
            no_telp: input.no_telp || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', donorId);

        if (error) throw error;

        // Fetch updated donor data
        const { data: updatedData, error: fetchError } = await supabase
          .from('muzakki')
          .select('id, nama_kk, alamat, no_telp, created_at, updated_at')
          .eq('id', donorId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!updatedData) {
          throw new Error('Failed to fetch updated donor profile');
        }

        const row = updatedData as any;
        return {
          id: row.id,
          nama: row.nama_kk,
          alamat: row.alamat,
          no_telp: row.no_telp,
          created_at: row.created_at,
          updated_at: row.updated_at,
        } as DonorProfile;
      } else {
        // Create new donor
        const { data: insertedData, error } = await (supabase
          .from('muzakki') as any)
          .insert({
            nama_kk: input.nama,
            alamat: input.alamat,
            no_telp: input.no_telp || null,
          })
          .select('id');

        if (error) throw error;
        if (!insertedData || insertedData.length === 0) {
          throw new Error('Failed to create donor profile');
        }

        const newDonorId = (insertedData as any)[0].id;

        // Fetch the full donor data
        const { data: newData, error: fetchError } = await supabase
          .from('muzakki')
          .select('id, nama_kk, alamat, no_telp, created_at, updated_at')
          .eq('id', newDonorId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!newData) {
          throw new Error('Failed to fetch newly created donor profile');
        }

        const row = newData as any;
        return {
          id: row.id,
          nama: row.nama_kk,
          alamat: row.alamat,
          no_telp: row.no_telp,
          created_at: row.created_at,
          updated_at: row.updated_at,
        } as DonorProfile;
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
