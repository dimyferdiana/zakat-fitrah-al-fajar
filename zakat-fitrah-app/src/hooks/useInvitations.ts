import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserInvitation, InvitationStatus } from '@/types/database.types';
import { toast } from 'sonner';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invitation-manager`;

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'createInvitation',
          email,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invitation');
      }

      const data: CreateInvitationResponse = await response.json();
      return data;
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
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'validateInvitation',
      token,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to validate invitation');
  }

  const data = await response.json();
  return data;
}

// Mutation: Register user with invitation token
interface RegisterUserParams {
  token: string;
  email: string;
  password: string;
}

export async function registerUserWithInvitation({ token, email, password }: RegisterUserParams) {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'registerUser',
      token,
      email,
      password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }

  const data = await response.json();
  return data;
}
