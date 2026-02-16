# Project Hygiene — File Organization Rules

> Keep the repo clean so you (and your agents) can find things fast.

---

## Directory Ownership

| Directory | What goes here | What does NOT go here |
|---|---|---|
| `ops/` | Operational docs, workflows, team playbooks | Feature-specific docs |
| `prd-task/` | PRD templates, task templates | Implementation code |
| `prd-task/generations/` | Generated PRDs, tasks, test plans, QA reports | Temp files, backups |
| `zakat-fitrah-app/src/` | Application source code | Docs, SQL, scripts |
| `zakat-fitrah-app/supabase/migrations/` | Sequential SQL migrations | One-off scripts |
| `zakat-fitrah-app/supabase/scripts/` | One-off SQL scripts | Migrations |
| `zakat-fitrah-app/supabase/seeds/` | Seed data | Production data |
| `zakat-fitrah-app/email-templates/` | HTML email templates | Code |

---

## File Naming Conventions

### PRDs and Tasks
```
prd-[feature-name].md            # Product Requirement Document
tasks-[feature-name].md          # Task list for a feature
qa-[feature-name].md             # QA report for a feature
context-[feature-name].md        # Shared context for parallel agents
```

### Migrations
```
NNN_short_description.sql        # e.g., 019_add_sedekah_columns.sql
```
- Always sequential (no gaps)
- Lowercase with underscores
- Descriptive but short

### Components
```
src/components/[feature]/        # Feature-specific components
  FeatureNameForm.tsx
  FeatureNameList.tsx
  FeatureNameCard.tsx
```

### Hooks
```
src/hooks/use[FeatureName].ts    # e.g., useSedekahReceipt.ts
```

### Pages
```
src/pages/[PageName].tsx         # PascalCase, matches route
```

### Types
```
src/types/[feature].ts           # lowercase, one file per domain
```

---

## Cleanup Rules

### Files That Should Be Removed

| Pattern | Action |
|---|---|
| `*.bak` | Delete (we have git history) |
| `*.old` | Delete |
| `.applied` suffix on migrations | Remove suffix or delete |
| `*placeholder*.sql` | Replace with real migration or delete |
| Temp SQL files in wrong directory | Move to `supabase/scripts/` or delete |

### Current Cleanup Candidates

```
supabase/migrations/012_pemasukan_beras.sql.bak          → DELETE
supabase/migrations/012_placeholder.sql                   → DELETE or renumber
supabase/migrations/013_placeholder.sql                   → DELETE or renumber
supabase/migrations/013_user_invitations_schema.sql.applied → DELETE
supabase/migrations/013_user_invitations_schema.sql.bak   → DELETE
supabase/migrations/014_rls_invitation_auth.sql.bak       → DELETE
```

### After Every Feature Completion

Run this checklist (or delegate to Librarian agent):

```
- [ ] No .bak or .old files added
- [ ] No console.log debugging left in src/
- [ ] No TODO/FIXME/HACK comments without issue references
- [ ] New files follow naming conventions
- [ ] New components are in the right directory
- [ ] Task file has all checkboxes marked [x]
- [ ] PRD is not modified after approval (create addendum if needed)
- [ ] No duplicate type definitions across files
```

---

## Documentation Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
│  DRAFT   │───▶│ APPROVED │───▶│  ACTIVE  │───▶│   ARCHIVED   │
│          │    │          │    │  (being   │    │  (feature     │
│  prd-*   │    │  prd-*   │    │  worked)  │    │   shipped)   │
└──────────┘    └──────────┘    └──────────┘    └──────────────┘
```

- **DRAFT:** PRD generated, under review
- **APPROVED:** PRD approved, tasks generated
- **ACTIVE:** Engineer agents are implementing
- **ARCHIVED:** Feature shipped, doc is reference only

### Archiving

When a feature ships, add a header to the PRD and task files:

```markdown
> **STATUS: ARCHIVED** — Shipped in [commit/PR link]. For reference only.
```

Do NOT delete old PRDs/tasks — they're valuable history.

---

## Root-Level File Audit

Files at the workspace root should be minimal:

```
zakat-fitrah-al-fajar/
├── ops/                    ✅ operational docs
├── prd-task/               ✅ PRDs and tasks
├── supabase/               ✅ Supabase project config
├── zakat-fitrah-app/       ✅ main application
├── IMPLEMENTATION_SUMMARY.md   ⚠️ consider moving to ops/
├── README.md               ✅ project overview
└── *.prompt.md             ⚠️ consider moving to prd-task/
```

---

## The Single Grep Test

> Can any team member (human or AI) find what they need with a single search?

If files are named well and in the right place, yes. If not, restructure.

Common searches that should return results quickly:
- "Where is the dashboard component?" → `src/components/dashboard/`
- "Where are the migrations?" → `supabase/migrations/`
- "What's the PRD for sedekah receipt?" → `prd-task/generations/prd-phase-2.2.0-sedekah-receipt.md`
- "What tasks are left?" → `prd-task/generations/tasks-*.md` (search for `- [ ]`)
- "How do I deploy?" → `ops/DEVELOPMENT_WORKFLOW.md`
