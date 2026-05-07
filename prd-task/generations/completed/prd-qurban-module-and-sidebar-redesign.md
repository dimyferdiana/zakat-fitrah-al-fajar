# PRD: Modul Qurban & Sidebar Redesign

**Feature:** qurban-module-and-sidebar-redesign
**Date:** 2026-05-06
**Status:** Draft

---

## 1. Introduction / Overview

Tambahkan modul **Qurban** ke aplikasi Al-Fajar, dan modernisasi navigasi dengan mengganti sidebar kustom saat ini menggunakan komponen shadcn **sidebar-07**. Sidebar baru akan dilengkapi **App Switcher** di pojok kiri atas sehingga pengguna dapat berpindah antara aplikasi *Zakat Fitrah* dan *Qurban* dalam satu platform.

**Masalah yang diselesaikan:**

- Pendaftaran Qurban saat ini dikelola secara manual (kertas/spreadsheet)
- Sidebar kustom lebih sulit dirawat; sidebar-07 menyediakan pola UX yang lebih baik
- Staf membutuhkan satu platform terpadu untuk mengelola Zakat dan Qurban

---

## 2. Goals

1. Memungkinkan petugas mendaftar, mengelola, dan mencetak kuitansi untuk peserta Qurban
2. Memodernisasi UX sidebar dengan shadcn sidebar-07
3. Menghadirkan App Switcher agar pengguna dapat berpindah antara mode Zakat Fitrah dan Qurban
4. Melacak status pembayaran sederhana: **Terdaftar** / **Lunas**
5. Mendukung upload foto hewan (opsional, dapat ditambahkan kapan saja)
6. Menghasilkan kuitansi PDF yang dapat dicetak/diunduh untuk setiap transaksi Qurban

---

## 3. User Stories

- Sebagai **petugas**, saya dapat mendaftarkan peserta Qurban baru (Sapi atau Kambing/Domba) beserta semua kolom yang diperlukan
- Sebagai **petugas**, saya dapat mendaftarkan hingga 7 nama peserta di bawah satu Sapi, dan tepat 1 nama di bawah satu Kambing/Domba
- Sebagai **petugas**, saya dapat mengubah status pendaftaran menjadi "Lunas" atau membiarkannya sebagai "Terdaftar"
- Sebagai **petugas**, saya dapat menghasilkan dan mencetak/mengunduh kuitansi PDF untuk pembayaran Qurban
- Sebagai **petugas**, saya dapat mengupload foto Sapi atau Kambing secara opsional setelah pendaftaran
- Sebagai **petugas**, saya dapat melihat tabel semua pendaftaran Qurban dengan pencarian dan filter
- Sebagai **admin dan petugas**, saya dapat beralih antara aplikasi Zakat Fitrah dan Qurban menggunakan App Switcher di pojok kiri atas
- Sebagai **pengguna mana pun**, saya dapat menavigasi modul Qurban melalui sidebar-07 yang baru

---

## 4. Functional Requirements

### A. Sidebar Redesign (sidebar-07)

1. Ganti sidebar kustom di `MainLayout.tsx` dengan komponen shadcn **sidebar-07** (instal via `npx shadcn@latest add sidebar-07`)
2. Pojok kiri atas sidebar harus menampilkan **App Switcher** (mirip team/org switcher bawaan sidebar-07), menggantikan area logo/nama aplikasi saat ini
3. App Switcher harus menampilkan dua pilihan aplikasi:
   - **Zakat Fitrah** — modul manajemen zakat yang sudah ada
   - **Qurban** — modul Qurban baru
4. Saat pengguna berpindah aplikasi, item navigasi di sidebar berubah menyesuaikan rute aplikasi tersebut
5. Semua section navigasi yang ada (Ringkasan, Data Master, Transaksi, Laporan, Sistem) tetap tersedia di bawah aplikasi Zakat Fitrah
6. Sidebar aplikasi Qurban menampilkan navigasinya sendiri:
   - **Ringkasan Qurban** (dashboard ringkasan)
   - **Data Qurban** (tabel pendaftaran)
   - **Laporan Qurban** *(untuk iterasi berikutnya)*

### B. Modul Qurban

