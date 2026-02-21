# Parallel Execution Guide — Running Multiple AI Agents

> How to run 2-4 AI agents simultaneously without conflicts.

---

## Why Parallel?

A single agent doing everything sequentially is slow. With proper task splitting, you can run multiple agents in parallel — cutting implementation time by 2-4x.

---

## Tools for Parallel Agents

| Tool | How to use for parallelism |
|---|---|
| **VS Code Copilot Chat** | Open multiple chat panels (split editor) — each is a separate agent |
| **Claude CLI** | Open multiple terminal tabs, each running `claude` with different prompts |
| **Cursor** | Multiple composer sessions |
| **OpenClaw** | Separate session for QA |
| **Copilot Edits** | Can handle one agent's work while you direct another in chat |

### Recommended Setup: 3 Terminals + 1 Chat

```
┌──────────────────────────────────────────────────────┐
│ Terminal 1: npm run dev (always running)              │
├────────────────────┬─────────────────────────────────┤
│ Terminal 2:        │ Terminal 3:                      │
│ Agent A (Claude)   │ Agent B (Claude)                 │
│ Working on Task 1  │ Working on Task 2                │
├────────────────────┴─────────────────────────────────┤
│ VS Code: Copilot Chat (Agent C for quick questions)  │
└──────────────────────────────────────────────────────┘
```

---

## The Parallelization Process

### Step 1: Analyze Task Dependencies

