# PRD — Dashboard Configuration

## Document Control
- **Version:** V1.7.0
- **Created Date:** 2026-02-26
- **Last Updated:** 2026-02-26
- **Summary of Addition/Adjustment:** Menambahkan konfigurasi dashboard dinamis multi-view dengan widget terpilih, aturan agregasi, dan visibilitas berbasis role.

## 1. Introduction / Overview

Saat ini aplikasi hanya memiliki satu halaman Dashboard yang statis, menampilkan semua statistik dan grafik yang telah ditentukan secara hardcoded. Tidak ada cara bagi pengguna untuk menyesuaikan tampilan atau membuat view berbeda untuk kebutuhan yang berbeda (misal: ringkasan untuk pengurus inti vs. laporan lengkap untuk admin).

Fitur **Dashboard Configuration** memungkinkan **admin** untuk:

- Membuat lebih dari satu dashboard dengan judul kustom.
- Mengonfigurasi widget apa saja yang ditampilkan di setiap dashboard (StatCard, Chart, HakAmil Card, custom text/note).
- Mengatur aturan kalkulasi kustom per widget (aggregation rules).
- Mengatur visibilitas setiap dashboard (publik untuk semua user, atau privat hanya untuk admin).
- Mengedit atau menghapus dashboard manapun, termasuk dashboard default.

Pengguna non-admin dapat melihat dashboard sesuai hak akses visibilitas yang ditetapkan admin, dan berpindah antar dashboard menggunakan tab switcher di bagian atas halaman Dashboard.

---

## 2. Goals

1. Admin dapat membuat, mengedit, dan menghapus dashboard kustom.
2. Admin dapat menambahkan, menyusun ulang, dan menghapus widget dalam setiap dashboard.
3. Setiap widget StatCard dapat dikonfigurasi: label, ikon, dan aggregation rule (sumber data + logika perhitungan).
4. Setiap dashboard memiliki pengaturan visibilitas: **Publik** (semua role dapat melihat) atau **Privat** (hanya admin).
5. Semua dashboard ditampilkan dalam tab switcher di halaman Dashboard — tab hanya muncul jika user memiliki akses.
6. Tidak ada dashboard "terkunci" — bahkan dashboard default dapat diubah atau dihapus oleh admin.

---

## 3. User Stories

1. Sebagai **admin**, saya ingin membuat dashboard baru dengan judul kustom agar saya bisa membuat view khusus untuk laporan tertentu.
2. Sebagai **admin**, saya ingin memilih widget mana saja yang ditampilkan di setiap dashboard agar informasi yang relevan mudah diakses tanpa noise.
3. Sebagai **admin**, saya ingin mengatur aggregation rule pada setiap StatCard (misal: total beras hanya dari `pemasukan_beras` saja, bukan gabungan) agar perhitungan bisa disesuaikan kebutuhan pelaporan.
4. Sebagai **admin**, saya ingin mengatur apakah sebuah dashboard bisa dilihat oleh semua user atau hanya admin agar ada fleksibilitas privasi laporan.
5. Sebagai **admin**, saya ingin menambahkan blok teks/catatan ke dalam dashboard sebagai konteks tambahan (misal: "Laporan per 1 Ramadan 1447H").
6. Sebagai **petugas** (non-admin), saya ingin melihat dashboard Publik yang sudah dikonfigurasi admin melalui tab switcher tanpa bisa mengubah konfigurasinya.
7. Sebagai **admin**, saya ingin menyusun ulang urutan widget dalam dashboard menggunakan drag-and-drop agar layout lebih intuitif.
8. Sebagai **admin**, saya ingin menghapus dashboard yang tidak diperlukan lagi, termasuk dashboard default.

---

## 4. Functional Requirements

### 4.1 Manajemen Dashboard

