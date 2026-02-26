# Release Notes — V1.8.0

Release Date: 2026-02-26
Scope: Consolidated completed feature set from V1.0.0 to V1.8.0

## Highlights
- Dashboard keuangan fase 2 untuk pemasukan multi-kategori, hak amil, dan rekonsiliasi.
- Sedekah receipt generator PDF landscape dengan terbilang, stempel, dan tanda tangan.
- Invitation-only authentication dengan profile management dan penguatan RLS.
- Auto split kelebihan pembayaran menjadi zakat + sedekah/infak.
- Pengaturan hak amil uang/beras lintas kategori dengan basis perhitungan terstandar.
- Bulk pembayaran multi-muzakki dan multi-jenis dengan tanda terima tabel.
- Inline muzakki creation (creatable combobox) di form pemasukan.
- Dashboard configuration dinamis multi-view berbasis widget.
- Revamp navigasi dan manajemen rekening/kas berbasis ledger.

## Version Timeline

| Version | Created Date | Feature |
|---|---|---|
| V1.0.0 | 2026-01-11 | Fase 2 Dashboard Keuangan |
| V1.1.0 | 2026-01-23 | Phase 2.2.0 Sedekah Receipt Generator |
| V1.2.0 | 2026-02-12 | Invitation Auth + User/Profile Management |
| V1.3.0 | 2026-02-12 | Automatic Split Zakat/Sedekah |
| V1.4.0 | 2026-02-21 | Pengaturan Hak Amil (Uang & Beras) |
| V1.5.0 | 2026-02-22 | Bulk Pembayaran Transaksi |
| V1.6.0 | 2026-02-25 | Muzakki Creatable Inline in Pemasukan |
| V1.7.0 | 2026-02-26 | Dashboard Configuration |
| V1.8.0 | 2026-02-26 | Revamp Navigasi + Manajemen Rekening/Kas |

## Detailed Changes

### V1.0.0 — Fase 2 Dashboard Keuangan
- Summary: Menambahkan ruang lingkup Fase 2 untuk pemasukan uang multi-kategori, Hak Amil manual, dan rekonsiliasi admin-only.
- PRD: [prd-task/generations/completed/prd-fase-2-dashboard-keuangan.md](prd-task/generations/completed/prd-fase-2-dashboard-keuangan.md)
- Tasks: [prd-task/generations/completed/tasks-fase-2-dashboard-keuangan.md](prd-task/generations/completed/tasks-fase-2-dashboard-keuangan.md)

### V1.1.0 — Sedekah Receipt Generator
- Summary: Menetapkan generator bukti sedekah PDF landscape lengkap dengan terbilang, stempel, tanda tangan, dan lookup profil donatur.
- PRD: [prd-task/generations/completed/prd-phase-2.2.0-sedekah-receipt.md](prd-task/generations/completed/prd-phase-2.2.0-sedekah-receipt.md)
- Tasks: [prd-task/generations/completed/tasks-phase-2.2.0-sedekah-receipt.md](prd-task/generations/completed/tasks-phase-2.2.0-sedekah-receipt.md)

### V1.2.0 — Invitation Auth + User/Profile Management
- Summary: Mendefinisikan autentikasi wajib, registrasi berbasis undangan, manajemen user admin-only, serta penguatan akses lewat RLS.
- PRD: [prd-task/generations/completed/prd-auth-invite-user-management.md](prd-task/generations/completed/prd-auth-invite-user-management.md)
- Tasks: [prd-task/generations/completed/tasks-invitation-auth-system.md](prd-task/generations/completed/tasks-invitation-auth-system.md)

### V1.3.0 — Automatic Split Zakat/Sedekah
- Summary: Mengatur pemisahan otomatis kelebihan bayar menjadi zakat dan sedekah/infak dengan breakdown realtime, pencatatan ganda, dan dampak ke laporan.
- PRD: [prd-task/generations/completed/prd-auto-split-zakat-sedekah.md](prd-task/generations/completed/prd-auto-split-zakat-sedekah.md)
- Tasks: [prd-task/generations/completed/tasks-auto-split-zakat-sedekah.md](prd-task/generations/completed/tasks-auto-split-zakat-sedekah.md)

### V1.4.0 — Pengaturan Hak Amil (Uang & Beras)
- Summary: Menstandarkan aturan hak amil lintas kategori uang/beras, basis neto rekonsiliasi, konfigurasi per tahun, dan rekap laporan.
- PRD: [prd-task/generations/completed/prd-hak-amil-uang-beras.md](prd-task/generations/completed/prd-hak-amil-uang-beras.md)
- Tasks: [prd-task/generations/completed/tasks-hak-amil-uang-beras.md](prd-task/generations/completed/tasks-hak-amil-uang-beras.md)

### V1.5.0 — Bulk Pembayaran Transaksi
- Summary: Menambahkan alur input transaksi massal multi-muzakki dan multi-jenis dengan bukti terima tabel gabungan yang konsisten.
- PRD: [prd-task/generations/completed/prd-bulk-pembayaran-transaksi.md](prd-task/generations/completed/prd-bulk-pembayaran-transaksi.md)
- Tasks: [prd-task/generations/completed/tasks-bulk-pembayaran-transaksi.md](prd-task/generations/completed/tasks-bulk-pembayaran-transaksi.md)

### V1.6.0 — Muzakki Creatable Inline in Pemasukan
- Summary: Menambahkan creatable combobox agar muzakki baru dapat dibuat inline langsung dari form pemasukan tanpa pindah halaman.
- PRD: [prd-task/generations/completed/prd-muzakki-creatable-in-pemasukan.md](prd-task/generations/completed/prd-muzakki-creatable-in-pemasukan.md)
- Tasks: [prd-task/generations/completed/tasks-muzakki-creatable-in-pemasukan.md](prd-task/generations/completed/tasks-muzakki-creatable-in-pemasukan.md)

### V1.7.0 — Dashboard Configuration
- Summary: Menambahkan konfigurasi dashboard dinamis multi-view dengan widget terpilih, aturan agregasi, dan visibilitas berbasis role.
- PRD: [prd-task/generations/completed/prd-dashboard-configuration.md](prd-task/generations/completed/prd-dashboard-configuration.md)
- Tasks: [prd-task/generations/completed/tasks-dashboard-configuration.md](prd-task/generations/completed/tasks-dashboard-configuration.md)

### V1.8.0 — Revamp Navigasi + Manajemen Rekening/Kas
- Summary: Merombak struktur navigasi dan memperkenalkan manajemen rekening/kas berbasis ledger dengan posting otomatis dan rekonsiliasi.
- PRD: [prd-task/generations/completed/prd-revamp-menu-bank-account-management.md](prd-task/generations/completed/prd-revamp-menu-bank-account-management.md)
- Tasks: [prd-task/generations/completed/tasks-revamp-menu-bank-account-management.md](prd-task/generations/completed/tasks-revamp-menu-bank-account-management.md)

## Fresh Pages and Areas (Consolidated)
- Dashboard
- Dashboard Settings
- Pemasukan Uang
- Pemasukan Beras
- Muzakki
- Sedekah Receipt
- Rekonsiliasi
- Settings (Invitations, Profile, Hak Amil)
- Login / Register / Email Confirmation / Forgot Password / Reset Password

## Notes
- Versioning format follows VX.X.X.
- Version order follows feature Created Date chronology.
- Each PRD and its related task document share the same version.
