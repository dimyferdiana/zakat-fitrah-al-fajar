# Tasks: Revamp Navigasi + Manajemen Rekening/Kas

## Document Control
- **Version:** V1.8.0
- **Created Date:** 2026-02-26
- **Last Updated:** 2026-02-26
- **Summary of Addition/Adjustment:** Menjabarkan implementasi revamp menu, perubahan terminologi penerimaan, serta manajemen akun/ledger dan alur posting.

## Relevant Files

- `zakat-fitrah-app/src/components/layouts/MainLayout.tsx` - Struktur menu utama, grouping, label, visibility, dan urutan navigasi.
- `zakat-fitrah-app/src/App.tsx` - Definisi route utama, pemindahan route, dan redirect route lama ke route baru.
- `zakat-fitrah-app/src/pages/PemasukanUang.tsx` - Halaman utama yang akan di-rename secara terminologi ke Penerimaan Uang.
- `zakat-fitrah-app/src/pages/PemasukanBeras.tsx` - Halaman utama yang akan di-rename secara terminologi ke Penerimaan Beras.
- `zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx` - Form penerimaan uang; update label, source-account selection, dan posting ledger.
- `zakat-fitrah-app/src/components/pemasukan/PemasukanBerasForm.tsx` - Form penerimaan beras; update label, account mapping, dan ledger linkage.
- `zakat-fitrah-app/src/components/pemasukan/BulkPemasukanForm.tsx` - Flow bulk penerimaan; sinkronisasi terminologi + akun posting.
- `zakat-fitrah-app/src/hooks/usePemasukanUang.ts` - Mutasi/query penerimaan uang; integrasi auto-post ke ledger.
- `zakat-fitrah-app/src/hooks/usePemasukanBeras.ts` - Mutasi/query penerimaan beras; integrasi auto-post ke ledger.
- `zakat-fitrah-app/src/pages/Muzakki.tsx` - Entry point halaman Data Muzakki untuk pemisahan flow create/edit dan akses riwayat.
- `zakat-fitrah-app/src/components/muzakki/MuzakkiForm.tsx` - Form Muzakki master data only (tanpa field transaksi).
- `zakat-fitrah-app/src/components/muzakki/MuzakkiTable.tsx` - List Data Muzakki; navigasi ke detail dan trigger aksi CRUD.
- `zakat-fitrah-app/src/hooks/useMuzakki.ts` - Logika create/update/delete Muzakki tanpa coupling transaksi.
- `zakat-fitrah-app/src/pages/Rekonsiliasi.tsx` - Integrasi kebutuhan rekonsiliasi dengan akun/ledger baru.
- `zakat-fitrah-app/src/hooks/useRekonsiliasi.ts` - Hook proses rekonsiliasi untuk posting ledger dan audit.
- `zakat-fitrah-app/src/lib/supabase.ts` - Client akses DB untuk query tabel akun/ledger baru.
- `zakat-fitrah-app/src/lib/offlineStore.ts` - Penyesuaian fallback offline untuk data akun/ledger (jika mode offline tetap dipakai).
- `zakat-fitrah-app/src/types/database.types.ts` - Penambahan tipe tabel `accounts` dan `account_ledger_entries`.
- `zakat-fitrah-app/supabase/migrations/[next]_accounts_and_ledger_schema.sql` - Schema tabel akun + ledger + indeks + constraint.
- `zakat-fitrah-app/supabase/migrations/[next]_accounts_and_ledger_rls.sql` - RLS policy role-based untuk akun dan ledger.
- `zakat-fitrah-app/supabase/migrations/[next]_accounts_default_seed.sql` - Prefill 6 akun default first-run.
- `zakat-fitrah-app/supabase/migrations/[next]_legacy_account_backfill.sql` - Migrasi/normalisasi data historis agar kompatibel.
- `zakat-fitrah-app/src/hooks/usePemasukanUang.test.ts` - Uji mutasi penerimaan uang dan validasi posting ledger.
- `zakat-fitrah-app/src/hooks/usePemasukanBeras.test.ts` - Uji mutasi penerimaan beras dan validasi posting ledger.
- `zakat-fitrah-app/src/hooks/useMuzakki.test.ts` - Uji bahwa create/edit Muzakki tidak membuat transaksi.
- `zakat-fitrah-app/src/hooks/useRekonsiliasi.test.ts` - Uji entry rekonsiliasi, audit trail, dan konsistensi saldo.

### Notes

- Unit test sebaiknya ditempatkan berdampingan dengan file yang diuji (`*.test.ts` / `*.test.tsx`).
- Gunakan `npm run test` (Vitest) untuk menjalankan seluruh test suite pada proyek ini.
- Jika perlu uji spesifik per file, gunakan `npx vitest run path/to/file.test.ts`.
- Jalankan `npm run build` setelah perubahan besar untuk memastikan tidak ada error TypeScript/build.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [X] 0.0 Create feature branch
  - [X] 0.1 Create and checkout branch baru untuk fitur ini (contoh: `git checkout -b feat/revamp-menu-account-ledger`)
  - [X] 0.2 Push branch awal ke remote dan pastikan bukan branch `main`