1. Sistem harus menyediakan halaman **Dashboard Settings** yang hanya dapat diakses oleh admin.
2. Sistem harus memungkinkan admin membuat dashboard baru dengan mengisi **judul** (wajib) dan **deskripsi** (opsional).
3. Sistem harus memungkinkan admin mengedit judul, deskripsi, dan urutan widget pada dashboard yang sudah ada.
4. Sistem harus memungkinkan admin menghapus dashboard manapun. Jika semua dashboard dihapus, halaman Dashboard menampilkan empty state dengan tombol "Buat Dashboard".
5. Setiap dashboard harus memiliki pengaturan **visibilitas**:
   - `public` — dapat dilihat oleh semua user yang login.
   - `private` — hanya dapat dilihat oleh admin.
6. Sistem harus menyimpan konfigurasi dashboard di database (tabel `dashboard_configs`) agar persisten lintas sesi dan pengguna.

### 4.2 Tab Switcher

7. Halaman Dashboard harus menampilkan **tab switcher** di bagian atas jika terdapat lebih dari satu dashboard yang dapat diakses oleh user.
8. Tab hanya menampilkan dashboard dengan visibilitas `public` untuk user non-admin, dan semua dashboard untuk admin.
9. Tab yang aktif harus tersimpan di URL query param (e.g., `?dashboard=<id>`) agar bisa di-bookmark/share.
10. Jika hanya ada satu dashboard yang bisa diakses, tab switcher tidak ditampilkan.

### 4.3 Widget Types

Sistem harus mendukung empat jenis widget yang dapat ditambahkan ke dashboard:

11. **StatCard Widget** — Menampilkan satu angka statistik dengan label dan ikon. Admin dapat mengkonfigurasi:

    - Label teks (wajib)
    - Ikon (pilih dari preset icon list)
    - Aggregation Rule (lihat §4.4)
    - Format tampilan: `currency` (Rp), `weight` (kg), `number` (bulat)
12. **Chart Widget** — Menampilkan grafik batang pemasukan bulanan. Admin dapat memilih:

    - Jenis data: pemasukan uang atau pemasukan beras
    - Rentang: semua kategori atau kategori tertentu saja
13. **DistribusiProgress Widget** — Menampilkan progress bar perbandingan pemasukan vs distribusi. Admin memilih:

    - Jenis: `beras` atau `uang`
14. **HakAmil Widget** — Menampilkan ringkasan Hak Amil (komponen sudah ada). Tidak ada konfigurasi tambahan.
15. **Text/Note Widget** — Blok teks bebas (mendukung markdown sederhana: bold, italic, heading, bullet list). Admin mengisi konten saat menambahkan widget.

### 4.4 Aggregation Rules (StatCard)

16. Setiap StatCard harus memiliki satu **aggregation rule** yang menentukan bagaimana nilai dihitung. Admin memilih dari daftar rule yang tersedia di sistem:

| Rule ID                     | Label                 | Kalkulasi                                                               |
| --------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `zakat_beras_terkumpul`   | Zakat Beras Terkumpul | `pembayaran_zakat (beras)` + `pemasukan_beras (zakat_fitrah_beras)` |
| `zakat_uang_terkumpul`    | Zakat Uang Terkumpul  | `pembayaran_zakat (uang)` + `pemasukan_uang (zakat_fitrah_uang)`    |
| `fidyah_uang`             | Fidyah Uang           | `pemasukan_uang (fidyah_uang)`                                        |
| `fidyah_beras`            | Fidyah Beras          | `pemasukan_beras (fidyah_beras)`                                      |
| `infak_sedekah_uang`      | Infak/Sedekah Uang    | `pemasukan_uang (infak_sedekah_uang)`                                 |
| `infak_sedekah_beras`     | Infak/Sedekah Beras   | `pemasukan_beras (infak_sedekah_beras)`                               |
| `maal_penghasilan_uang`   | Maal/Penghasilan Uang | `pemasukan_uang (maal_penghasilan_uang)`                              |
| `total_pemasukan_uang`    | Total Pemasukan Uang  | Semua pemasukan uang + rekonsiliasi                                     |
| `total_pemasukan_beras`   | Total Pemasukan Beras | Semua pemasukan beras                                                   |
| `distribusi_beras`        | Beras Tersalurkan     | `distribusi_zakat (beras, selesai)`                                   |
| `distribusi_uang`         | Uang Tersalurkan      | `distribusi_zakat (uang, selesai)`                                    |
| `sisa_beras`              | Sisa Beras            | Total Pemasukan Beras − Distribusi Beras                               |
| `sisa_uang`               | Sisa Uang             | Total Pemasukan Uang − Hak Amil − Distribusi Uang                     |
| `total_muzakki`           | Total Muzakki         | COUNT distinct `muzakki_id` dari `pembayaran_zakat` WHERE `tahun_zakat_id = <selected>` |
| `total_mustahik_aktif`    | Mustahik Aktif        | COUNT `mustahik` where `is_active = true`                           |
| `total_mustahik_nonaktif` | Mustahik Non-Aktif    | COUNT `mustahik` where `is_active = false`                          |
| `hak_amil_uang`           | Hak Amil Uang         | `hak_amil.jumlah_uang_rp`                                             |

