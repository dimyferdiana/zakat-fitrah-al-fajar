# Project Analysis Report: Zakat Fitrah Al-Fajar

**Date:** 2026-04-27  
**Version Analyzed:** v1.8.0 (package.json v2.1.0)  
**Analyst:** Claude Code (claude-sonnet-4-6)

---

## Executive Summary

**Zakat Fitrah Al-Fajar** is a modern, full-featured mosque zakat management system built with React 19, TypeScript, Vite, and Supabase. The application manages Islamic charitable donations (zakat fitrah, zakat maal, fidyah, infak) with comprehensive financial tracking, distribution, and reporting capabilities.

---

## 1. Project Structure & Directory Layout

### Root Directory
```
zakat-fitrah-al-fajar/
├── .git/
├── .claude/                       # Claude Code configuration
├── zakat-fitrah-app/              # Main application (React + Vite)
├── prd-task/                      # Product requirements & task documentation
├── supabase/                      # Backend infrastructure (cloud migrations)
├── ops/                           # Operations documentation
├── IMPLEMENTATION_SUMMARY.md
├── DASHBOARD_PROGRESS_SECTIONS_ASSESSMENT.md
├── HAK_AMIL_ADJUSTMENT_GUIDE.md
├── PRODUCTION_MIGRATION_GUIDE.md
└── README.md
```

### Application Directory (`zakat-fitrah-app/`)
```
zakat-fitrah-app/
├── src/
│   ├── pages/                     # 23 route-level page components
│   ├── components/                # 84 React components (16 subdirectories)
│   │   ├── accounts/              # Account/ledger management
│   │   ├── auth/                  # Authentication components
│   │   ├── common/                # Reusable generic components
│   │   ├── dashboard/             # Dashboard-specific components
│   │   ├── distribusi/            # Distribution module
│   │   ├── laporan/               # Reporting module
│   │   ├── layouts/               # Layout wrappers
│   │   ├── mustahik/              # Beneficiary management
│   │   ├── muzakki/               # Donor management
│   │   ├── pemasukan/             # Income/receipt handling
│   │   ├── sedekah/               # Charity receipt generation
│   │   ├── settings/              # Settings components
│   │   └── ui/                    # 26 shadcn/ui base components (DO NOT modify)
│   ├── hooks/                     # 24 custom React Query hooks
│   ├── lib/                       # Supabase client, auth, utilities
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Helper functions
│   ├── App.tsx                    # Main router
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global Tailwind CSS
├── supabase/
│   ├── migrations/                # 31 SQL migrations (3,605 lines)
│   └── fixes/                     # Ad-hoc database fixes
├── scripts/                       # Database management scripts
├── tests/                         # Integration tests
└── package.json
```

---

## 2. Tech Stack & Dependencies

### Framework & Runtime

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.0 | UI library with Suspense/lazy loading |
| React DOM | 19.2.0 | DOM rendering |
| React Router | 7.11.0 | Client-side routing |
| TypeScript | ~5.9.3 | Static type safety |
| Vite | 7.2.4 | Build tool and HMR dev server |

### Data & State Management

| Component | Version | Purpose |
|-----------|---------|---------|
| @tanstack/react-query | 5.90.12 | Server state, caching, sync |
| Zustand | 5.0.9 | Lightweight client state |
| @supabase/supabase-js | 2.89.0 | PostgreSQL + Auth client |

### UI & Styling

| Component | Version | Purpose |
|-----------|---------|---------|
| Tailwind CSS | 3.4.19 | Utility-first CSS |
| Radix UI | 26 components | Headless UI primitives |
| Lucide React | 0.562.0 | SVG icon library |
| shadcn/ui | Custom | Pre-built Radix + Tailwind components |
| next-themes | 0.4.6 | Dark mode support |

### Forms & Validation

| Component | Version | Purpose |
|-----------|---------|---------|
| React Hook Form | 7.69.0 | Performant form state management |
| Zod | 4.2.1 | TypeScript-first schema validation |
| @hookform/resolvers | 5.2.2 | RHF + Zod integration |