7. Halaman baru `/qurban` dapat diakses oleh role: `admin`, `petugas`
8. Formulir pendaftaran harus mencakup field berikut:

   | Field           | Tipe                  | Wajib       | Keterangan                                          |
   | --------------- | --------------------- | ----------- | --------------------------------------------------- |
   | Tanggal         | Date picker           | Ya          | Tanggal pendaftaran                                 |
   | No. Qurban      | Text (auto-generated) | Ya          | Dibuat otomatis oleh sistem                         |
   | Nama            | Text                  | Ya          | Nama pendaftar utama                                |
   | Alamat          | Textarea              | Ya          | Alamat lengkap                                      |
   | No HP           | Text                  | Ya          | Nomor telepon                                       |
   | Jenis Qurban    | Dropdown              | Ya          | `Qurban Sapi` / `Qurban Kambing/Domba`          |
   | Sumber Hewan    | Radio                 | Ya          | `Beli dari Al-Fajar` / `Titipan (Bawa Sendiri)` |
   | Biaya Perawatan | Currency input        | Kondisional | Hanya tampil jika Sumber =*Titipan*               |
   | Qurban a/n      | Dynamic list          | Ya          | Nama-nama peserta yang diqurbankan                  |
   | Nominal (Rp)    | Currency input        | Ya          | Jumlah pembayaran, input manual                     |
   | Status          | Dropdown              | Ya          | `Terdaftar` / `Lunas`                           |
   | Catatan         | Textarea              | Tidak       | Catatan tambahan opsional                           |
9. Sistem harus **auto-generate** No. Qurban saat record baru dibuat:

   - Format Sapi: `SAP-YYYY-NNN` (contoh: `SAP-2026-001`)
   - Format Kambing/Domba: `KAM-YYYY-NNN` (contoh: `KAM-2026-001`)
   - NNN adalah urutan sequential berdasarkan tahun dan jenis hewan
10. Field **Qurban a/n** harus membatasi:

    - Sapi: **maksimal 7 nama**
    - Kambing/Domba: **tepat 1 nama**
    - Gunakan React Hook Form `useFieldArray` dengan tombol tambah/hapus
11. Tabel pendaftaran harus menampilkan kolom:
    `Tanggal` | `No. Qurban` | `Nama` | `Jenis` | `Qurban a/n` (ringkasan) | `Nominal` | `Status` | `Aksi`
12. Tabel harus mendukung:

    - Pencarian berdasarkan Nama dan No HP
    - Filter berdasarkan Jenis Qurban, Status, dan rentang Tanggal
    - Pagination
13. Petugas dapat **mengedit** data pendaftaran setelah dibuat (via dialog)
14. Petugas dapat **menghapus** data pendaftaran dengan dialog konfirmasi
15. Sistem harus menghasilkan **kuitansi PDF** untuk setiap pendaftaran Qurban, memuat:

    - No. Qurban, Tanggal, Nama, Alamat, No HP
    - Jenis Qurban, Sumber Hewan
    - Daftar nama Qurban a/n
    - Nominal Rp (dan Biaya Perawatan jika berlaku)
    - Status pembayaran
    - Branding organisasi (logo, nama, alamat dari `branding.ts`)
16. *(Opsional)* Petugas dapat **mengupload foto** hewan (Sapi atau Kambing) kapan saja setelah pendaftaran:

    - Disimpan di Supabase Storage bucket `qurban-photos`
    - Foto ditampilkan di tampilan detail record

---

## 5. Non-Goals (Out of Scope)

- Status lanjutan: Disembelih, Didistribusikan — **tidak termasuk** dalam iterasi ini
- Konfigurasi harga tetap di Settings — harga input manual per transaksi
- Integrasi data/laporan dengan modul Zakat Fitrah
- Ekspor Excel/PDF untuk laporan Qurban — dapat ditambahkan di iterasi berikutnya
- Upload foto wajib saat pendaftaran (foto bersifat opsional)

---

## 6. Design Considerations

- **Sidebar:** Gunakan pola shadcn `sidebar-07` sebagai shell layout baru
- **App Switcher:** Ditempatkan di pojok kiri atas, menggantikan area logo/nama aplikasi saat ini; mengikuti pola ACME/team switcher bawaan sidebar-07
- **Modul Qurban** mengikuti pola desain yang sama dengan modul Muzakki:
  - Tabel dengan tombol aksi (edit, hapus, unduh kuitansi)
  - Formulir di dalam modal Dialog
  - Komponen Shadcn UI yang sama: `Table`, `Dialog`, `Button`, `Input`, `Select`, `DatePicker`
- **Kuitansi PDF** mengikuti pola `BuktiPembayaran` di `src/components/muzakki/BuktiPembayaran.tsx`
- **Field Qurban a/n** menggunakan `useFieldArray` dari React Hook Form dengan tombol `+` tambah dan `×` hapus per baris
- **Foto hewan:** Ditampilkan sebagai thumbnail di detail record; gunakan komponen file input sederhana

