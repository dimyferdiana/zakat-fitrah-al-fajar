# PRD: Account Transaction Type Availability (Pengaturan Ketersediaan Rekening per Tipe Transaksi)

## 1) Introduction / Overview

Dokumen ini mendefinisikan fitur pengaturan ketersediaan rekening (kas, bank, qris) berdasarkan tipe transaksi pada aplikasi Zakat Fitrah Al-Fajar.

Masalah saat ini:
- Semua rekening aktif muncul di semua konteks transaksi tanpa filter, sehingga operator bisa salah pilih rekening (misalnya rekening khusus Infak dipakai untuk transaksi Zakat).
- Admin tidak bisa mengontrol rekening mana yang tersedia di formulir transaksi tertentu.
- Tidak ada visibilitas yang jelas tentang rekening mana yang diperuntukkan untuk tipe transaksi apa.

Tujuan:
- Memungkinkan admin mengkonfigurasi setiap rekening agar hanya tersedia di konteks transaksi yang diizinkan.
- Mengurangi risiko human error akibat pemilihan rekening yang tidak tepat.
- Memberikan visibilitas audit trail yang lebih akurat tentang pergerakan dana per rekening berdasarkan tipe transaksi.

## 2) Goals

1. Setiap rekening (kas/bank/qris) dapat dikonfigurasi ketersediaannya per **tipe transaksi** secara individual (on/off toggle).
2. Tampilan konfigurasi tersedia di halaman **Pengaturan Rekening** (`AccountsManagement`).
3. Formulir transaksi (Penerimaan Uang, Penerimaan Beras, Bulk Input, Distribusi/Pembayaran, Entry Ledger Manual) hanya menampilkan rekening yang diizinkan untuk konteks tersebut.
4. Rekening yang belum dikonfigurasi tipe transaksinya tetap berfungsi sebagai fallback (tampil di semua konteks) agar tidak mengganggu operasional existing.

## 3) Konteks Transaksi yang Menggunakan Rekening

Berikut adalah semua konteks di sistem yang saat ini menggunakan atau berpotensi menggunakan rekening:

| Kode Konteks | Label UI | Keterangan |
|---|---|---|
| `pemasukan_zakat_fitrah` | Penerimaan - Zakat Fitrah (Uang) | Formulir Penerimaan Uang, kategori Zakat Fitrah |
| `pemasukan_maal` | Penerimaan - Maal (Uang) | Formulir Penerimaan Uang, kategori Maal/Penghasilan |
| `pemasukan_infak` | Penerimaan - Infak/Sedekah (Uang) | Formulir Penerimaan Uang, kategori Infak/Sedekah |
| `pemasukan_fidyah` | Penerimaan - Fidyah (Uang) | Formulir Penerimaan Uang, kategori Fidyah |
| `distribusi_{asnaf}` | Distribusi - {Nama Kategori Asnaf} | Formulir Distribusi/Pembayaran Zakat, satu konteks per kategori asnaf. Nama kategori bersifat **dinamis** mengikuti data tabel `kategori_mustahik` (mis. `distribusi_amil`, `distribusi_fakir`, `distribusi_miskin`, dll). |
| `rekonsiliasi` | Rekonsiliasi Rekening | Entry rekonsiliasi IN/OUT rekening — dicatat secara terpisah dari entry manual biasa |
| `entry_manual` | Entry Ledger Manual (IN/OUT) | Input manual masuk/keluar dari halaman Pengaturan Rekening |

> **Catatan Penerimaan Beras:** Penerimaan Beras tidak memerlukan konfigurasi rekening karena beras diterima langsung tanpa pencatatan ke rekening.

> **Catatan QRIS:** Rekening dengan channel `qris` **hanya diperbolehkan untuk konteks penerimaan** (`pemasukan_*`). Konteks distribusi dan rekonsiliasi tidak boleh menggunakan rekening QRIS. Sistem harus memfilter rekening QRIS secara otomatis di luar konteks penerimaan.

## 4) User Stories

