# Testing Checklist: Invitation Auth System

Complete testing checklist for the Invitation-Only Authentication + User Management + Profile Settings feature.

## Prerequisites

- ✅ Migrations 013 and 014 applied successfully
- ✅ Edge Function `invitation-manager` deployed
- ✅ Environment variables configured
- ✅ Email templates configured
- ✅ At least one admin user with `is_active = true` exists

## Test Environment Setup

### Create Test Data

```sql
-- Ensure you have an active admin user
UPDATE public.users 
SET role = 'admin', is_active = true 
WHERE email = 'admin@test.com';

-- Create a test petugas user
INSERT INTO public.users (id, email, nama_lengkap, role, is_active)
VALUES (
  'uuid-for-test-petugas',
  'petugas@test.com',
  'Test Petugas',
  'petugas',
  true
);

-- Create an inactive user for testing
INSERT INTO public.users (id, email, nama_lengkap, role, is_active)
VALUES (
  'uuid-for-inactive-user',
  'inactive@test.com',
  'Inactive User',
  'petugas',
  false
);
```

---

## Test Suite 1: Admin Invitation Management

### Test 1.1: Create Invitation (Admin)

**Preconditions:** Logged in as admin

**Steps:**
1. Navigate to Settings → Invitations tab
2. Click "Create Invitation" button
3. Enter email: `newuser@example.com`
4. Select role: `Petugas`
5. Click "Create"

**Expected Results:**
- ✅ Modal shows success message
- ✅ Invitation link displayed with copy button
- ✅ Link format: `http://localhost:5173/register?token=...`
- ✅ Token is URL-safe (only alphanumeric and dashes)
- ✅ New row appears in invitations table with status "Pending"
- ✅ Expiry shows "in 24 hours"

**Database Verification:**
```sql
SELECT email, role, expires_at, used_at, revoked_at
FROM public.user_invitations
WHERE email = 'newuser@example.com'
ORDER BY created_at DESC
LIMIT 1;
```
Should show: email, role, expires_at (24 hrs from now), used_at (null), revoked_at (null)

---

### Test 1.2: Create Invitation - Duplicate Email

**Preconditions:** Email already exists as active user

**Steps:**
1. Try to create invitation with existing user's email (e.g., `admin@test.com`)

**Expected Results:**
- ✅ Error message: "User with this email already exists"
- ✅ No invitation created in database
- ✅ Form remains open for correction

---

### Test 1.3: Create Invitation - Invalid Email Format

**Steps:**
1. Enter invalid email: `notanemail`
2. Click "Create"

**Expected Results:**
- ✅ Form validation error: "Email tidak valid"
- ✅ Submit button disabled or error shown
- ✅ No API call made

---

### Test 1.4: Revoke Invitation

**Preconditions:** At least one pending invitation exists

**Steps:**
1. Find pending invitation in table
2. Click "Revoke" button
3. Confirm in dialog

**Expected Results:**
- ✅ Status changes from "Pending" to "Revoked"
- ✅ Revoke button disappears
- ✅ Re-invite button appears
- ✅ Success toast notification

**Database Verification:**
```sql
SELECT revoked_at 
FROM public.user_invitations 
WHERE email = 'newuser@example.com';
```
Should show timestamp, not null.

---

### Test 1.5: Re-invite After Revoke

**Preconditions:** Revoked invitation exists

**Steps:**
1. Click "Re-invite" button on revoked invitation
2. Confirm action

**Expected Results:**
- ✅ New invitation created with same email
- ✅ New token generated (different from old one)
- ✅ New expiry date (24 hours from now)
- ✅ Old invitation remains revoked
- ✅ New invitation shows as "Pending"

**Database Verification:**
```sql
SELECT email, token_hash, created_at, revoked_at
FROM public.user_invitations
WHERE email = 'newuser@example.com'
ORDER BY created_at DESC
LIMIT 2;
```
Should show 2 rows: one revoked (old), one pending (new).

