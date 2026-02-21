## Relevant Files

- `zakat-fitrah-app/src/pages/PemasukanUang.tsx` - Main pemasukan uang page; add Bulk mode toggle here.
- `zakat-fitrah-app/src/pages/PemasukanBeras.tsx` - Main pemasukan beras page; add Bulk mode toggle here.
- `zakat-fitrah-app/src/components/pemasukan/BulkPemasukanForm.tsx` - **NEW** — Core bulk input table (multi-muzakki, multi-jenis).
- `zakat-fitrah-app/src/components/pemasukan/BulkPemasukanForm.test.tsx` - Unit tests for BulkPemasukanForm.
- `zakat-fitrah-app/src/components/pemasukan/BulkTandaTerima.tsx` - **NEW** — Combined receipt with table layout (reuses ReceiptShell).
- `zakat-fitrah-app/src/components/pemasukan/ReceiptShell.tsx` - **NEW** — Shared receipt header/footer extracted from BuktiPembayaran.
- `zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx` - Existing single form; add toggle to switch to Bulk mode.
- `zakat-fitrah-app/src/components/pemasukan/BuktiPemasukanUang.tsx` - Existing uang receipt; refactor to use ReceiptShell.
- `zakat-fitrah-app/src/components/muzakki/BuktiPembayaran.tsx` - Existing receipt template; source for shared header/footer.
- `zakat-fitrah-app/src/hooks/usePemasukanUang.ts` - Existing uang mutation; reused per-row inside bulk submit.
- `zakat-fitrah-app/src/hooks/usePemasukanBeras.ts` - Existing beras mutation; reused per-row inside bulk submit.
- `zakat-fitrah-app/src/hooks/useMuzakki.ts` - Muzakki queries + quick-create mutation for new muzakki.
- `zakat-fitrah-app/src/hooks/useBulkPembayaran.ts` - **NEW** — Orchestrates sequential bulk submission and collects results.
- `zakat-fitrah-app/src/hooks/useBulkPembayaran.test.ts` - Unit tests for useBulkPembayaran.
- `zakat-fitrah-app/src/lib/hakAmilSnapshot.ts` - Existing snapshot; called per-transaction for hak amil auto-split.
- `zakat-fitrah-app/src/types/bulk.ts` - **NEW** — TypeScript types: `BulkRow`, `BulkSubmissionMeta`, `BulkResult`.
- `zakat-fitrah-app/supabase/migrations/026_bulk_submission_log.sql` - **NEW** — Table for bulk submission metadata (operator, receipt_no, row_count).

### Notes

- Unit tests should be placed alongside the component/hook they test.
- Run tests with `npm test` (Vitest).
- Each muzakki transaction must persist as an individual row in `pemasukan_uang` / `pemasukan_beras`.
- Receipt reuses header/footer from `BuktiPembayaran.tsx` via `ReceiptShell`; only the table content changes.

---

## Instructions for Completing Tasks

As you complete each task, change `- [ ]` to `- [x]` in this file. Update after each sub-task, not just the parent.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Checkout and create branch: `git checkout -b feature/bulk-pembayaran-transaksi`

- [ ] 1.0 Shared receipt header/footer extraction
  - [ ] 1.1 Read `BuktiPembayaran.tsx` and `BuktiPemasukanUang.tsx` and catalogue shared header/footer markup (mosque name, address, title, footer signature lines).
  - [ ] 1.2 Create `ReceiptShell.tsx` under `src/components/pemasukan/` accepting `{title, noUrut, children}` props; renders header, `{children}`, then footer unchanged.
  - [ ] 1.3 Refactor `BuktiPembayaran.tsx` and `BuktiPemasukanUang.tsx` to use `ReceiptShell` so existing receipts look identical to before.

- [ ] 2.0 Data contract and TypeScript types
  - [x] 2.1 Create `src/types/bulk.ts` with:
    - `BulkRow` — `{ muzakkiId: string | null; muzakkiNama: string; zakatFitrahBeras: number | null; zakatFitrahUang: number | null; zakatMaalBeras: number | null; zakatMaalUang: number | null; infakBeras: number | null; infakUang: number | null; }`
    - `BulkSubmissionMeta` — `{ operatorId: string; tahunZakatId: string; receiptNo: string; rowLimit: number; }`
    - `BulkResult` — `{ success: boolean; receiptNo: string; rows: BulkRow[]; errors: string[]; }`
  - [ ] 2.2 Create `026_bulk_submission_log.sql` with table `bulk_submission_logs`: `id uuid PK`, `operator_id uuid FK users`, `tahun_zakat_id uuid FK tahun_zakat`, `receipt_no text unique`, `row_count int`, `created_at timestamptz default now()`.
  - [ ] 2.3 Add RLS: admin full CRUD, petugas insert + read own rows only.
  - [ ] 2.4 Register `bulk_submission_logs` type in `src/types/database.types.ts`.