1. Sebagai admin, saya ingin mengatur rekening `BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT` agar hanya tersedia untuk konteks `pemasukan_zakat_fitrah` dan `distribusi_fakir`/`distribusi_miskin`, sehingga amil tidak keliru memilih rekening ini saat input infak.
2. Sebagai admin, saya ingin rekening `KAS` tersedia di semua konteks kecuali QRIS-only contexts, agar kasir bisa menerapkannya secara luas.
3. Sebagai amil, saya ingin saat memilih rekening di formulir Penerimaan Infak, hanya rekening yang diizinkan untuk infak yang muncul, sehingga tidak perlu scroll dan pilih secara manual dari semua rekening.
4. Sebagai admin, saya ingin melihat ringkasan ketersediaan setiap rekening di tabel halaman Pengaturan Rekening, agar mudah mengaudit konfigurasi tanpa membuka satu per satu.
5. Sebagai admin, saya ingin bisa set "tersedia di semua konteks" dengan satu toggle, agar rekening generik seperti KAS tidak perlu dikonfigurasi satu per satu.

## 5) Functional Requirements

### Phase 1: Konfigurasi Ketersediaan per Rekening (Halaman Pengaturan Rekening)

1. Halaman Pengaturan Rekening harus menampilkan kolom atau indikator ringkasan konteks transaksi yang aktif untuk setiap rekening dalam tabel daftar rekening.
2. Pada form edit rekening, sistem harus menampilkan panel **"Pengaturan Ketersediaan Transaksi"** yang berisi daftar semua konteks transaksi dengan toggle on/off per konteks.
3. Toggle yang diaktifkan (`on`) berarti rekening tersebut **tersedia** untuk dipilih di konteks transaksi tersebut.
4. Sistem harus menyediakan tombol **"Izinkan di Semua Konteks"** sebagai shortcut untuk mengaktifkan semua toggle sekaligus.
5. Sistem harus menyimpan konfigurasi ketersediaan ini saat admin menyimpan form edit rekening.
6. Rekening baru yang dibuat tanpa konfigurasi eksplisit default-nya adalah **tersedia di semua konteks** (backward-compatible).
7. Konfigurasi harus mendukung semua konteks transaksi yang didefinisikan di Section 3, termasuk konteks distribusi yang jumlahnya mengikuti data dinamis dari tabel `kategori_mustahik`.
8. Sistem harus menyediakan tombol **"Export Konfigurasi"** (unduh JSON) dan **"Import Konfigurasi"** (unggah JSON) untuk memudahkan setup lingkungan baru atau backup konfigurasi rekening. Format JSON mengikuti struktur `allowed_transaction_contexts` di Technical Considerations.

### Phase 2: Filtering Rekening di Formulir Transaksi

8. Formulir **Penerimaan Uang** harus memfilter pilihan rekening berdasarkan kategori transaksi yang sedang diisi:
   - Kategori Zakat Fitrah → tampilkan rekening dengan `pemasukan_zakat_fitrah = true`.
   - Kategori Maal → tampilkan rekening dengan `pemasukan_maal = true`.
   - Kategori Infak/Sedekah → tampilkan rekening dengan `pemasukan_infak = true`.
   - Kategori Fidyah → tampilkan rekening dengan `pemasukan_fidyah = true`.
9. Form **Bulk Input Penerimaan** harus memfilter dropdown rekening berdasarkan konteks yang relevan. Jika terdapat baris uang multi-kategori dalam satu bulk, tampilkan rekening yang tersedia untuk minimal salah satu dari kategori tersebut (union).
10. Halaman **Distribusi/Pembayaran Zakat** harus memfilter rekening berdasarkan konteks distribusi per asnaf:
    - Sistem membaca kategori asnaf dari tabel `kategori_mustahik` secara dinamis.
    - Untuk distribusi ke asnaf X, tampilkan rekening dengan `distribusi_{slug_asnaf_X} = true`.
    - Slug dibentuk dari nama kategori asnaf yang dinormalisasi (lowercase, spasi diganti underscore).
    - Rekening QRIS **tidak boleh** muncul di formulir distribusi, terlepas dari konfigurasi konteks.
11. Halaman **Entry Ledger Manual** (di Pengaturan Rekening) harus memfilter rekening dengan `entry_manual = true`.
12. Halaman **Rekonsiliasi** harus memfilter rekening dengan `rekonsiliasi = true`.
    - Rekening QRIS **tidak boleh** muncul di formulir rekonsiliasi.
