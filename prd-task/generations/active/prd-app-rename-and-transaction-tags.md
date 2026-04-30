# PRD: Rename Aplikasi ke UPZ Al-Fajar & Tag Transaksi

**Status:** Active
**Tanggal:** 2026-04-27
**Versi:** 1.0

---

## 1. Introduction / Overview

### Latar Belakang

Saat ini aplikasi dikenal sebagai "Zakat Fitrah Al-Fajar", namun secara organisasi unit pengelola zakat ini adalah **UPZ (Unit Pengumpul Zakat) Al-Fajar**. Nama yang tepat penting untuk branding, dokumen resmi, dan kepercayaan muzakki maupun mustahik.

Selain itu, pengelola membutuhkan cara untuk **mengelompokkan transaksi berdasarkan konteks/acara** — misalnya membedakan transaksi rutin ("Umum") dari transaksi khusus hari raya ("Idul Fitri") — agar laporan keuangan lebih informatif dan mudah dianalisis.

### Tujuan

1. Mengganti nama aplikasi dari "Zakat Fitrah Al-Fajar" menjadi **"UPZ Al-Fajar"** di seluruh tampilan UI, dokumen PDF, dan metadata.
2. Menambahkan sistem **tag transaksi** yang fleksibel: tag bawaan ("Umum", "Idul Fitri") dan kemampuan admin menambah tag baru.

---

## 2. Goals

### Fitur 1 — Rename Aplikasi

- [ ] Nama "UPZ Al-Fajar" tampil konsisten di seluruh antarmuka (sidebar, header, browser tab, halaman login).
- [ ] Nama "UPZ Al-Fajar" tercantum di semua dokumen yang dihasilkan (PDF receipt, surat pengantar, laporan).
- [ ] Metadata SEO (page title, meta description, og:title) diperbarui.

### Fitur 2 — Tag Transaksi

- [ ] Semua jenis transaksi (Pemasukan Uang, Pemasukan Beras, Pembayaran Zakat, Distribusi) dapat diberi tag.
- [ ] Tag bersifat opsional — transaksi tanpa tag tetap valid.
- [ ] Tag default tersedia: **"Umum"** dan **"Idul Fitri"**.
- [ ] Admin dapat menambah tag baru melalui halaman Settings.
- [ ] Tag dapat digunakan sebagai filter di halaman transaksi.
- [ ] Tag muncul di laporan dan file export (PDF/Excel).

---

## 3. User Stories

### Rename Aplikasi

- Sebagai **pengurus masjid**, saya ingin melihat nama "UPZ Al-Fajar" di semua halaman aplikasi agar identitas organisasi konsisten.
- Sebagai **muzakki** yang menerima PDF kwitansi, saya ingin melihat nama lembaga yang benar ("UPZ Al-Fajar") agar saya percaya dokumen tersebut resmi.

### Tag Transaksi

- Sebagai **petugas**, saya ingin menandai transaksi dengan tag "Idul Fitri" saat musim ramadan/lebaran agar mudah dipisahkan dari transaksi rutin.
- Sebagai **admin**, saya ingin menambah tag baru (misal "Infak Jumat") dari halaman Settings agar tag bisa disesuaikan dengan kegiatan masjid.
- Sebagai **admin** yang membuat laporan, saya ingin memfilter transaksi berdasarkan tag dan melihat kolom tag di export Excel agar analisis keuangan per kegiatan mudah dilakukan.

---

## 4. Functional Requirements

### Fitur 1 — Rename Aplikasi ke UPZ Al-Fajar

**FR-1.1** Sistem harus menampilkan nama **"UPZ Al-Fajar"** (bukan "Zakat Fitrah Al-Fajar") di:

- Sidebar (logo/nama aplikasi)
- Header halaman
- Browser tab title (format: `{Nama Halaman} | UPZ Al-Fajar`)
- Halaman Login & Register
- Halaman Email Confirmation, Forgot Password, Reset Password

**FR-1.2** Nama **"UPZ Al-Fajar"** harus tercantum di semua dokumen yang dihasilkan:

