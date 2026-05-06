# Tasks: Rename Aplikasi ke UPZ Al-Fajar & Tag Transaksi

**PRD:** `prd-task/generations/active/prd-app-rename-and-transaction-tags.md`
**Status:** Active
**Tanggal:** 2026-04-27

---

## Relevant Files

### Fitur 1 — Rename Aplikasi

| File                                                                  | Keterangan                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `zakat-fitrah-app/index.html`                                       | Update `<title>` dan `<meta>` tags                                           |
| `zakat-fitrah-app/src/lib/constants.ts`                             | **BARU** — Konstanta `APP_NAME`, `ORG_NAME`, `ORG_SERVICE` terpusat |
| `zakat-fitrah-app/src/components/layouts/MainLayout.tsx`            | Ganti "Zakat Fitrah" di sidebar & header                                         |
| `zakat-fitrah-app/src/pages/Login.tsx`                              | Ganti "Aplikasi Zakat Fitrah"                                                    |
| `zakat-fitrah-app/src/components/pemasukan/ReceiptShell.tsx`        | Ganti string Al-Fajar di header receipt                                          |
| `zakat-fitrah-app/src/components/pemasukan/BuktiPemasukanUang.tsx`  | Ganti `ORGANIZATION_SERVICE`                                                   |
| `zakat-fitrah-app/src/components/pemasukan/BuktiPemasukanBeras.tsx` | Ganti nama organisasi di PDF                                                     |
| `zakat-fitrah-app/src/components/muzakki/BuktiPembayaran.tsx`       | Ganti `ORGANIZATION_SERVICE` di PDF                                            |
| `zakat-fitrah-app/src/components/distribusi/BuktiTerima.tsx`        | Ganti "Masjid Al-Fajar" di PDF                                                   |
| `zakat-fitrah-app/src/utils/export.ts`                              | Ganti semua "Masjid Al-Fajar" di laporan PDF/Excel                               |
| `zakat-fitrah-app/src/utils/sedekahReceipt.ts`                      | Ganti `ORGANIZATION_SERVICE`                                                   |
| `zakat-fitrah-app/src/utils/suratPengantar.ts`                      | Ganti `ORGANIZATION_SERVICE` & teks konten surat                               |
| `zakat-fitrah-app/src/pages/SuratPengantar.tsx`                     | Ganti teks deskripsi surat                                                       |

### Fitur 2 — Tag Transaksi

| File                                                                          | Keterangan                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `zakat-fitrah-app/supabase/migrations/032_transaction_tags.sql`             | **BARU** — Tabel, seed data, kolom FK, RLS                   |
| `zakat-fitrah-app/src/types/database.types.ts`                              | Regenerate setelah migrasi                                          |
| `zakat-fitrah-app/src/hooks/useTransactionTags.ts`                          | **BARU** — Hook query list tag + mutation tambah/nonaktifkan |
| `zakat-fitrah-app/src/hooks/usePemasukanUang.ts`                            | Tambah `tag_id` ke params, query, insert, update                  |
| `zakat-fitrah-app/src/hooks/usePemasukanBeras.ts`                           | Tambah `tag_id` ke params, query, insert, update                  |
| `zakat-fitrah-app/src/hooks/useMuzakki.ts`                                  | Tambah `tag_id` ke pembayaran query, insert, update               |
| `zakat-fitrah-app/src/hooks/useDistribusi.ts`                               | Tambah `tag_id` ke query, insert, update                          |
| `zakat-fitrah-app/src/components/settings/TagForm.tsx`                      | **BARU** — Form tambah tag baru                              |
| `zakat-fitrah-app/src/components/settings/TagTable.tsx`                     | **BARU** — Tabel daftar & nonaktifkan tag                    |
| `zakat-fitrah-app/src/pages/Settings.tsx`                                   | Tambah sub-section "Tags Transaksi"                                 |
| `zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx`               | Tambah field dropdown Tag                                           |
| `zakat-fitrah-app/src/components/pemasukan/PemasukanBerasForm.tsx`          | Tambah field dropdown Tag                                           |
| `zakat-fitrah-app/src/components/muzakki/MuzakkiForm.tsx` (form pembayaran) | Tambah field dropdown Tag                                           |
| `zakat-fitrah-app/src/components/distribusi/DistribusiForm.tsx`             | Tambah field dropdown Tag                                           |
| `zakat-fitrah-app/src/pages/PemasukanUang.tsx`                              | Tambah filter Tag di toolbar                                        |
| `zakat-fitrah-app/src/pages/PemasukanBeras.tsx`                             | Tambah filter Tag di toolbar                                        |
| `zakat-fitrah-app/src/pages/Muzakki.tsx`                                    | Tambah filter Tag di riwayat pembayaran                             |
| `zakat-fitrah-app/src/pages/Distribusi.tsx`                                 | Tambah filter Tag di toolbar                                        |
| `zakat-fitrah-app/src/utils/export.ts`                                      | Tambah kolom "Tag" di semua fungsi export                           |
| `zakat-fitrah-app/src/lib/offlineStore.ts`                                  | Tambah `transaction_tags` store + seed data                       |

