# Development Workflow — Detailed Guide

> Step-by-step workflow with checklists to eliminate unnecessary production deployments.

---

## The Problem We're Solving

**Before:** Code → Push to main → Wait for Vercel build → Check production → Find bugs → Repeat  
**After:** Code → Local preview → Push to branch → Vercel preview URL → Validate → Merge → Done

---

## One-Time Setup

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Link Your Project

```bash
cd zakat-fitrah-app
vercel login             # Login with your Vercel account
vercel link              # Select your existing project when prompted
```

### 3. Pull Environment Variables

```bash
vercel env pull .env.local    # Creates .env.local with production env vars
```

> `.env.local` is gitignored. It gives you the same env vars that Vercel uses in production.

---

## Daily Development Workflow

### Morning Start

```bash
cd zakat-fitrah-app
git checkout main
git pull origin main
git checkout -b feature/todays-work    # or switch to existing branch
npm run dev                             # → localhost:5173
```

### While Coding

1. **Hot reload** catches most issues instantly at `localhost:5173`
2. **Save often** — Vite HMR is fast
3. **Check browser console** for runtime errors

### Before Committing

Run the **pre-commit checklist**:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build (catches import errors, missing exports, etc.)
npm run build

# 4. Preview the production build
npm run preview    # → localhost:4173
```

> If `npm run preview` looks correct at `localhost:4173`, it WILL look correct on Vercel. They use the same `dist/` output.

### Commit & Push

```bash
git add -A
git commit -m "feat(scope): what you did"
git push origin feature/todays-work
```

### Get Preview URL

Two options:

**Option A: Automatic (via GitHub)**
- Push to any branch that's not `main`
- Vercel auto-creates a preview deployment
- URL appears in Vercel dashboard or GitHub PR comments

**Option B: Manual (via CLI)**
```bash
vercel    # Deploys preview from your local code, outputs URL directly
```

### Validate Preview

Open the Vercel preview URL and check:
- [ ] Pages load correctly
- [ ] Auth works (login/logout)
- [ ] Data displays from Supabase
- [ ] Forms submit correctly
- [ ] Mobile responsive layout
- [ ] No console errors

### Merge to Production

```bash
# Option A: GitHub PR (recommended)
# Create PR on GitHub: feature/todays-work → main
# Review → Merge → Auto-deploys to production

# Option B: Direct merge (solo work)
git checkout main
git merge feature/todays-work
git push origin main    # → triggers production deployment
```

---

## Pre-Deploy Checklist

Use this before every merge to `main`:

```markdown
## Pre-Deploy Checklist

- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes (no lint errors)
- [ ] `npm run build` succeeds
- [ ] `npm run preview` tested locally
- [ ] Vercel preview URL tested (if applicable)
- [ ] New migrations applied to Supabase (if any)
- [ ] RLS policies tested for new tables (if any)
- [ ] No hardcoded localhost URLs or test data
- [ ] No `console.log` debugging left in code
- [ ] Commit messages follow convention: type(scope): description
```

---

## Environment-Specific Commands

| Environment | Command | URL | Purpose |
|---|---|---|---|
| **Dev** | `npm run dev` | `localhost:5173` | Hot reload, fast iteration |
| **Demo** | `npm run dev:demo` | `localhost:5173` | Offline mode, mock data |
| **Preview** | `npm run build && npm run preview` | `localhost:4173` | Test production build locally |
| **Vercel Preview** | `vercel` (CLI) or push to branch | `*.vercel.app` | Test on real infra |
| **Production** | merge to `main` | Your domain | Live site |

---

## Debugging Workflow

### "It works in dev but not in production"

```bash
# 1. Reproduce with local preview
npm run build && npm run preview

# 2. If it reproduces → it's a build issue
#    Check: missing imports, env vars, dynamic imports

# 3. If it doesn't reproduce → it's an env/infra issue
vercel env pull .env.local    # Compare env vars
```

### "The Vercel build fails"

```bash
# Run the exact same build locally
npm run build

# Check for:
# - TypeScript errors (strict mode in build, not in dev)
# - Missing dependencies
# - Import path case sensitivity (macOS is case-insensitive, Linux is not)
```

### "The database migration broke something"

```bash
# 1. Check Supabase Dashboard → SQL Editor
# 2. Run the migration SQL manually to see errors
# 3. Check RLS policies: Dashboard → Authentication → Policies
# 4. Test with Supabase client in browser console
```

---

## Commit Message Convention

```
type(scope): description

Types:
  feat     → New feature
  fix      → Bug fix
  refactor → Code restructuring (no behavior change)
  docs     → Documentation only
  style    → Formatting, missing semicolons, etc.
  test     → Adding tests
  chore    → Build process, dependencies, tooling

Scope (optional):
  auth, dashboard, muzakki, distribusi, laporan,
  settings, sedekah, db, rls, ui, export

Examples:
  feat(dashboard): add monthly revenue chart
  fix(auth): handle expired session redirect
  refactor(muzakki): extract form validation to hook
  docs: update deployment guide
  chore(deps): update @supabase/supabase-js to 2.90
```

---

## Quick Workflow Scripts

Add these to your shell profile (`~/.zshrc`) for convenience:

```bash
# Quick build check
alias zbuild="cd ~/Documents/zakat-fitrah-al-fajar/zakat-fitrah-app && npm run build && npm run preview"

# Quick dev start
alias zdev="cd ~/Documents/zakat-fitrah-al-fajar/zakat-fitrah-app && npm run dev"

# Quick deploy preview
alias zpreview="cd ~/Documents/zakat-fitrah-al-fajar/zakat-fitrah-app && vercel"

# Pre-commit check
alias zcheck="cd ~/Documents/zakat-fitrah-al-fajar/zakat-fitrah-app && npx tsc --noEmit && npm run lint && npm run build"
```
