# Deployment Guide - Zakat Fitrah Management App

## Overview

This guide covers deploying the Zakat Fitrah Management Application to Vercel with Supabase backend. Vercel provides automatic builds, instant SSL, and global CDN distribution.

---

## Prerequisites

- Node.js 18+ installed
- Git installed and repository initialized
- Supabase project created and configured
- Vercel account (free tier available at [vercel.com](https://vercel.com))
- GitHub account (for repository hosting)

---

## Production Build Steps

### 1. Build Validation (Local Testing)

Before deploying, validate the production build locally:

```bash
# Navigate to project directory
cd zakat-fitrah-app

# Install dependencies (if not already installed)
npm install

# Create production build
npm run build

# Test production build locally
npm run preview
```

**Expected output:**
- Build completes without errors
- `dist/` folder created with optimized assets
- Preview server runs at `http://localhost:4173`

**Verify:**
- ✅ All routes load correctly
- ✅ Authentication works (login/logout)
- ✅ Dashboard displays data
- ✅ CRUD operations function properly
- ✅ PDF/Excel exports work
- ✅ No console errors

---

### 2. Environment Variables Setup

#### Development (.env)
Already configured for local development with Supabase.

#### Production (Vercel Dashboard)
You'll configure these in Vercel's dashboard after deployment setup.

Required environment variables:
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

---

### 3. Code Optimization

The build includes:
- ✅ Code splitting (automatic with Vite)
- ✅ Lazy loading for routes
- ✅ Tree shaking for unused code
- ✅ Minification and compression
- ✅ Asset optimization (images, fonts)

Build output typically:
- `index.html`: ~2KB
- JavaScript chunks: 200-800KB total
- CSS: 50-100KB
- Vendor chunks cached separately

---

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended for first deployment)

#### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "feat: complete zakat fitrah management app"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/zakat-fitrah-app.git
git branch -M main
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Vite configuration

#### Step 3: Configure Build Settings

Vercel should auto-detect:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### Step 4: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |

#### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Get your deployment URL: `https://your-project.vercel.app`

---

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview (first time)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name: zakat-fitrah-app
# - Directory: ./
# - Override build command? No

# Add environment variables (one time)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Deploy to production
vercel --prod
```

---

## Vercel Configuration Files

### vercel.json (SPA Routing)

Create `vercel.json` in project root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Purpose:**
- SPA routing: All routes redirect to `index.html` (client-side routing)
- Security headers: Prevent XSS, clickjacking, MIME sniffing
- Asset caching: 1-year cache for static assets (with immutable flag)

---

## Supabase Configuration

### Add Vercel Domain to Supabase Auth

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to **Redirect URLs**:
   ```
   https://your-project.vercel.app/**
   https://your-project.vercel.app
   ```
3. Add to **Site URL** (optional):
   ```
   https://your-project.vercel.app
   ```

---

## Post-Deployment Checklist

### 1. Verify Deployment

- [ ] Visit production URL: `https://your-project.vercel.app`
- [ ] Login with test credentials
- [ ] Navigate all routes (Dashboard, Muzakki, Mustahik, Distribusi, Laporan, Settings)
- [ ] Test CRUD operations (create, read, update, delete)
- [ ] Test PDF export functionality
- [ ] Test Excel export functionality
- [ ] Verify RLS policies working (different user roles)
- [ ] Check mobile responsiveness

### 2. Performance Audit

Run Lighthouse audit (Chrome DevTools):
```bash
# Or use CLI
npm install -g lighthouse
lighthouse https://your-project.vercel.app --view
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### 3. SSL & Security

- [ ] Verify HTTPS works (automatic with Vercel)
- [ ] Check SSL certificate (click padlock in browser)
- [ ] Test security headers (use securityheaders.com)
- [ ] Verify no mixed content warnings

### 4. Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Android Chrome)

---

## Continuous Deployment

Vercel automatically deploys:

### Production Deployments
- **Trigger:** Push to `main` branch
- **URL:** `https://your-project.vercel.app` (production)
- **Process:** Build → Deploy → Update production

### Preview Deployments
- **Trigger:** Push to any branch or Pull Request
- **URL:** `https://your-project-git-branch.vercel.app` (preview)
- **Purpose:** Test changes before merging to production

### Deployment Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature

# Vercel automatically creates preview deployment
# Get preview URL from Vercel dashboard or GitHub PR

# Test preview deployment
# If good, merge to main

# Create Pull Request on GitHub
# Review → Merge to main

# Vercel automatically deploys to production
```

---

## Custom Domain Setup (Optional)

### 1. Add Domain in Vercel

1. Go to Vercel Dashboard → Settings → Domains
2. Click **"Add"**
3. Enter your domain: `zakatfitrah.yourdomain.com`
4. Follow DNS configuration instructions

### 2. Update DNS Records

Add these records to your DNS provider:

**For subdomain (recommended):**
```
Type: CNAME
Name: zakatfitrah
Value: cname.vercel-dns.com
```

**For root domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 3. Verify Domain

- Vercel automatically provisions SSL certificate (1-2 minutes)
- Verify HTTPS works on custom domain
- Update Supabase redirect URLs with custom domain

---

## Monitoring & Analytics

### Vercel Analytics (Optional - Free Tier)

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to src/main.tsx
import { Analytics } from '@vercel/analytics/react';

// In your root component
<Analytics />
```

Enable in Vercel Dashboard → Analytics → Enable

### Vercel Speed Insights (Optional - Free Tier)

```bash
# Install Speed Insights
npm install @vercel/speed-insights

# Add to src/main.tsx
import { SpeedInsights } from '@vercel/speed-insights/react';

// In your root component
<SpeedInsights />
```

---

## Rollback Procedure

If production has issues:

### Via Vercel Dashboard

1. Go to Deployments tab
2. Find previous working deployment
3. Click three dots → **Promote to Production**
4. Confirm promotion

### Via Git

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force

# Vercel will auto-deploy the reverted version
```

---

## Environment Management

### Development
```bash
npm run dev
# Uses .env file
# Connects to development Supabase
```

### Staging/Preview
```bash
# Automatic on PR creation
# Uses Preview environment variables in Vercel
```

### Production
```bash
vercel --prod
# Uses Production environment variables in Vercel
# Deploys to main domain
```

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error:** TypeScript errors
```bash
# Run type check locally
npm run build
# Fix all TypeScript errors before deploying
```

### Routes Don't Work (404 on refresh)

**Solution:** Add/verify `vercel.json` with SPA rewrite configuration (see above)

### Environment Variables Not Loading

**Solution:** 
1. Check variable names start with `VITE_`
2. Redeploy after adding variables
3. Clear Vercel build cache: Settings → Clear Cache

### Supabase Connection Issues

**Solution:**
1. Verify environment variables are correct
2. Check Supabase project is not paused
3. Verify Vercel domain in Supabase redirect URLs
4. Check RLS policies are enabled

### Slow Initial Load

**Solution:**
1. Implement code splitting (see Task 11.6-11.7)
2. Enable Vercel Edge Network
3. Optimize images with `next/image` or similar
4. Review bundle size with `vite-bundle-visualizer`

---

## Security Best Practices

- ✅ Never commit `.env` files to Git
- ✅ Use environment variables for all secrets
- ✅ Enable Supabase RLS policies
- ✅ Use HTTPS only (Vercel default)
- ✅ Set security headers in `vercel.json`
- ✅ Regularly update dependencies: `npm audit fix`
- ✅ Use strong admin passwords
- ✅ Enable 2FA for Vercel and Supabase accounts

---

## Maintenance

### Regular Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies (quarterly)
npm update

# Update major versions carefully
npm install package-name@latest

# Test thoroughly after updates
npm run build
npm run preview
```

### Database Backups

Supabase provides automatic daily backups (7 days retention on free tier).

Manual backup:
1. Supabase Dashboard → Database → Backups
2. Click **"Create Backup"**
3. Download backup (optional)

---

## Support & Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Vite Documentation:** https://vitejs.dev/guide/
- **Supabase Documentation:** https://supabase.com/docs
- **React Router:** https://reactrouter.com/

---

## Deployment Checklist Summary

**Pre-Deployment:**
- [x] Development complete (Tasks 0-10)
- [x] All features tested locally
- [ ] Production build succeeds: `npm run build`
- [ ] Preview build works: `npm run preview`
- [ ] All routes verified
- [ ] Code optimized (splitting, lazy loading)

**Deployment:**
- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables configured
- [ ] `vercel.json` created with SPA routing
- [ ] Supabase redirect URLs updated
- [ ] First deployment successful

**Post-Deployment:**
- [ ] Production URL accessible
- [ ] All features work in production
- [ ] Lighthouse audit score > 90
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)
- [ ] Monitoring set up

---

**Ready for Production!** 🚀

Once all checklists are complete, your Zakat Fitrah Management App is ready for production use.