17. Rule list di atas bersifat **sistem-defined** (tidak bisa ditambah oleh admin di Fase ini). Admin hanya memilih dari daftar yang tersedia.

### 4.5 Widget Layout & Ordering

18. Sistem harus memungkinkan admin menyusun ulang widget dalam dashboard menggunakan **drag-and-drop**.
19. Urutan widget harus tersimpan di database dan dirender sesuai urutan yang disimpan.
20. Setiap dashboard memiliki pengaturan **kolom StatCard per baris** (`stat_card_columns`): pilihan `1`, `2`, atau `3` (default: `3`). Admin mengatur ini di pengaturan dashboard, berlaku untuk semua StatCard dalam dashboard tersebut. Di layar medium otomatis turun ke 2, di mobile selalu 1.
21. Widget non-StatCard (Chart, Progress, HakAmil, Text) dirender penuh lebar (full-width) atau setengah lebar (half-width), dipilih saat konfigurasi widget.

### 4.6 Default Dashboard (Auto-Create)

27. Saat sistem mendeteksi tidak ada dashboard tersedia untuk user yang login, sistem harus otomatis membuat **Dashboard Utama** dengan konfigurasi berikut:

**Dashboard Utama** — `visibility: public`, `stat_card_columns: 3`

| Urutan | Widget Type | Konfigurasi |
|---|---|---|
| 1 | StatCard | rule: `total_muzakki`, label: "Total Muzakki", icon: `Users`, format: `number` |
| 2 | StatCard | rule: `total_mustahik_aktif`, label: "Mustahik Aktif", icon: `Heart`, format: `number` |
| 3 | StatCard | rule: `total_mustahik_nonaktif`, label: "Mustahik Non-Aktif", icon: `Heart`, format: `number` |
| 4 | StatCard | rule: `zakat_beras_terkumpul`, label: "Zakat Beras Terkumpul", icon: `Package`, format: `weight` |
| 5 | StatCard | rule: `zakat_uang_terkumpul`, label: "Zakat Uang Terkumpul", icon: `Coins`, format: `currency` |
| 6 | StatCard | rule: `distribusi_beras`, label: "Beras Tersalurkan", icon: `Send`, format: `weight` |
| 7 | StatCard | rule: `distribusi_uang`, label: "Uang Tersalurkan", icon: `TrendingUp`, format: `currency` |
| 8 | StatCard | rule: `fidyah_uang`, label: "Fidyah Uang", icon: `HandHeart`, format: `currency` |
| 9 | StatCard | rule: `fidyah_beras`, label: "Fidyah Beras", icon: `HandHeart`, format: `weight` |
| 10 | StatCard | rule: `infak_sedekah_uang`, label: "Infak/Sedekah Uang", icon: `Gift`, format: `currency` |
| 11 | StatCard | rule: `infak_sedekah_beras`, label: "Infak/Sedekah Beras", icon: `Gift`, format: `weight` |
| 12 | StatCard | rule: `maal_penghasilan_uang`, label: "Maal/Penghasilan Uang", icon: `Coins`, format: `currency` |
| 13 | StatCard | rule: `total_pemasukan_uang`, label: "Total Pemasukan Uang", icon: `Banknote`, format: `currency` |
| 14 | StatCard | rule: `total_pemasukan_beras`, label: "Total Pemasukan Beras", icon: `Wheat`, format: `weight` |
| 15 | StatCard | rule: `hak_amil_uang`, label: "Hak Amil Uang", icon: `Coins`, format: `currency` |
| 16 | HakAmil | — , width: `full` |
| 17 | DistribusiProgress | jenis: `beras`, width: `half` |
| 18 | DistribusiProgress | jenis: `uang`, width: `half` |
| 19 | Chart | data_type: `uang`, categories: semua, width: `full` |
| 20 | Chart | data_type: `beras`, categories: semua, width: `full` |

