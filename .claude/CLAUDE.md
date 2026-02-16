# Project-Level AI Agent Instructions

> Read this before doing anything in this repository.

## Project

Zakat Fitrah Al-Fajar — A mosque zakat (Islamic charity) management web application.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7
- **UI:** Tailwind CSS 3 + shadcn/ui (Radix)
- **State:** Zustand (client) + TanStack React Query (server)
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Routing:** React Router DOM v7
- **Forms:** React Hook Form + Zod
- **Hosting:** Vercel (auto-deploy from `main` branch)

## Key Paths

| Path | Purpose |
|---|---|
| `zakat-fitrah-app/src/` | Application source code |
| `zakat-fitrah-app/src/components/ui/` | shadcn/ui base components (DO NOT modify) |
| `zakat-fitrah-app/src/components/` | Feature components |
| `zakat-fitrah-app/src/hooks/` | Custom React hooks |
| `zakat-fitrah-app/src/lib/` | Supabase client, auth, utilities |
| `zakat-fitrah-app/src/pages/` | Route-level pages |
| `zakat-fitrah-app/src/types/` | TypeScript type definitions |
| `zakat-fitrah-app/supabase/migrations/` | SQL migrations (sequential numbering) |
| `zakat-fitrah-app/supabase/functions/` | Supabase Edge Functions (Deno) |
| `prd-task/generations/` | PRDs, task lists, QA reports |
| `ops/` | Operational docs and workflows |

## Rules for All Agents

1. **Never push directly to `main`.** Work on feature branches.
2. **Run `npm run build` before marking work complete.** Build must pass.
3. **Check off tasks** in the task file as you complete them: `[ ]` → `[x]`
4. **Follow existing code patterns.** Check similar files before creating new ones.
5. **Use shadcn/ui components** from `@/components/ui/` — don't reinvent.
6. **Use the `@/` import alias** for all project imports.
7. **Include RLS policies** with any new Supabase table.
8. **Commit messages:** `type(scope): description` (e.g., `feat(dashboard): add chart`)

## Operational Docs

Read these for detailed workflows:
- `ops/STANDARD_OPERATIONS.md` — Main operations overview
- `ops/AGENT_ROLES.md` — Team roles and agent playbooks
- `ops/DEVELOPMENT_WORKFLOW.md` — Detailed dev workflow
- `ops/PARALLEL_EXECUTION.md` — Running multiple agents
- `ops/PROJECT_HYGIENE.md` — File organization rules

## PRD & Task Generation

- PRD rules: `prd-task/create-prd.md`
- Task rules: `prd-task/generate-tasks.md`
- Output goes to: `prd-task/generations/`