13. Jika tidak ada rekening yang memenuhi filter konteks (misalnya belum dikonfigurasi), sistem harus menampilkan **semua rekening aktif non-QRIS** sebagai fallback agar operasional tidak terganggu. Pengecualian: untuk konteks penerimaan, rekening QRIS boleh muncul dalam fallback.
14. Rekening yang tidak aktif (`is_active = false`) tidak boleh ditampilkan di formulir transaksi mana pun, terlepas dari konfigurasi konteks.
15. Rekening dengan `account_channel = 'qris'` **diblokir secara keras** (hard-coded) dari semua konteks selain `pemasukan_*`, tidak bergantung pada konfigurasi toggle admin.

### Phase 3: Validasi dan Safeguard

14. Sistem harus memvalidasi saat submit bahwa rekening yang dipilih memang diperbolehkan untuk konteks transaksi tersebut (server-side check, bukan hanya client-side).
15. Jika rekening tidak valid untuk konteks saat submit, sistem harus mengembalikan error yang jelas kepada pengguna.
16. Perubahan konfigurasi rekening tidak boleh memutus data transaksi lama (data existing tetap valid dan dapat dibaca).

## 6) Non-Goals (Out of Scope)

1. Tidak mencakup pembatasan akses rekening berdasarkan role pengguna (cukup berbasis konteks transaksi).
2. Tidak mencakup audit log setiap perubahan konfigurasi rekening (di luar scope ini).
3. Tidak mencakup fitur multi-currency atau konversi mata uang.
4. Tidak mencakup integrasi otomatis dengan rekening bank/QRIS eksternal (hanya pengaturan ketersediaan internal).
5. Tidak mencakup pengaturan limit nominal per rekening per konteks.

## 7) Design Considerations

1. Panel konfigurasi konteks transaksi pada form edit rekening menggunakan komponen **Checkbox** atau **Switch** (shadcn/ui) yang familiar, bukan interface yang terlalu kompleks.
2. Tabel daftar rekening di halaman Pengaturan Rekening menampilkan badge **dengan ikon** ringkasan konteks aktif (badge chip per konteks) agar mudah dibaca sekilas.
3. Setiap konteks transaksi harus memiliki **ikon representatif** yang ditampilkan berpasangan dengan label teks pada badge maupun panel konfigurasi. Panduan ikon per grup konteks:
   - Penerimaan (`pemasukan_*`): ikon masuk/arrow-down (mis. `ArrowDownCircle` atau `Wallet`)
   - Distribusi (`distribusi_*`): ikon keluar/kirim (mis. `Send` atau `HandCoins`)
   - Rekonsiliasi: ikon siklus/cek rekening (mis. `RefreshCw` atau `GitMerge`)
   - Entry Manual: ikon pensil/manual (mis. `Pencil` atau `FileEdit`)
4. Warna/kode visual:
   - Rekening tersedia di semua konteks: badge hijau `Semua Konteks`
   - Rekening terkonfigurasi parsial: badge abu-abu/biru per kode konteks yang aktif (dengan ikon)
   - Rekening tanpa konteks aktif: badge merah `Tidak Tersedia`
   - Rekening QRIS: badge ungu `QRIS — Penerimaan Saja` sebagai penanda permanen bahwa channel ini dibatasi
5. Di formulir transaksi, jika rekening yang dipilih sudah tersimpan di data lama tetapi tidak lagi tersedia untuk konteks tersebut, sistem menampilkan warning (`rekening ini dibatasi untuk konteks lain`) namun tetap memperbolehkan submit untuk tidak memutus data existing.

## 8) Technical Considerations

### Opsi Skema DB

**Rekomendasi: Kolom JSONB `allowed_transaction_contexts` pada tabel `accounts`**

```sql
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS allowed_transaction_contexts JSONB NOT NULL DEFAULT '{"all": true}'::jsonb;
```

Struktur nilai:
```json
// Tersedia di semua konteks (default/backward-compatible)
{ "all": true }

// Dikonfigurasi parsial
{
  "all": false,
  "pemasukan_zakat_fitrah": true,
  "pemasukan_infak": true,
  "distribusi_zakat": true,
  "pemasukan_maal": false,
  "pemasukan_fidyah": false,
  "entry_manual": true
}
```

Keuntungan:
- Tidak menambah tabel/join baru.
- Flexible untuk menambah konteks baru di masa depan.
- Backward-compatible: `"all": true` berarti tidak ada pembatasan.

