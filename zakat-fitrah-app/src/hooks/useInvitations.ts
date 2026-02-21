import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserInvitation, InvitationStatus } from '@/types/database.types';
import { toast } from 'sonner';

// Helper function to calculate invitation status
export function getInvitationStatus(invitation: UserInvitation): InvitationStatus {
  if (invitation.revoked_at) return 'revoked';
  if (invitation.used_at) return 'used';
  
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  if (now > expiresAt) return 'expired';
  
  return 'pending';
}

// Query: Fetch all invitations
export function useInvitationsList() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserInvitation[];
    },
  });
}

// Mutation: Create invitation
interface CreateInvitationParams {
  email: string;
  role: 'admin' | 'petugas';
}

interface CreateInvitationResponse {
  success: boolean;
  invitation: {
    id: string;
    email: string;
    role: string;
    expires_at: string;
  };
  invitationLink: string;
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: CreateInvitationParams) => {
      const { data, error } = await supabase.functions.invoke('invitation-manager', {
        body: {
          action: 'createInvitation',
          email,
          role,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create invitation');
      }

      return data as CreateInvitationResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invitation');
    },
  });
}

// Mutation: Revoke invitation
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('user_invitations')
        .update({ revoked_at: new Date().toISOString() } as never)
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke invitation');
    },
  });
}

// Mutation: Re-invite (create new invitation with same email)
interface ReInviteParams {
  email: string;
  role: 'admin' | 'petugas';
}

export function useReInvite() {
  const createInvitationMutation = useCreateInvitation();
  
  return useMutation({
    mutationFn: async ({ email, role }: ReInviteParams) => {
      return createInvitationMutation.mutateAsync({ email, role });
    },
  });
}

// Query: Validate invitation token
export async function validateInvitationToken(token: string) {
  const { data, error } = await supabase.functions.invoke('invitation-manager', {
    body: {
      action: 'validateInvitation',
      token,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to validate invitation');
  }

  return data;
}

// Mutation: Register user with invitation token
interface RegisterUserParams {
  token: string;
  email: string;
  password: string;
}

export async function registerUserWithInvitation({ token, email, password }: RegisterUserParams) {
  const { data, error } = await supabase.functions.invoke('invitation-manager', {
    body: {
      action: 'registerUser',
      token,
      email,
      password,
    },
  });

  if (error) {
    throw new Error(error.message || 'Registration failed');
  }

  return data;
}
