# PRD: Comprehensive Code Audit & Technical Documentation

**Feature Name:** code-audit-documentation
**Date Created:** 2026-05-22
**Author:** AI-assisted (dimyferdiana)
**Status:** Ready for Implementation
**Priority:** Urgent — within current sprint

---

## 1. Introduction / Overview

The Zakat Fitrah Al-Fajar application has grown to 206 source files across 32 pages, 31 hooks, 40 database migrations, and multiple Supabase Edge Functions. As the codebase scales, the absence of formal technical documentation and a structured security review creates compounding risks: undiscovered credential exposure, unfiltered user inputs, performance bottlenecks (missing debounce), and architectural decisions that resist scale.

**Analysis scope covers:** client-side source (`zakat-fitrah-app/src/`), Supabase migrations (`supabase/migrations/`), Supabase Edge Functions (`supabase/functions/`), and the built production bundle (`zakat-fitrah-app/dist/`) for credential exposure verification.

This PRD defines the deliverable: a **single interactive HTML audit document** that covers architecture, security vulnerabilities, code quality issues, scalability assessment, and a remediation tracker — readable by both engineers and non-technical stakeholders.

**Goal:** Eliminate preventable risk (data leaks, hacks, high maintenance cost) by producing a living reference document that every team member can act on.

---

## 2. Goals

1. Produce a complete **architecture map** of the application: pages, hooks, lib modules, Supabase tables, and their relationships.
2. Identify and classify all **security vulnerabilities** (credential exposure, API key leaks, unfiltered inputs, URL parameter injection) with severity ratings.
3. Document all **code quality problems** (duplication, missing debounce, unvalidated forms, anti-patterns) with concrete file references.
4. Assess the **database architecture** for RLS completeness, indexing gaps, migration hygiene, and normalization issues.
5. Evaluate **scalability**: can this app handle 10× current load? What breaks first?
6. Produce a **severity matrix** with remediation steps, estimated effort, and owner/status tracking fields.
7. Deliver everything as a single **interactive HTML file** with navigation, severity filters, and collapsible sections — no build tool required to open.

---

## 3. User Stories

**As an engineer,**

> I want to open one document and see every security finding with a file path and line number, so I can fix them without hunting through the codebase.

**As an engineer,**

> I want a function-level explanation of each major hook and lib module, so I can onboard faster and safely modify existing flows.

**As a technical manager,**

> I want a severity dashboard with open/in-progress/resolved counts, so I can track remediation progress in sprint planning.

**As a non-technical stakeholder,**

> I want a plain-language risk summary explaining what could go wrong and what the team is doing about it, so I can make informed decisions about timelines and budget.

**As a security reviewer,**

> I want a dedicated section listing every place credentials or API keys could be exposed, with concrete evidence and recommended fixes.

---

## 4. Functional Requirements

### 4.1 Document Structure

1. The document MUST be a single self-contained `.html` file — no external dependencies, all CSS and JS inlined.
2. The document MUST have a sticky left navigation sidebar with section links.
3. The document MUST have a global severity filter (All / Critical / High / Medium / Low) that dynamically shows/hides findings.
4. The document MUST have a global search bar that highlights matching text across all sections.
5. Each finding card MUST include: **Severity badge**, **Category**, **File path + line number**, **Description**, **Risk explanation**, **Recommended fix**, **Estimated effort in hours** (e.g., 1h, 2h, 4h, 8h, 16h+), **Owner field** (text input), and **Status selector** (Open / In Progress / Resolved).
6. Status changes in the remediation tracker MUST persist in `localStorage` so the document acts as a lightweight tracker without a backend.
7. The document MUST include a **version block** in the HTML `<head>` as a comment listing: report generation date, total source files analyzed, and the last-modified date of each analyzed directory. This block serves as a regeneration fingerprint.

### 4.2 Section: Executive Summary