**Alternatif: Tabel terpisah `account_transaction_type_allowlist`**
- Lebih queryable tapi memerlukan JOIN di setiap query rekening.
- Lebih baik jika di masa depan ada banyak metadata per konteks (limit, catatan, dll).

### Perubahan Hook/Query

- `useAccountsList({ context })` perlu dukungan parameter konteks opsional untuk filtering sisi client.
- Alternatif: filter dilakukan di query Supabase (`.filter('allowed_transaction_contexts->>pemasukan_infak', 'eq', 'true')`).
- Query harus tetap berfungsi tanpa parameter konteks (backward-compatible untuk semua caller lama).

### Validasi Server-Side

- Tambahkan pengecekan di hook `useCreatePemasukanUang` / `useUpdatePemasukanUang` sebelum insert bahwa `account_id` yang dipilih memiliki konteks yang sesuai.
- Sama untuk hook distribusi/pembayaran zakat.

## 9) Success Metrics

1. Admin dapat mengkonfigurasi ketersediaan konteks transaksi per rekening dalam < 30 detik.
2. Formulir transaksi hanya menampilkan rekening yang relevan (0 rekening tidak relevan muncul).
3. Tidak ada transaksi existing yang rusak/hilang setelah fitur ini di-deploy.
4. Fallback logic berfungsi: jika semua rekening difilter habis, semua rekening aktif tetap muncul sebagai fallback.

## 10) Keputusan dari Open Questions

Semua pertanyaan terbuka telah dijawab oleh Product Owner dan sudah diintegrasikan ke dalam dokumen ini.

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Apakah `distribusi_zakat` perlu dibagi per kategori asnaf? | **Ya** — setiap kategori asnaf mendapat konteksnya sendiri (`distribusi_amil`, `distribusi_fakir`, dll). Nama kategori mengikuti data dinamis dari tabel `kategori_mustahik`. |
| 2 | Apakah perlu konteks `rekonsiliasi` terpisah dari `entry_manual`? | **Ya** — `rekonsiliasi` adalah konteks tersendiri. Rekening dapat diizinkan untuk rekonsiliasi tanpa harus diizinkan untuk entry manual, dan sebaliknya. |
| 3 | Apakah rekening QRIS diizinkan untuk konteks distribusi/pembayaran? | **Tidak** — rekening QRIS hanya untuk penerimaan (`pemasukan_*`). Pembatasan ini bersifat **hard-coded** di sistem dan tidak dapat di-override oleh konfigurasi admin. |
| 4 | Apakah ringkasan konteks di tabel rekening cukup badge teks saja? | **Tidak** — setiap badge harus disertai **ikon** yang merepresentasikan tipe transaksi (penerimaan, distribusi, rekonsiliasi, manual). Detail di Section 7. |
| 5 | Apakah konfigurasi konteks perlu bisa di-export/import? | **Ya** — fitur export (unduh JSON) dan import (unggah JSON) konfigurasi rekening dimasukkan ke dalam scope. Detail di Section 5 (Fr. #8) dan Section 11 (Priority 4). |

## 11) Delivery Priority Plan

1. **Priority 1 (DB + Config UI):** Tambah kolom `allowed_transaction_contexts` pada tabel `accounts` + panel konfigurasi toggle di form edit rekening (termasuk toggle per konteks distribusi dinamis dari `kategori_mustahik`) + tampilan ringkasan badge+ikon di tabel daftar rekening.
2. **Priority 2 (Filtering di Formulir):** Update `useAccountsList` dengan parameter konteks opsional + terapkan filtering di: Penerimaan Uang, Bulk Input, Distribusi/Pembayaran (per asnaf dinamis), Rekonsiliasi. Pastikan QRIS diblokir secara otomatis di konteks non-penerimaan.
3. **Priority 3 (Validasi Server-Side):** Tambah validasi server-side di hook mutasi transaksi + safeguard fallback jika konfigurasi belum ada + blokir keras QRIS di konteks distribusi dan rekonsiliasi pada level server.
4. **Priority 4 (Export/Import Konfigurasi):** Tambah tombol Export (unduh JSON konfigurasi semua rekening) dan Import (unggah JSON, overwrite konfigurasi) di halaman Pengaturan Rekening. Sertakan validasi schema JSON saat import.
