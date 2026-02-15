# Email Template Configuration Guide

This guide walks you through configuring email templates in your Supabase Dashboard for the invitation-based authentication system.

---

## 🎨 New! Professional Email Templates

**We've created beautiful, production-ready email templates for you!**

Located in: `email-templates/` folder
- ✅ `confirm-signup.html` - Email confirmation (Green theme)
- ✅ `reset-password.html` - Password reset (Red theme)
- ✅ `magic-link.html` - Passwordless login (Indigo theme)
- ✅ `invite-user.html` - User invitation (Blue theme)

**Features:**
- 📱 Mobile-responsive design
- 🎨 Beautiful gradient headers
- 🔘 Clear call-to-action buttons
- ✉️ Professional branding
- 🌐 Works across all email clients (Gmail, Outlook, Apple Mail)

**See:** `email-templates/README.md` for full documentation and implementation guide.

---

## Prerequisites

✅ **Completed:**
- Database migrations applied (013_user_invitations_schema.sql, 016_rls_invitation_auth.sql)
- Edge Function deployed (invitation-manager)
- Frontend application deployed to Vercel (or have your deployment URL ready)

📋 **You'll Need:**
- Your Supabase project URL: `https://zuykdhqdklsskgrtwejg.supabase.co`
- Your frontend deployment URL (e.g., `https://your-app.vercel.app` or `https://yourdomain.com`)

---

## Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Select your project: **zakat-fitrah-al-fajar**
4. Navigate to **Authentication** (in the left sidebar)
5. Click on **Email Templates**

---

## Step 2: Configure Site URL

Before configuring email templates, set your site URL:

1. In the Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your frontend deployment URL:
   ```
   https://zakat-fitrah-al-fajar.vercel.app
   ```
   *(Replace with your actual Vercel deployment URL)*

3. Add **Redirect URLs** (one per line):
   ```
   https://zakat-fitrah-al-fajar.vercel.app/**
   http://localhost:5173/**
   ```
   *(For both production and local development)*

4. Click **Save**

---

## Step 3: Configure "Confirm Signup" Email Template

This email is sent when a new user registers via invitation.

### Navigation:
- **Authentication** → **Email Templates** → **Confirm signup**

### Configuration:

1. **Subject Line:**
   ```
   Confirm Your Email - Zakat Fitrah Al Fajar
   ```

2. **Message Body (HTML):**
   
   📧 **Professional template available:** Copy the full HTML from `email-templates/confirm-signup.html`
   
   This template includes:
   - 🎨 Beautiful gradient header with brand colors (Green theme)
   - 📱 Mobile-responsive design
   - 🔘 Prominent CTA button
   - 📋 Alternative text link for compatibility
   - ⏱️ Clear expiry information (24 hours)
   - 🔒 Security messaging
   - ✉️ Professional footer

   **Quick Start (Basic HTML):**
   ```html
   <h2>Welcome to Zakat Fitrah Al Fajar!</h2>
   
   <p>Thank you for registering. Please confirm your email address to activate your account.</p>
   
   <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Confirm Email Address</a></p>
   
   <p>Or copy and paste this link into your browser:</p>
   <p style="color: #10b981;">{{ .SiteURL }}/email-confirmation?token_hash={{ .TokenHash }}&type=signup</p>
   
   <p>This link will expire in 24 hours.</p>
   
   <p>If you didn't register for this account, you can safely ignore this email.</p>
   
   <br>
   <p>Best regards,<br><strong>Zakat Fitrah Al Fajar Team</strong></p>
   ```

3. Click **Save**

### Template Variables Used:
- `{{ .ConfirmationURL }}` - Pre-built confirmation URL (recommended - most reliable)
- `{{ .SiteURL }}` - Your frontend URL (set in URL Configuration)
- `{{ .TokenHash }}` - Email confirmation token hash used by `verifyOtp`

> **💡 Pro Tip:** Use the professional template from `email-templates/confirm-signup.html` for a polished, mobile-responsive design that works across all email clients.

---

## Step 4: Configure "Reset Password" Email Template

This email is sent when a user requests a password reset.

### Navigation:
- **Authentication** → **Email Templates** → **Reset Password**

