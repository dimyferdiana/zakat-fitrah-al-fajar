# Agent Roles & Playbooks

> How to run this project like a team — with you as the lead and AI agents as your crew.

---

## Team Overview

```
                    ┌──────────────┐
                    │   YOU (Lead)  │
                    │  Architect &  │
                    │  Final Review │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
   │  PM Agent   │  │  Engineer  │  │  QA Agent   │
   │  (Copilot)  │  │  Agents    │  │  (OpenClaw) │
   └──────┬──────┘  │ (Copilot/  │  └──────┬──────┘
          │         │  Claude)   │         │
          │         └─────┬──────┘         │
          │               │                │
          │        ┌──────▼──────┐         │
          │        │  DevOps     │         │
          │        │  Agent      │         │
          │        └─────────────┘         │
          │                                │
          └──────────┐  ┌─────────────────┘
                     │  │
              ┌──────▼──▼──────┐
              │  Librarian     │
              │  Agent         │
              └────────────────┘
```

---

## Role 1: PM Agent (Product Manager)

**Who:** Copilot / Claude (VS Code or CLI)  
**When to invoke:** Starting a new feature, planning a phase, scoping work, task monitoring

### Responsibilities

1. **Create PRDs** — Transform feature requests into Product Requirements Documents
2. **Generate Tasks** — Break PRDs into actionable task lists for engineers
3. **Monitor Tasks** — Check, organize, and monitor all completed, running, and unfinished tasks
4. **Track Progress** — Maintain visibility into project status across all features
5. **Report Status** — Provide lead with weekly/sprint summaries

### Trigger Phrases
```
"Act as PM. Create a PRD for [feature description]"
"Act as PM. Generate tasks from prd-task/generations/prd-[name].md"
"Act as PM. Check and organize all tasks. Generate a status report."
"Act as PM. Monitor task progress on feature [name]"
```

### Playbook

#### Generate PRD
```
1. Read prd-task/create-prd.md for rules
2. Provide the agent with the feature description
3. Agent asks 3-5 clarifying questions (you answer with letter codes like "1A, 2C, 3B")
4. Agent generates PRD → saved to prd-task/generations/prd-[feature-name].md
5. You review and approve
```

**Prompt template:**
```
Read the file prd-task/create-prd.md for instructions.
Then create a PRD for the following feature:

[Your feature description here]

Save the output to prd-task/generations/prd-[feature-name].md
Do NOT start implementing. Only generate the PRD.
```

#### Generate Task List
```
1. Read prd-task/generate-tasks.md for rules
2. Point the agent at the approved PRD
3. Agent generates parent tasks → you confirm with "Go"
4. Agent generates sub-tasks → saved to prd-task/generations/tasks-[feature-name].md
5. You review and approve
```

**Prompt template:**
```
Read the file prd-task/generate-tasks.md for instructions.
Then generate a task list based on this PRD:
prd-task/generations/prd-[feature-name].md

Save the output to prd-task/generations/tasks-[feature-name].md
```

### Output
- `prd-task/generations/prd-*.md` (PRDs)
- `prd-task/generations/tasks-*.md` (Task lists)
- `prd-task/generations/active/task-status-report.md` (Weekly status report)

#### Task Monitoring & Organization

**When to invoke:** Daily/weekly, or whenever you need a status overview

**Prompt template:**
```
You are a PM agent for the zakat-fitrah-app project.

Perform a complete task audit: Read all files in prd-task/generations/ that match tasks-*.md

For each task file, create a structured report with:
1. Feature name (extracted from filename)
2. Overall progress: X% (based on checked vs total checkboxes)
3. Status: COMPLETED | IN_PROGRESS | BLOCKED | NOT_STARTED
4. Task breakdown:
   - [ ] [Task 1.0] — status (if marked [x], status is "Done"; else "In Progress" or "Pending")
   - [ ] [Task 1.1] — status
5. Next steps / blockers

Compile into a single report: prd-task/generations/active/task-status-report.md with:

## Task Status Report — [Date]

### Summary
- Total features: X
- Completed: Y
- In Progress: Z
- Not Started: W

### Feature Breakdown
[For each feature, show the structure above]

### Actionable Next Steps
- Feature A: Next task is [X.Y] — assigned to [Agent]
- Feature B: Blocked by [reason] — needs [action]
- Etc.

Do NOT modify task files. Only read and report.
```

### Output
- `prd-task/generations/prd-*.md` (PRDs)
- `prd-task/generations/tasks-*.md` (Task lists)
- `prd-task/generations/active/task-status-report.md` (Weekly status report)

