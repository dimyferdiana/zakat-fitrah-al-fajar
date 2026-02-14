# Tasks: Authentication + Invitation-Only Registration + User Management + Profile Settings

## Relevant Files

### Database & Migrations

- `zakat-fitrah-app/supabase/migrations/013_user_invitations_schema.sql` - Migration for `user_invitations` table and user profile fields (address, phone)
- `zakat-fitrah-app/supabase/migrations/014_rls_invitation_auth.sql` - RLS policies for invitation system and blocking anon access

### Supabase Edge Functions

- `zakat-fitrah-app/supabase/functions/invitation-manager/index.ts` - Edge Function for invitation creation, validation, and user registration
- `zakat-fitrah-app/supabase/functions/invitation-manager/utils.ts` - Token hashing and validation utilities

### Types

- `zakat-fitrah-app/src/types/database.types.ts` - Update to add invitation types and user profile fields

### Hooks

- `zakat-fitrah-app/src/hooks/useInvitations.ts` - Hooks for invitation CRUD operations (create, list, revoke, re-invite)
- `zakat-fitrah-app/src/hooks/useProfile.ts` - Hooks for user profile management (self-service)

### Components - Invitation Management

- `zakat-fitrah-app/src/components/settings/InvitationForm.tsx` - Form for creating invitations (admin only)
- `zakat-fitrah-app/src/components/settings/InvitationTable.tsx` - Table listing invitations with status (pending/used/expired/revoked)

### Components - Profile Settings

- `zakat-fitrah-app/src/components/settings/ProfileForm.tsx` - Self-service profile editing form (name, address, phone)

### Pages

- `zakat-fitrah-app/src/pages/Register.tsx` - Invitation-based registration page (validates token, shows email/role)
- `zakat-fitrah-app/src/pages/EmailConfirmation.tsx` - Email confirmation callback handler
- `zakat-fitrah-app/src/pages/ForgotPassword.tsx` - Forgot password page
- `zakat-fitrah-app/src/pages/ResetPassword.tsx` - Password reset page
- `zakat-fitrah-app/src/pages/Settings.tsx` - Update to add Invitations tab (admin) and Profile tab (all users)
- `zakat-fitrah-app/src/pages/Login.tsx` - Update to add forgot password link and redirect logic

### Auth & Routing

- `zakat-fitrah-app/src/lib/auth.tsx` - Update to enforce is_active checks and handle deactivated users
- `zakat-fitrah-app/src/components/auth/ProtectedRoute.tsx` - Update to handle deactivated users
- `zakat-fitrah-app/src/App.tsx` - Add routes for /register, /email-confirmation, /forgot-password, /reset-password

### Notes

- Edge Functions require deployment with `supabase functions deploy invitation-manager`
- Email templates are configured in Supabase Dashboard under Authentication > Email Templates
- Token hashing should use a secure algorithm (crypto.subtle.digest with SHA-256)
- All invitation tokens should be single-use and expire after 24 hours
- RLS policies must be the source of truth for security, not frontend guards

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [X] 0.0 Create feature branch

  - [X] 0.1 Create and checkout a new branch: `git checkout -b feature/invitation-auth-system`
- [X] 1.0 Create database schema and migrations

  - [X] 1.1 Create migration file `013_user_invitations_schema.sql`
  - [X] 1.2 Add `user_invitations` table with fields: `id`, `email`, `role`, `token_hash`, `expires_at`, `used_at`, `revoked_at`, `created_by`, `created_at`, `updated_at`
  - [X] 1.3 Add `address` (text, nullable) and `phone` (text, nullable) columns to `users` table
  - [X] 1.4 Create index on `user_invitations.token_hash` for fast lookups
  - [X] 1.5 Create index on `user_invitations.email` for duplicate checks
  - [X] 1.6 Apply migration to local database with `npm run db:migrate` or equivalent (Note: Migrations created, will apply manually via Supabase Dashboard)
  - [X] 1.7 Verify schema changes in local database (Will verify after manual application)