### Configuration:

1. **Subject Line:**
   ```
   Reset Your Password - Zakat Fitrah Al Fajar
   ```

2. **Message Body (HTML):**
   
   📧 **Professional template available:** Copy the full HTML from `email-templates/reset-password.html`
   
   This template includes:
   - 🎨 Beautiful gradient header with brand colors (Red theme for urgency)
   - 📱 Mobile-responsive design
   - 🔘 Prominent CTA button
   - 📋 Alternative text link for compatibility
   - ⏱️ Clear expiry information (1 hour)
   - 🔒 Enhanced security messaging and tips
   - ⚠️ Security warning box
   - ✉️ Professional footer

   **Quick Start (Basic HTML):**
   ```html
   <h2>Reset Your Password</h2>
   
   <p>You requested to reset your password for Zakat Fitrah Al Fajar.</p>
   
   <p><a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a></p>
   
   <p>Or copy and paste this link into your browser:</p>
   <p style="color: #ef4444;">{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery</p>
   
   <p><strong>This link will expire in 1 hour.</strong></p>
   
   <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
   
   <br>
   <p>Best regards,<br><strong>Zakat Fitrah Al Fajar Team</strong></p>
   ```

3. Click **Save**

### Template Variables Used:
- `{{ .SiteURL }}` - Your frontend URL
- `{{ .TokenHash }}` - Password reset token hash

> **💡 Pro Tip:** Use the professional template from `email-templates/reset-password.html` for enhanced security messaging and better user experience.

---

## Step 5: Configure "Magic Link" Email Template

This email is sent when a user requests passwordless login via magic link.

> **Note:** Magic link requires proper route configuration in your app. Only enable if you have implemented magic link authentication.

### Navigation:
- **Authentication** → **Email Templates** → **Magic Link**

### Configuration:

1. **Subject Line:**
   ```
   Your Login Link - Zakat Fitrah Al Fajar
   ```

2. **Message Body (HTML):**
   
   📧 **Professional template available:** Copy the full HTML from `email-templates/magic-link.html`
   
   This template includes:
   - 🎨 Beautiful gradient header with brand colors (Indigo/Purple theme)
   - 📱 Mobile-responsive design
   - 🔘 Prominent CTA button
   - ⚡ Benefits section explaining magic link advantages
   - 📋 Alternative text link for compatibility
   - ⏱️ Clear expiry information (5 minutes)
   - 🔒 Enhanced security warnings (one-time use)
   - ⚠️ Security notice about link sharing
   - ✉️ Professional footer

   **Quick Start (Basic HTML):**
   ```html
   <h2>Magic Link Login</h2>
   
   <p>Follow this link to login to your Zakat Fitrah Al Fajar account:</p>
   
   <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Log In</a></p>
   
   <p>Or copy and paste this link into your browser:</p>
   <p style="color: #6366f1;">{{ .ConfirmationURL }}</p>
   
   <p><strong>This link will expire in 5 minutes</strong> and can only be used once.</p>
   
   <p>If you didn't request this link, you can safely ignore this email.</p>
   
   <br>
   <p>Best regards,<br><strong>Zakat Fitrah Al Fajar Team</strong></p>
   ```

3. Click **Save**

### Template Variables Used:
- `{{ .ConfirmationURL }}` - Pre-built magic link URL (recommended - includes all necessary parameters)

> **💡 Pro Tip:** Use the professional template from `email-templates/magic-link.html` for a modern passwordless login experience with clear security messaging.

---

## Step 6: Test Email Templates

### Test Signup Confirmation:

1. Navigate to your app's invitation page (as admin)
2. Create a test invitation: `test@example.com` (use a real email you can access)
3. Copy the invitation link
4. Open invitation link in incognito/private browser window
5. Complete registration with a password
6. Check your email inbox for the confirmation email
7. Click the confirmation link
8. Verify you're redirected to `/email-confirmation` and see success message
9. Try logging in

### Test Password Reset:

1. Go to `/forgot-password` on your app
2. Enter your email address
3. Submit the form
4. Check your email for the password reset link
5. Click the reset password link
6. Verify you're redirected to `/reset-password`
7. Enter a new password
8. Submit and verify you can log in with the new password