---

## Role 2: Engineer Agent(s)

**Who:** Copilot / Claude / Cursor (VS Code or CLI)  
**When to invoke:** Implementing tasks from a task list

### How to Parallelize Engineers

You can run **multiple engineer agents** simultaneously on **independent tasks**. The key constraint: **agents must NOT edit the same file at the same time.**

#### Safe Parallelization Strategy

```
Tasks 1.0: Set up database schema     ← Agent A (touches supabase/migrations/)
Tasks 2.0: Build UI components        ← Agent B (touches src/components/)
Tasks 3.0: Create API hooks           ← Agent C (touches src/hooks/)
Tasks 4.0: Wire up pages              ← WAIT (depends on 2.0 + 3.0)
```

#### Prompt Template (per agent)
```
You are an Engineer agent working on the zakat-fitrah-app project.

Your assignment:
- Task file: prd-task/generations/tasks-[feature-name].md
- Work on tasks: [X.0 through X.N] ONLY
- Do NOT touch tasks assigned to other agents

Tech stack context:
- React 19 + TypeScript + Vite 7
- Tailwind CSS + shadcn/ui (components in src/components/ui/)
- Supabase for backend (client in src/lib/)
- TanStack React Query for server state
- Zustand for client state
- React Router DOM v7 for routing
- React Hook Form + Zod for forms

Rules:
1. Check off each sub-task in the task file as you complete it: [ ] → [x]
2. Follow existing code patterns in the codebase
3. Use shadcn/ui components from @/components/ui/
4. Use the existing Supabase client from @/lib/supabase
5. Add TypeScript types to src/types/
6. Run `npm run build` after you finish to verify no errors
```

### Conflict Prevention

| Task Type | Files Touched | Can Parallelize? |
|---|---|---|
| Database migrations | `supabase/migrations/` | YES (sequential numbering) |
| UI components | `src/components/[feature]/` | YES (separate folders) |
| Hooks / API | `src/hooks/` | YES (separate files) |
| Pages | `src/pages/` | YES (separate files) |
| Types | `src/types/` | CAREFUL (may share type files) |
| App.tsx routing | `src/App.tsx` | NO (single file, one agent only) |
| Shared utils | `src/utils/` or `src/lib/` | NO (coordinate manually) |

---

## Role 3: QA Agent

**Who:** You (manual) + OpenClaw Agent (automated)  
**When to invoke:** After engineer agents complete their tasks

### QA Playbook

#### Phase 1: Automated Checks (OpenClaw)
```
1. Run build:          npm run build
2. Run lint:           npm run lint
3. Run type check:     npx tsc --noEmit
4. Check for errors in the terminal output
```

#### Phase 2: Functional Testing (You or OpenClaw)
```
1. Start dev server:   npm run dev
2. Test each feature from the task list
3. Check edge cases:
   - Empty states
   - Error states
   - Loading states
   - Auth boundaries (role-based access)
   - Mobile responsiveness
4. Verify Supabase RLS policies work correctly
```

#### Phase 3: Preview Validation
```
1. Push to feature branch
2. Wait for Vercel preview URL
3. Test on preview URL (real Supabase connection)
4. Test on mobile device using preview URL
```

### QA Prompt Template (for OpenClaw)
```
You are a QA agent for the zakat-fitrah-app project.

Test the following feature: [feature name]
Task file: prd-task/generations/tasks-[feature-name].md
PRD: prd-task/generations/prd-[feature-name].md

Steps:
1. Read the PRD to understand expected behavior
2. Read the task list to see what was implemented
3. Run `npm run build` — report any errors
4. Run `npm run lint` — report any warnings/errors
5. Start `npm run dev` and test each user story from the PRD
6. Document findings in prd-task/generations/qa-[feature-name].md with:
   - ✅ PASS: [what works]
   - ❌ FAIL: [what's broken, steps to reproduce]
   - ⚠️ WARNING: [edge cases, potential issues]
```

### QA Output
- `prd-task/generations/qa-[feature-name].md`
- Bug reports filed as issues or documented inline

---

## Role 4: DevOps Agent

**Who:** Copilot / Claude  
**When to invoke:** Database changes, deployment issues, environment setup

### Playbook

#### Database Migrations
```
1. Create migration file: supabase/migrations/NNN_description.sql
2. Numbering: next sequential number after existing files (currently at 018)
3. Always include:
   - CREATE/ALTER statements
   - RLS policies
   - Rollback comments
4. Test SQL in Supabase Dashboard SQL Editor first
5. Then add to migrations folder for version control
```

