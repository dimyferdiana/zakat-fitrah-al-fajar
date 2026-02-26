# Zakat Fitrah Al-Fajar

Aplikasi manajemen zakat masjid berbasis React + TypeScript + Vite dengan backend Supabase.

## Tech Stack
- Frontend: React 19, TypeScript, Vite 7
- UI: Tailwind CSS + shadcn/ui
- Data: Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- State: TanStack Query + Zustand

## Main App
- App source: `zakat-fitrah-app/`
- PRD & task docs: `prd-task/generations/`
- Ops docs: `ops/`

## Release Notes (Completed Features)

| Version | Created Date | Feature |
|---|---|---|
| V1.0.0 | 2026-01-11 | Fase 2 Dashboard Keuangan |
| V1.1.0 | 2026-01-23 | Sedekah Receipt Generator |
| V1.2.0 | 2026-02-12 | Invitation Auth + User/Profile Management |
| V1.3.0 | 2026-02-12 | Auto Split Zakat/Sedekah |
| V1.4.0 | 2026-02-21 | Pengaturan Hak Amil Uang/Beras |
| V1.5.0 | 2026-02-22 | Bulk Pembayaran Transaksi |
| V1.6.0 | 2026-02-25 | Muzakki Creatable Inline in Pemasukan |
| V1.7.0 | 2026-02-26 | Dashboard Configuration |
| V1.8.0 | 2026-02-26 | Revamp Navigasi + Manajemen Rekening/Kas |

## Fresh Features & Pages

### Fresh Features
- Dashboard keuangan multi-kategori (fitrah/fidyah/maal/infak), hak amil, dan rekonsiliasi.
- Generator bukti sedekah PDF landscape dengan terbilang, stempel, dan tanda tangan.
- Invitation-only authentication, profile self-service, dan hardening RLS.
- Auto split kelebihan pembayaran ke sedekah/infak dan sinkronisasi ke laporan.
- Konfigurasi hak amil uang/beras dengan kalkulasi dan rekap per periode.
- Input bulk multi-muzakki + multi-jenis transaksi dengan tanda terima tabel.
- Creatable muzakki inline pada form pemasukan tanpa pindah halaman.
- Dashboard configuration: multi-dashboard, widget composition, visibility rules.
- Revamp menu + modul rekening/kas berbasis ledger (in/out/rekonsiliasi).

### Fresh / Updated Pages (high-level)
- `Dashboard`
- `Dashboard Settings`
- `Pemasukan Uang`
- `Pemasukan Beras`
- `Muzakki`
- `Sedekah Receipt`
- `Rekonsiliasi`
- `Settings` (Invitations, Profile, Hak Amil)
- `Login`, `Register`, `Forgot Password`, `Reset Password`, `Email Confirmation`

## Related Documents
- Completed PRD & task set: `prd-task/generations/completed/`
- Active work: `prd-task/generations/active/`
- QA plans/findings: `prd-task/generations/qa/`
- SQL notes/scripts: `prd-task/generations/sql/`

## Versioning Policy
- Format: `VX.X.X`
- Assigned in chronological order by feature `Created Date`.
- PRD and its related task file share the same feature version.