---

## Common Issues & Troubleshooting

### Issue 1: Links in Email Point to Wrong URL

**Problem:** Email links go to `localhost` or wrong domain

**Solution:**
- Go to **Authentication** → **URL Configuration**
- Update **Site URL** to your production URL
- Save and test again

### Issue 2: Email Not Received

**Problem:** User doesn't receive confirmation email

**Possible causes:**
1. Email in spam/junk folder
2. Email provider blocking Supabase emails
3. Invalid email address

**Solutions:**
- Check spam folder
- Use a different email provider (Gmail, Outlook)
- Verify email address is valid
- Check Supabase logs: **Logs** → **Auth** in dashboard

### Issue 3: "Email not confirmed" Error on Login

**Problem:** User tries to log in but gets "Email not confirmed" error

**Solution:**
- This is expected behavior!
- User must click the confirmation link in their email first
- Resend confirmation email if needed:
  ```javascript
  await supabase.auth.resend({
    type: 'signup',
    email: 'user@example.com'
  })
  ```

### Issue 4: Token Expired Error

**Problem:** Clicking email link shows "Token expired" error

**Solution:**
- Default token expiry is 24 hours
- Use forgot password to request a new link
- Or create a new invitation for the user

### Issue 5: 404 Error When Clicking Email Link

**Problem:** Email link leads to 404 page

**Possible causes:**
1. Frontend routes not configured correctly
2. Deployment issue (routes not properly handled)

**Solutions:**
- Verify `vercel.json` has rewrites configuration (should already be set)
- Check that routes exist in `App.tsx`:
  - `/email-confirmation`
  - `/reset-password`
  - `/auth/callback` (if using magic links)
- Redeploy frontend if routes were recently added

---

## Template Variable Reference

Supabase provides these variables for email templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .SiteURL }}` | Your site URL from configuration | `https://your-app.vercel.app` |
| `{{ .Token }}` | Authentication token | `pkce_abc123...` |
| `{{ .TokenHash }}` | Hashed version of token | `#access_token=...` |
| `{{ .ConfirmationURL }}` | Pre-built confirmation URL | Full URL with token |
| `{{ .Email }}` | User's email address | `user@example.com` |
| `{{ .RedirectTo }}` | Custom redirect URL | Custom path if provided |

---

## Security Best Practices

✅ **Do:**
- Use HTTPS for all URLs (production)
- Set appropriate token expiry times
- Log authentication events
- Monitor failed login attempts
- Use secure redirect URL validation

❌ **Don't:**
- Expose admin credentials in emails
- Use plain HTTP for production
- Share invitation links publicly
- Reuse invitation tokens
- Disable email confirmation (security risk)

---

## Next Steps

After configuring email templates:

1. ✅ Test complete registration flow
2. ✅ Test password reset flow
3. ✅ Test email confirmation works
4. ✅ Verify RLS policies block unauthenticated access
5. ✅ Test deactivated user blocking
6. ✅ Update task list in `tasks-invitation-auth-system.md`

---

## Quick Reference: Frontend Routes

Make sure these routes exist in your app:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/register` | `Register.tsx` | Invitation-based registration |
| `/email-confirmation` | `EmailConfirmation.tsx` | Handle email confirmation callback |
| `/forgot-password` | `ForgotPassword.tsx` | Request password reset |
| `/reset-password` | `ResetPassword.tsx` | Set new password |
| `/login` | `Login.tsx` | User login |
| `/dashboard` | `Dashboard.tsx` | Main app (protected) |

All routes are already implemented! ✅

---

## Support

If you encounter issues:

1. Check Supabase logs: **Dashboard** → **Logs** → **Auth**
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test with a fresh incognito/private browser session
5. Review the complete flow in `tasks-invitation-auth-system.md`

**Project Info:**
- Project ID: `zuykdhqdklsskgrtwejg`
- Region: Northeast Asia (Seoul)
- Dashboard: https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg

---

## Related Documentation

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-config)
- Main implementation guide: `tasks-invitation-auth-system.md`
- Deployment guide: `DEPLOYMENT.md`
