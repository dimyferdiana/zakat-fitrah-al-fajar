# Tasks: Account Transaction Type Availability (Pengaturan Ketersediaan Rekening per Tipe Transaksi)

**PRD:** `prd-task/generations/active/prd-account-transaction-type-availability.md`
**Branch:** `feature/account-transaction-type-availability`

---

## Relevant Files

- `zakat-fitrah-app/supabase/migrations/038_account_transaction_contexts.sql` — Migrasi baru: tambah kolom `allowed_transaction_contexts` JSONB pada tabel `accounts`
- `zakat-fitrah-app/src/types/database.types.ts` — Perlu ditambahkan field `allowed_transaction_contexts` pada tipe `accounts`
- `zakat-fitrah-app/src/hooks/useAccountsLedger.ts` — Update `useAccountsList` agar mendukung parameter `context` opsional untuk filtering
- `zakat-fitrah-app/src/components/accounts/AccountFormDialog.tsx` — Tambah panel "Pengaturan Ketersediaan Transaksi" dengan toggle per konteks
- `zakat-fitrah-app/src/pages/AccountsManagement.tsx` — Tambah kolom badge ringkasan konteks di tabel daftar rekening + Export/Import konfigurasi
- `zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx` — Update selector rekening agar memfilter berdasarkan konteks penerimaan
- `zakat-fitrah-app/src/components/pemasukan/BulkPemasukanForm.tsx` — Update selector rekening agar memfilter berdasarkan konteks (union multi-kategori)
- `zakat-fitrah-app/src/components/distribusi/DistribusiForm.tsx` — Update selector rekening agar memfilter per konteks distribusi asnaf, blokir QRIS
- `zakat-fitrah-app/src/components/settings/RekonsiliasiForm.tsx` — Update selector rekening agar memfilter berdasarkan konteks `rekonsiliasi`, blokir QRIS
- `zakat-fitrah-app/src/lib/accountContextUtils.ts` *(baru)* — Utility: helper untuk menentukan apakah rekening diizinkan untuk konteks tertentu, normalisasi slug asnaf, hard-coded QRIS block

### Notes

- Kolom `allowed_transaction_contexts` menggunakan JSONB dengan default `{"all": true}` (backward-compatible — semua rekening existing tetap berfungsi tanpa konfigurasi ulang).
- Slug konteks distribusi dibentuk dari nama asnaf di tabel `kategori_mustahik` yang di-normalisasi: lowercase + spasi → underscore. Contoh: `"Fakir Miskin"` → `distribusi_fakir_miskin`.
- Rekening QRIS diblokir secara **hard-coded** dari semua konteks non-penerimaan tanpa bergantung pada konfigurasi JSONB.
- Fallback: jika tidak ada rekening yang cocok setelah filter, tampilkan semua rekening aktif (untuk QRIS: hanya fallback di konteks penerimaan).
- Jalankan `npm run build` dari `zakat-fitrah-app/` setelah setiap phase sebelum commit.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Dari direktori `zakat-fitrah-app/`, jalankan: `git checkout -b feature/account-transaction-type-availability`

- [ ] 1.0 Database Schema — Tambah kolom `allowed_transaction_contexts`
  - [ ] 1.1 Buat file migrasi `zakat-fitrah-app/supabase/migrations/038_account_transaction_contexts.sql`
  - [ ] 1.2 Tulis SQL: `ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS allowed_transaction_contexts JSONB NOT NULL DEFAULT '{"all": true}'::jsonb;`
  - [ ] 1.3 Tambahkan index GIN pada kolom JSONB untuk performa query: `CREATE INDEX IF NOT EXISTS idx_accounts_transaction_contexts ON public.accounts USING GIN (allowed_transaction_contexts);`
  - [ ] 1.4 Tambahkan komentar kolom di SQL: `COMMENT ON COLUMN public.accounts.allowed_transaction_contexts IS 'JSONB config of allowed transaction contexts. {"all": true} = available in all contexts.';`
  - [ ] 1.5 Jalankan migrasi lokal: `supabase db push --local` dari direktori `zakat-fitrah-app/`
  - [ ] 1.6 Update `database.types.ts`: tambahkan field `allowed_transaction_contexts: Json | null` pada Row/Insert/Update tipe tabel `accounts`

