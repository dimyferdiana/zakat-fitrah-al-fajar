## Relevant Files

### Files to Create
- `zakat-fitrah-app/src/components/layouts/AppLayout.tsx` — Layout utama baru berbasis shadcn sidebar-07, menggantikan MainLayout
- `zakat-fitrah-app/src/components/layouts/AppSwitcher.tsx` — Komponen App Switcher (Zakat ↔ Qurban) di pojok kiri atas sidebar
- `zakat-fitrah-app/src/store/appStore.ts` — Zustand store untuk menyimpan state app aktif (`zakat` | `qurban`)
- `zakat-fitrah-app/src/pages/Qurban.tsx` — Halaman utama modul Qurban
- `zakat-fitrah-app/src/components/qurban/QurbanForm.tsx` — Form pendaftaran Qurban dalam modal Dialog
- `zakat-fitrah-app/src/components/qurban/QurbanTable.tsx` — Tabel daftar pendaftaran Qurban
- `zakat-fitrah-app/src/components/qurban/BuktiQurban.tsx` — Komponen kuitansi PDF Qurban
- `zakat-fitrah-app/src/components/qurban/PhotoUpload.tsx` — Komponen upload foto hewan (opsional)
- `zakat-fitrah-app/src/hooks/useQurban.ts` — React Query hooks (list, create, update, delete)
- `zakat-fitrah-app/src/types/qurban.ts` — TypeScript interfaces untuk domain Qurban
- `zakat-fitrah-app/supabase/migrations/NNNN_create_qurban_tables.sql` — SQL migration tabel Qurban

### Files to Modify
- `zakat-fitrah-app/src/App.tsx` — Tambah route `/qurban`, ganti `MainLayout` dengan `AppLayout`
- `zakat-fitrah-app/src/components/layouts/MainLayout.tsx` — Digantikan/direfactor ke AppLayout
- `zakat-fitrah-app/src/types/database.types.ts` — Regenerate setelah migration diterapkan

### Notes
- Jalankan build setelah setiap task besar: `cd zakat-fitrah-app && npm run build`
- Untuk apply migration lokal: `supabase db push` atau apply via Supabase MCP tool
- Regenerate types setelah migration: `supabase gen types typescript --local > src/types/database.types.ts`

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Buat dan checkout branch baru: `git checkout -b feature/qurban-module-sidebar-07`

- [x] 1.0 Sidebar Redesign — Ganti MainLayout dengan shadcn sidebar-07
  - [x] 1.1 Install komponen sidebar-07 dari shadcn: `cd zakat-fitrah-app && npx shadcn@latest add sidebar-07`
  - [x] 1.2 Baca dan pahami struktur `src/components/layouts/MainLayout.tsx` yang lama (navigasi sections, role filtering, responsive mobile)
  - [x] 1.3 Buat `src/components/layouts/AppLayout.tsx` berbasis sidebar-07 — migrasikan semua navigation sections Zakat Fitrah (Ringkasan, Data Master, Transaksi, Laporan, Sistem) ke config baru
  - [x] 1.4 Pastikan role-based nav filtering tetap berfungsi di AppLayout (items disembunyikan per role)
  - [x] 1.5 Pastikan responsive mobile sidebar (Sheet/drawer) tetap berfungsi dengan sidebar-07
  - [x] 1.6 Pastikan header dinamis (judul halaman berdasarkan route aktif) tetap tampil
  - [x] 1.7 Ganti semua referensi `MainLayout` di `src/App.tsx` dengan `AppLayout`
  - [x] 1.8 Jalankan `npm run build` — pastikan tidak ada error TypeScript setelah migrasi layout

