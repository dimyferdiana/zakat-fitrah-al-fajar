# PRD: Authentication + Invitation-Only Registration + User Management + Profile Settings

## 1. Introduction / Overview

The app currently allows a "viewer" (no login) to access parts of the system. This creates a privacy/security risk, especially for sensitive data such as Mustahik information.

This PRD introduces **mandatory authentication** for all non-public pages and implements **invitation-only registration** restricted to two roles: **admin** and **petugas**. It also adds:

- **User Management** (admin-only): invite users, change roles (admin/petugas), and remove/deactivate accounts.
- **User Profile Settings** (self-service): change name, address, and phone number (email and profile photo cannot be changed).

Primary security requirement: **unauthenticated users must not be able to access any Mustahik data**. Additionally, all sensitive app data must be protected by backend authorization (RLS), not only by frontend route guards.

## 2. Goals

- Enforce login for access to the app (remove anonymous viewer access).
- Allow only admin to onboard users via invitation links (expires in 24 hours).
- Ensure registration is possible only for invited emails, and results in an **admin** or **petugas** account.
- Require email confirmation before the new account can log in.
- Provide admin tools to manage users (role change, deactivation/removal).
- Provide a profile page for users to update non-sensitive personal info (name/address/phone).

## 3. User Stories

- As an admin, I want to invite a new admin or petugas by email so that only trusted staff can access the app.
- As an invited user, I want to open an invitation link and register using my invited email and a password so I can access the dashboard.
- As an invited user, I want to confirm my email via a link so that my account becomes active.
- As a petugas, I want to log in and use the app to manage Zakat/Sedekah operations without seeing admin-only settings.
- As an admin, I want to view a list of users and change a user's role between admin and petugas so I can control permissions.
- As an admin, I want to deactivate/remove a user's access so former staff cannot use the app.
- As a logged-in user, I want to update my name, address, and phone number from a profile settings page without changing my email or profile photo.

## 4. Functional Requirements

### 4.1 Roles and Access Control

1. The system must support exactly two roles: `admin` and `petugas`.
2. The system must remove the `viewer` role and any anonymous access paths that previously allowed data access without login.
3. The system must require authentication for all application routes except:
   - Login page
   - Invitation registration page (only when a valid invitation token is present)
   - Email confirmation handling page (if applicable)
4. The system must enforce access control in both layers:
   - Frontend routing (redirect unauthenticated users to `/login`)
   - Backend database authorization (Row Level Security / RLS)
5. The system must ensure unauthenticated users cannot access **any Mustahik information** (list, detail, search, exports, API queries, etc.).
6. The system must ensure unauthenticated users cannot access other private app data (Muzakki, pembayaran, distribusi, laporan, settings, etc.); auth pages are the only allowed unauthenticated surfaces.
7. The system must restrict admin-only pages/features (e.g., User Management) to role `admin`.
8. The system must deny all reads/writes for deactivated users (even if they still have a valid auth session).

### 4.2 Admin Invitation Flow (Invitation-Only Registration)

9. The system must provide an admin-only UI to create an invitation with:
   - Invitee email
   - Intended role: `admin` or `petugas`
   - Expiration: 24 hours from creation (fixed)
10. The system must generate an invitation link that contains a secure token (single-use).
11. The system must allow the admin to copy the invitation link to send to the invitee (out of app).
12. The system must prevent creating invitations for invalid emails (basic email format validation).
13. The system must normalize email addresses for matching (case-insensitive comparison).
14. The system must display invitation status in admin UI (at minimum):

- `pending` (not used, not expired)
- `used`
- `expired`

15. The system should allow an admin to revoke an unused invitation before expiration.
16. The system should allow an admin to re-invite the same email (new token, new 24h window).
17. The system should prevent accidental invitation spam by implementing a basic rate limit (at least in UI: disable rapid re-submit; ideally also backend).
18. The system should prevent inviting an email that is already registered and active; the UI should show a clear message and recommend "Change role" instead (admin action).
19. The system should allow inviting an email that is registered but deactivated only if admin explicitly chooses "reactivate" (exact behavior depends on deactivation strategy).

### 4.3 Registration From Invitation Link

20. The system must provide a registration page reachable only via a valid invitation token.
21. The registration page must require:

- Email (must match invited email; read-only or validated strictly)
- Password
- Confirm password

22. The system must validate password and confirm password match before submission.
23. The system must reject registration if:

- Token is invalid
- Token is expired
- Token has already been used
- Email does not match the invitation email

24. On successful registration submission, the system must:

- Create the auth account using the invited email
- Assign the invited role (`admin` or `petugas`)
- Mark the invitation as `used` (single-use)

25. The system must send an email confirmation message to the registered email.
26. The system must prevent login until the email is confirmed.
27. After email confirmation, the user must be able to log in and be redirected to the correct landing page (dashboard).
28. The system must show clear UX states on the invitation registration page:

- Loading/validating token
- Token valid (show email + role + expiration timestamp)
- Token expired/used/invalid (and next-step instruction: contact admin)

### 4.4 Login / Logout

29. The system must provide login using email + password.
30. The system must provide logout and terminate the current session on logout.
31. The system must handle common auth errors with clear UI messaging:

- Wrong credentials
- Email not confirmed
- Account deactivated/removed

32. The system should redirect already-authenticated users away from login/register screens to the dashboard.

### 4.5 User Management (Admin-Only)

33. The system must provide an admin-only "User Management" settings page.
34. The page must list users with (minimum):

- Name (if available)
- Email
- Role (`admin` or `petugas`)
- Status (`active` / `deactivated`)
- Created date (optional)

35. The system must allow admin to change a user's role between `admin` and `petugas`.
36. The system must allow admin to remove access for a user (deactivate or delete; see Open Questions).
37. The system must prevent an admin from accidentally locking the system by removing the last remaining active admin account.
38. The system should record an audit trail for:

- Invitation creation/revocation/use
- Role changes
- Deactivation/removal actions

39. The system should provide a separate tab/section to manage invitations (list + revoke + re-invite).

### 4.6 User Profile Settings (Self-Service)

40. The system must provide a "Profile" settings page for the logged-in user.
41. The profile page must allow updating:

- Full name
- Address
- Phone number (contact)

42. The profile page must not allow changing:

- Email
- Profile photo

43. The system must validate phone input with permissive rules (digits, spaces, +) and store as a normalized string (formatting rules are technical).

### 4.7 Migration / Compatibility

44. The system must define a migration strategy for existing `viewer` accounts:

- Default behavior should be safe (no anonymous access; viewers should not be able to access Mustahik).
- Admin must be able to deactivate or convert specific accounts to `petugas`/`admin`.

45. The system must ensure no existing route remains accessible without authentication after the change (except auth flows).

## 5. Non-Goals (Out of Scope)

- Public registration without invitation.
- A `viewer` role or any anonymous data access.
- Social login (Google, etc.) or SSO.
- Profile photo upload and management.
- Allowing users to change their email address.
- Complex permission matrices beyond `admin` vs `petugas`.

## 6. Design Considerations

- Add an authenticated shell that redirects unauthenticated users to `/login`.
- Registration UX:
  - Invitation link landing page should clearly show: invited email, role, expiration time, and token validity status.
  - Expired/used token pages should provide a clear failure state and instruction: "Contact admin to request a new invitation."
- Add Settings navigation entry for:
  - `User Management` (admin-only)
  - `Profile` (all authenticated users)

## 7. Technical Considerations (Suggested)

This section suggests an implementation approach; exact details may vary based on current codebase patterns.

- Auth provider: Supabase Auth (already used in the app).
- Store role and profile fields in the existing `public.users` table keyed by `auth.users.id` (current app pattern).
- Invitation storage:
  - Create a table like `user_invitations` with fields: `email`, `role`, `token_hash`, `expires_at`, `used_at`, `revoked_at`, `created_by`, timestamps.
  - Store only a hash of the token, never the raw token.
- Registration endpoint/server action must:
  - Validate token and email, check expiry/used/revoked
  - Create the auth user
  - Create/initialize profile with role + default fields
  - Mark invitation as used
- Backend requirement:
  - Client-side code cannot securely perform privileged auth operations (creating users, enforcing invite-only signup) without a trusted server component.
  - Recommended approach is to implement a Supabase Edge Function (service role) that performs: invite creation, token validation, account creation/activation, and role assignment.
- RLS (must be treated as source of truth):
  - Mustahik tables: deny all `anon` access; allow `authenticated` only; additionally require the caller to be an active user in `public.users`.
  - Other app tables: deny `anon` access; require active authenticated user.
  - User management tables: admin-only read/write (except self-profile reads/updates).
- Account deactivation:
  - Prefer soft-deactivation (e.g., `profiles.status = 'deactivated'`) and enforce it at session/authorization checks.
  - In this app's schema, prefer `public.users.is_active = false` and ensure RLS blocks all access when inactive.

## 8. Success Metrics

- 0 successful Mustahik data reads by unauthenticated sessions (verified by RLS and manual QA).
- 100% of new registrations happen via a valid invitation token.
- Invitation link expiry is enforced (registrations after 24h are rejected).
- Admin can change roles and deactivate accounts without breaking access for at least one admin user.

## 9. Open Questions

1. Password policy: minimum length only (e.g., 8+) or require complexity rules? YES
2. Account removal behavior: should "remove" mean hard delete auth user, or soft-deactivate with optional later deletion? Soft-deactivate
3. Password reset: should we enable "Forgot password" flow now? YES
4. Mustahik access: should `petugas` have full Mustahik access like today, or should Mustahik be admin-only? both, petugas and admin.
5. Invitation delivery: should invitations be sent by email automatically from the system, or only copy-link for admin to send manually? Only copy-link.