28. Dashboard default yang dibuat otomatis dapat diedit atau dihapus oleh admin seperti dashboard biasa.

### 4.7 Filter Tahun Zakat

29. Semua widget dalam satu dashboard menggunakan filter **tahun zakat** yang sama yang dipilih user di tab switcher (selector sudah ada di Dashboard page).
30. Widget Text/Note tidak dipengaruhi filter tahun zakat.

### 4.8 Keamanan & Otorisasi

31. Hanya user dengan role `admin` yang dapat mengakses halaman Dashboard Settings.
32. Semua operasi tulis (create, update, delete, duplicate dashboard/widget) harus memvalidasi role di sisi server (Supabase RLS policy).
33. User non-admin yang mencoba mengakses endpoint konfigurasi harus mendapat error `403 Forbidden`.

---

## 5. Non-Goals (Out of Scope)

- **Role selain admin/public** — tidak ada fitur assign dashboard ke role spesifik (selain publik/privat) di fase ini.
- **Dashboard sharing via link** — dashboard privat tidak bisa di-share via link khusus.
- **Custom formula builder** — admin tidak bisa menulis formula kalkulasi kustom; hanya memilih dari rule yang telah didefinisikan sistem.
- **Real-time collaboration** — tidak ada live update saat dua admin mengedit dashboard bersamaan.
- **Dashboard templates** — tidak ada pemilihan template saat membuat dashboard baru; admin mulai dari kosong atau menduplikasi yang sudah ada.
- **Export dashboard** — tidak ada fitur export dashboard ke PDF/PNG di fase ini.
- **Widget-level tahun filter** — setiap widget tidak bisa memiliki filter tahun sendiri; semua widget dalam satu dashboard berbagi filter yang sama.

---

## 6. Design Considerations

- Halaman **Dashboard** yang sudah ada tetap digunakan, dengan tambahan tab switcher di atas konten.
- Halaman **Dashboard Settings** adalah halaman baru di menu sidebar (hanya tampil untuk admin), atau dapat diakses via tombol "⚙ Konfigurasi" di pojok kanan atas halaman Dashboard.
- UI untuk mengkonfigurasi widget menggunakan **panel samping (side sheet/drawer)** agar tidak meninggalkan halaman.
- Drag-and-drop dapat menggunakan library `@dnd-kit/core` yang sudah umum dipakai dengan React.
- Gunakan komponen `shadcn/ui` yang sudah ada: `Tabs`, `Sheet`, `Dialog`, `Select`, `Input`, `Button`, `Card`.
- Preview widget harus terlihat real-time saat admin mengubah konfigurasi di panel samping.

---

## 7. Technical Considerations

### Database Schema (Supabase)

**Tabel `dashboard_configs`**

```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
title              text NOT NULL
description        text
visibility         text NOT NULL DEFAULT 'public' -- 'public' | 'private'
sort_order         integer NOT NULL DEFAULT 0
stat_card_columns  integer NOT NULL DEFAULT 3    -- 1 | 2 | 3
created_by         uuid REFERENCES auth.users(id)
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```