---

### Test 1.6: View Invitation Table

**Preconditions:** Multiple invitations with different statuses

**Steps:**
1. Navigate to Settings → Invitations tab
2. Review table contents

**Expected Results:**
- ✅ All invitations displayed (pending, used, expired, revoked)
- ✅ Status badges color-coded:
  - Pending: Yellow/Warning
  - Used: Green/Success
  - Expired: Red/Destructive
  - Revoked: Gray/Secondary
- ✅ Dates formatted correctly (e.g., "14 Jan 2025")
- ✅ Actions shown appropriately:
  - Pending: Revoke button
  - Revoked: Re-invite button
  - Used/Expired: No actions

---

### Test 1.7: Invitation Access - Non-Admin

**Preconditions:** Logged in as petugas (not admin)

**Steps:**
1. Navigate to Settings page

**Expected Results:**
- ✅ "Invitations" tab is NOT visible
- ✅ Only "Profile" and "System Settings" tabs shown
- ✅ Attempting to access invitation API returns error

---

## Test Suite 2: User Registration

### Test 2.1: Register with Valid Token

**Preconditions:** Valid, unused invitation token obtained

**Steps:**
1. Open invitation link in browser (logged out)
2. Verify invitation details displayed:
   - Email
   - Role
   - Expiry
3. Enter name: `John Doe`
4. Enter password: `SecurePass123!`
5. Confirm password: `SecurePass123!`
6. Click "Register"

**Expected Results:**
- ✅ Loading state shown during registration
- ✅ Success message: "Registration successful!"
- ✅ Redirect to login page after 2-3 seconds
- ✅ User can log in with credentials

**Database Verification:**
```sql
-- Check auth.users
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'newuser@example.com';

-- Check public.users
SELECT email, nama_lengkap, role, is_active 
FROM public.users 
WHERE email = 'newuser@example.com';

-- Check invitation marked as used
SELECT used_at 
FROM public.user_invitations 
WHERE email = 'newuser@example.com' 
AND used_at IS NOT NULL;
```
Should show user created, invitation marked as used.

---

### Test 2.2: Register with Expired Token

**Preconditions:** Invitation with `expires_at` in the past

**Setup:**
```sql
-- Manually expire an invitation for testing
UPDATE public.user_invitations
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE email = 'expired@example.com'
AND used_at IS NULL;
```

**Steps:**
1. Access registration page with expired token

**Expected Results:**
- ✅ Error message: "Invitation has expired"
- ✅ No registration form shown
- ✅ "Back to Login" button visible

---

### Test 2.3: Register with Used Token

**Preconditions:** Invitation already used (used_at IS NOT NULL)

**Steps:**
1. Try to access registration page with previously used token

**Expected Results:**
- ✅ Error message: "Invitation has already been used"
- ✅ No registration form shown
- ✅ Redirect to login page

---

### Test 2.4: Register with Invalid Token

**Steps:**
1. Access `/register?token=invalid-token-xyz123`

**Expected Results:**
- ✅ Error message: "Invalid invitation token"
- ✅ No registration form shown

---

### Test 2.5: Register - Password Mismatch

**Preconditions:** Valid invitation link

**Steps:**
1. Enter password: `Password123!`
2. Enter confirm password: `DifferentPass456!`
3. Click "Register"

**Expected Results:**
- ✅ Form validation error: "Passwords do not match"
- ✅ Registration not attempted
- ✅ Form fields remain filled

---

### Test 2.6: Register - Weak Password

**Steps:**
1. Enter password: `123`
2. Click "Register"

**Expected Results:**
- ✅ Form validation error: "Password minimal 8 karakter"
- ✅ Registration blocked

---

## Test Suite 3: Profile Settings

### Test 3.1: View Own Profile (All Users)

**Preconditions:** Logged in as any user (admin or petugas)

**Steps:**
1. Navigate to Settings → Profile tab