Look at the task file (`prd-task/generations/tasks-*.md`) and identify which tasks are **independent** (don't touch the same files).

Example from a typical feature:

```
Task 1.0: Create database migration    → supabase/migrations/
Task 2.0: Create TypeScript types       → src/types/
Task 3.0: Build API hooks               → src/hooks/
Task 4.0: Build UI components           → src/components/[feature]/
Task 5.0: Create page + routing         → src/pages/ + src/App.tsx
Task 6.0: Testing & QA                  → n/a (read-only)
```

**Dependency graph:**
```
Task 1.0 (DB) ──────────────────────┐
Task 2.0 (Types) ──┐                │
                    ├──▶ Task 3.0 ──┤
                    │    (Hooks)    │
Task 4.0 (UI) ─────┘               ├──▶ Task 5.0 ──▶ Task 6.0
                                    │    (Page)       (QA)
                                    │
```

### Step 2: Assign Independent Tasks

**Wave 1** (fully parallel):
- Agent A → Task 1.0 (database migration)
- Agent B → Task 2.0 (TypeScript types)
- Agent C → Task 4.0 (UI components — can use placeholder types)

**Wave 2** (after Wave 1 completes):
- Agent A → Task 3.0 (hooks — needs types from 2.0)
- Agent B → Task 5.0 (page — needs components from 4.0 + hooks from 3.0)

**Wave 3** (after Wave 2):
- QA Agent → Task 6.0

### Step 3: Create Agent Assignments

For each agent, create a focused prompt that includes:
1. Which tasks to work on (by number)
2. Which files/directories they OWN (can edit)
3. Which files/directories they must NOT touch
4. Tech stack reminders

---

## Agent Assignment Templates

### Template: Assign DB Migration Work

```
ROLE: Engineer Agent — Database
TASK FILE: prd-task/generations/tasks-[feature].md
YOUR TASKS: 1.0 and all sub-tasks (1.1, 1.2, etc.)

YOUR TERRITORY (you may edit):
  - zakat-fitrah-app/supabase/migrations/
  - zakat-fitrah-app/supabase/scripts/

DO NOT TOUCH:
  - src/ (any file)
  - Any other directory

CONTEXT:
  - Current highest migration: 018
  - Your migration files start at 019
  - Always include RLS policies
  - Test SQL in Supabase Dashboard first

When done, mark your tasks as [x] in the task file and run:
  npm run build (to verify nothing is broken)
```

### Template: Assign UI Component Work

```
ROLE: Engineer Agent — Frontend Components
TASK FILE: prd-task/generations/tasks-[feature].md
YOUR TASKS: 4.0 and all sub-tasks (4.1, 4.2, etc.)

YOUR TERRITORY (you may edit):
  - src/components/[feature-name]/  (create this folder)

DO NOT TOUCH:
  - src/App.tsx
  - src/pages/
  - src/hooks/
  - supabase/

CONTEXT:
  - Use shadcn/ui components from @/components/ui/
  - Follow existing component patterns (check src/components/dashboard/ for examples)
  - Use Tailwind CSS for styling
  - Props should use TypeScript interfaces
  - If you need types that don't exist yet, create a local interface
    in the component file (the types agent will align them later)

When done, mark your tasks as [x] in the task file.
```

### Template: Assign Hook/API Work

```
ROLE: Engineer Agent — Hooks & API Layer
TASK FILE: prd-task/generations/tasks-[feature].md
YOUR TASKS: 3.0 and all sub-tasks

YOUR TERRITORY (you may edit):
  - src/hooks/use[FeatureName].ts  (create new hook files)
  - src/types/[feature].ts         (may need to add types)

DO NOT TOUCH:
  - src/components/
  - src/pages/
  - src/App.tsx
  - supabase/

CONTEXT:
  - Use TanStack React Query for server state
  - Use the Supabase client from @/lib/supabase
  - Follow existing hook patterns (check src/hooks/ for examples)
  - Export typed hooks that components can consume
  - Handle loading, error, and empty states

When done, mark your tasks as [x] in the task file.
```

---

## Conflict Resolution

### What To Do When Agents Conflict

| Situation | Solution |
|---|---|
| Two agents need to edit `src/App.tsx` | One agent does it. The other waits or skips that part. |
| Agent A created types, Agent B needs them | Run Agent A first, then Agent B. Or Agent B uses placeholder types. |
| Both agents import from same file | Safe — imports are additive, not conflicting. |
| Build fails after merging agent work | Run `npm run build`, identify the error file, fix manually. |

### Post-Parallel Merge Checklist

After all parallel agents finish:

```
- [ ] All agents marked their tasks as [x]
- [ ] Run npm run build — passes?
- [ ] Run npm run lint — passes?
- [ ] Check for duplicate type definitions
- [ ] Check for inconsistent naming
- [ ] Wire up the page in src/App.tsx (if not done)
- [ ] Test feature end-to-end
```

---

## Communication Between Agents

Agents don't talk to each other. **You are the router.** When Agent A produces output that Agent B needs:

1. Agent A completes work → you verify
2. You give Agent B the context:
   ```
   "Agent A created these types in src/types/feature.ts.
    Use them in your hooks. Here's the file: [paste or reference]"
   ```

### Shared Context File (Optional)

For complex features, create a context file that all agents can read:

```markdown
# prd-task/generations/context-[feature].md

## Shared Decisions
- Table name: `sedekah_receipts`
- Primary key: `id` (UUID, auto-generated)
- User reference: `created_by` (references auth.users)

## Type Definitions
Located in: src/types/sedekah.ts
- SedekahReceipt
- SedekahReceiptForm
- SedekahReceiptFilter

## API Endpoints
- List: supabase.from('sedekah_receipts').select()
- Create: supabase.from('sedekah_receipts').insert()
- Update: supabase.from('sedekah_receipts').update()

## UI Components
- SedekahReceiptForm (in src/components/sedekah/)
- SedekahReceiptList (in src/components/sedekah/)
- SedekahReceiptCard (in src/components/sedekah/)
```

---

## Parallel Execution Checklist

Before starting parallel work:

```
- [ ] Task list exists and is approved
- [ ] Dependency graph identified (which tasks depend on which)
- [ ] Waves defined (Wave 1: independent, Wave 2: dependent, etc.)
- [ ] Agent assignments written (territory + constraints)
- [ ] Feature branch created (all agents work on same branch)
- [ ] Dev server running (npm run dev)
```

After parallel work completes:

```
- [ ] All task checkboxes marked [x]
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] End-to-end test of feature
- [ ] Push to branch
- [ ] Verify Vercel preview URL
- [ ] Merge to main (if everything passes)
```