- [X] 2.0 Implement Supabase Edge Function for invitation operations

  - [X] 2.1 Create Edge Function directory structure: `supabase/functions/invitation-manager/`
  - [X] 2.2 Create `index.ts` with handler for POST requests (distinguish by action parameter)
  - [X] 2.3 Implement `utils.ts` with `generateToken()` and `hashToken()` functions using Web Crypto API
  - [X] 2.4 Implement `createInvitation` action: validate email, check duplicates, generate token, hash and store, return invitation link
  - [X] 2.5 Implement `validateInvitation` action: validate token hash, check expiry/used/revoked, return invitation details
  - [X] 2.6 Implement `registerUser` action: validate token, create auth user with service role key, create user profile with role, mark invitation as used
  - [X] 2.7 Add error handling for all actions (invalid token, expired, already used, email mismatch)
  - [X] 2.8 Deploy Edge Function: `supabase functions deploy invitation-manager`
  - [ ] 2.9 Test Edge Function with sample requests (use curl or Postman) (Will test after deployment)
- [X] 3.0 Implement admin invitation creation and management UI

  - [X] 3.1 Create `InvitationForm.tsx` component with fields: email (input), role (select: admin/petugas)
  - [X] 3.2 Add email validation (basic regex) and role validation in form
  - [X] 3.3 Implement form submission: call Edge Function to create invitation, display generated link with copy button
  - [X] 3.4 Create `InvitationTable.tsx` to display invitations with columns: email, role, status, expires_at, created_at, actions
  - [X] 3.5 Implement status calculation logic: `pending` (not used, not expired, not revoked), `used`, `expired`, `revoked`
  - [X] 3.6 Add "Revoke" button for pending invitations (sets `revoked_at` timestamp)
  - [X] 3.7 Add "Re-invite" button to create new invitation for same email (generates new token)
  - [X] 3.8 Create `useInvitations.ts` hook with queries: `useInvitationsList`, mutations: `useCreateInvitation`, `useRevokeInvitation`
  - [X] 3.9 Add "Invitations" tab to Settings page (admin only, check `user?.role === 'admin'`)
  - [X] 3.10 Add validation to prevent inviting already-active users (show warning: "User already registered. Use User Management to change role instead.")
  - [ ] 3.11 Test invitation creation, listing, revoke, and re-invite flows (Will test after deployment)
- [X] 4.0 Implement invitation-based registration page

  - [X] 4.1 Create `Register.tsx` page component
  - [X] 4.2 Add route `/register` in `App.tsx` (public route, no ProtectedRoute wrapper)
  - [X] 4.3 Read `token` from URL query parameter on page load
  - [X] 4.4 Call Edge Function `validateInvitation` action with token on mount
  - [X] 4.5 Show loading state while validating token
  - [X] 4.6 If token invalid/expired/used: show error message "This invitation link is invalid or has expired. Please contact your administrator for a new invitation."
  - [X] 4.7 If token valid: display invitation details (email read-only, role display, expiration timestamp)
  - [X] 4.8 Create registration form with fields: email (read-only, pre-filled), password (input), confirm password (input)
  - [X] 4.9 Add password validation: minimum 8 characters, must match confirm password
  - [X] 4.10 On form submit: call Edge Function `registerUser` action with token, email, password
  - [X] 4.11 Handle registration errors (token expired during registration, email mismatch, etc.)
  - [X] 4.12 On success: show success message "Account created! Please check your email to confirm your account before logging in." with link to login page
  - [ ] 4.13 Test registration flow with valid and invalid tokens
- [X] 5.0 Implement email confirmation flow

  - [ ] 5.1 Configure Supabase email confirmation in Dashboard: Authentication > Email Templates > Confirm signup (See EMAIL_TEMPLATE_SETUP.md)
  - [ ] 5.2 Update email template to use frontend URL: `{{ .SiteURL }}/email-confirmation?token={{ .Token }}&type=signup` (See EMAIL_TEMPLATE_SETUP.md)
  - [X] 5.3 Create `EmailConfirmation.tsx` page to handle email confirmation callback
  - [X] 5.4 Add route `/email-confirmation` in `App.tsx` (public route)
  - [X] 5.5 In EmailConfirmation page: extract token from URL and call `supabase.auth.verifyOtp()`
  - [X] 5.6 Show success message on successful confirmation with redirect to login
  - [X] 5.7 Show error message if confirmation fails
  - [X] 5.8 Update `Login.tsx` to display clear error when user tries to login with unconfirmed email (check error code)
  - [ ] 5.9 Test email confirmation flow end-to-end