- [ ] 2.0 Utility Helper — `accountContextUtils.ts`
  - [ ] 2.1 Buat file `zakat-fitrah-app/src/lib/accountContextUtils.ts`
  - [ ] 2.2 Definisikan type `TransactionContext = string` dan konstanta konteks penerimaan statis: `PEMASUKAN_CONTEXTS = ['pemasukan_zakat_fitrah', 'pemasukan_maal', 'pemasukan_infak', 'pemasukan_fidyah']`
  - [ ] 2.3 Buat fungsi `buildDistribusiContext(namaAsnaf: string): string` — normalisasi slug: trim + lowercase + replace spasi dengan underscore, prefix `distribusi_`
  - [ ] 2.4 Buat fungsi `isQrisBlocked(accountChannel: string, context: string): boolean` — return `true` jika channel `'qris'` dan context tidak dimulai dengan `'pemasukan_'`
  - [ ] 2.5 Buat fungsi `isAccountAllowedForContext(allowedContexts: Record<string, boolean>, context: string): boolean` — cek `all: true` sebagai shortcut, lalu cek key context spesifik
  - [ ] 2.6 Buat fungsi `filterAccountsByContext(accounts: Account[], context: string): Account[]` — gabungkan QRIS block + context check + fallback ke semua aktif jika hasil kosong

- [ ] 3.0 Hook — Update `useAccountsList` dengan parameter `context` opsional
  - [ ] 3.1 Buka `zakat-fitrah-app/src/hooks/useAccountsLedger.ts`, baca implementasi `useAccountsList` saat ini
  - [ ] 3.2 Tambahkan parameter opsional `context?: string` pada `useAccountsList`
  - [ ] 3.3 Jika `context` diberikan, tambahkan post-fetch client-side filtering menggunakan `filterAccountsByContext` dari `accountContextUtils.ts`
  - [ ] 3.4 Pastikan semua caller lama `useAccountsList()` tanpa argumen tetap berfungsi (backward-compatible)
  - [ ] 3.5 Jalankan `npm run build` dan pastikan tidak ada TypeScript error

- [ ] 4.0 Config UI — Panel toggle di `AccountFormDialog.tsx`
  - [ ] 4.1 Baca `src/components/accounts/AccountFormDialog.tsx` untuk memahami struktur form saat ini
  - [ ] 4.2 Tambahkan query `useKategoriMustahik` (atau gunakan hook yang sudah ada) di dalam `AccountFormDialog` untuk mengambil daftar asnaf dinamis dari tabel `kategori_mustahik`
  - [ ] 4.3 Tambahkan state lokal `allowedContexts: Record<string, boolean>` yang di-initialize dari data rekening yang sedang diedit, dengan default `{ all: true }`
  - [ ] 4.4 Buat UI panel "Pengaturan Ketersediaan Transaksi" di dalam form dialog menggunakan komponen `Switch` atau `Checkbox` dari shadcn/ui
  - [ ] 4.5 Tampilkan toggle `"Izinkan di Semua Konteks"` sebagai master-toggle. Jika aktif, sembunyikan/disable toggle individual
  - [ ] 4.6 Tampilkan toggle per konteks penerimaan statis (4 konteks: zakat fitrah, maal, infak, fidyah) dengan ikon `ArrowDownCircle` (lucide-react)
  - [ ] 4.7 Render toggle per asnaf dinamis dari hasil query `kategori_mustahik`, gunakan `buildDistribusiContext()` untuk slug, dengan ikon `HandCoins`
  - [ ] 4.8 Tampilkan toggle `rekonsiliasi` dengan ikon `RefreshCw` dan toggle `entry_manual` dengan ikon `Pencil`
  - [ ] 4.9 Untuk rekening dengan `account_channel = 'qris'`, tampilkan info-banner bahwa QRIS otomatis dibatasi hanya untuk penerimaan dan sembunyikan toggle distribusi/rekonsiliasi/entry_manual
  - [ ] 4.10 Pastikan `allowedContexts` di-include saat submit form edit/create rekening (`useUpdateAccount` / `useCreateAccount`)
  - [ ] 4.11 Update `useUpdateAccount` dan `useCreateAccount` di hook agar menyertakan field `allowed_transaction_contexts` dalam payload upsert

