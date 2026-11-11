import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DonorProfile {
  id: string;
  nama: string;
  alamat: string;
  no_telp: string | null;
  created_at: string;
  updated_at: string;
}
interface DonorRow {
  id: string; nama_kk: string; nama_lengkap?: string | null; alamat: string;
  no_telp: string | null; created_at: string; updated_at: string;
}

interface SearchDonorParams {
  query?: string; // Search by name or phone
}

interface CreateDonorInput {
  personId?: string;
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

      const query = params.query.replace(/[,()%_]/g, ' ').trim();
      if (!query) return [];

      try {
        // Search by name or phone in muzakki table
        // Use ilike (case-insensitive) with % wildcards for partial match
        const { data, error } = await (supabase as unknown as SupabaseClient)
          .from('muzakki')
          .select('id, nama_kk, nama_lengkap, alamat, no_telp, created_at, updated_at')
          .or(`nama_kk.ilike.%${query}%,nama_lengkap.ilike.%${query}%,alamat.ilike.%${query}%,no_telp.ilike.%${query}%`)
          .limit(10);

        if (error) {
          console.error('Error searching donors:', error);
          return [];
        }

        return ((data || []) as DonorRow[]).map(row => ({
          id: row.id,
          nama: row.nama_lengkap || row.nama_kk,
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

      const row = data as DonorRow;
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
 * Use the explicitly selected person ID, or create a separate person.
 * Receipt snapshot edits never silently update the shared master record.
 */
export async function resolveDonorRecord(input: CreateDonorInput): Promise<DonorProfile> {
  const client = supabase as unknown as SupabaseClient;
  let personId = input.personId;
  if (!personId) {
    const { data, error } = await client.from('muzakki').insert({
      nama_kk: input.nama, alamat: input.alamat, no_telp: input.no_telp || null,
    }).select('id').single();
    if (error) throw error;
    if (!data?.id) throw new Error('Data orang baru tidak dapat dibuat.');
    personId = data.id as string;
  }
  const { data, error } = await client.from('muzakki')
    .select('id,nama_kk,nama_lengkap,alamat,no_telp,created_at,updated_at')
    .eq('id', personId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Data orang yang dipilih tidak ditemukan.');
  return { id: data.id, nama: data.nama_lengkap || data.nama_kk, alamat: data.alamat,
    no_telp: data.no_telp, created_at: data.created_at, updated_at: data.updated_at } as DonorProfile;
}

export function useUpsertDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveDonorRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-donor'] });
      queryClient.invalidateQueries({ queryKey: ['donor'] });
    },
    onError: (error: Error) => {
      console.error('Error upserting donor:', error);
      toast.error('Gagal menyimpan data donor: ' + error.message);
    },
  });
}
