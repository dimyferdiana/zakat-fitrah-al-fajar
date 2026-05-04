# 📧 SMTP Email Configuration Guide

## Current Status

❌ **SMTP Email is NOT configured** - This is why confirmation emails are not being sent.

---

## 🎯 Quick Summary

**What is SMTP?**
SMTP (Simple Mail Transfer Protocol) is the service that actually sends emails. Without SMTP configured, Supabase cannot send any emails (confirmation, password reset, invitations, etc.).

**Good News:**
Supabase provides **free built-in SMTP** for all projects. You don't need to configure an external email service like SendGrid or Mailgun (though you can if you want more control).

---

## ✅ Option 1: Use Supabase's Built-in SMTP (Recommended - FREE)

Supabase automatically uses its own SMTP service. You just need to:

### Step 1: Enable Email Auth

1. Go to Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg
   ```

2. Navigate to: **Authentication** → **Providers**

3. Find **Email** provider

4. Make sure these are **ENABLED**:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (this sends confirmation emails)
   - ✅ **Secure email change** (optional but recommended)

5. Click **Save**

### Step 2: Configure Email Templates

This is **CRITICAL** - without templates, emails won't be sent even if SMTP is enabled.

1. Go to: **Authentication** → **Email Templates**

2. Configure these 2 required templates:

#### A. Confirm Signup
- **Subject:** `Confirm Your Email - Zakat Fitrah Al Fajar`
- **Body:** Use template from `email-templates/confirm-signup.html`

**Quick basic template:**
```html
<h2>Welcome to Zakat Fitrah Al Fajar!</h2>

<p>Thank you for registering. Please confirm your email address:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>

<p>This link will expire in 24 hours.</p>

<p>Best regards,<br>Zakat Fitrah Al Fajar Team</p>
```

#### B. Reset Password
- **Subject:** `Reset Your Password - Zakat Fitrah Al Fajar`
- **Body:** Use template from `email-templates/reset-password.html`

**Quick basic template:**
```html
<h2>Reset Your Password</h2>

<p>Click the link below to reset your password:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>This link will expire in 1 hour.</p>

<p>Best regards,<br>Zakat Fitrah Al Fajar Team</p>
```

3. Click **Save** for each template

### Step 3: Configure Site URL

1. Go to: **Authentication** → **URL Configuration**

2. Set **Site URL**:
   ```
   https://zakat-fitrah-al-fajar.vercel.app
   ```

3. Add **Redirect URLs**:
   ```
   https://zakat-fitrah-al-fajar.vercel.app/**
   http://localhost:5173/**
   ```

4. Click **Save**

### Step 4: Test Email Sending

1. Create a new test user (use your own email)
2. Check if confirmation email arrives
3. Check spam/junk folder
4. Try password reset flow

---

## 🚀 Option 2: Use Custom SMTP (Optional - More Control)

If you want to use your own email service (Gmail, SendGrid, AWS SES, etc.):

### For Gmail (Development Only)

1. Go to: **Settings** → **Project Settings** → **Auth**

2. Scroll to **SMTP Settings**

3. Configure:
   - **SMTP Host:** `smtp.gmail.com`
   - **SMTP Port:** `587`
   - **SMTP User:** `your-gmail@gmail.com`
   - **SMTP Pass:** Use [App Password](https://myaccount.google.com/apppasswords)
   - **SMTP Sender Name:** `Zakat Fitrah Al Fajar`
   - **SMTP Sender Email:** `your-gmail@gmail.com`

4. Click **Save**

⚠️ **Warning:** Gmail has daily sending limits (500 emails/day). Not recommended for production.

### For SendGrid (Production Recommended)

1. Sign up for [SendGrid](https://sendgrid.com/) (Free tier: 100 emails/day)

2. Create an API Key in SendGrid Dashboard

3. In Supabase: **Settings** → **Project Settings** → **Auth** → **SMTP Settings**

4. Configure:
   - **SMTP Host:** `smtp.sendgrid.net`
   - **SMTP Port:** `587`
   - **SMTP User:** `apikey`
   - **SMTP Pass:** Your SendGrid API Key
   - **SMTP Sender Name:** `Zakat Fitrah Al Fajar`
   - **SMTP Sender Email:** Your verified sender email

5. Click **Save**

### For AWS SES (Production - Cheapest)

1. Set up AWS SES in your AWS account
2. Verify your domain or email
3. Create SMTP credentials
4. Configure in Supabase SMTP settings

---

## ✅ Recommended Setup for Your Project

**For Development & Testing:**
✅ Use Supabase's built-in SMTP (Option 1)
- Free
- No configuration needed
- Works immediately
- Good for testing

**For Production:**
✅ Consider upgrading to custom SMTP (Option 2)
- Better deliverability
- Custom sender email (no-reply@your-domain.com)
- Higher sending limits
- Better email reputation

---

## 🧪 Testing Checklist

After configuring SMTP and email templates:

- [ ] Register a new user with your own email
- [ ] Check inbox for confirmation email (check spam too)
- [ ] Click confirmation link - should work
- [ ] Try "Forgot Password" flow
- [ ] Check inbox for password reset email
- [ ] Click reset link - should work
- [ ] Check Supabase logs for any errors:
  - Dashboard → Logs → Auth logs
  - Look for email-related errors

---

## 🐛 Troubleshooting

### Email not arriving?

1. **Check spam/junk folder** - Most common issue
2. **Check Supabase logs** - Dashboard → Logs → Auth logs
3. **Verify email templates are saved** - Not just edited
4. **Check Site URL is correct** - Must match your deployment
5. **Try different email provider** - Test with Gmail, Yahoo, Outlook

### Email arrives but link doesn't work?

1. **Check Site URL** matches your deployment URL
2. **Add deployment URL to Redirect URLs**
3. **Verify frontend route exists** - `/email-confirmation`
4. **Check token hasn't expired** - Confirmation: 24h, Reset: 1h

### Still not working?

Check if email confirmations are required:

1. **Temporary workaround** (not recommended for production):
   - Go to: **Authentication** → **Providers** → **Email**
   - **Disable** "Confirm email"
   - Users can login immediately without confirmation
   - ⚠️ Security risk - emails not verified

2. **Better solution:** Fix the SMTP/template configuration

---

## 📊 Current Status Summary

| Item | Status | Priority |
|------|--------|----------|
| SMTP Configured | ❌ Not yet | 🔴 Critical |
| Email Templates | ❌ Not configured | 🔴 Critical |
| Site URL | ⚠️ May need update | 🟡 High |
| Redirect URLs | ⚠️ May need update | 🟡 High |

**Time to fix:** 10-15 minutes

**Impact:** Users cannot receive confirmation emails → Cannot login

---

## 🎯 Quick Start Script

Run these steps in order:

```bash
# 1. Go to Supabase Dashboard
open "https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg/auth/providers"

# 2. Enable Email Auth (check the boxes)
# 3. Configure email templates
# 4. Set Site URL
# 5. Test with new registration
```

---

## 📚 Related Files

- `EMAIL_FIX_URGENT.md` - Fix current user login issue
- `EMAIL_TEMPLATE_SETUP.md` - Detailed template configuration
- `email-templates/` - Professional HTML templates
- `scripts/manual-confirm-email.sql` - Manual confirmation script

---

**Last Updated:** February 15, 2026  
**Status:** 🔴 Action Required - SMTP Not Configured