- [ ] 3.0 `useBulkPembayaran` hook
  - [ ] 3.1 Create `src/hooks/useBulkPembayaran.ts`.
  - [ ] 3.2 Implement `submitBulk(rows: BulkRow[], meta: BulkSubmissionMeta): Promise<BulkResult>` — for each row, call `createPemasukanUang` and/or `createPemasukanBeras` for each non-null/non-zero value.
  - [ ] 3.3 After each successful insert, call `createHakAmilSnapshot` from `hakAmilSnapshot.ts` for auto-split.
  - [ ] 3.4 After all rows succeed, insert one row into `bulk_submission_logs`.
  - [ ] 3.5 Return `BulkResult`: `success: true` if all pass; `success: false` with `errors[]` if any row fails (partial saves are kept).
  - [ ] 3.6 Write unit tests: all valid rows submit, zero-value row is skipped, partial failure collects errors without blocking other rows.

- [ ] 4.0 `BulkPemasukanForm` component
  - [ ] 4.1 Create `src/components/pemasukan/BulkPemasukanForm.tsx`.
  - [ ] 4.2 Render spreadsheet-style table with columns: No | Nama Muzakki | Zakat Fitrah (Beras KG / Uang RP) | Zakat Maal (Beras KG / Uang RP) | Infak/Sedekah (Beras KG / Uang RP) | Hapus.
  - [ ] 4.3 Add multi-select typeahead at top to search existing muzakki; selecting one appends a new row.
  - [ ] 4.4 Add "Tambah Muzakki Baru" button: open mini popover with nama-only input, on save create muzakki via `useMuzakki` mutation and add row.
  - [ ] 4.5 Show summary bar below table: Jumlah Muzakki | Total Uang (all uang summed) | Total Beras KG (all beras summed).
  - [ ] 4.6 Validate on submit: no negative numbers; rows where all 6 values are null/zero are rejected with inline error.
  - [ ] 4.7 Wire submit to `submitBulk`; show row-level or global spinner while submitting.
  - [ ] 4.8 On success: show success toast + "Lihat Tanda Terima" button that renders `BulkTandaTerima`.
  - [ ] 4.9 Write unit tests: empty state, adding a row, deleting a row, validation failure, successful submit.

- [ ] 5.0 `BulkTandaTerima` receipt component
  - [ ] 5.1 Create `src/components/pemasukan/BulkTandaTerima.tsx`.
  - [ ] 5.2 Wrap with `ReceiptShell` passing `receiptNo` and title `"TANDA TERIMA ZAKAT (FITRAH/MAL)"`.
  - [ ] 5.3 Render header fields: Nama (e.g. "Penerimaan Massal — {n} Muzakki"), Jumlah Orang, Jumlah RP, label Perincian.
  - [ ] 5.4 Render receipt table matching the reference photo exactly: No | Nama/Muzakki | Zakat Fitrah Beras (KG) | Zakat Fitrah Uang (RP) | Zakat Maal Beras (KG) | Zakat Maal Uang (RP) | Infak/Shadaqah/Fidyah Beras (KG) | Infak/Shadaqah/Fidyah Uang (RP).
  - [ ] 5.5 Sequence numbers (1, 2, 3…) in No column reference the single document `receiptNo`; no separate per-muzakki receipt number.
  - [ ] 5.6 Add totals row at bottom of table.
  - [ ] 5.7 Print CSS: compact font, all columns fit A4 landscape, no browser chrome on print.
  - [ ] 5.8 Add "Cetak / Print" button using `window.print()` or existing PDF export pattern.

- [ ] 6.0 Bulk mode toggle in existing pages
  - [ ] 6.1 Add "Mode Bulk" tab to `PemasukanUang.tsx`: shows `BulkPemasukanForm` when active, existing `PemasukanForm` when inactive.
  - [ ] 6.2 Add same tab to `PemasukanBeras.tsx` (or create a unified `BulkPembayaran.tsx` page if cleaner).
  - [ ] 6.3 Row limit reads from admin settings; falls back to 10.
  - [ ] 6.4 Show responsive notice on small screens: "Mode bulk lebih nyaman digunakan pada layar yang lebih besar."