- [X] 1.0 Implement navigation revamp (grouping, reorder, rename, route move + redirects)
  - [X] 1.1 Finalkan menu map baru berdasarkan PRD (group heading, item, urutan, role visibility)
  - [X] 1.2 Refactor konfigurasi nav di `MainLayout` agar mendukung grouping dan urutan final
  - [X] 1.3 Update route tree di `App.tsx` untuk route/section baru
  - [X] 1.4 Tambahkan redirect route lama ke route baru untuk menjaga deep-link compatibility
  - [X] 1.5 Verifikasi proteksi role-based access tetap sama setelah rename/move route
  - [X] 1.6 Uji manual semua menu utama (Admin/Petugas/Bendahara) untuk memastikan tidak ada dead link
- [X] 2.0 Replace "Pemasukan" terminology with "Penerimaan" across impacted UI
  - [X] 2.1 Inventarisasi semua string "Pemasukan" di pages, components, breadcrumbs, tombol, dan helper text
  - [X] 2.2 Ubah label halaman menjadi "Penerimaan Uang" dan "Penerimaan Beras"
  - [X] 2.3 Ubah label action/filter/section yang relevan tanpa mengubah arti bisnis lain
  - [X] 2.4 Pastikan penamaan di menu, judul tab, dan route display name konsisten
  - [X] 2.5 Jalankan smoke test UI untuk cek tidak ada label lama yang tertinggal di area terdampak
- [X] 3.0 Refactor Muzakki flow into master-data-only CRUD (remove transaction input from create/edit)
  - [X] 3.1 Audit field form create/edit Muzakki dan tandai field transaksi yang harus dihapus
  - [X] 3.2 Refactor `MuzakkiForm` agar hanya menyimpan data master orang/KK
  - [X] 3.3 Pastikan `useMuzakki` mutation tidak memicu create transaksi apa pun
  - [X] 3.4 Pindahkan entry transaksi agar hanya tersedia via modul Penerimaan
  - [X] 3.5 Pertahankan akses riwayat transaksi Muzakki pada halaman detail/list (read-only context)
  - [X] 3.6 Tambahkan test untuk memastikan create/edit Muzakki tidak membuat record transaksi baru
- [X] 4.0 Build account management module (Kas/Bank/QRIS) with default prefill + safe lifecycle rules
  - [X] 4.1 Buat migration schema `accounts` (field inti: name, type, status, metadata, timestamps)
  - [X] 4.2 Tambahkan RLS policy CRUD akun berdasarkan role (minimal Admin/Bendahara)
  - [X] 4.3 Buat migration seed prefill 6 akun default first-run sesuai PRD
  - [X] 4.4 Implement halaman daftar akun (list + search sederhana + status aktif/nonaktif)
  - [X] 4.5 Implement form tambah/edit akun dengan validasi field wajib
  - [X] 4.6 Implement aturan hapus aman (soft-delete atau hard-delete guarded by existing ledger)
  - [X] 4.7 Integrasikan account selector ke modul transaksi yang melakukan posting otomatis
- [X] 5.0 Build per-account ledger (IN/OUT/REKONSILIASI) with hybrid posting, filters, and audit trail
  - [X] 5.1 Buat migration schema `account_ledger_entries` dengan referensi akun dan sumber transaksi
  - [X] 5.2 Definisikan kolom wajib ledger: tanggal, tipe mutasi, nominal/kuantitas, referensi, catatan, saldo berjalan
  - [X] 5.3 Implement auto-posting dari modul transaksi terkait ke ledger akun terpilih
  - [X] 5.4 Implement entry manual IN/OUT pada halaman ledger akun
  - [X] 5.5 Implement entry manual REKONSILIASI pada halaman ledger akun
  - [X] 5.6 Simpan audit trail untuk seluruh entry manual (`created_by`, `updated_by`, `timestamp`, `reason`)
  - [X] 5.7 Implement filter ledger (rentang tanggal, tipe mutasi, kata kunci)
  - [X] 5.8 Tambahkan guard agar transaksi tidak dapat disimpan tanpa akun (sesuai rule PRD)
  - [X] 5.9 Tambahkan test konsistensi saldo berjalan saat create/update/cancel transaksi
- [X] 6.0 Implement data migration/backward compatibility and validation coverage (saldo consistency, role policies)
  - [X] 6.1 Definisikan strategi mapping data historis ke akun default/akun fallback
  - [X] 6.2 Buat migration backfill untuk transaksi legacy yang belum memiliki account linkage
  - [X] 6.3 Verifikasi seluruh transaksi baru memiliki linkage akun valid (no orphan transaction)
  - [X] 6.4 Uji role policy untuk akun/ledger di semua operasi (create/update/delete/read)
  - [X] 6.5 Uji konsistensi saldo antara ledger akun dan ringkasan dashboard periode sama
  - [X] 6.6 Jalankan regression test area terdampak (menu, muzakki, penerimaan, rekonsiliasi)
  - [X] 6.7 Jalankan `npm run build` dan dokumentasikan hasil validasi sebelum merge