- [x] 2.0 App Switcher — Tambah switcher Zakat Fitrah ↔ Qurban di pojok kiri atas
  - [x] 2.1 Buat `src/store/appStore.ts` — Zustand store dengan state `activeApp: 'zakat' | 'qurban'` dan setter-nya
  - [x] 2.2 Definisikan nav config untuk app Qurban: `Ringkasan Qurban` (`/qurban/ringkasan`) dan `Data Qurban` (`/qurban`)
  - [x] 2.3 Buat `src/components/layouts/AppSwitcher.tsx` — dropdown/popover mengikuti pola ACME/team switcher bawaan sidebar-07, menampilkan dua pilihan: **Zakat Fitrah** dan **Qurban**
  - [x] 2.4 Integrasikan `AppSwitcher` ke `AppLayout` di pojok kiri atas, menggantikan area logo/nama aplikasi saat ini
  - [x] 2.5 Implementasikan logika: saat app switcher berubah, sidebar menampilkan nav items sesuai app aktif (Zakat atau Qurban)
  - [x] 2.6 Saat switch ke Qurban, redirect ke `/qurban`; saat switch ke Zakat Fitrah, redirect ke `/dashboard`
  - [x] 2.7 Test switching bolak-balik Zakat ↔ Qurban — pastikan navigasi dan state konsisten

- [x] 3.0 Database & Backend — Migration tabel Qurban + RLS policies
  - [x] 3.1 Cek nomor migration terakhir di `supabase/migrations/` untuk menentukan nomor berikutnya
  - [x] 3.2 Buat file `supabase/migrations/NNNN_create_qurban_tables.sql`
  - [x] 3.3 Definisikan tabel `qurban_registrations` dengan kolom: `id`, `no_qurban`, `tanggal`, `nama`, `alamat`, `no_hp`, `jenis`, `sumber_hewan`, `biaya_perawatan`, `nominal`, `status`, `catatan`, `photo_url`, `created_at`, `updated_at`, `created_by`
  - [x] 3.4 Definisikan tabel `qurban_participants` dengan kolom: `id`, `qurban_registration_id` (FK → `qurban_registrations`), `nama`, `urutan`
  - [x] 3.5 Buat function/trigger PostgreSQL untuk auto-generate `no_qurban` dalam format `SAP-YYYY-NNN` (Sapi) dan `KAM-YYYY-NNN` (Kambing), sequential per tahun dan jenis
  - [x] 3.6 Tambahkan RLS policies untuk `qurban_registrations`: `SELECT` (semua role), `INSERT/UPDATE/DELETE` (admin, petugas)
  - [x] 3.7 Tambahkan RLS policies untuk `qurban_participants`: sama dengan `qurban_registrations`
  - [x] 3.8 Apply migration ke Supabase (gunakan Supabase MCP tool `apply_migration` atau `supabase db push`)
  - [x] 3.9 Regenerate TypeScript types setelah migration berhasil: `supabase gen types typescript > src/types/database.types.ts`

- [x] 4.0 Modul Qurban Core — Types, hooks, halaman, tabel, dan form pendaftaran
  - [x] 4.1 Buat `src/types/qurban.ts` — definisikan interfaces: `QurbanRegistration`, `QurbanParticipant`, `QurbanFormValues`, `QurbanListParams`
  - [x] 4.2 Buat `src/hooks/useQurban.ts` — implementasikan hooks berikut mengikuti pola `useMuzakki.ts`:
    - `useQurbanList(params)` — fetch daftar pendaftaran dengan filter & pagination
    - `useCreateQurban()` — mutation untuk buat pendaftaran baru (termasuk insert participants)
    - `useUpdateQurban()` — mutation untuk edit pendaftaran
    - `useDeleteQurban()` — mutation untuk hapus pendaftaran
  - [x] 4.3 Buat `src/components/qurban/QurbanTable.tsx` — tabel dengan kolom: Tanggal, No. Qurban, Nama, Jenis, Qurban a/n (ringkasan jumlah nama), Nominal (formatted Rp), Status (badge), Aksi (edit, hapus, unduh kuitansi)
  - [x] 4.4 Implementasikan search bar (Nama, No HP) dan filter (Jenis Qurban, Status, rentang Tanggal) di `QurbanTable`
  - [x] 4.5 Implementasikan pagination di `QurbanTable`
  - [x] 4.6 Buat `src/components/qurban/QurbanForm.tsx` — form dalam Dialog dengan semua field sesuai PRD
  - [x] 4.7 Implementasikan conditional field: field **Biaya Perawatan** hanya tampil saat Sumber Hewan = `Titipan (Bawa Sendiri)` menggunakan `watch()` dari React Hook Form
  - [x] 4.8 Implementasikan dynamic field array untuk **Qurban a/n** menggunakan `useFieldArray` — tombol `+` tambah nama, tombol `×` hapus nama; batasi max sesuai jenis (Sapi: 7, Kambing: 1)
  - [x] 4.9 Buat Zod validation schema: validasi semua field wajib, format No HP, batas jumlah a/n per jenis hewan
  - [x] 4.10 Buat `src/pages/Qurban.tsx` — halaman utama yang menyatukan `QurbanTable` + dialog `QurbanForm` (create & edit)
  - [x] 4.11 Tambahkan route `/qurban` di `src/App.tsx` dengan `ProtectedRoute` (admin, petugas), di-render dalam `AppLayout`

