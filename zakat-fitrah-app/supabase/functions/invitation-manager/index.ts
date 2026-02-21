// deno-lint-ignore-file no-explicit-any
/// <reference types="./types.d.ts" />
// @ts-expect-error - Deno module imports
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
// @ts-expect-error - Deno module imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateToken, hashToken, isValidEmail, normalizeEmail } from './utils.ts';

// Declare Response and console since this is a Deno environment
declare const Response: ResponseConstructor;
declare const console: Console;

interface ResponseConstructor {
  new (body?: unknown, init?: unknown): unknown;
  error(): unknown;
  redirect(url: string, status?: number): unknown;
}

interface Console {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
}

// Type imports for proper TypeScript support
type RequestEvent = Parameters<Parameters<typeof serve>[0]>[0];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  action: 'createInvitation' | 'validateInvitation' | 'registerUser';
  email?: string;
  role?: 'admin' | 'petugas';
  token?: string;
  password?: string;
}

serve(async (req: RequestEvent) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, email, role, token, password }: InvitationRequest = await req.json();

    // ============================================
    // CREATE INVITATION
    // ============================================
    if (action === 'createInvitation') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: missing access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!email || !role) {
        return new Response(
          JSON.stringify({ error: 'Email and role are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate email format
      if (!isValidEmail(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate role
      if (!['admin', 'petugas'].includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Role must be admin or petugas' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedEmail = normalizeEmail(email);

      // Check if user already exists and is active
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email, is_active')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingUser && existingUser.is_active) {
        return new Response(
          JSON.stringify({ 
            error: 'User already registered and active. Use User Management to change their role instead.' 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current user (admin creating invitation)
      const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
      if (!currentUser) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate token and hash it
      const plainToken = await generateToken();
      const tokenHash = await hashToken(plainToken);

      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Insert invitation
      const { data: invitation, error: insertError } = await supabaseAdmin
        .from('user_invitations')
        .insert({
          email: normalizedEmail,
          role,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create invitation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate invitation link
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
      const invitationLink = `${frontendUrl}/register?token=${plainToken}`;

      return new Response(
        JSON.stringify({
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expires_at: invitation.expires_at,
          },
          invitationLink,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // VALIDATE INVITATION
    // ============================================
    if (action === 'validateInvitation') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash the provided token
      const tokenHash = await hashToken(token);

      // Look up invitation
      const { data: invitation, error: lookupError } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (lookupError || !invitation) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Invalid invitation token' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already used
      if (invitation.used_at) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'This invitation has already been used' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if revoked
      if (invitation.revoked_at) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'This invitation has been revoked' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'This invitation has expired' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid invitation
      return new Response(
        JSON.stringify({
          valid: true,
          invitation: {
            email: invitation.email,
            role: invitation.role,
            expires_at: invitation.expires_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // REGISTER USER
    // ============================================
    if (action === 'registerUser') {
      if (!token || !email || !password) {
        return new Response(
          JSON.stringify({ error: 'Token, email, and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedEmail = normalizeEmail(email);

      // Hash the provided token
      const tokenHash = await hashToken(token);

      // Look up invitation
      const { data: invitation, error: lookupError } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (lookupError || !invitation) {
        return new Response(
          JSON.stringify({ error: 'Invalid invitation token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify email matches
      if (invitation.email !== normalizedEmail) {
        return new Response(
          JSON.stringify({ error: 'Email does not match invitation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already used
      if (invitation.used_at) {
        return new Response(
          JSON.stringify({ error: 'This invitation has already been used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if revoked
      if (invitation.revoked_at) {
        return new Response(
          JSON.stringify({ error: 'This invitation has been revoked' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ error: 'This invitation has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Password validation
      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters long' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create auth user with service role
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: false, // Require email confirmation
      });

      if (authError) {
        console.error('Auth creation error:', authError);
        return new Response(
          JSON.stringify({ error: `Failed to create account: ${authError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: normalizedEmail,
          nama_lengkap: normalizedEmail.split('@')[0], // Default name from email
          role: invitation.role,
          is_active: true,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark invitation as used
      await supabaseAdmin
        .from('user_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Account created successfully. Please check your email to confirm your account.',
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