7. The document MUST open with a visual dashboard: total findings by severity (Critical / High / Medium / Low) displayed as colored stat cards.
8. The executive summary MUST include a plain-language "What could go wrong?" paragraph for each Critical and High finding, written for a non-technical reader.
9. The summary MUST include an overall risk rating (e.g., "High Risk — 3 Critical issues require immediate action").

### 4.3 Section: Architecture Documentation

10. The document MUST include a **module map** showing: Pages → Hooks → Lib modules → Supabase tables.
11. Each page MUST list: its route path, primary hooks it uses, and a 2-sentence description of its purpose.
12. Each hook MUST list: what data it fetches/mutates, what Supabase tables it touches, and key side effects.
13. The document MUST include a **data flow diagram** (rendered as an SVG or ASCII-art table) showing the full lifecycle of a zakat payment: user input → form validation → Supabase insert → RLS check → dashboard aggregation.
14. Each lib module (`/lib/`) MUST have a documented purpose and list of exported functions with one-line descriptions.

### 4.4 Section: Security Analysis

15. The document MUST audit and report on each of the following vectors:
    | Vector                         | What to check                                                                                                              |
    | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
    | Credential / API key exposure  | `.env` usage, hardcoded keys in source files, AND verification in the built production bundle (`dist/assets/*.js`) — both source and bundle must be checked since the bundle is what ships to users |
    | Input validation               | Forms using React Hook Form + Zod — are all schemas enforced? Missing `.trim()`, missing max-length, type coercion gaps |
    | URL parameter injection        | React Router params passed directly to Supabase queries without sanitization                                               |
    | Search inputs without debounce | Any `onChange` handler that triggers a Supabase query on every keystroke                                                 |
    | Authentication bypass vectors  | Pages accessible without auth guard, RLS policies that are too permissive                                                  |
    | XSS surface                    | Any `dangerouslySetInnerHTML`, raw HTML rendering from user-controlled data                                              |
    | Mass assignment                | Supabase insert/update calls that spread unvalidated user objects                                                          |
16. Each finding under Security MUST have a **CVSS-style severity** (Critical / High / Medium / Low) and a clear remediation code example.
17. The document MUST explicitly state which Supabase tables have **no RLS policies at all** based on reviewing the 40 migrations. A table is considered covered if it has at least one policy present; the report flags tables with zero policies.
18. The Security section MUST include a dedicated sub-section for **Edge Function security**: secret handling in `supabase/functions/`, input validation of incoming request bodies, CORS headers, and any hardcoded values in Deno function files.

### 4.5 Section: Code Quality Issues

19. The document MUST identify and list instances of:

    - **Duplicated logic** across hooks (e.g., repeated Supabase query patterns that should be abstracted)
    - **Missing debounce** on search/filter inputs that fire queries on every keystroke
    - **Dead code** — exported functions/components never imported elsewhere
    - **Inconsistent error handling** — hooks that swallow errors vs. those that surface them via toast
    - **Magic numbers / strings** — hardcoded values that should be constants in `lib/constants.ts`
    - **Type safety gaps** — use of `any`, untyped Supabase responses, missing Zod parse at API boundaries
    - **Edge Function issues** — same categories applied to `supabase/functions/`: duplicated fetch logic, missing input validation, hardcoded secrets, inconsistent error responses
20. Each code quality finding MUST include a before/after code snippet demonstrating the fix.

### 4.6 Section: Database Architecture Analysis

21. The document MUST list all 40 migrations and summarize the schema evolution.
22. The document MUST identify:
    - Tables missing primary key indexes
    - Foreign keys without corresponding indexes
    - Columns that should have unique constraints but don't
    - Tables that have no RLS policy at all (zero policies present)
    - N+1 query risks from hook patterns
    - Missing `created_at` / `updated_at` audit columns
23. The document MUST assess whether the current schema supports **soft deletes** or hard deletes, and flag any data integrity risks.

### 4.7 Section: Scalability Assessment