#### Environment Management
```
# Sync Vercel env vars locally
vercel env pull .env.local

# Required env vars:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

#### Deployment Checklist
```
- [ ] All engineers marked tasks complete
- [ ] QA passed
- [ ] npm run build succeeds
- [ ] Preview URL tested
- [ ] Migrations applied to Supabase (if any)
- [ ] PR reviewed
- [ ] Merge to main → auto-deploys to production
```

### DevOps Prompt Template
```
You are a DevOps agent for the zakat-fitrah-app project.

Task: [describe the infra/deployment task]

Context:
- Supabase project for backend (PostgreSQL + Auth + Edge Functions)
- Vercel for frontend hosting (auto-deploys from main branch)
- Migrations in zakat-fitrah-app/supabase/migrations/ (currently at 018)
- Edge Functions in zakat-fitrah-app/supabase/functions/ (Deno runtime)

Rules:
1. Never modify production directly
2. Test migrations in SQL editor before committing
3. Next migration number: [check current highest + 1]
4. Include RLS policies with any new table
```

---

## Role 5: Librarian Agent

**Who:** Copilot / Claude  
**When to invoke:** Periodically (after each feature completion), or when repo feels messy

### Playbook

#### After Each Feature Completion
```
1. Archive completed task files (mark as done, don't delete)
2. Remove temp files, .bak files, unused SQL scripts
3. Verify all new files are in the right directories
4. Update STANDARD_OPERATIONS.md if tech stack changed
5. Check for orphaned imports or dead code
```

#### Periodic Cleanup (Monthly)
```
1. Review prd-task/generations/ — archive old PRDs/tasks
2. Check for duplicate or conflicting documentation
3. Verify migration files are sequential with no gaps
4. Clean up .bak files in supabase/migrations/
5. Ensure .gitignore is up to date
6. Run npm audit and report vulnerabilities
```

### Librarian Prompt Template
```
You are a Librarian agent for the zakat-fitrah-app project.
Your job is to keep the repository organized and clean.

Perform the following:
1. List all files in prd-task/generations/ and categorize them by status:
   - Active (currently being worked on)
   - Completed (feature shipped)
   - Stale (no longer relevant)
2. Check for .bak, .old, or temporary files that should be cleaned up
3. Verify the file structure matches ops/STANDARD_OPERATIONS.md
4. Report any documentation that is outdated or contradictory
5. Save your report to ops/CLEANUP_REPORT.md

Do NOT delete any files without explicit approval. Only report what should be cleaned.
```

---

## PM Task Monitoring Quick Reference

### Daily Task Check

```bash
# Prompt to PM Agent:
"Act as PM. Check all tasks in prd-task/generations/ and create status report."
```

The agent will:
1. Scan all `tasks-*.md` files
2. Count completed/pending/blocked tasks per feature
3. Generate `task-status-report.md` showing:
   - % complete per feature
   - Current blockers
   - Next assignments
   - Overall progress

### What Gets Tracked

| Item | Format | Location |
|---|---|---|
| Feature PRD | `prd-[name].md` | `prd-task/generations/` |
| Task list | `tasks-[name].md` | `prd-task/generations/` |
| Task status | Checkbox progress `[x]` vs `[ ]` | Inside task file |
| Overall report | `task-status-report.md` | `prd-task/generations/active/` |

---

## Delegation Quick Reference

### Starting a New Feature (Full Cycle)

```
Step 1: PM Agent      → Generate PRD        → you review & approve
Step 2: PM Agent      → Generate Tasks       → you review & approve
Step 3: PM Agent      → Monitor progress     → generate status reports (weekly)
Step 4: You           → Assign tasks to engineer agents (split by independence)
Step 5: Engineer A    → Work on Task Group 1
        Engineer B    → Work on Task Group 2 (parallel)
        Engineer C    → Work on Task Group 3 (parallel)
Step 6: PM Agent      → Check task progress (mark blockers)
Step 7: You           → Wire up / integrate agent outputs
Step 8: QA Agent      → Test everything      → file bugs
Step 9: Engineer      → Fix bugs from QA
Step 10: DevOps Agent  → Pre-deployment checklist
Step 11: PM Agent     → Update status report (feature complete)
Step 12: You          → Final review + merge to main
Step 13: Librarian    → Clean up repo
```

### Quick Fixes / Bugs

```
Step 1: You / QA      → Identify bug
Step 2: Engineer Agent → Fix it on a fix/ branch
Step 3: npm run build  → Verify
Step 4: Push → Preview URL → Verify
Step 5: Merge to main
```