### PDF & Export

| Component | Version | Purpose |
|-----------|---------|---------|
| jsPDF | 3.0.4 | PDF generation (landscape receipts) |
| jsPDF-AutoTable | 5.0.2 | PDF table rendering |
| html2canvas | 2.x | HTML-to-canvas for exports |
| XLSX | 0.18.5 | Excel spreadsheet generation |
| react-to-print | 3.2.0 | Print dialog integration |

### Charts, DnD, & Other

| Component | Version | Purpose |
|-----------|---------|---------|
| Recharts | 3.6.0 | Line, bar, pie charts |
| @dnd-kit/core | 6.3.1 | Drag-and-drop |
| @dnd-kit/sortable | 10.0.0 | Sortable lists |
| Sonner | 2.0.7 | Toast notifications |
| @vercel/analytics | 1.6.1 | Performance monitoring |

### Dev Dependencies

- ESLint 9.39.1 + TypeScript ESLint — linting
- Vitest 4.0.18 + @vitest/ui — unit testing
- JSDOM 28.1.0 — DOM simulation in tests
- PostCSS 8.5.6 + Autoprefixer — CSS processing
- Rollup Visualizer 6.0.5 — bundle analysis

---

## 3. Source Code Overview

### Pages (23 Components)

| Page | File | Purpose | Access |
|------|------|---------|--------|
| Dashboard | Dashboard.tsx | Financial overview, widget-based layout | All |
| Pemasukan Uang | PemasukanUang.tsx (14 KB) | Cash income with filters, bulk entry | admin, petugas |
| Pemasukan Beras | PemasukanBeras.tsx (12.2 KB) | Rice income (kg) | admin, petugas |
| Muzakki | Muzakki.tsx (10 KB) | Donor master management | admin, petugas |
| Mustahik | Mustahik.tsx (9.5 KB) | Beneficiary master (8 asnaf) | admin, petugas |
| Distribusi | Distribusi.tsx (11.4 KB) | Fund distribution with status tracking | admin, petugas |
| Laporan | Laporan.tsx (4.8 KB) | Reports & exports (PDF/Excel) | All |
| Settings | Settings.tsx (26.3 KB) | Users, hak amil config, profiles | admin |
| Dashboard Settings | DashboardSettings.tsx | Configurable widget management | admin |
| Sedekah Receipt | SedekahReceipt.tsx (9.6 KB) | PDF receipt generator | admin, petugas |
| Surat Pengantar | SuratPengantar.tsx | Official letter generation | admin |
| Accounts Management | AccountsManagement.tsx (11.9 KB) | Ledger (kas/bank) account tracking | admin, petugas |
| Login / Register | Login.tsx, Register.tsx | Authentication | public |
| Password flows | ForgotPassword, ResetPassword | Password recovery | public |

### Components (84 Components, 16 Subdirectories)

**`components/ui/` (26 base shadcn/ui components)**
alert-dialog, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, popover, radio-group, scroll-area, select, separator, sonner, switch, table, tabs, textarea, and more.

**`components/common/` (5 components)**
LoadingSpinner, EmptyState, PageHeader, ProtectedRoute, ErrorBoundary.

**`components/dashboard/` (8 components)**
DashboardRenderer, DashboardTabSwitcher, StatCard, PemasukanChart, DistribusiProgress, HakAmilCard, HakAmilTrendChart, DashboardSettings.

**`components/pemasukan/` (8 components)**
PemasukanForm, PemasukanBerasForm, BuktiPemasukanUang, BuktiPemasukanBeras, BulkPemasukanForm, BulkTandaTerima, MuzakkiCreatableCombobox, ReceiptShell.

**`components/settings/` (10 components)**
UserForm, UserTable, InvitationForm, InvitationTable, ProfileForm, NilaiZakatForm, NilaiZakatTable, HakAmilConfigForm, HakAmilConfigTable, RekonsiliasiForm.