**Expected Results:**
- ✅ Form pre-filled with current user data:
  - Name
  - Email (shown as disabled field)
  - Address
  - Phone
- ✅ "Save Changes" button visible

---

### Test 3.2: Update Profile - Success

**Steps:**
1. Change name to: `Updated Name`
2. Enter address: `Jl. Test No. 123`
3. Enter phone: `+62 812-3456-7890`
4. Click "Save Changes"

**Expected Results:**
- ✅ Loading state during save
- ✅ Success toast: "Profile updated successfully"
- ✅ Form fields updated with new values
- ✅ Changes persist after page refresh

**Database Verification:**
```sql
SELECT nama_lengkap, address, phone 
FROM public.users 
WHERE id = 'current-user-id';
```
Should show updated values.

---

### Test 3.3: Update Profile - Invalid Phone

**Steps:**
1. Enter phone: `abcdefg`
2. Click "Save Changes"

**Expected Results:**
- ✅ Form validation error: "Format nomor telepon tidak valid"
- ✅ Save blocked

---

### Test 3.4: Profile Self-Service Restriction

**Preconditions:** Logged in as non-admin

**Test:**
Try to directly update role or is_active via API (using browser devtools)

```javascript
// In browser console
fetch('/api/update-profile', {
  method: 'POST',
  body: JSON.stringify({
    role: 'admin', // Try to escalate privilege
    is_active: true
  })
})
```

**Expected Results:**
- ✅ RLS policy blocks the update
- ✅ Role and is_active remain unchanged
- ✅ Error returned from API

---

## Test Suite 4: Authentication Flow

### Test 4.1: Login - Active User

**Steps:**
1. Navigate to `/login`
2. Enter active user credentials
3. Click "Sign In"

**Expected Results:**
- ✅ Successful login
- ✅ Redirect to Dashboard
- ✅ User session established

---

### Test 4.2: Login - Inactive User

**Preconditions:** User with `is_active = false` exists

**Steps:**
1. Try to log in as inactive user

**Expected Results:**
- ✅ Login succeeds initially (Supabase Auth allows it)
- ✅ Immediately redirected to login page
- ✅ Error message: "Your account has been deactivated"
- ✅ Session cleared

---

### Test 4.3: Login - Email Not Confirmed

**Preconditions:** User registered but hasn't confirmed email

**Steps:**
1. Register new user (get invitation, complete registration)
2. Do NOT click email confirmation link
3. Try to log in

**Expected Results:**
- ✅ Login blocked
- ✅ Error message: "Please confirm your email address"
- ✅ Instruction to check email

---

### Test 4.4: Login - Invalid Credentials

**Steps:**
1. Enter wrong password

**Expected Results:**
- ✅ Error message: "Invalid email or password"
- ✅ Login blocked

---

### Test 4.5: Email Confirmation

**Preconditions:** User registered, confirmation email received

**Steps:**
1. Click confirmation link from email
2. Redirected to `/email-confirmation?token=...&type=signup`

**Expected Results:**
- ✅ Loading indicator shown
- ✅ Email verified in Supabase Auth
- ✅ Success message: "Email Confirmed!"
- ✅ "Go to Login" button works
- ✅ User can now log in successfully

---

### Test 4.6: Forgot Password

**Steps:**
1. Click "Forgot password?" on login page
2. Enter email: `test@example.com`
3. Click "Send Reset Link"

**Expected Results:**
- ✅ Success message: "Check your email for reset link"
- ✅ Email sent to user (check inbox/spam)
- ✅ Email contains reset link

---

### Test 4.7: Reset Password

**Steps:**
1. Click reset link from email
2. Redirected to `/reset-password?token=...`
3. Enter new password: `NewPassword456!`
4. Confirm password: `NewPassword456!`
5. Click "Reset Password"

**Expected Results:**
- ✅ Success message: "Password reset successful"
- ✅ Redirect to login page
- ✅ Can log in with new password
- ✅ Old password no longer works

---

