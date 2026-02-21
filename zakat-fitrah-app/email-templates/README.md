# Email Templates - Zakat Fitrah Al Fajar

Professional HTML email templates for the Zakat Fitrah Al Fajar authentication system.

## 📧 Available Templates

### 1. Confirm Signup (`confirm-signup.html`)
**Purpose:** Email confirmation for new user registration  
**Color Theme:** Green (`#10b981`)  
**Variables Used:**
- `{{ .ConfirmationURL }}` - Pre-built confirmation URL (recommended)
- `{{ .SiteURL }}` - Your frontend URL
- `{{ .TokenHash }}` - Email confirmation token hash
- `{{ .Token }}` - Alternative token (if using manual URL construction)

**Subject Line:** `Confirm Your Email - Zakat Fitrah Al Fajar`

---

### 2. Reset Password (`reset-password.html`)
**Purpose:** Password reset request  
**Color Theme:** Red (`#ef4444`)  
**Variables Used:**
- `{{ .SiteURL }}` - Your frontend URL
- `{{ .TokenHash }}` - Password reset token hash

**Subject Line:** `Reset Your Password - Zakat Fitrah Al Fajar`

---

### 3. Invite User (`invite-user.html`)
**Purpose:** Administrator invitation to join the system  
**Color Theme:** Blue (`#3b82f6`)  
**Variables Used:**
- `{{ .ConfirmationURL }}` - Pre-built invitation URL
- `{{ .Email }}` - Invited user's email address

**Subject Line:** `You're Invited - Zakat Fitrah Al Fajar`

---

### 4. Magic Link (`magic-link.html`)
**Purpose:** Passwordless login authentication  
**Color Theme:** Indigo/Purple (`#6366f1`)  
**Variables Used:**
- `{{ .ConfirmationURL }}` - Pre-built magic link login URL

**Subject Line:** `Your Login Link - Zakat Fitrah Al Fajar`

**Features:**
- ⚡ Quick login without password
- 🔒 One-time use link (expires in 5 minutes)
- ✨ Benefits section explaining magic link advantages
- ⚠️ Enhanced security warnings

---

## 🎨 Design Features

### ✅ Email Best Practices
- **Mobile Responsive:** Works on all screen sizes
- **Client Compatible:** Tested for Gmail, Outlook, Apple Mail
- **Inline CSS:** All styles are inline for maximum compatibility
- **Table-Based Layout:** Rock-solid rendering across email clients
- **Safe Fonts:** System font stack for consistent rendering
- **High Contrast:** Accessible text colors (WCAG compliant)

### 🎯 Visual Design
- **Gradient Headers:** Eye-catching color gradients per email type
- **Clear CTAs:** Large, prominent action buttons
- **Beautiful Typography:** Clean, readable text hierarchy
- **Visual Icons:** Emoji icons for quick visual scanning
- **Info Boxes:** Highlighted sections for important information
- **Alternative Links:** Manual URL fallback for button issues

---

## 📋 Implementation Guide

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Each Template

#### For "Confirm Signup" Template:
1. Click on **Confirm signup**
2. **Subject:** `Confirm Your Email - Zakat Fitrah Al Fajar`
3. **Body:** Copy and paste the entire content from `confirm-signup.html`
4. Click **Save**

#### For "Reset Password" Template:
1. Click on **Reset Password**
2. **Subject:** `Reset Your Password - Zakat Fitrah Al Fajar`
3. **Body:** Copy and paste the entire content from `reset-password.html`
4. Click **Save**

#### For "Magic Link" Template (Passwordless Login):
1. Click on **Magic Link**
2. **Subject:** `Your Login Link - Zakat Fitrah Al Fajar`
3. **Body:** Copy and paste the entire content from `magic-link.html`
4. Click **Save**

#### For "Invite User" Template:
> **Note:** Currently, user invitations may be handled via Edge Functions.  
> The `invite-user.html` template is available if you want to customize invitation emails separately.

---

## 🔧 Customization

### Changing Colors
Each template uses a different color scheme:
- **Confirm Signup:** Green (`#10b981`, `#059669`)
- **Reset Password:** Red (`#ef4444`, `#dc2626`)
- **Magic Link:** Indigo/Purple (`#6366f1`, `#4f46e5`)
- **Invite User:** Blue (`#3b82f6`, `#2563eb`)

To change colors, search and replace the hex codes in each template.

### Adding Your Logo
Replace the emoji icon `🌙` in the header with an `<img>` tag:

```html
<img src="https://yourdomain.com/logo.png" alt="Zakat Fitrah Al Fajar" style="max-width: 150px; height: auto;">
```

**Important:** Logo must be hosted on a public URL.

### Updating Text Content
All text is in Indonesian (Bahasa Indonesia). To change:
- Edit the text between HTML tags
- Keep the HTML structure intact
- Maintain inline styles for compatibility

---

## 📱 Testing Your Emails

### Before Going Live:
1. **Send Test Emails:** Use Supabase's test email feature
2. **Check Multiple Clients:** Test on Gmail, Outlook, Apple Mail
3. **Mobile Testing:** View on iPhone and Android devices
4. **Link Testing:** Click all buttons and links to verify URLs

### Tools for Testing:
- [Litmus](https://litmus.com/) - Email preview across clients
- [Email on Acid](https://www.emailonacid.com/) - Email testing platform
- [Mailtrap](https://mailtrap.io/) - Safe email testing environment

---

## 🔐 Security Notes

### Template Variables
Always use Supabase template variables - never hardcode:
- ✅ `{{ .ConfirmationURL }}` - Secure, encrypted URL
- ✅ `{{ .TokenHash }}` - Hashed token for security
- ❌ Don't hardcode tokens or URLs

### URL Structure
The templates generate URLs like:
```
https://your-domain.com/email-confirmation?token_hash=abc123&type=signup
https://your-domain.com/reset-password?token_hash=xyz789&type=recovery
```

These URLs must match your frontend routing configuration.

---

## 📊 Template Comparison

| Template | Purpose | Expiry | Color | Priority |
|----------|---------|--------|-------|----------|
| Confirm Signup | Email verification | 24 hours | Green | High |
| Reset Password | Password reset | 1 hour | Red | Critical |
| Magic Link | Passwordless login | 5 minutes | Indigo | Medium |
| Invite User | Admin invitation | 7 days | Blue | Medium |

---

## 🐛 Troubleshooting

### Email Not Sending
1. Check SMTP settings in Supabase Dashboard
2. Verify email templates are saved
3. Check spam/junk folder
4. Review Supabase logs for errors

### Broken Links
1. Verify Site URL in Supabase settings
2. Check frontend routes match URL patterns
3. Test token handling in your app

### Styling Issues
1. Some email clients strip CSS - use inline styles only
2. Test in multiple clients (Gmail, Outlook, etc.)
3. Use table-based layouts (not div/flexbox)

---

## 📚 Additional Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email HTML Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)
- [Can I Email](https://www.caniemail.com/) - CSS support in email clients

---

## 📝 Maintenance Checklist

- [ ] Test templates after any Supabase updates
- [ ] Update copyright year annually
- [ ] Review and update link expiry times
- [ ] Test on new email clients as they emerge
- [ ] Keep backup copies of working templates
- [ ] Document any custom modifications

---

**Last Updated:** February 15, 2026  
**Version:** 1.0.0  
**Maintained by:** Zakat Fitrah Al Fajar Team