**Tabel `dashboard_widgets`**

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
dashboard_id      uuid REFERENCES dashboard_configs(id) ON DELETE CASCADE
widget_type       text NOT NULL -- 'stat_card' | 'chart' | 'distribusi_progress' | 'hak_amil' | 'text_note'
sort_order        integer NOT NULL DEFAULT 0
width             text NOT NULL DEFAULT 'full' -- 'full' | 'half' (untuk non-StatCard)
config            jsonb NOT NULL DEFAULT '{}'
-- Contoh config per widget_type:
-- stat_card: { "label": "Zakat Beras", "icon": "Package", "rule": "zakat_beras_terkumpul", "format": "weight" }
-- chart: { "data_type": "beras", "categories": ["zakat_fitrah_beras"] }
-- distribusi_progress: { "jenis": "beras" }
-- hak_amil: {}
-- text_note: { "content": "## Catatan\n- Laporan per Ramadan 1447H" }
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```

- RLS harus diterapkan: semua user dapat `SELECT` baris dengan `visibility = 'public'`; hanya admin yang dapat `INSERT/UPDATE/DELETE`.
- Admin dapat `SELECT` semua baris tanpa filter visibilitas.
- Migrasi SQL harus dibuat di `supabase/migrations/` dengan nomor sekuensial.

### Frontend

- Buat hook `useDashboardConfigs()` untuk fetching daftar dashboard yang aksesibel (filter visibilitas sesuai role user).
- Buat hook `useDashboardWidgets(dashboardId)` untuk fetching widget per dashboard, diurutkan by `sort_order`.
- Komponen `DashboardRenderer` yang merender widget berdasarkan `widget_type` dan `config`, menerima prop `stat_card_columns` dari dashboard config.
- Aggregation rules dipanggil dari hook `useDashboardStats` yang sudah ada — cukup memetakan `rule` ID ke field yang sesuai. Rule `total_muzakki` harus difilter berdasarkan `tahunZakatId` yang aktif.
- Gunakan React Router DOM untuk menyimpan tab aktif di URL: `/dashboard?id=<dashboard_id>`.
- Logika auto-create default dashboard: di halaman Dashboard, jika `useDashboardConfigs()` mengembalikan array kosong, trigger fungsi `createDefaultDashboard()` yang membuat record di `dashboard_configs` + 20 widget di `dashboard_widgets` sesuai §4.6, lalu refetch.
- Fungsi `duplicateDashboard(dashboardId)`: fetch dashboard + widgets, insert baru dengan judul suffix " — Salinan", return ID dashboard baru dan redirect ke tab baru.

---

## 8. Success Metrics

1. Admin dapat membuat, mengedit, dan menghapus dashboard tanpa bantuan teknis.
2. User non-admin hanya dapat melihat dashboard `public` dan tidak dapat mengakses Settings.
3. Widget yang dikonfigurasi menampilkan data yang akurat sesuai aggregation rule yang dipilih.
4. Tab switcher berfungsi dan state tab tersimpan di URL.
5. Tidak ada regresi pada halaman Dashboard yang sudah ada.
6. RLS Supabase mencegah akses tidak sah pada operasi konfigurasi (diverifikasi dengan test case manual).

---

## 9. Open Questions

_Semua open questions telah dijawab dan dimasukkan ke dalam requirements di atas:_

| # | Pertanyaan | Jawaban | Diimplementasikan di |
|---|---|---|---|
| 1 | Fitur duplicate dashboard? | Ya | §4.1 req. 7, §7 Frontend |
| 2 | `total_muzakki` per tahun zakat atau global? | Per tahun zakat | §4.4 tabel aggregation rules |
| 3 | Auto-create default saat semua dashboard dihapus? | Ya, default lengkap 20 widget | §4.6, §7 Frontend |
| 4 | Kolom StatCard per baris bisa diatur? | Ya, 1/2/3 per dashboard | §4.5 req. 20, §7 Schema `stat_card_columns` |