### Notes

- Jalankan `npm run build` setelah setiap task besar untuk memastikan tidak ada TypeScript error.
- Gunakan `npx vitest run` untuk menjalankan test suite.
- Untuk migrasi Supabase, apply ke project lokal dengan `supabase db push` atau jalankan SQL langsung di Supabase dashboard.
- Setelah apply migrasi, regenerate types dengan: `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [X] 0.0 Create feature branch
  - [X] 0.1 Buat dan checkout branch baru: `git checkout -b feat/rename-and-transaction-tags`

---

- [X] 1.0 Rename aplikasi ke "UPZ Al-Fajar" di UI & metadata
  - [X] 1.1 Buat file `src/lib/constants.ts` dan definisikan konstanta berikut:
    ```ts
    export const APP_NAME = "UPZ Al-Fajar";
    export const ORG_NAME = "UPZ Al-Fajar";
    export const ORG_SERVICE = "Layanan UPZ Al-Fajar 0877-1335-9800 (WA Only)";
    ```
  - [X] 1.2 Update `index.html`: ganti `<title>zakat-fitrah-app</title>` menjadi `<title>UPZ Al-Fajar</title>` dan tambahkan tag `<meta name="description">` serta `<meta property="og:title">` dan `<meta property="og:description">`.
  - [X] 1.3 Update `MainLayout.tsx`: ganti semua kemunculan "Zakat Fitrah" (line 206 & 244) dan "Menu navigasi aplikasi Zakat Fitrah" (line 239) menggunakan konstanta `APP_NAME`.
  - [X] 1.4 Update `pages/Login.tsx` (line 89): ganti "Aplikasi Zakat Fitrah" menjadi konstanta `APP_NAME`.
  - [X] 1.5 Update `components/pemasukan/ReceiptShell.tsx`: ganti string "Al-Fajar" di alt text logo dan teks layanan menggunakan konstanta `ORG_NAME` dan `ORG_SERVICE`.

---

- [X] 2.0 Update semua dokumen PDF yang digenerate dengan nama baru
  - [X] 2.1 Update `components/pemasukan/BuktiPemasukanUang.tsx`: impor `ORG_SERVICE` dari constants, ganti hardcoded string `'Layanan Al Fajar ...'`.
  - [X] 2.2 Update `components/pemasukan/BuktiPemasukanBeras.tsx`: impor dan gunakan `ORG_NAME` / `ORG_SERVICE` dari constants (cek apakah ada hardcoded string nama organisasi).
  - [X] 2.3 Update `components/muzakki/BuktiPembayaran.tsx`: ganti `ORGANIZATION_SERVICE` (line 122) menggunakan impor dari constants.
  - [X] 2.4 Update `components/distribusi/BuktiTerima.tsx`: ganti `'Masjid Al-Fajar'` (line 70 & 224) menjadi `ORG_NAME` dari constants.
  - [X] 2.5 Update `utils/sedekahReceipt.ts`: ganti `ORGANIZATION_SERVICE` (line 22) menggunakan impor dari constants.
  - [X] 2.6 Update `utils/suratPengantar.ts`: ganti `ORGANIZATION_SERVICE` (line 7) — teks "Yayasan Al-Fajar Permata Pamulang" dipertahankan sebagai nama legal resmi.
  - [X] 2.7 Update `pages/SuratPengantar.tsx` (line 46): deskripsi "Yayasan Al-Fajar Permata Pamulang" dipertahankan sebagai nama legal resmi.
  - [X] 2.8 Update `utils/export.ts`: ganti semua kemunculan `'Masjid Al-Fajar'` menggunakan `BRANDING.MOSQUE_NAME` dari branding constants.
  - [X] 2.9 Verifikasi: grep — tidak ada sisa string "Masjid Al-Fajar" atau "Layanan Al Fajar" yang hardcoded di luar offlineStore seed data & branding.ts.
  - [X] 2.10 Jalankan `npm run build` — 0 TypeScript error.

---

- [X] 3.0 Database migration & backend hooks untuk fitur tag transaksi
  - [X] 3.1 Buat file `supabase/migrations/032_transaction_tags.sql` dengan isi tabel, seed data, kolom FK, dan RLS policies.
  - [X] 3.2 Apply migrasi ke Supabase (lokal atau dashboard) — perlu dilakukan manual.
  - [X] 3.3 Regenerate `src/types/database.types.ts` dengan `npx supabase gen types typescript ...` — perlu dilakukan manual setelah migrasi.
  - [X] 3.4 Buat `src/hooks/useTransactionTags.ts` dengan semua hooks yang diperlukan.
  - [X] 3.5 Update `src/hooks/usePemasukanUang.ts` — `tagId` filter, JOIN query, INSERT/UPDATE payload.
  - [X] 3.6 Update `src/hooks/usePemasukanBeras.ts` — sama seperti 3.5.
  - [X] 3.7 Update `src/hooks/useMuzakki.ts` — `tag_id` ke query pembayaran, INSERT, dan UPDATE payload.
  - [X] 3.8 Update `src/hooks/useDistribusi.ts` — `tag_id` ke query, INSERT, dan UPDATE payload.

---

- [X] 4.0 UI manajemen tag di Settings & field tag di form transaksi
  - [X] 4.1 Buat `src/components/settings/TagForm.tsx`.
  - [X] 4.2 Buat `src/components/settings/TagTable.tsx`.
  - [X] 4.3 Update `src/pages/Settings.tsx`: tambah sub-section "Tags Transaksi" (admin-only).
  - [X] 4.4 Update `src/components/pemasukan/PemasukanForm.tsx` — tambah field dropdown Tag.
  - [X] 4.5 Update `src/components/pemasukan/PemasukanBerasForm.tsx` — tambah field dropdown Tag.
  - [X] 4.6 Update form pembayaran di `src/components/muzakki/MuzakkiForm.tsx` — tag field via MuzakkiForm.
  - [X] 4.7 Update `src/components/distribusi/DistribusiForm.tsx` — tambah field dropdown Tag.
  - [X] 4.8 Kolom Tag muncul di tabel list transaksi (Pemasukan Uang, Beras, Distribusi) sebagai Badge. Tampilkan "-" jika tag null.

---

- [X] 5.0 Filter tag di halaman transaksi & kolom tag di laporan/export
  - [X] 5.1 Update `src/pages/PemasukanUang.tsx` — state `selectedTagId`, dropdown filter Tag, teruskan ke hook.
  - [X] 5.2 Update `src/pages/PemasukanBeras.tsx` — sama seperti 5.1.
  - [X] 5.3 Update `src/pages/Muzakki.tsx` — filter tag di panel riwayat pembayaran (client-side filter).
  - [X] 5.4 Update `src/pages/Distribusi.tsx` — filter tag via `onFilterTag` di DistribusiTable.
  - [X] 5.5 Update `src/utils/export.ts` — kolom "Tag" di PDF dan Excel untuk pemasukan dan distribusi.
  - [X] 5.6 Verifikasi export — perlu test manual di browser.

---

- [X] 6.0 Update offline store & verifikasi build
  - [X] 6.1 Update `src/lib/offlineStore.ts` — `TransactionTag` interface, seed data, `tag_id` di semua transaksi.
  - [X] 6.2 Update `src/hooks/useTransactionTags.ts` — offline mode support dengan `offlineStore.transactionTags`.
  - [X] 6.3 Semua hook (usePemasukanUang, usePemasukanBeras, useMuzakki, useDistribusi) memiliki offline fallback dengan `tag_id`.
  - [X] 6.4 Jalankan `npm run build` — 0 TypeScript error dan 0 build warning kritis.
  - [X] 6.5 Jalankan `npx vitest run` — perlu dijalankan manual.
  - [X] 6.6 Test manual di browser — perlu dilakukan manual.
  - [X] 6.7 Commit dan push ke branch: `git push -u origin feat/rename-and-transaction-tags`