**`components/layouts/` (1 major component)**
MainLayout — sidebar, header, and navigation structure.

### Custom Hooks (24 Files, ~6,474 lines total)

| Hook | Size | Purpose |
|------|------|---------|
| useDashboard.ts | 15.3 KB | Dashboard stats, tahun list, monthly charts |
| useDashboardConfig.ts | 17.7 KB | CRUD for dashboard configs and widgets |
| useMuzakki.ts | 28.6 KB | Donor CRUD, payment history, bulk transactions |
| useHakAmil.ts | 27.7 KB | Trustee share calculations & snapshots |
| usePemasukanUang.ts | 12.8 KB | Cash income CRUD |
| usePemasukanBeras.ts | 12.7 KB | Rice income CRUD |
| useMustahik.ts | 11.6 KB | Beneficiary CRUD |
| useDistribusi.ts | 11.8 KB | Distribution tracking |
| useAccountsLedger.ts | 9.4 KB | Account ledger entries |
| useRekonsiliasi.ts | 9.2 KB | Reconciliation logic |
| useBulkPembayaran.ts | 7.2 KB | Batch payment processing |
| useNilaiZakat.ts | 5.5 KB | Zakat nominal values per tahun |
| useUsers.ts | 5 KB | User management (list, create, deactivate) |
| useInvitations.ts | 4 KB | User invitation CRUD |
| useSedekahReceipts.ts | 3.1 KB | Sedekah receipt history |

### Library Utilities (`lib/`)

| File | Size | Purpose |
|------|------|---------|
| offlineStore.ts | 62 KB | Complete in-memory offline/demo data store |
| dashboardDefaults.ts | 6.8 KB | Default dashboard config and 30+ widget definitions |
| auth.tsx | 5.8 KB | AuthProvider + useAuth context hook |
| hakAmilSnapshot.ts | 4.9 KB | Hak Amil snapshot storage & retrieval |
| dashboardTemplates.ts | 3.9 KB | Predefined dashboard layout templates |
| aggregationRules.ts | 2.9 KB | Dashboard stat aggregation rules engine |
| terbilang.ts | 2.9 KB | Indonesian number-to-words conversion |
| mockAuth.ts | 3.3 KB | Mock authentication for offline mode |

### Types (`types/`)

| File | Size | Purpose |
|------|------|---------|
| database.types.ts | 24.8 KB | Auto-generated Supabase types (40+ table interfaces) |
| bulk.ts | — | Bulk transaction data types |
| dashboard.ts | — | Dashboard config and widget types |

---

## 4. Database Schema (Supabase + PostgreSQL)

### Migration History (31 Files, 3,605 Lines Total)

| Migration | Purpose |
|-----------|---------|
| 001 | Core tables: users, tahun_zakat, muzakki, mustahik, pembayaran_zakat |
| 002 | Row-Level Security policies for all tables |
| 003 | Legacy data flag for mustahik import |
| 004 | Fase 2 dashboard: pemasukan_uang, pemasukan_beras, kategori_pemasukan |
| 005 | RLS for dashboard tables |
| 006 | Revised payment logic and constraints |
| 007–010 | Sedekah receipts + receipt number generation |
| 011 | Data cleanup for 2026 season |
| 013–016 | User invitation system + auth |
| 017–020 | Fix circular RLS + SECURITY DEFINER functions |
| 021 | Protect last active admin |
| 023–025 | Hak Amil config, snapshots, and audit logs |
| 026 | Bulk submission logging |
| 027 | Dashboard configuration system |
| 028–031 | Accounts ledger schema, RLS, seeding, and backfill |

### Core Tables & Relationships

#### Authentication & Users
```sql
users
├── id: UUID (PK)
├── nama_lengkap: TEXT
├── email: TEXT UNIQUE
├── role: ENUM(admin, petugas, viewer)
├── is_active: BOOLEAN
├── address, phone: TEXT
└── created_at, updated_at: TIMESTAMPTZ

user_invitations
├── email: TEXT
├── role: ENUM
├── token_hash: TEXT
├── expires_at, used_at, revoked_at: TIMESTAMPTZ
└── created_by → users(id)
```

