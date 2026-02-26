-- Migration: User Invitations Schema
-- Description: Add user_invitations table and extend users table with address and phone fields
-- Date: 2026-02-14

-- Add address and phone columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'petugas')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_token_hash ON public.user_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON public.user_invitations(expires_at);

-- Enable RLS on user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger for user_invitations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_invitations_updated_at
BEFORE UPDATE ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comment on table
COMMENT ON TABLE public.user_invitations IS 'Stores invitation tokens for user registration (invitation-only system)';
COMMENT ON COLUMN public.user_invitations.token_hash IS 'SHA-256 hash of the invitation token (never store plain token)';
COMMENT ON COLUMN public.user_invitations.expires_at IS 'Invitation expires 24 hours after creation';
COMMENT ON COLUMN public.user_invitations.used_at IS 'Timestamp when invitation was used for registration';
COMMENT ON COLUMN public.user_invitations.revoked_at IS 'Timestamp when invitation was revoked by admin';