### Test 4.8: Auto-Redirect When Logged In

**Preconditions:** Already logged in

**Steps:**
1. Try to access `/login` while logged in

**Expected Results:**
- ✅ Immediately redirected to Dashboard
- ✅ No login form shown

---

## Test Suite 5: Row-Level Security (RLS)

### Test 5.1: Anonymous Access Blocked

**Preconditions:** Logged out

**Test via Browser DevTools:**
```javascript
// Try to query data without auth
const { data, error } = await supabase
  .from('muzakki')
  .select('*');

console.log('Data:', data); // Should be [] or error
console.log('Error:', error); // Should show auth error
```

**Expected Results:**
- ✅ No data returned
- ✅ Error indicates authentication required
- ✅ RLS policy blocks access

---

### Test 5.2: Authenticated Active User Access

**Preconditions:** Logged in as active user

**Test:**
Navigate dashboard, view muzakki, mustahik, pembayaran, distribusi pages

**Expected Results:**
- ✅ All data loads successfully
- ✅ Can create, read, update records
- ✅ No RLS errors

---

### Test 5.3: Inactive User Access Blocked

**Preconditions:**
- User logged in
- Admin sets `is_active = false` for that user

**Test:**
Try to access any data page

**Expected Results:**
- ✅ Access blocked immediately
- ✅ Redirected to login
- ✅ Error: "Account deactivated"
- ✅ Session cleared

---

### Test 5.4: User Invitations - Admin Only

**Preconditions:** Logged in as petugas (not admin)

**Test via DevTools:**
```javascript
// Try to query invitations as non-admin
const { data, error } = await supabase
  .from('user_invitations')
  .select('*');
```

**Expected Results:**
- ✅ Empty array or RLS error
- ✅ Only admins can see invitations table
- ✅ Policy blocks non-admin access

---

### Test 5.5: Self-Profile Read Access

**Test:**
All authenticated users should read their own profile

```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', currentUserId);
```

**Expected Results:**
- ✅ Own profile returned
- ✅ Cannot read other users' profiles (non-admin)

---

## Test Suite 6: Edge Function

### Test 6.1: Create Invitation (Edge Function)

**Test with curl:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager' \
  -H 'Authorization: Bearer YOUR_ADMIN_JWT' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "createInvitation",
    "email": "newuser@example.com",
    "role": "petugas"
  }'
```

**Expected Results:**
- ✅ 200 OK status
- ✅ Response includes `invitationLink` and `expiresAt`
- ✅ Token is unique and URL-safe
- ✅ Database record created

---

### Test 6.2: Validate Invitation (Edge Function)

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "validateInvitation",
    "token": "TOKEN_HERE"
  }'
```

**Expected Results:**
- ✅ Returns invitation details if valid
- ✅ Returns error if expired/used/invalid

---

### Test 6.3: Register User (Edge Function)

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "registerUser",
    "token": "TOKEN_HERE",
    "password": "SecurePass123!",
    "nama_lengkap": "John Doe"
  }'