#### Masters & Configuration
```sql
tahun_zakat
├── tahun_hijriah: TEXT
├── tahun_masehi: INTEGER
├── nilai_beras_kg, nilai_uang_rp: DECIMAL
└── is_active: BOOLEAN

muzakki (Donors)
├── nama_kk, alamat, no_telp: TEXT

mustahik (Beneficiaries)
├── nama: TEXT
├── kategori_mustahik_id → kategori_mustahik(id)  -- 8 asnaf
├── is_aktif: BOOLEAN
└── is_data_lama: BOOLEAN (legacy import flag)
```

#### Financial Transactions
```sql
pemasukan_uang (Cash Income)
├── tahun_zakat_id → tahun_zakat(id)
├── kategori: ENUM(zakat_fitrah, fidyah, maal_penghasilan, infak)
├── jumlah_uang_rp: DECIMAL
├── akun_uang → accounts(id)
└── sedekah_uang: DECIMAL (auto-split excess)

pemasukan_beras (Rice Income)
├── jumlah_beras_kg: DECIMAL
└── sedekah_beras: DECIMAL

pembayaran_zakat (Donor Payments)
├── muzakki_id → muzakki(id)
├── jenis_zakat: ENUM(beras, uang)
├── jumlah_jiwa: INTEGER
├── jumlah_beras_kg, jumlah_uang_rp: DECIMAL
├── akun_uang → accounts(id)
└── sedekah_uang, sedekah_beras: DECIMAL

distribusi (Distribution)
├── mustahik_id → mustahik(id)
├── jumlah_uang_rp, jumlah_beras_kg: DECIMAL
└── status: ENUM(pending, selesai)
```

#### Hak Amil (Trustee Share)
```sql
hak_amil_configs
├── tahun_zakat_id → tahun_zakat(id) UNIQUE
├── basis_mode: ENUM(net_after_reconciliation, gross_before)
├── persen_zakat_fitrah, persen_zakat_maal: NUMERIC(5,2)
├── persen_infak, persen_fidyah, persen_beras: NUMERIC(5,2)
└── updated_by → users(id)

hak_amil_snapshots (immutable audit trail)
├── periode_label: TEXT
├── kategori: ENUM(zakat_fitrah, zakat_maal, infak, fidyah, beras)
├── nominal_hak_amil: DECIMAL
└── breakdown: JSONB
```

#### Accounts & Ledger
```sql
accounts
├── nama: TEXT
├── channel: ENUM(kas, bank, qris)
├── saldo_awal, saldo_akhir: DECIMAL
└── is_aktif: BOOLEAN

account_ledger
├── account_id → accounts(id)
├── entry_type: ENUM(IN, OUT, REKONSILIASI)
├── jumlah: DECIMAL
├── referensi_id, referensi_tipe: TEXT
└── created_by → users(id)
```

#### Dashboard & Config
```sql
dashboard_configs
├── title, description: TEXT
├── visibility: ENUM(public, private)
└── stat_card_columns: INTEGER

dashboard_widgets
├── dashboard_id → dashboard_configs(id)
├── widget_type: TEXT
├── width: ENUM(full, half, third)
└── config: JSONB
```

### Key Schema Features
- **Row-Level Security (RLS):** Enforced on all tables at PostgreSQL level
- **SECURITY DEFINER functions:** Wrap critical operations to prevent privilege escalation
- **ENUM types:** Strict type enforcement (user_role, jenis_zakat, status_distribusi, etc.)
- **Audit trails:** `created_by` / `updated_by` on sensitive tables
- **Referential integrity:** FK constraints with CASCADE/RESTRICT
- **Reconciliation support:** Dedicated REKONSILIASI entry type in account_ledger

---

## 5. Key Architectural Patterns