- [x] 5.0 Kuitansi PDF Qurban — Generate & download bukti pendaftaran Qurban
  - [x] 5.1 Buat `src/components/qurban/BuktiQurban.tsx` mengikuti pola `src/components/muzakki/BuktiPembayaran.tsx`
  - [x] 5.2 Implementasikan fungsi `generateQurbanReceiptPDF(data: QurbanRegistration)` menggunakan `jsPDF`:
    - Header: logo Al-Fajar, nama organisasi, alamat (dari `branding.ts`)
    - Body: No. Qurban, Tanggal, Nama, Alamat, No HP, Jenis Qurban, Sumber Hewan
    - Daftar Qurban a/n (list bernomor)
    - Nominal Rp + Biaya Perawatan (jika berlaku), Status pembayaran
    - Footer: tanda tangan / cap (jika tersedia)
  - [x] 5.3 Implementasikan fungsi `downloadQurbanReceipt()` dan `printQurbanReceipt()`
  - [x] 5.4 Tambahkan tombol **Unduh Kuitansi** dan **Cetak** di kolom Aksi pada `QurbanTable`
  - [x] 5.5 Test PDF: generate dengan data Sapi (7 a/n) dan Kambing (1 a/n) — pastikan layout tidak overflow

- [x] 6.0 Upload Foto Hewan (Opsional) — Supabase Storage + tampilan foto di detail
  - [x] 6.1 Buat Supabase Storage bucket `qurban-photos` (public read, authenticated write) via Supabase MCP tool atau migration SQL
  - [x] 6.2 Buat `src/components/qurban/PhotoUpload.tsx` — komponen file input dengan preview thumbnail, accept `image/*`
  - [x] 6.3 Implementasikan upload ke Supabase Storage: `supabase.storage.from('qurban-photos').upload(path, file)`
  - [x] 6.4 Setelah upload berhasil, simpan public URL ke kolom `photo_url` di record `qurban_registrations` via `useUpdateQurban()`
  - [x] 6.5 Integrasikan `PhotoUpload` ke halaman/dialog edit Qurban — tampilkan thumbnail foto jika `photo_url` sudah ada
  - [x] 6.6 Tampilkan thumbnail foto di kolom Foto pada `QurbanTable` (opsional, bisa di tooltip atau kolom terpisah)

- [x] 7.0 Integrasi, Build & QA — Pastikan semua fitur bekerja dan build lulus
  - [ ] 7.1 Test semua navigasi Zakat Fitrah yang ada — pastikan tidak ada regresi setelah migrasi sidebar-07
  - [ ] 7.2 Test App Switcher: Zakat → Qurban → Zakat — navigasi, redirect, dan state konsisten
  - [ ] 7.3 Test form Qurban — create Sapi (7 a/n, Titipan), create Kambing (1 a/n, Beli), edit, delete
  - [ ] 7.4 Test validasi form — coba submit dengan data tidak valid, pastikan error message muncul
  - [ ] 7.5 Test PDF receipt — unduh dan cetak untuk Sapi dan Kambing, cek semua data tampil benar
  - [ ] 7.6 Test upload foto hewan (jika diimplementasikan) — upload, preview, tampil di tabel
  - [ ] 7.7 Test di layar mobile — sidebar-07 drawer, form responsive, tabel scroll horizontal
  - [x] 7.8 Jalankan `cd zakat-fitrah-app && npm run build` — pastikan tidak ada TypeScript error dan build sukses