- [ ] 5.0 Badge ringkasan konteks di tabel `AccountsManagement.tsx`
  - [ ] 5.1 Baca `src/pages/AccountsManagement.tsx` untuk memahami struktur tabel daftar rekening saat ini
  - [ ] 5.2 Buat komponen kecil `AccountContextBadges` (inline di halaman atau file terpisah) yang menerima prop `allowedContexts` dan `accountChannel`
  - [ ] 5.3 Jika `all: true`, render badge hijau `Semua Konteks` dengan ikon `CheckCircle`
  - [ ] 5.4 Jika `account_channel = 'qris'`, render badge ungu `QRIS — Penerimaan Saja` dengan ikon `QrCode`
  - [ ] 5.5 Jika terkonfigurasi parsial, render badge abu-abu per konteks aktif (maksimal 3 badge, sisanya `+N lainnya`) dengan ikon per grup konteks sesuai panduan di PRD §7
  - [ ] 5.6 Jika tidak ada konteks aktif sama sekali, render badge merah `Tidak Tersedia` dengan ikon `XCircle`
  - [ ] 5.7 Tambahkan kolom "Ketersediaan" di tabel rekening yang menampilkan `AccountContextBadges`

- [ ] 6.0 Filtering di formulir transaksi — Penerimaan Uang
  - [ ] 6.1 Baca `src/components/pemasukan/PemasukanForm.tsx` dan identifikasi bagaimana rekening saat ini di-fetch dan di-render di selector
  - [ ] 6.2 Tentukan konteks berdasarkan `jenis_pemasukan` / kategori form yang sedang aktif (mis. `zakat_fitrah` → `pemasukan_zakat_fitrah`)
  - [ ] 6.3 Teruskan konteks ke `useAccountsList({ context })` agar hanya rekening yang relevan yang ditampilkan
  - [ ] 6.4 Pastikan fallback berfungsi: jika hasil filter 0 rekening, tampilkan semua aktif

- [ ] 7.0 Filtering di formulir transaksi — Bulk Input Penerimaan
  - [ ] 7.1 Baca `src/components/pemasukan/BulkPemasukanForm.tsx` dan identifikasi bagaimana rekening di-fetch untuk selector
  - [ ] 7.2 Hitung union konteks dari semua baris uang yang ada di bulk (mis. baris zakat fitrah + infak → union `pemasukan_zakat_fitrah` + `pemasukan_infak`)
  - [ ] 7.3 Filter rekening menggunakan `filterAccountsByContext` dengan logika union: rekening ditampilkan jika diizinkan untuk **minimal satu** konteks dalam union
  - [ ] 7.4 Pastikan dropdown rekening ter-update reaktif saat komposisi baris berubah

- [ ] 8.0 Filtering di formulir transaksi — Distribusi/Pembayaran Zakat
  - [ ] 8.1 Baca `src/components/distribusi/DistribusiForm.tsx` dan identifikasi selector rekening saat ini
  - [ ] 8.2 Ambil nama asnaf dari mustahik yang dipilih (via relasi `mustahik.kategori_mustahik.nama`)
  - [ ] 8.3 Gunakan `buildDistribusiContext(namaAsnaf)` untuk menentukan kode konteks
  - [ ] 8.4 Filter rekening menggunakan konteks tersebut, dan blokir QRIS menggunakan `isQrisBlocked()`
  - [ ] 8.5 Pastikan fallback berfungsi dan QRIS tidak pernah muncul di distribusi