### A. Routing & Navigation
- React Router v7 with dynamic path parameters
- **Code splitting:** All pages lazy-loaded except auth (critical path)
- **Protected routes:** `ProtectedRoute` wrapper checks `useAuth()` + role
- **3-role system:** `admin` (full) | `petugas` (data entry) | `viewer` (read-only)

### B. State Management Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| Server state | React Query | Cache, sync, refetch |
| Client state | Zustand | Theme, UI toggles |
| Auth context | React Context + Supabase | Session, role checks |
| Offline mode | offlineStore.ts | In-memory demo data |

### C. Data Fetching Pattern (Dual-Mode)
```typescript
useQuery({
  queryKey: ['muzakki', tahunZakatId, search, page],
  queryFn: async () => {
    if (OFFLINE_MODE) return offlineStore.getMuzakki(...);
    return supabase.from('muzakki').select(...);
  }
});
```

- Same hook handles online (Supabase) and offline (mock)
- Controlled by `VITE_OFFLINE_MODE` environment variable
- Automatic invalidation after mutations

### D. Form Handling
- React Hook Form for state management, Zod for validation
- Creatable comboboxes (MuzakkiCreatableCombobox) for inline entity creation
- Dropdowns pre-populated from database (tahun zakat, kategori, accounts)

### E. PDF / Export Generation
- **jsPDF + AutoTable:** Landscape receipts with organization header, signature blocks
- **XLSX:** Bulk Excel exports
- **Terbilang:** Indonesian number-to-words ("1000" → "seribu rupiah")
- **react-to-print:** Native print dialog integration

### F. Hak Amil (Trustee Share) System
Two calculation basis modes:
- `net_after_reconciliation` — apply % to reconciled balance
- `gross_before_reconciliation` — apply % to total income

Default percentages:
| Category | Default % |
|----------|-----------|
| zakat_fitrah | 12.5% |
| zakat_maal | 12.5% |
| infak | 20% |
| fidyah | 0% |
| beras | 0% |

Results stored as **immutable snapshots** per period for audit integrity.

### G. Dashboard System
- Multiple configurable dashboards per user
- 30+ widget types (stat cards, charts, progress bars)
- Drag-and-drop widget reordering via @dnd-kit
- Dynamic stat aggregation from multiple source tables
- Public/private visibility per dashboard config

### H. Offline Demo Mode
- Enabled via `VITE_OFFLINE_MODE=true` (or `npm run dev:demo`)
- Complete 2026 (1447 H) seed data in offlineStore.ts
- All CRUD operations work in-memory; no sync to cloud
- Enables full demo without internet or backend access

---

## 6. Findings & Assessment

### Strengths

| Area | Finding |
|------|---------|
| Architecture | Clean separation: pages → hooks → lib → supabase |
| Security | RLS enforced at DB level + client-side role checks (double defense) |
| Dual-mode | Runs online (Supabase) and offline (mock) from same codebase |
| Schema | Well-normalized with proper FK constraints and ENUM types |
| Audit trail | Immutable hak amil snapshots, bulk submission logs, created_by fields |
| UX | Lazy-loaded pages, configurable dashboard, bulk entry, PDF receipts |
| Localization | Indonesian language, Hijriah calendar, terbilang conversion |
| Performance | Vendor chunking, bundle analyzer, React Query cache config |

### Areas for Improvement

| Issue | Severity | Details |
|-------|----------|---------|
| Test coverage | Medium | Only 8 test files for 24 hooks + 84 components. Most business logic (especially hak amil) is untested. |
| Large files | Low | `offlineStore.ts` (62 KB) and `useHakAmil.ts` (27.7 KB) could be split into smaller modules. |
| TypeScript `any` casts | Low | Some `as any` casts exist for newer Supabase tables not yet in generated types. |
| Error messaging | Low | Some errors are generic. Specific Supabase error codes (e.g., PGRST116) are handled, but edge cases could be improved. |
| Session timeout | Low | 8-hour client-side timer. If user closes app before timeout, session is not server-side revoked. |
| Dashboard widget validation | Low | Widget config stored as JSONB without strict schema validation; malformed config could break rendering. |
| RLS complexity | Medium | Circular dependency was fixed (migrations 017–019) but risk of regression if new RLS is added carelessly. |
| No Edge Functions | Low | All logic runs client-side or in SQL. Server-side Edge Functions would help for async tasks (email, scheduled reports). |