- PDF Bukti Pemasukan Uang
- PDF Bukti Pemasukan Beras
- PDF Tanda Terima Pembayaran Muzakki (BuktiPembayaran)
- PDF Tanda Terima Distribusi (BuktiTerima)
- PDF Bulk Tanda Terima (BulkTandaTerima)
- PDF Kwitansi Sedekah (SedekahReceipt)
- PDF Surat Pengantar
- PDF/Excel Laporan

**FR-1.3** Metadata halaman harus diperbarui:

- `<title>` tag: `UPZ Al-Fajar`
- `<meta name="description">`: deskripsi singkat UPZ Al-Fajar
- `<meta property="og:title">`: `UPZ Al-Fajar`
- `<meta property="og:description">`: deskripsi singkat

**FR-1.4** String "Zakat Fitrah Al-Fajar" tidak boleh muncul lagi di UI manapun setelah fitur ini selesai.

---

### Fitur 2 — Tag Transaksi

#### 2a. Master Data Tag

**FR-2.1** Sistem harus menyediakan tabel `transaction_tags` di database dengan kolom:

- `id` (UUID, PK)
- `nama` (TEXT, UNIQUE, NOT NULL) — nama tag
- `is_aktif` (BOOLEAN, default true)
- `created_by` (UUID → users.id)
- `created_at` (TIMESTAMPTZ)

**FR-2.2** Sistem harus menyediakan 2 tag default yang di-seed saat migrasi:

- **"Umum"** — untuk transaksi rutin sehari-hari
- **"Idul Fitri"** — untuk transaksi terkait kegiatan Idul Fitri

**FR-2.3** Admin dapat menambah tag baru melalui halaman **Settings → Tags Transaksi**:

- Form input: nama tag (text, wajib, maks 50 karakter)
- Validasi: nama tag tidak boleh duplikat (case-insensitive)
- Setelah simpan, tag langsung tersedia di semua form transaksi

**FR-2.4** Admin dapat menonaktifkan tag (soft delete via `is_aktif = false`):

- Tag yang dinonaktifkan tidak muncul di dropdown form transaksi baru
- Transaksi lama yang sudah memakai tag tersebut tetap menampilkan nama tag (tidak hilang)

**FR-2.5** Hanya user dengan role **admin** yang dapat menambah atau menonaktifkan tag. Role petugas dan viewer hanya bisa memilih tag yang ada.

#### 2b. Kolom Tag di Tabel Transaksi

**FR-2.6** Kolom `tag_id` (UUID, nullable, FK → transaction_tags.id) harus ditambahkan ke tabel-tabel berikut:

- `pemasukan_uang`
- `pemasukan_beras`
- `pembayaran_zakat`
- `distribusi`

**FR-2.7** Tag bersifat **opsional** — transaksi tanpa tag (NULL) tetap valid dan disimpan normal.

#### 2c. UI Form Transaksi

**FR-2.8** Semua form input transaksi (PemasukanForm, PemasukanBerasForm, MuzakkiForm/pembayaran, DistribusiForm) harus menampilkan:

- Field **"Tag"** berupa dropdown/select
- Placeholder: "Pilih tag (opsional)"
- Daftar opsi: semua tag aktif dari tabel `transaction_tags`
- Nilai default: kosong (tidak dipilih)

**FR-2.9** Form edit transaksi harus menampilkan tag yang sudah dipilih sebelumnya dan memungkinkan perubahan.

#### 2d. Filter Berdasarkan Tag

**FR-2.10** Halaman Pemasukan Uang, Pemasukan Beras, Muzakki (riwayat pembayaran), dan Distribusi harus memiliki filter **"Tag"**:

- Dropdown: "Semua Tag" (default) | daftar tag aktif
- Saat dipilih, tabel hanya menampilkan transaksi dengan tag tersebut
- Filter tag bekerja bersama filter lain yang sudah ada (tahun, tanggal, kategori, dst.)

#### 2e. Laporan & Export

**FR-2.11** Kolom **"Tag"** harus ditampilkan di:

- Tabel transaksi pada halaman Laporan (jika ada kolom transaksi individual)
- File Excel export — kolom "Tag" ditambahkan setelah kolom kategori
- PDF laporan — kolom "Tag" ditambahkan pada tabel transaksi

