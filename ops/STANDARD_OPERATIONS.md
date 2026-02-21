# Standard Operations — Zakat Fitrah Al-Fajar

> Single source of truth for how this project runs. Read this first.

---

## Table of Contents

1. [Tech Stack Summary](#tech-stack-summary)
2. [Repository Structure](#repository-structure)
3. [Development Workflow](#development-workflow)
4. [Preview-First Deployment](#preview-first-deployment)
5. [Branch Strategy](#branch-strategy)
6. [Team & Agent Roles](#team--agent-roles)
7. [Quick Reference Commands](#quick-reference-commands)

---

## Tech Stack Summary

| Layer            | Technology                                      | Version   |
| ---------------- | ----------------------------------------------- | --------- |
| **Runtime**      | Node.js                                         | 25.x      |
| **Framework**    | React + TypeScript                              | 19.x      |
| **Build**        | Vite                                            | 7.x       |
| **UI**           | Tailwind CSS + shadcn/ui (Radix primitives)     | 3.x       |
| **State**        | Zustand (client) + TanStack React Query (server)| 5.x       |
| **Routing**      | React Router DOM                                | 7.x       |
| **Forms**        | React Hook Form + Zod validation                | 7.x + 4.x|
| **Backend**      | Supabase (Auth, PostgreSQL, Edge Functions)      | 2.89+     |
| **Charts**       | Recharts                                        | 3.x       |
| **Export**        | jsPDF + jspdf-autotable + xlsx                  | 3.x       |
| **Hosting**      | Vercel (auto-build from GitHub)                 | -         |
| **Repo**         | GitHub                                          | -         |
| **Package Mgr**  | npm                                             | 11.x      |

### Key Architecture Decisions

- **SPA** with client-side routing (Vercel rewrites all routes to `index.html`)
- **Code-splitting** via `React.lazy()` + Vite manual chunks
- **RLS (Row Level Security)** enforced at Supabase DB level
- **Offline mode** available via `VITE_OFFLINE_MODE=true` with mock data
- **Edge Functions** for sensitive server-side logic (e.g., invitation-manager)

---

## Repository Structure

```
zakat-fitrah-al-fajar/
├── ops/                    # ← YOU ARE HERE — operational docs
├── prd-task/               # PRDs, task lists, generation outputs
│   ├── create-prd.md       # PRD generation prompt/rules
│   ├── generate-tasks.md   # Task generation prompt/rules
│   └── generations/        # All generated PRDs, tasks, SQL, test plans
├── supabase/               # Supabase project config (root-level)
└── zakat-fitrah-app/       # ← Main application code
    ├── src/
    │   ├── components/     # UI components (auth/, common/, dashboard/, etc.)
    │   ├── hooks/          # Custom React hooks
    │   ├── lib/            # Auth, Supabase client, utilities
    │   ├── pages/          # Route-level page components
    │   ├── types/          # TypeScript type definitions
    │   └── utils/          # Helper functions
    ├── supabase/
    │   ├── migrations/     # SQL migration files (numbered 001–018+)
    │   ├── functions/      # Edge Functions (Deno)
    │   ├── scripts/        # One-off SQL scripts
    │   └── seeds/          # Seed data
    ├── email-templates/    # HTML email templates for auth flows
    ├── public/             # Static assets
    └── scripts/            # Node.js utility scripts
```

---

## Development Workflow

### The Golden Rule

> **Never deploy to production just to check your work.**
> Use local preview or Vercel preview URLs instead.

### The 4-Step Cycle

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│  1. DEVELOP  │───▶│  2. VERIFY   │───▶│  3. PREVIEW URL  │───▶│ 4. PROMOTE  │
│  local dev   │    │  local build │    │  push to branch  │    │ merge→main  │
│  npm run dev │    │  npm run     │    │  auto-deploy     │    │ auto-deploy │
│              │    │  build &&    │    │  to Vercel       │    │ to prod     │
│              │    │  npm run     │    │  preview         │    │             │
│              │    │  preview     │    │                  │    │             │
└─────────────┘    └──────────────┘    └──────────────────┘    └─────────────┘
     ↑                                                               │
     └───────────── iterate if issues found ─────────────────────────┘
```

### Step-by-Step

**Step 1: DEVELOP** (local hot-reload)
```bash
cd zakat-fitrah-app
npm run dev          # → http://localhost:5173 with HMR
# OR
npm run dev:demo     # → offline mode with mock data
```

**Step 2: VERIFY** (build + local preview — catches what dev mode misses)
```bash
npm run build                # TypeScript check + Vite production build
npm run preview              # → http://localhost:4173 (serves dist/)
```
> This is the **exact same output** Vercel will deploy. If it works here, it works on Vercel.

**Step 3: PREVIEW URL** (share with team / test on real infra)
```bash
git add -A
git commit -m "feat(scope): description"
git push origin feature/your-branch
# → Vercel automatically creates a preview URL for this branch
# → Check the GitHub PR or Vercel dashboard for the URL
```

**Step 4: PROMOTE** (only after preview is validated)
```bash
# Create PR: feature/your-branch → main
# Review PR (or self-review for solo work)
# Merge → Vercel auto-deploys main as production
```

---

## Preview-First Deployment

### Why You Were Deploying to Production Too Often

Without Vercel CLI and without running `npm run preview` locally, the only way to see a "real" build was to push to `main` and wait for Vercel. This is slow and risky.

### Install Vercel CLI (Recommended)

```bash
npm i -g vercel
vercel login
vercel link    # link this repo to your Vercel project (run from zakat-fitrah-app/)
```

### Vercel CLI Commands

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `vercel dev`       | Runs Vercel dev environment locally (simulates serverless)|
| `vercel build`     | Runs the exact Vercel build pipeline locally              |
| `vercel`           | Deploys to a **preview URL** (NOT production)             |
| `vercel --prod`    | Deploys to **production** (use sparingly)                 |
| `vercel env pull`  | Pulls env vars from Vercel to local `.env.local`          |

### Quick Preview Without Push

```bash
# From zakat-fitrah-app/
vercel               # deploys to a unique preview URL instantly
# → Check the output URL in terminal
```

### Vercel Automatic Previews (via GitHub)

Every push to a **non-main** branch automatically gets a preview URL:
- Push to `feature/my-feature` → Vercel deploys `zakat-fitrah-xxxx.vercel.app`
- This URL is posted as a comment on the GitHub PR
- No need to merge to main just to see the result

---

## Branch Strategy

```
main (production)
 ├── feature/invitation-auth-system    ← current active branch
 ├── feature/auto-split-zakat-sedekah
 └── feature/next-feature-name
```

### Rules

1. **`main`** = production. Only merge validated code here.
2. **`feature/*`** = development branches. Push freely, preview URLs auto-generated.
3. **Naming:** `feature/short-description`, `fix/bug-description`, `hotfix/urgent-fix`
4. **Commit format:** `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
   - Example: `feat(dashboard): add monthly revenue chart`

### Merge Process

```bash
# 1. Ensure your branch is up to date with main
git fetch origin
git rebase origin/main    # or merge, your preference

# 2. Push and create PR
git push origin feature/your-branch

# 3. Verify Vercel preview URL works

# 4. Merge PR (squash merge recommended for clean history)
```

---

## Team & Agent Roles

See [AGENT_ROLES.md](./AGENT_ROLES.md) for detailed playbooks.

| Role                    | Who                  | Responsibility                              |
| ----------------------- | -------------------- | ------------------------------------------- |
| **PM (Product Manager)**| AI Agent             | Generate PRDs and task lists                 |
| **Engineer**            | You + AI Agents      | Implement tasks from task lists              |
| **QA**                  | You + OpenClaw Agent | Test implementations, write test plans       |
| **DevOps**              | AI Agent             | Migrations, deployment, env management       |
| **Librarian**           | AI Agent             | Organize docs, archive old files, clean repo |

---

## Quick Reference Commands

### Development
```bash
npm run dev              # Start dev server (HMR)
npm run dev:demo         # Start in offline/mock mode
npm run build            # Production build
npm run preview          # Serve production build locally
npm run lint             # Run ESLint
```

### Git
```bash
git checkout -b feature/name   # New feature branch
git push origin feature/name   # Push (triggers Vercel preview)
```

### Vercel CLI (after install)
```bash
vercel                   # Deploy to preview URL
vercel --prod            # Deploy to production
vercel env pull          # Sync env vars locally
vercel dev               # Local Vercel dev environment
```

### Supabase
```bash
# Migrations are in zakat-fitrah-app/supabase/migrations/
# Apply via Supabase Dashboard SQL editor or supabase CLI
# Edge Functions in zakat-fitrah-app/supabase/functions/
```

---

## Related Documents

| Document | Purpose |
|---|---|
| [AGENT_ROLES.md](./AGENT_ROLES.md) | Team roles, agent playbooks, delegation guide |
| [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) | Detailed workflow with checklists |
| [PROJECT_HYGIENE.md](./PROJECT_HYGIENE.md) | File organization rules |
| [PARALLEL_EXECUTION.md](./PARALLEL_EXECUTION.md) | Running multiple agents in parallel |
| [../prd-task/create-prd.md](../prd-task/create-prd.md) | PRD generation rules |
| [../prd-task/generate-tasks.md](../prd-task/generate-tasks.md) | Task generation rules |