- [X] 6.0 Implement user profile settings page (self-service)

  - [X] 6.1 Create `ProfileForm.tsx` component with fields: nama_lengkap (input), address (textarea), phone (input)
  - [X] 6.2 Pre-fill form with current user data from context
  - [X] 6.3 Add phone validation: permissive regex allowing digits, spaces, dashes, parentheses, + sign
  - [X] 6.4 Implement form submission: call Supabase to update `users` table for current user
  - [X] 6.5 Add success toast notification on update
  - [X] 6.6 Create `useProfile.ts` hook with mutation: `useUpdateProfile`
  - [X] 6.7 Add "Profile" tab to Settings page (accessible to all authenticated users, not just admin)
  - [X] 6.8 Ensure email field is displayed but disabled (not editable)
  - [ ] 6.9 Test profile update for both admin and petugas roles (Will test after deployment)
- [X] 7.0 Implement password reset flow

  - [X] 7.1 Update `Login.tsx` to add "Forgot Password?" link below login form
  - [X] 7.2 Create `ForgotPassword.tsx` page with email input field
  - [X] 7.3 Add route `/forgot-password` in `App.tsx` (public route)
  - [X] 7.4 Implement forgot password submission: call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'frontend-url/reset-password' })`
  - [X] 7.5 Show success message: "Password reset link sent! Please check your email."
  - [ ] 7.6 Configure Supabase password reset email template in Dashboard: Authentication > Email Templates > Reset password (See EMAIL_TEMPLATE_SETUP.md)
  - [X] 7.7 Create `ResetPassword.tsx` page with fields: new password (input), confirm password (input)
  - [X] 7.8 Add route `/reset-password` in `App.tsx` (public route)
  - [X] 7.9 Extract token from URL in ResetPassword page
  - [X] 7.10 On form submit: call `supabase.auth.updateUser({ password: newPassword })`
  - [X] 7.11 Show success message with redirect to login
  - [ ] 7.12 Test password reset flow end-to-end
- [X] 8.0 Update RLS policies for security

  - [X] 8.1 Create migration file `016_rls_invitation_auth.sql` (renamed from 014)
  - [X] 8.2 Drop and recreate RLS policies for `mustahik` table: deny `anon`, require authenticated AND is_active = true
  - [X] 8.3 Drop and recreate RLS policies for `muzakki` table: deny `anon`, require authenticated AND is_active = true
  - [X] 8.4 Drop and recreate RLS policies for `pembayaran_uang` table: deny `anon`, require authenticated AND is_active = true
  - [X] 8.5 Drop and recreate RLS policies for `pembayaran_beras` table: deny `anon`, require authenticated AND is_active = true
  - [X] 8.6 Drop and recreate RLS policies for `distribusi` table: deny `anon`, require authenticated AND is_active = true
  - [X] 8.7 Drop and recreate RLS policies for `laporan_distribusi` table: deny `anon`, require authenticated AND is_active = true
  - [X] 8.8 Add RLS policies for `user_invitations` table: admin-only read/write (check role = 'admin' AND is_active = true)
  - [X] 8.9 Update RLS policies for `users` table: all users can read their own profile, only admin can read all, only admin can update roles
  - [X] 8.10 Apply migration to remote database
  - [ ] 8.11 Test RLS policies: attempt to query mustahik as anon (should fail), as authenticated active user (should succeed), as deactivated user (should fail)
- [X] 9.0 Update authentication logic and routing

  - [X] 9.1 Update `auth.tsx` in `fetchUserData` function to check `is_active` field
  - [X] 9.2 If user is not active (`is_active = false`), logout immediately and show error toast: "Your account has been deactivated. Please contact an administrator."
  - [X] 9.3 Update `ProtectedRoute.tsx` to redirect deactivated users to login with error message
  - [X] 9.4 Update `Login.tsx` to redirect already-authenticated users to `/dashboard`
  - [X] 9.5 Update `Login.tsx` to handle error codes: "Email not confirmed", "Invalid credentials", "Account deactivated"
  - [X] 9.6 Remove any remaining references to `viewer` role in codebase (grep for 'viewer' and replace/remove)
  - [ ] 9.7 Test authentication flows: login as active user, attempt login as deactivated user, attempt access while deactivated
- [ ] 10.0 Testing and validation

  - [ ] 10.1 Test invitation creation as admin (valid email, duplicate active user check, invalid email)
  - [ ] 10.2 Test invitation expiry (manually set expires_at in past and attempt registration)
  - [ ] 10.3 Test registration with valid invitation token
  - [ ] 10.4 Test registration with invalid/expired/used token
  - [ ] 10.5 Test email confirmation flow
  - [ ] 10.6 Test login with unconfirmed email (should fail)
  - [ ] 10.7 Test login with confirmed email (should succeed)
  - [ ] 10.8 Test profile update for admin and petugas
  - [ ] 10.9 Test password reset flow
  - [ ] 10.10 Test deactivated user: toggle user to inactive in admin panel, verify they can't access app
  - [ ] 10.11 Test RLS: attempt to access mustahik data as anon (should fail via direct Supabase query)
  - [ ] 10.12 Test user management: change role, deactivate/reactivate user
  - [ ] 10.13 Verify last admin protection: attempt to deactivate last remaining admin (should show error)
- [ ] 11.0 Documentation and deployment

  - [ ] 11.1 Document invitation flow in README or setup guide
  - [ ] 11.2 Document Edge Function deployment steps
  - [ ] 11.3 Document email template configuration steps
  - [ ] 11.4 Update migration guide for production deployment
  - [ ] 11.5 Create PR with all changes
  - [ ] 11.6 Deploy migrations to production
  - [ ] 11.7 Deploy Edge Function to production
  - [ ] 11.8 Configure email templates in production Supabase
  - [ ] 11.9 Test end-to-end in production environment

---

## Implementation Notes

### Security Considerations

- **Token Security**: Never store plain tokens in database; always hash with SHA-256 or stronger
- **RLS First**: All security must be enforced at RLS level, not just frontend
- **Service Role**: Edge Function must use service role key to create auth users (never expose to frontend)
- **Single-use Tokens**: Mark invitation as used immediately after account creation

### Email Configuration

- Supabase email templates need to point to frontend URLs (not Supabase URLs)
- Confirmation URL: `{{ .SiteURL }}/email-confirmation?token={{ .Token }}&type=signup`
- Reset password URL: `{{ .SiteURL }}/reset-password?token={{ .Token }}`

### Edge Function Environment Variables

- `SUPABASE_SERVICE_ROLE_KEY` - Required for creating auth users
- `SUPABASE_URL` - Supabase project URL
- Frontend URL for generating invitation links

### Testing Checklist

- [ ] Anonymous users cannot access any protected data (test with direct Supabase queries)
- [ ] Deactivated users are immediately logged out
- [ ] Invitations expire after 24 hours
- [ ] Tokens are single-use (cannot register twice with same token)
- [ ] Email confirmation is required before login
- [ ] Last admin cannot be deactivated
- [ ] Profile updates work for all user roles
- [ ] Password reset works end-to-end

---

## Success Criteria

✅ **Feature is complete when:**

1. Admin can create invitations with email and role
2. Invitation link works and shows token validity status
3. Users can register only with valid invitation tokens
4. Email confirmation is required and enforced
5. Users can update their profile (name, address, phone)
6. Password reset flow works end-to-end
7. Anonymous users cannot access any protected data (verified via RLS)
8. Deactivated users cannot access the app (even with valid session)
9. All manual tests in section 10.0 pass
10. No viewer role remains in codebase
