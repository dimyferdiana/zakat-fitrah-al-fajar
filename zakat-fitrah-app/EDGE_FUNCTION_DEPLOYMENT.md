# Edge Function Deployment Guide

This guide explains how to deploy the `invitation-manager` Edge Function to Supabase.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created
- Admin access to Supabase Dashboard
- Migrations 013 and 014 applied successfully

## Edge Function Overview

**Name:** `invitation-manager`  
**Runtime:** Deno  
**Location:** `supabase/functions/invitation-manager/`

**Actions:**
- `createInvitation` - Generate invitation token and send email
- `validateInvitation` - Validate invitation token before registration
- `registerUser` - Complete user registration with invitation

## Deployment Steps

### Step 1: Verify Supabase CLI is Installed

```bash
supabase --version
```

If not installed:
```bash
npm install -g supabase
```

### Step 2: Link to Your Supabase Project

#### Option A: Using Project Reference (Recommended)

```bash
cd zakat-fitrah-app
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project reference in:
- Supabase Dashboard → Settings → General → Reference ID

#### Option B: Using Project URL

```bash
supabase link --project-url https://YOUR_PROJECT.supabase.co
```

**If you encounter authentication issues:**
The CLI may fail to authenticate. In that case, proceed to Manual Deployment (Step 8).

### Step 3: Set Environment Variables in Dashboard

Go to Supabase Dashboard → **Settings** → **Edge Functions** → **Environment Variables**

Add these variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `YOUR_ANON_KEY` | Found in Settings → API → Project API Keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `YOUR_SERVICE_ROLE_KEY` | Found in Settings → API → Project API Keys → `service_role` (⚠️ Keep secret!) |
| `FRONTEND_URL` | `http://localhost:5173` (dev) or `https://yourdomain.com` (prod) | Your frontend URL for generating invitation links |

⚠️ **Important:** The `service_role` key bypasses RLS and should NEVER be exposed to the frontend!

### Step 4: Deploy the Edge Function

```bash
cd zakat-fitrah-app
supabase functions deploy invitation-manager
```

**Expected Output:**
```
Deploying invitation-manager (project ref: YOUR_PROJECT_REF)
✓ Deployed invitation-manager function
```

### Step 5: Verify Deployment

Check if the function is deployed:

```bash
supabase functions list
```

Or in Supabase Dashboard:
- Go to **Edge Functions**
- You should see `invitation-manager` in the list

### Step 6: Test the Edge Function

#### Test 1: Create Invitation (Admin Only)

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "createInvitation",
    "email": "newuser@example.com",
    "role": "petugas"
  }'
```

**Expected Response (Success):**
```json
{
  "invitationLink": "http://localhost:5173/register?token=abc123...",
  "expiresAt": "2025-01-15T10:30:00.000Z"
}
```

**Expected Response (Error - Not Admin):**
```json
{
  "error": "Only admins can create invitations"
}
```

#### Test 2: Validate Invitation

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "validateInvitation",
    "token": "TOKEN_FROM_STEP_1"
  }'
```

**Expected Response:**
```json
{
  "valid": true,
  "email": "newuser@example.com",
  "role": "petugas",
  "expiresAt": "2025-01-15T10:30:00.000Z"
}
```

#### Test 3: Register User

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "registerUser",
    "token": "TOKEN_FROM_STEP_1",
    "password": "SecurePassword123!",
    "nama_lengkap": "Test User"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com"
  }
}
```

### Step 7: Check Edge Function Logs

**Via CLI:**
```bash
supabase functions logs invitation-manager
```

**Via Dashboard:**
1. Go to **Edge Functions** → `invitation-manager`
2. Click **Logs** tab
3. View real-time logs and errors

### Step 8: Manual Deployment (If CLI Fails)

If Supabase CLI authentication fails, you can deploy manually via Dashboard:

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create Function**
3. Name: `invitation-manager`
4. Copy contents of `supabase/functions/invitation-manager/index.ts`
5. Paste into the code editor
6. Click **Deploy**

**Limitation:** This won't include the `utils.ts` helper file. You'll need to inline those utilities into `index.ts`.

To inline utilities:
1. Copy all helper functions from `utils.ts`
2. Paste them at the top of `index.ts` (before the `serve()` call)
3. Remove the `import` statement for utils
4. Deploy the combined file

## Troubleshooting

### Error: "Function not found"

- Verify deployment succeeded: `supabase functions list`
- Check URL is correct: `https://YOUR_PROJECT.supabase.co/functions/v1/invitation-manager`
- Wait 1-2 minutes after deployment for propagation

### Error: "Invalid JWT"

- Check that you're using the correct `SUPABASE_ANON_KEY` in Authorization header
- Format: `Authorization: Bearer YOUR_ANON_KEY`

### Error: "Service role key not configured"

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Dashboard → Settings → Edge Functions → Environment Variables
- Restart the Edge Function after adding env vars (redeploy)

### Error: "Cannot create user"

- Verify migrations 013 and 014 are applied
- Check that `user_invitations` table exists
- Ensure invitation token is valid and not expired
- Check Edge Function logs for detailed error

### Error: "Email already exists"

The Edge Function checks for duplicate users. This is expected behavior when:
- A user with that email already exists in `auth.users`
- A user with that email already exists in `public.users`

Solution: Use a different email address or delete the existing user first.

## Updating the Edge Function

To update after making code changes:

```bash
cd zakat-fitrah-app
supabase functions deploy invitation-manager
```

Changes take effect immediately (within 1-2 minutes).

## Security Notes

1. **Never expose service role key** - It's only used in Edge Functions (server-side)
2. **Tokens are hashed** - Plain tokens never stored in database (SHA-256)
3. **24-hour expiry** - Invitations automatically expire
4. **Single-use tokens** - Once used, token is marked and cannot be reused
5. **Admin-only creation** - Only active admin users can create invitations
6. **Email validation** - Checks for duplicate users before creating invitation

## Production Checklist

Before going to production:

- [ ] Update `FRONTEND_URL` to production domain
- [ ] Verify all environment variables are set
- [ ] Test all three actions (create, validate, register)
- [ ] Configure Supabase email templates
- [ ] Test email confirmation flow
- [ ] Set up monitoring for Edge Function logs
- [ ] Document invitation workflow for admin users

## Email Templates Configuration

After deploying Edge Function, configure email templates:

Go to Supabase Dashboard → **Authentication** → **Email Templates**

### Confirm Signup Template

**Subject:** Confirm your email for Zakat Fitrah Al-Fajar

**Body:**
```html
<h2>Confirm your email</h2>
<p>Welcome to Zakat Fitrah Al-Fajar!</p>
<p>Click the link below to confirm your email address:</p>
<p><a href="{{ .SiteURL }}/email-confirmation?token={{ .Token }}&type=signup">Confirm Email</a></p>
<p>This link expires in 24 hours.</p>
```

Make sure to update `{{ .SiteURL }}` to match your `FRONTEND_URL`.

### Reset Password Template

**Subject:** Reset your password for Zakat Fitrah Al-Fajar

**Body:**
```html
<h2>Reset your password</h2>
<p>You requested to reset your password for Zakat Fitrah Al-Fajar.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/reset-password?token={{ .Token }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

## Support

If you encounter issues:
- Check Edge Function logs for detailed errors
- Verify environment variables are correctly set
- Ensure migrations are applied
- Test with curl commands before testing with frontend
- Check Supabase status: https://status.supabase.com/