**FR-2.12** Transaksi tanpa tag ditampilkan sebagai **"-"** atau **"Umum"** (kosong) pada laporan/export.

---

## 5. Non-Goals (Out of Scope)

- Tidak mengubah domain/URL aplikasi.
- Tidak mengganti logo/favicon (hanya nama teks).
- Tidak mendukung multi-tag per transaksi (satu transaksi = satu tag saja).
- Tidak membuat laporan agregasi per tag (misal: total pemasukan per tag). Ini bisa menjadi fitur lanjutan.
- Tidak mengizinkan petugas atau viewer untuk membuat/menghapus tag.
- Tag tidak mempengaruhi kalkulasi zakat, hak amil, atau logika bisnis lainnya.

---

## 6. Design Considerations

### Rename Aplikasi

- Gunakan sebuah konstanta terpusat, misalnya `APP_NAME = "UPZ Al-Fajar"` di `src/lib/constants.ts`, lalu referensikan dari seluruh UI dan utilitas PDF. Hindari hardcode string di banyak file.

### Tag Transaksi — UI

- Gunakan komponen `<Select>` dari shadcn/ui (sudah tersedia di `@/components/ui/select`) untuk dropdown tag.
- Di halaman Settings, buat sub-section baru **"Tags Transaksi"** — mirip pola NilaiZakatForm/Table yang sudah ada.
- Tampilan tag di tabel transaksi bisa menggunakan `<Badge>` (shadcn/ui) dengan warna netral.

### Tag Transaksi — Database

- Tambahkan migrasi SQL baru (file `032_transaction_tags.sql`) dengan:
  1. Tabel `transaction_tags` + seed data (Umum, Idul Fitri)
  2. Kolom `tag_id` di 4 tabel transaksi
  3. FK constraint + RLS policies

---

## 7. Technical Considerations

### Rename Aplikasi

- Buat file `src/lib/constants.ts` (atau tambahkan ke yang sudah ada) dengan `export const APP_NAME = "UPZ Al-Fajar"`.
- Cari semua kemunculan string "Zakat Fitrah Al-Fajar", "Zakat Fitrah", "Al Fajar" di seluruh `src/` dan perbarui.
- Perbarui `index.html` untuk `<title>`, `<meta>` tags.
- Perbarui fungsi PDF generation di `src/utils/sedekahReceipt.ts`, `src/utils/suratPengantar.ts`, dan komponen bukti lainnya.
- Perbarui `offlineStore.ts` jika ada nama aplikasi di seed data.

### Tag Transaksi

- **Migrasi:** File baru `032_transaction_tags.sql` — tabel, seed, kolom FK, RLS.
- **RLS:**
  - SELECT: semua authenticated users (untuk populate dropdown)
  - INSERT/UPDATE: hanya role = 'admin'
- **Hooks baru:** `useTransactionTags.ts` — query semua tag aktif + mutation tambah/nonaktifkan tag.
- **Perbarui hooks transaksi:** `usePemasukanUang`, `usePemasukanBeras`, `useMuzakki`, `useDistribusi` — sertakan `tag_id` pada query SELECT dan payload INSERT/UPDATE.
- **Offline mode:** Tambahkan `transaction_tags` ke `offlineStore.ts` dengan seed data yang sama.
- **Type generation:** Jalankan `supabase gen types` setelah migrasi untuk memperbarui `database.types.ts`.

---

## 8. Success Metrics

| Kriteria                                                        | Target                        |
| --------------------------------------------------------------- | ----------------------------- |
| Tidak ada teks "Zakat Fitrah Al-Fajar" yang tersisa di UI       | 100% — 0 kemunculan          |
| Nama "UPZ Al-Fajar" muncul di semua dokumen PDF yang digenerate | 100% dokumen                  |
| Dropdown tag tersedia di semua 4 form transaksi                 | 100% form                     |
| Tag "Umum" dan "Idul Fitri" tersedia out-of-the-box             | Terverifikasi setelah migrasi |
| Admin dapat menambah tag baru < 30 detik dari halaman Settings  | UX test manual                |
| Filter tag bekerja di semua halaman transaksi                   | Semua halaman terverifikasi   |
| Kolom tag muncul di export Excel dan PDF laporan                | Terverifikasi dengan download |
| Build (`npm run build`) lulus tanpa error TypeScript          | CI pass                       |

