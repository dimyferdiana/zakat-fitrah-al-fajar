# Docker Local Testing Workflow

> **Required workflow before releasing to production.** Use Docker to test locally in an environment that mirrors Vercel deployment.

## Overview

This workflow ensures code changes are tested thoroughly locally before pushing to `main` and deploying to production. Two Docker profiles handle different testing phases:

- **`dev` profile** — Hot reload for rapid iteration during development
- **`prod` profile** — Production-like build for pre-release validation

---

## 1. Development (While Coding)

### Start the dev server
```bash
docker compose --profile dev up
```

### Access the app
Open `http://localhost:5173` in your browser.

### What you get
- **Hot reload** — Changes reflect instantly without restarting
- **Live TypeScript checking** — Errors shown in terminal and browser console
- **Development experience** — Matches local `npm run dev`

### Best for
- Building new features
- Debugging interactively
- Testing API integration with Supabase
- Quick iteration cycles

---

## 2. Pre-Release Testing (Before Pushing to `main`)

### Stop the dev server
```bash
docker compose down
```

### Build and run the production profile
```bash
docker compose --profile prod up --build
```

This builds exactly as Vercel will, served via Nginx at `http://localhost:80`.

### Access the app
Open `http://localhost` in your browser.

### Required Checklist

Before proceeding to git workflow, verify all items:

- [ ] **App loads and displays correctly** — No 404s, blank pages, or layout issues
- [ ] **Login/auth works** — Can authenticate with your Supabase project
- [ ] **Core features work** — Test zakat entry, reports generation, data filters
- [ ] **No console errors** — Open DevTools (F12 → Console) — should be clean
- [ ] **Responsive on mobile** — Use DevTools device mode to test mobile layout
- [ ] **Build passes locally** — Run the build command:
  ```bash
  cd zakat-fitrah-app
  npm run build
  cd ..
  ```

### What you're testing
- The **exact bundle** Vercel will deploy (optimized, minified, chunked)
- **Nginx serving** and routing (SPA fallback to `/index.html`)
- **Asset caching** and security headers
- Performance under production conditions

---

## 3. Git Workflow

Once local testing passes:

### Create a feature branch
```bash
git checkout -b feat/your-feature-name
```

### Make changes and test locally
```bash
# Test with hot reload (dev profile)
docker compose --profile dev up

# After changes, test the prod build
docker compose --profile prod up --build

# Verify TypeScript and build pass
cd zakat-fitrah-app
npm run build
cd ..
```

### Commit and push
```bash
git push origin feat/your-feature-name
```

### Open a PR on GitHub
- Let CI run automated checks
- Review will verify compliance with `CLAUDE.md` rules

---

## 4. Release to Production

Only merge to `main` when:

- ✅ All local Docker tests pass (`dev` and `prod` profiles)
- ✅ `npm run build` succeeds
- ✅ PR review is approved
- ✅ CI checks are green

### Deploy
```bash
# Merge to main
git merge feat/your-feature-name main
git push origin main
```

**Vercel auto-deploys** — configured in `vercel.json`. No manual action needed.

---

## Pro Tips

### Quick profile switching
```bash
# Stop current containers
docker compose down

# Switch to another profile
docker compose --profile prod up --build
```

### Test with mock data (offline mode)
Verify offline development still works:

Edit `zakat-fitrah-app/.env`:
```bash
VITE_OFFLINE_MODE=true
```

Then run dev profile:
```bash
docker compose --profile dev up
```

Revert when done:
```bash
VITE_OFFLINE_MODE=false
```

### Verify API calls
Open DevTools → **Network** tab while interacting with the app:
- Should see `api.supabase.co` calls ✅
- No 404s or failed requests ✅
- Status codes 200/201 for successful operations ✅

### Test different screen sizes
In DevTools (F12):
- Click **Toggle device toolbar** (Ctrl+Shift+M / Cmd+Shift+M)
- Test on iPhone, iPad, desktop breakpoints
- Verify Tailwind responsive classes work (`md:`, `lg:`, etc.)

### Clean Docker state (if needed)
```bash
# Remove containers and volumes
docker compose down -v

# Rebuild fresh
docker compose --profile dev up --build
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5173 already in use | `docker compose down` first, or change port in `docker-compose.yml` |
| Port 80 already in use | Change port in `docker-compose.yml` from `80:80` to `8080:80` |
| Stale node_modules in container | `docker compose down -v` then rebuild |
| `.env` not being read | Verify file is in `zakat-fitrah-app/.env`, not root |
| Build fails with TypeScript errors | Run `npm run build` locally in `zakat-fitrah-app/` to see full error |
| Supabase credentials invalid | Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` |

---

## Related Docs

- [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) — Overall dev workflow
- [STANDARD_OPERATIONS.md](./STANDARD_OPERATIONS.md) — General operations
- [CLAUDE.md](../.claude/CLAUDE.md) — Project rules and tech stack