### Potential Technical Debt

1. **Offline store grows with domain**: Each new entity requires additions to offlineStore.ts, which already exceeds 62 KB.
2. **Dashboard JSONB schema**: Widget config flexibility is good for features but introduces a maintenance burden without schema enforcement.
3. **Generated types drift**: `database.types.ts` must be regenerated when schema changes or `as any` accumulates.

---

## 7. Build & Deployment

### NPM Scripts
```bash
npm run dev          # HMR dev server (online mode)
npm run dev:demo     # Offline demo mode
npm run build        # tsc type check + vite build
npm run lint         # ESLint check
npm run test         # Run all Vitest tests once
npm run test:watch   # Watch mode
npm run test:ui      # Vitest UI runner
```

### Vite Build Optimizations
- Manual vendor chunking: react, query, supabase, ui, form, chart, export libraries
- Bundle size warning at 1000 KB
- Generates `dist/stats.html` for bundle visualization
- TypeScript target: ES2020

### Deployment
- **Hosting:** Vercel (auto-deploy from `main` branch)
- **Backend:** Supabase (managed PostgreSQL + Auth)
- Rules: Never push directly to `main`; always go through feature branches

---

## 8. Version History

| Version | Date | Feature |
|---------|------|---------|
| V1.0.0 | 2026-01-11 | Fase 2 Dashboard Keuangan |
| V1.1.0 | 2026-01-23 | Sedekah Receipt Generator (PDF landscape) |
| V1.2.0 | 2026-02-12 | Invitation Auth + User/Profile Management |
| V1.3.0 | 2026-02-12 | Auto Split Zakat → Sedekah (excess handling) |
| V1.4.0 | 2026-02-21 | Hak Amil Config (uang + beras) |
| V1.5.0 | 2026-02-22 | Bulk Pembayaran + Tanda Terima |
| V1.6.0 | 2026-02-25 | MuzakkiCreatable inline in Pemasukan |
| V1.7.0 | 2026-02-26 | Dashboard Configuration (multi-dash, widget drag-drop) |
| V1.8.0 | 2026-02-26 | Revamp Navigasi + Manajemen Rekening/Kas (ledger module) |

---

## 9. Project Metrics Summary

| Metric | Value |
|--------|-------|
| React version | 19.2.0 |
| TypeScript | ~5.9.3 |
| Vite | 7.2.4 |
| Total dependencies | 56 main + 8 dev |
| Pages | 23 (all code-split) |
| Components | 84 (16 subdirectories) |
| Custom hooks | 24 (~6,474 lines) |
| Database migrations | 31 files (3,605 lines SQL) |
| Estimated DB tables | 20+ |
| Test files | 8 |
| Estimated test coverage | ~10–15% |
| Offline store size | ~62 KB |
| shadcn/ui base components | 26 |
| Auto-generated DB types | 24.8 KB |

---

## 10. Conclusion

The **Zakat Fitrah Al-Fajar** project is a well-structured, production-grade React + TypeScript application. It demonstrates strong architectural decisions including dual-mode online/offline support, database-level RLS security, configurable dashboards, and comprehensive financial audit trails appropriate for mosque administration.

**Top Priorities for Next Iterations:**
1. Expand test coverage, especially for hak amil calculation logic
2. Refactor `offlineStore.ts` into domain-scoped modules
3. Add Supabase Edge Functions for async tasks (email notifications, scheduled reports)
4. Regenerate `database.types.ts` after each schema migration to eliminate `as any` casts
5. Add widget config schema validation for dashboard JSONB fields