---

## 9. Open Questions

1. **Nama lengkap resmi di dokumen:** Apakah dokumen PDF menggunakan "UPZ Al-Fajar" saja, atau nama lengkap seperti "Unit Pengumpul Zakat (UPZ) Al-Fajar Masjid [Nama Masjid]"? → Saat ini menggunakan "UPZ Al-Fajar", bisa disesuaikan dengan konstanta.
2. **Warna/ikon tag:** Apakah setiap tag perlu warna tertentu (seperti label di GitHub) atau cukup teks polos? Boleh dikasih warna.
3. **Tag di Bulk Pembayaran:** Saat input massal (BulkPemasukanForm), apakah tag diterapkan satu per satu per baris, atau satu tag untuk seluruh batch? 1 tag untuk seluruh.
4. **Urutan tag di dropdown:** Apakah tag diurutkan alfabetis, atau berdasarkan urutan dibuat (terbaru di bawah)? berdasarkan alfabetis.

---

## Lampiran: Daftar File yang Perlu Diubah

### Fitur 1 — Rename

| File                                          | Perubahan                                 |
| --------------------------------------------- | ----------------------------------------- |
| `public/index.html`                         | Update `<title>`, `<meta>` tags       |
| `src/lib/constants.ts`                      | Buat/tambah `APP_NAME = "UPZ Al-Fajar"` |
| `src/components/layouts/MainLayout.tsx`     | Ganti nama di sidebar/header              |
| `src/pages/Login.tsx`                       | Ganti nama di heading                     |
| `src/pages/Register.tsx`                    | Ganti nama di heading                     |
| `src/utils/sedekahReceipt.ts`               | Ganti nama di header PDF                  |
| `src/utils/suratPengantar.ts`               | Ganti nama di header surat                |
| `src/components/pemasukan/Bukti*.tsx`       | Ganti nama di header bukti                |
| `src/components/distribusi/BuktiTerima.tsx` | Ganti nama di header bukti                |
| `src/lib/offlineStore.ts`                   | Update seed data jika ada nama app        |

### Fitur 2 — Tag Transaksi

| File                                                | Perubahan                                 |
| --------------------------------------------------- | ----------------------------------------- |
| `supabase/migrations/032_transaction_tags.sql`    | **BARU** — tabel + seed + FK + RLS |
| `src/types/database.types.ts`                     | Regenerate setelah migrasi                |
| `src/hooks/useTransactionTags.ts`                 | **BARU** — hook CRUD tag           |
| `src/hooks/usePemasukanUang.ts`                   | Tambah `tag_id` ke query/mutation       |
| `src/hooks/usePemasukanBeras.ts`                  | Tambah `tag_id` ke query/mutation       |
| `src/hooks/useMuzakki.ts`                         | Tambah `tag_id` ke pembayaran           |
| `src/hooks/useDistribusi.ts`                      | Tambah `tag_id` ke query/mutation       |
| `src/components/pemasukan/PemasukanForm.tsx`      | Tambah field Tag                          |
| `src/components/pemasukan/PemasukanBerasForm.tsx` | Tambah field Tag                          |
| `src/components/muzakki/MuzakkiForm.tsx`          | Tambah field Tag di pembayaran            |
| `src/components/distribusi/DistribusiForm.tsx`    | Tambah field Tag                          |
| `src/pages/PemasukanUang.tsx`                     | Tambah filter Tag                         |
| `src/pages/PemasukanBeras.tsx`                    | Tambah filter Tag                         |
| `src/pages/Muzakki.tsx`                           | Tambah filter Tag di riwayat              |
| `src/pages/Distribusi.tsx`                        | Tambah filter Tag                         |
| `src/pages/Settings.tsx`                          | Tambah sub-section Tags Transaksi         |
| `src/components/settings/TagForm.tsx`             | **BARU** — form tambah tag         |
| `src/components/settings/TagTable.tsx`            | **BARU** — tabel daftar tag        |
| `src/utils/export.ts`                             | Tambah kolom Tag di Excel export          |
| `src/lib/offlineStore.ts`                         | Tambah `transaction_tags` ke store      |