- [ ] 9.0 Filtering di formulir transaksi — Rekonsiliasi
  - [ ] 9.1 Baca `src/components/settings/RekonsiliasiForm.tsx` dan identifikasi selector rekening
  - [ ] 9.2 Teruskan konteks `'rekonsiliasi'` ke filter rekening
  - [ ] 9.3 Blokir QRIS menggunakan `isQrisBlocked()` secara hard-coded
  - [ ] 9.4 Pastikan fallback menghilangkan QRIS meskipun semua rekening lain difilter habis

- [ ] 10.0 Filtering di formulir transaksi — Entry Manual Ledger
  - [ ] 10.1 Baca `src/pages/AccountsManagement.tsx` bagian form entry manual ledger
  - [ ] 10.2 Teruskan konteks `'entry_manual'` ke filter rekening
  - [ ] 10.3 Pastikan fallback mempertahankan fungsi eksisting

- [ ] 11.0 Validasi Server-Side di hook mutasi
  - [ ] 11.1 Update `useCreatePemasukanUang` / `useUpdatePemasukanUang` di `useAccountsLedger.ts` atau hooks terkait: tambahkan pre-submit check bahwa `account_id` yang dipilih memiliki konteks yang sesuai
  - [ ] 11.2 Jika validasi gagal (rekening tidak diizinkan untuk konteks), throw error dengan pesan yang jelas sebelum hit Supabase
  - [ ] 11.3 Lakukan hal yang sama untuk hook mutasi distribusi (`useCreateDistribusi` / `useUpdateDistribusi`)
  - [ ] 11.4 Lakukan hal yang sama untuk hook mutasi rekonsiliasi
  - [ ] 11.5 Pastikan blokir QRIS diterapkan di level validasi server-side (tidak bisa di-bypass dari client)

- [ ] 12.0 Export / Import konfigurasi rekening
  - [ ] 12.1 Buat fungsi `exportAccountContextsConfig(accounts: Account[]): string` di `accountContextUtils.ts` — hasilkan JSON string berisi array `{ id, account_name, allowed_transaction_contexts }` untuk semua rekening
  - [ ] 12.2 Buat fungsi `parseImportedContextsConfig(jsonString: string): ImportPayload[] | Error` — validasi schema JSON (array of objects dengan `id` dan `allowed_transaction_contexts`), return error jika schema tidak valid
  - [ ] 12.3 Tambahkan tombol **"Export Konfigurasi"** di halaman `AccountsManagement.tsx` (di area header/toolbar) — klik mengunduh file `rekening-config-{tanggal}.json`
  - [ ] 12.4 Tambahkan tombol **"Import Konfigurasi"** di area yang sama — klik membuka file picker JSON
  - [ ] 12.5 Setelah import berhasil di-parse, tampilkan preview perubahan dalam dialog konfirmasi sebelum menyimpan
  - [ ] 12.6 Setelah konfirmasi, jalankan batch `useUpdateAccount` untuk setiap rekening dalam payload import
  - [ ] 12.7 Tampilkan toast sukses/gagal setelah proses import selesai

- [ ] 13.0 QA & Build
  - [ ] 13.1 Jalankan `npm run build` dari `zakat-fitrah-app/` — pastikan zero TypeScript errors
  - [ ] 13.2 Test manual: buka form edit rekening, verifikasi panel toggle muncul dan bisa disimpan
  - [ ] 13.3 Test manual: buka tabel daftar rekening, verifikasi badge/ikon muncul sesuai konfigurasi
  - [ ] 13.4 Test manual: input penerimaan zakat fitrah — verifikasi hanya rekening zakat fitrah yang muncul
  - [ ] 13.5 Test manual: ubah rekening QRIS — verifikasi toggle distribusi/rekonsiliasi/manual tidak muncul dan selector distribusi tidak menampilkan rekening QRIS
  - [ ] 13.6 Test manual: fallback — nonaktifkan semua konteks sebuah rekening, verifikasi rekening masih muncul sebagai fallback saat tidak ada rekening lain yang cocok
  - [ ] 13.7 Test manual: export → download JSON → import kembali → verifikasi konfigurasi tidak berubah
  - [ ] 13.8 Commit dengan pesan: `feat(accounts): add transaction context availability config`