```

**Expected Results:**
- ✅ User created in auth.users
- ✅ Profile created in public.users
- ✅ Invitation marked as used
- ✅ Token cannot be reused

---

## Test Suite 7: User Management (Admin)

### Test 7.1: Admin Views All Users

**Preconditions:** Logged in as admin

**Steps:**
1. Navigate to Settings → System Settings → Manage Users

**Expected Results:**
- ✅ All users displayed in table
- ✅ Shows: name, email, role, status (active/inactive)
- ✅ Edit and deactivate buttons visible

---

### Test 7.2: Admin Edits User

**Steps:**
1. Click edit button for a user
2. Change role from petugas to admin
3. Save

**Expected Results:**
- ✅ Role updated in database
- ✅ Success notification
- ✅ Changes visible in table

---

### Test 7.3: Admin Deactivates User

**Steps:**
1. Click deactivate button for active user
2. Confirm action

**Expected Results:**
- ✅ User's `is_active` set to false
- ✅ Status badge changes to "Inactive"
- ✅ Button changes to "Activate"
- ✅ That user is immediately logged out if currently logged in

---

### Test 7.4: Admin Reactivates User

**Steps:**
1. Click activate button for inactive user
2. Confirm action

**Expected Results:**
- ✅ User's `is_active` set to true
- ✅ User can log in again
- ✅ Status badge shows "Active"

---

## Test Suite 8: Security

### Test 8.1: Token Hashing

**Database Verification:**
```sql
SELECT token_hash 
FROM public.user_invitations 
LIMIT 1;
```

**Expected:**
- ✅ `token_hash` is SHA-256 hash (64 characters, hex)
- ✅ NOT the plain token
- ✅ Cannot reverse token from hash

---

### Test 8.2: Service Role Key Security

**Check:**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` only in Edge Function environment variables
- ✅ NOT in frontend code
- ✅ NOT in git repository
- ✅ NOT in browser localStorage/sessionStorage

---

### Test 8.3: CORS Headers

**Test Edge Function from different origin:**
```javascript
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ANON_KEY'
  },
  body: JSON.stringify({ action: 'validateInvitation', token: 'test' })
});
```

**Expected Results:**
- ✅ CORS headers present in response
- ✅ No CORS errors in browser console

---

## Test Suite 9: Edge Cases

### Test 9.1: Concurrent Registration

**Steps:**
1. Open invitation link in two browser tabs simultaneously
2. Submit registration in both tabs at same time

**Expected Results:**
- ✅ One succeeds
- ✅ One fails with "invitation already used" error
- ✅ Only one user created in database

---

### Test 9.2: Special Characters in Name

**Steps:**
1. Enter name with special chars: `Muḥammad O'Brien-Smith`
2. Complete registration

**Expected Results:**
- ✅ Registration succeeds
- ✅ Name stored correctly with all characters

---

### Test 9.3: Very Long Email

**Steps:**
1. Try email with 255+ characters

**Expected Results:**
- ✅ Form validation limits length OR
- ✅ Database handles gracefully

---

### Test 9.4: Time Zone Handling

**Verify:**
- ✅ All timestamps stored as UTC in database
- ✅ Expiry calculations account for time zones
- ✅ Displayed dates use browser's locale

---

## Summary Checklist

Review and mark each category as complete:

- [ ] **Suite 1:** Admin Invitation Management (7 tests)
- [ ] **Suite 2:** User Registration (6 tests)
- [ ] **Suite 3:** Profile Settings (4 tests)
- [ ] **Suite 4:** Authentication Flow (8 tests)
- [ ] **Suite 5:** Row-Level Security (5 tests)
- [ ] **Suite 6:** Edge Function (3 tests)
- [ ] **Suite 7:** User Management (4 tests)
- [ ] **Suite 8:** Security (3 tests)
- [ ] **Suite 9:** Edge Cases (4 tests)

**Total Tests:** 44

## Bug Reporting Template

If a test fails, use this template:

```
**Test Failed:** [Test ID and Name]
**Environment:** [Local/Dev/Prod]
**User Role:** [Admin/Petugas/Anon]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots/Logs:**

**Database State:**
```sql
-- Relevant query showing issue
```

**Priority:** [Critical/High/Medium/Low]
```

## Production Readiness

Before marking feature complete, verify:

- [ ] All 44 tests pass
- [ ] No console errors in browser
- [ ] No errors in Edge Function logs
- [ ] Database migrations applied successfully
- [ ] RLS policies verified with actual queries
- [ ] Email templates configured and tested
- [ ] Security review complete (service role key, token hashing, RLS)
- [ ] Documentation complete (MIGRATION_GUIDE, EDGE_FUNCTION_DEPLOYMENT)
- [ ] User feedback collected (if possible)

---

**Testing Last Updated:** [Date]  
**Tested By:** [Name]  
**Status:** [Not Started / In Progress / Complete]