- [ ] 7.0 Build, test, and deploy
  - [ ] 7.1 Run `npm run build` — fix all TypeScript and lint errors.
  - [ ] 7.2 Run `npm test` — confirm all new tests pass, 0 failures.
  - [ ] 7.3 Manual QA: submit 5 muzakki with mixed types → verify 5 individual records in `pemasukan_uang`/`pemasukan_beras`.
  - [ ] 7.4 Manual QA: verify receipt table layout matches reference photo.
  - [ ] 7.5 Manual QA: create new muzakki inline → confirm DB record has only `nama` set.
  - [ ] 7.6 Manual QA: confirm `hak_amil_snapshots` rows created for each inserted transaction.
  - [ ] 7.7 Apply migration `026_bulk_submission_log.sql` to production Supabase.
  - [ ] 7.8 Commit and push branch `feature/bulk-pembayaran-transaksi`.

---

## PM Parallelization Pass (A/B/C Assignment Plan)

### Objective

Menjalankan implementasi paralel tanpa konflik file dan tanpa saling overwrite antar agent.

### Agent Roles

- **Agent A (Backend/DB):** migration, RLS, audit, snapshot persistence, data contract.
- **Agent B (Frontend/UI):** receipt shell extraction, bulk input form, receipt component, page toggle integration.
- **Agent C (Domain Logic/Hook/Test):** bulk hook orchestration, unit tests, QA checklist execution.

### Wave Plan

#### Wave 0 — Branch + Data Contract (Agent A solo, no parallel conflict)
Lock the TypeScript types before all agents begin so there are no conflicting interfaces.

| Task | Agent | Files touched |
|---|---|---|
| 0.1 Create feature branch | A | git only |
| 2.1 Create `src/types/bulk.ts` | A | `src/types/bulk.ts` |

> **Gate:** Merge/commit `bulk.ts` before Wave 1 starts. All agents read from this file.

---

#### Wave 1 — DB + Receipt Shell + Hook Scaffold (A + B + C in parallel)
Each agent works on completely separate files — zero overlap.

| Task | Agent | Files touched |
|---|---|---|
| 2.2–2.4 Migration + RLS + DB types | A | `026_bulk_submission_log.sql`, `database.types.ts` |
| 1.1–1.3 Extract `ReceiptShell`, refactor existing receipts | B | `ReceiptShell.tsx`, `BuktiPembayaran.tsx`, `BuktiPemasukanUang.tsx` |
| 3.1–3.6 `useBulkPembayaran` hook + unit tests | C | `useBulkPembayaran.ts`, `useBulkPembayaran.test.ts` |

> **Gate:** All Wave 1 agents done before Wave 2.

---

#### Wave 2 — Form + Receipt UI + Page Toggle (B + C in parallel; A idle or reviews)
Agent B builds UI; Agent C writes component tests and prepares QA script.

| Task | Agent | Files touched |
|---|---|---|
| 4.1–4.9 `BulkPemasukanForm` component | B | `BulkPemasukanForm.tsx`, `BulkPemasukanForm.test.tsx` |
| 5.1–5.8 `BulkTandaTerima` receipt component | B | `BulkTandaTerima.tsx` |
| 6.1–6.4 Mode Bulk toggle in pages | B | `PemasukanUang.tsx`, `PemasukanBeras.tsx` |
| 7.2–7.6 QA test scripts and manual checklist | C | QA notes only (read-only on source) |

> **Note:** Agent B works sequentially within its own tasks (Form → Receipt → Toggle). Agent C runs in parallel on QA prep without touching B's files.

> **Gate:** Build passes (`npm run build`) before Wave 3.

---

#### Wave 3 — Final QA + Deploy (C leads; A applies migration)

| Task | Agent | Files touched |
|---|---|---|
| 7.1 Build check + TypeScript fixes | C | Any file with TS errors |
| 7.2 Run all tests | C | Test runner only |
| 7.3–7.6 Manual QA execution | C | No code changes |
| 7.7 Apply migration to production Supabase | A | Supabase Dashboard (SQL Editor) |
| 7.8 Commit + push branch | A | git only |

---

### Conflict Prevention Rules

1. **No two agents touch the same file in the same wave.**
2. **`bulk.ts` is read-only after Wave 0** — type changes require PM approval and re-sync.
3. **Agent B owns** all `src/components/pemasukan/*` and page files.
4. **Agent C owns** all `src/hooks/useBulkPembayaran*` and test files.
5. **Agent A owns** all `supabase/migrations/*` and `src/types/database.types.ts`.