---

## 7. Technical Considerations

### Sidebar

- Instal sidebar-07: `npx shadcn@latest add sidebar-07`
- Ganti `src/components/layouts/MainLayout.tsx` dengan layout baru berbasis sidebar-07
- State App Switcher (app aktif: `zakat` | `qurban`) disimpan di Zustand store atau React context
- Navigasi disusun berdasarkan app aktif; filter role tetap berlaku

### Database (Supabase migration diperlukan)

**Tabel `qurban_registrations`:**

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
no_qurban        text NOT NULL UNIQUE
tanggal          date NOT NULL
nama             text NOT NULL
alamat           text NOT NULL
no_hp            text NOT NULL
jenis            text NOT NULL  -- 'sapi' | 'kambing'
sumber_hewan     text NOT NULL  -- 'beli' | 'titipan'
biaya_perawatan  numeric        -- nullable, hanya untuk titipan
nominal          numeric NOT NULL
status           text NOT NULL DEFAULT 'terdaftar'  -- 'terdaftar' | 'lunas'
catatan          text
photo_url        text           -- nullable, Supabase Storage URL
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
created_by       uuid REFERENCES auth.users(id)
```

**Tabel `qurban_participants`:**

```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
qurban_registration_id  uuid NOT NULL REFERENCES qurban_registrations(id) ON DELETE CASCADE
nama                    text NOT NULL
urutan                  integer NOT NULL  -- 1-7 untuk Sapi, hanya 1 untuk Kambing
```

- **RLS policies** harus disertakan untuk kedua tabel, mengikuti pola yang sudah ada
- **Supabase Storage**: Buat bucket `qurban-photos` untuk upload foto hewan

### Kode Baru

| File                                                  | Deskripsi                                        |
| ----------------------------------------------------- | ------------------------------------------------ |
| `src/pages/Qurban.tsx`                              | Halaman utama modul Qurban                       |
| `src/components/qurban/QurbanForm.tsx`              | Form pendaftaran (Dialog)                        |
| `src/components/qurban/QurbanTable.tsx`             | Tabel daftar pendaftaran                         |
| `src/components/qurban/BuktiQurban.tsx`             | Komponen kuitansi PDF                            |
| `src/hooks/useQurban.ts`                            | React Query hooks (list, create, update, delete) |
| `src/types/qurban.ts`                               | TypeScript types untuk Qurban                    |
| `supabase/migrations/NNNN_create_qurban_tables.sql` | SQL migration                                    |

### Pola yang Dapat Digunakan Ulang

- `src/hooks/useMuzakki.ts` → template untuk `useQurban.ts`
- `src/components/muzakki/BuktiPembayaran.tsx` → template untuk `BuktiQurban.tsx`
- `src/components/muzakki/MuzakkiForm.tsx` → template untuk `QurbanForm.tsx`
- `src/components/muzakki/MuzakkiTable.tsx` → template untuk `QurbanTable.tsx`
- `src/lib/branding.ts` → konstanta organisasi untuk kuitansi

### Routing

- Tambahkan route `/qurban` di `src/App.tsx` dengan `ProtectedRoute` (admin, petugas)
- Route ini hanya tampil di navigasi saat app switcher berada di mode **Qurban**

---

## 8. Success Metrics

- Petugas dapat mendaftarkan entri Qurban baru (termasuk beberapa nama a/n) dalam waktu di bawah 3 menit
- Kuitansi PDF dihasilkan dengan benar memuat semua nama peserta, branding organisasi, dan info pembayaran
- App Switcher sidebar memungkinkan perpindahan mulus antara mode Zakat Fitrah dan Qurban tanpa error reload halaman
- Seluruh fungsionalitas Zakat yang ada tetap berjalan normal setelah migrasi sidebar

---

## 9. Open Questions

1. **Format No. Qurban**: Apakah format `SAP-2026-001` / `KAM-2026-001` sudah sesuai, atau ada format lain yang diinginkan?
2. **Biaya Perawatan Titipan**: Apakah ada nilai default/placeholder yang disarankan untuk biaya perawatan per jenis hewan?
3. **Konten Kuitansi**: Adakah info tambahan yang harus tercantum di kuitansi Qurban selain yang sudah disebutkan? (misal: tanda tangan, nomor rekening)
4. **Ringkasan Qurban**: Apa saja widget/statistik yang perlu ditampilkan di halaman Ringkasan Qurban? (misal: total Sapi terdaftar, total Kambing lunas, total nominal terkumpul)
