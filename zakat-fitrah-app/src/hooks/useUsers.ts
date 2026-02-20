import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  nama_lengkap: string;
  role: 'admin' | 'petugas';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateUserInput {
  email: string;
  nama_lengkap: string;
  role: 'admin' | 'petugas';
  password: string;
}

interface UpdateUserInput {
  id: string;
  nama_lengkap: string;
  role: 'admin' | 'petugas';
  is_active: boolean;
}

function mapUserMutationError(error: Error): string {
  const raw = error.message || '';
  const normalized = raw.toLowerCase();

  if (
    normalized.includes('last active admin') ||
    normalized.includes('cannot deactivate or demote the last active admin') ||
    normalized.includes('cannot delete the last active admin')
  ) {
    return 'Tidak dapat menonaktifkan atau menurunkan role admin terakhir. Tambahkan/aktifkan admin lain terlebih dahulu.';
  }

  return raw;
}

// Fetch users list
export function useUsersList() {
  return useQuery({
    queryKey: ['users-list'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If 403, user doesn't have permission - return empty array
        if (error.code === 'PGRST301' || error.message.includes('403')) {
          console.warn('User management requires service role access');
          return [];
        }
        throw error;
      }
      return (data || []) as User[];
    },
    retry: false, // Don't retry on permission errors
  });
}

// Create user (Note: This requires proper backend implementation with Edge Functions)
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_input: CreateUserInput) => {
      // Note: Direct user creation from client is not secure
      // This should be done via Supabase Edge Function with service role
      
      // For now, show error message that this requires backend setup
      throw new Error(
        'User management requires backend Edge Function setup. ' +
        'Please create users via Supabase Dashboard: Authentication > Users > Add User'
      );
      
      /* Original code kept for reference:
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            nama_lengkap: input.nama_lengkap,
            role: input.role,
          },
        },
      });

      if (authError) throw authError;

      // Create user record
      if (authData.user) {
        const { error: userError } = await (supabase.from('users').insert as any)({
          id: authData.user.id,
          email: input.email,
          nama_lengkap: input.nama_lengkap,
          role: input.role,
          is_active: true,
        });

        if (userError) throw userError;
      }

      return authData.user;
      */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User berhasil ditambahkan. Email konfirmasi telah dikirim.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { data, error } = await (supabase.from('users').update as any)({
        nama_lengkap: input.nama_lengkap,
        role: input.role,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', input.id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui user: ${mapUserMutationError(error)}`);
    },
  });
}

// Toggle user active status
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await (supabase.from('users').update as any)({
        is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success(
        variables.is_active ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan'
      );
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status user: ${mapUserMutationError(error)}`);
    },
  });
}