24. The document MUST answer: "Can this app handle 10× current users without architectural changes?" with a Yes/No/Partial and justification.
25. The document MUST identify the **top 3 bottlenecks** that would fail first under load (e.g., unindexed queries, Supabase free-tier limits, client-side aggregation of large datasets).
26. The document MUST include a **scaling roadmap** with three tiers: Current state → Optimized (0–3 months) → Scale-ready (3–12 months).

### 4.8 Section: Remediation Tracker

27. All findings from all sections MUST be aggregated into a single **Remediation Tracker** table at the end of the document.
28. The tracker MUST be sortable by: Severity, Category, Status, and Estimated Effort.
29. Each row MUST have: ID, Severity, Category, Short description, File reference, **Effort in hours** (e.g., 1h, 2h, 4h, 8h, 16h+), Owner (editable text input), Status (dropdown: Open / In Progress / Resolved), and Notes (text input).
30. The tracker MUST show a **progress bar** (e.g., "12 / 47 resolved") that updates as statuses are changed.
31. The tracker MUST have an **Export to CSV** button that downloads current state including owner, status, hours, and notes fields.

---

## 5. Non-Goals (Out of Scope)

- **Auto-fixing code** — this document identifies and explains issues; fixes are done by engineers in follow-up tasks.
- **CI/CD integration** — the HTML document is a point-in-time artifact, not a live dashboard connected to the repo.
- **Performance profiling** — runtime profiling (Lighthouse, browser DevTools traces) is out of scope; this is static analysis only.
- **Dependency vulnerability scanning** — npm audit results are referenced but a full supply-chain analysis (e.g., Snyk) is a separate deliverable.
- **Test coverage analysis** — test files exist for some hooks; a coverage report is a separate task.
- **Competitive benchmarking** — no comparison to other mosque management apps.

---

## 6. Design Considerations

### HTML Document Design

- **Color scheme:** Use semantic colors for severity: Critical = red-700, High = orange-600, Medium = yellow-500, Low = blue-500, Info = gray-400.
- **Typography:** System font stack (no external fonts), minimum 14px body text for readability.
- **Layout:** Two-column layout — fixed 240px sidebar + scrollable content area. On print, sidebar hidden.
- **Severity badges:** Pill-shaped colored badges consistent throughout all sections.
- **Code blocks:** Syntax-highlighted using a self-contained JS highlighter (e.g., Prism.js inlined or a lightweight alternative). Before/after diffs should use color coding (red/green lines).
- **Finding cards:** Each finding is a collapsible card with a header row (severity + title + file ref) and an expandable body (description + fix + effort + owner/status fields).

### Navigation Structure

```
Executive Summary
├── Risk Dashboard (stat cards)
└── Plain-language Summary

Architecture
├── Module Map
├── Pages Reference
├── Hooks Reference
├── Lib Modules Reference
└── Data Flow: Zakat Payment Lifecycle

Security Analysis
├── Credential / API Key Exposure (source + built bundle)
├── Input Validation Gaps
├── URL Parameter Injection
├── Missing Debounce (Search Inputs)
├── Authentication Bypass
├── XSS Surface
├── RLS Policy Coverage (zero-policy tables)
└── Edge Function Security

Code Quality
├── Code Duplication
├── Missing Debounce
├── Dead Code
├── Error Handling Inconsistency
├── Magic Values
├── Type Safety Gaps
└── Edge Function Quality

Database Architecture
├── Schema Evolution Timeline
├── Missing Indexes
├── RLS Coverage Matrix
└── Data Integrity Risks

Scalability Assessment
├── Current State Rating
├── Top 3 Bottlenecks
└── Scaling Roadmap

Remediation Tracker
```

---

## 7. Technical Considerations

### Analysis Approach

The document is produced by **static analysis** across four target areas:

| Target | Path | Purpose |
|---|---|---|
| Client source | `zakat-fitrah-app/src/` | All pages, hooks, lib, components |
| Supabase migrations | `zakat-fitrah-app/supabase/migrations/` | Schema, RLS policy coverage |
| Edge Functions | `zakat-fitrah-app/supabase/functions/` | Serverless function security and quality |
| Built bundle | `zakat-fitrah-app/dist/assets/` | Credential exposure in shipped code |

- The agent performing the analysis MUST read each file in the target directories — no assumptions from filenames alone.
- The built bundle MUST be checked by running `npm run build` first if `dist/` does not exist, then grepping the output JS files for `VITE_`, Supabase project URLs, UUIDs, and base64 strings.
- File references in findings MUST use the format `src/hooks/useQurban.ts:42` (relative to `zakat-fitrah-app/`). Edge Function findings use `supabase/functions/<name>/index.ts:15`.

### Output File

- **Location:** `prd-task/generations/active/code-audit-report.html`
- **File size budget:** Under 2MB (inline assets should be compressed/minified).
- **Browser compatibility:** Must render correctly in Chrome 120+, Safari 17+, Firefox 120+.
- **No build step required** — the HTML file must be openable by double-clicking it locally.

### Security Analysis Tools / Methods

- **Source files:** Grep for `VITE_`, `process.env`, hardcoded UUIDs, and base64 strings in `src/` and `supabase/functions/`.
- **Built bundle:** After `npm run build`, grep `dist/assets/*.js` for Supabase project URL patterns (`supabase.co`), anon key patterns (JWT format), and any value that was in `.env`. This is the ground-truth exposure check.
- **Input validation:** Review all Zod schemas in hooks and pages for missing `.trim()`, missing `.max()`, and unchecked type coercions.
- **URL params:** Inspect all `useParams()` and `useSearchParams()` call sites for values passed directly into Supabase `.eq()`, `.ilike()`, or `.filter()` without sanitization.
- **Debounce:** Search for `onChange` and `onInput` handlers on text inputs that invoke a Supabase query without a debounce wrapper.
- **RLS coverage:** Audit all 40 migration files; flag any `CREATE TABLE` that has no subsequent `CREATE POLICY` in any migration.
- **Edge Functions:** Read each function's `index.ts` for secret handling (`Deno.env.get` vs hardcoded), CORS header presence, and request body validation before use.

### Remediation Tracker Persistence

- Owner and Status fields use `localStorage` with a key of `audit-tracker-{finding-id}`.
- The Export CSV function uses the `Blob` API — no server required.
- Finding IDs are stable slugs derived from category + file + line number to survive document regeneration.

---

## 8. Success Metrics

| Metric                                                        | Target                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| All Critical findings have an assigned owner                  | 100% within 3 days of document delivery                   |
| All Critical findings resolved                                | Within current sprint (2026-05-22 to 2026-06-05)          |
| All High findings have a remediation plan                     | Within 1 week of document delivery                        |
| Engineer onboarding time (new dev reads architecture section) | < 30 minutes to understand full app flow                  |
| Non-technical stakeholders can read Executive Summary         | < 10 minutes to understand risks without engineering help |
| Document file opens without errors in Chrome/Safari/Firefox   | 100%                                                      |

---

## 9. Decisions Log

All questions resolved on 2026-05-22. No open questions remain.

| # | Question | Decision |
|---|---|---|
| 1 | Credential exposure: source only or also built bundle? | **Both.** Source files AND `dist/assets/*.js` (built bundle) must be checked — the bundle is what ships to users. |
| 2 | RLS "complete" definition | **Presence of any policy.** Tables with zero policies are flagged; tables with at least one policy are considered covered. |
| 3 | Effort estimation unit | **Hours** (e.g., 1h, 2h, 4h, 8h, 16h+) — not T-shirt sizes. |
| 4 | Versioning / regeneration fingerprint | **Yes.** The HTML `<head>` includes a comment block with report date, file count, and last-modified dates of all analyzed directories. |
| 5 | Edge Functions in scope | **Yes.** `supabase/functions/` is included in both security analysis and code quality analysis. |
