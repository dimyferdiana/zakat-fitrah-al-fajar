# PRD — Fase 2: Dashboard Keuangan + Pemasukan Uang (Fitrah, Fidyah, Maal Penghasilan)

## 1. Introduction / Overview
Aplikasi saat ini berfokus pada Zakat Fitrah (pembayaran dan distribusi beras/uang) dan dashboard menampilkan ringkasan pemasukan/distribusi zakat saja.

Fase 2 bertujuan memperluas **pelacakan pemasukan uang** agar mencakup:
- **Zakat Fitrah (uang)** (tetap)
- **Fidyah (uang)**
- **Zakat Maal Penghasilan/Profesi (uang)**
- **Infak/Sedekah (uang)** (minimal untuk menampung “kelebihan bayar”)

Serta memperbarui **Dashboard** agar menampilkan metrik-metrik uang terkumpul per kategori, plus **Hak Amil** dan rumus progress:

$$\text{Sisa} = \text{Total Pemasukan} - \text{Hak Amil} - \text{Tersalurkan}$$

Catatan penting:
- Di Fase 2, **Hak Amil masih diinput manual** (belum auto persentase).
- Untuk uang, disediakan pemilihan akun: **Kas** atau **Bank** (fixed).
- Ada fitur **rekonsiliasi manual** (beras + uang), hanya untuk **admin**.

## 2. Goals
1. Dashboard menampilkan metrik uang terkumpul untuk: Zakat (uang), Infak/Sedekah (uang), Fidyah (uang).
2. Dashboard menampilkan komponen progress uang: Total Pemasukan, Hak Amil (manual), Tersalurkan, dan Sisa (hasil rumus).
3. Mendukung pencatatan pemasukan uang untuk:
   - Fidyah (uang)
   - Zakat Maal Penghasilan/Profesi (uang)
4. Pada pencatatan Zakat Fitrah (uang), jika terjadi **kelebihan bayar**, sistem membantu mengarahkan ke **Infak/Sedekah (uang)** (dengan konfirmasi petugas).
5. Setiap pemasukan uang wajib memilih akun tujuan: **Kas** atau **Bank**.
6. Admin dapat melakukan rekonsiliasi manual (penyesuaian) untuk saldo uang (Kas/Bank) dan stok beras.

## 3. User Stories
1. Sebagai **petugas**, saya ingin mencatat pembayaran **Fidyah (uang)** agar total fidyah terlihat di dashboard.
2. Sebagai **petugas**, saya ingin mencatat **Zakat Maal Penghasilan (uang)** dengan bantuan kalkulasi sederhana agar nominal zakat maal lebih konsisten.
3. Sebagai **petugas**, saat ada muzakki membayar **lebih** dari kewajiban Zakat Fitrah (uang), saya ingin sistem menyarankan pencatatan selisih sebagai **Infak/Sedekah**.
4. Sebagai **admin**, saya ingin menginput **Hak Amil** secara manual agar dashboard dapat menghitung “Sisa” secara benar.
5. Sebagai **admin**, saya ingin melakukan **rekonsiliasi** (penyesuaian) jika ada selisih stok beras atau saldo Kas/Bank agar laporan sesuai kondisi nyata.
6. Sebagai **viewer**, saya ingin melihat ringkasan dashboard uang yang jelas (tanpa bisa mengubah data).

## 4. Functional Requirements

### 4.1 Kategori pemasukan uang
1. Sistem harus menyediakan kategori pemasukan uang: 
   1) Zakat Fitrah (uang)
   2) Fidyah (uang)
   3) Zakat Maal Penghasilan/Profesi (uang)
   4) Infak/Sedekah (uang)
2. Sistem harus menyimpan pemasukan uang per kategori, per tahun zakat.

### 4.2 Akun uang (Kas/Bank)
3. Setiap transaksi pemasukan uang harus memiliki field akun tujuan dengan pilihan: `Kas` atau `Bank`.
4. Dashboard harus dapat menampilkan ringkasan uang terkumpul berdasarkan akun (Kas vs Bank) sebagai total (minimal), dan opsional per kategori (jika mudah).

### 4.3 Dashboard (ringkasan + progress uang)
5. Dashboard harus menambahkan kartu/metrik:
   - Infak/Sedekah Uang Terkumpul
   - Fidyah Uang Terkumpul
   - (tetap) Zakat Uang Terkumpul
6. Dashboard harus menampilkan komponen progress uang yang menghitung:
   - Total Pemasukan (uang) = Zakat Uang + Infak/Sedekah Uang + Fidyah Uang + Maal Uang
   - Hak Amil (uang) = nilai manual input (per tahun)
   - Tersalurkan (uang) = total distribusi uang (existing)
   - Sisa (uang) = Total Pemasukan - Hak Amil - Tersalurkan
7. Sistem harus memastikan nilai “Sisa” tidak negatif; jika negatif, tampilkan peringatan “Periksa input Hak Amil / distribusi”.

### 4.4 Hak Amil (manual)
8. Sistem harus menyediakan input Hak Amil (uang) manual per tahun zakat (hanya admin).
9. Sistem harus menyimpan riwayat perubahan Hak Amil (minimal via audit log yang sudah ada, atau tabel khusus perubahan).

### 4.5 Kelebihan bayar Zakat Fitrah (uang) → Infak/Sedekah
10. Saat petugas menginput pembayaran Zakat Fitrah (uang), sistem harus bisa menghitung “kewajiban” berdasarkan:
   - jumlah jiwa × nilai uang per jiwa (mengambil dari `tahun_zakat.nilai_uang_rp`).
11. Jika nominal dibayar > kewajiban, sistem harus menampilkan dialog/konfirmasi:
   - “Ada kelebihan Rp X. Simpan sebagai Infak/Sedekah?”
   - Default: ya (bisa diubah).
12. Jika disetujui, sistem harus mencatat selisih ke kategori Infak/Sedekah (uang) dengan referensi transaksi asal.

### 4.6 Zakat Maal Penghasilan (uang)
13. Sistem harus menyediakan form input transaksi “Zakat Maal Penghasilan (uang)” yang menyimpan nominal akhir (uang) + akun (Kas/Bank) + tanggal.
14. Sistem harus menyediakan kalkulator sederhana (opsional UI di form) untuk membantu hitung nominal zakat maal penghasilan mengikuti rujukan Baznas:
   - input pendapatan bulanan, bonus/pendapatan lain, hutang/cicilan yang jatuh tempo
   - output: kewajiban zakat maal
   - Catatan: detail rumus dan parameter nisab akan ditetapkan (lihat Open Questions).

### 4.7 Fidyah (uang)
15. Sistem harus menyediakan form input transaksi “Fidyah (uang)” yang menyimpan nominal + akun (Kas/Bank) + tanggal.

### 4.8 Rekonsiliasi (admin-only)
16. Sistem harus menyediakan halaman “Rekonsiliasi” untuk admin.
17. Admin dapat membuat entri penyesuaian untuk:
   - saldo Kas (uang)
   - saldo Bank (uang)
   - stok Beras (kg)
18. Setiap penyesuaian harus memiliki: tanggal, jenis (uang/beras), akun (untuk uang), nilai selisih (+/-), dan catatan.
19. Dashboard harus menggunakan nilai penyesuaian sebagai bagian dari perhitungan total (misalnya melalui “saldo awal + transaksi + penyesuaian”), atau minimal menampilkan penyesuaian sebagai komponen terpisah (dipilih saat implementasi).

## 5. Non-Goals (Out of Scope) — disimpan untuk Fase 3 / topik lain
- Hak Amil dihitung otomatis berdasarkan persentase (Zakat 12.5%, Infak 20%, Fidyah 20%).
- Zakat Maal selain penghasilan/profesi (emas, tabungan, perdagangan, dll).
- Fidyah dalam bentuk beras.
- Otomasi “kekurangan beras diambil dari hak amil” (dan aturan batasnya).
- Manajemen logistik distribusi (keterbatasan distribusi, penjadwalan, dsb).
- Pengayaan tabel muzakki/mustahik (mis. menampilkan nomor HP langsung di tabel) dan menu master “Amilin”.
- Redirect pembayaran publik ke MPZ/UPZ (alur end-user eksternal).

## 6. Design Considerations
- Dashboard: tambah 2–4 kartu baru (Infak/Sedekah, Fidyah, Maal (opsional digabung ke “Total Pemasukan Uang”)).
- Progress distribusi uang: tampilkan bar/komponen yang mencantumkan Total Pemasukan, Hak Amil, Tersalurkan, Sisa.
- Form pemasukan uang: gunakan pola UI existing (shadcn/ui + react-hook-form) seperti pembayaran zakat.
- Rekonsiliasi: tampilan tabel riwayat penyesuaian + form tambah penyesuaian (admin-only).

## 7. Technical Considerations
- Saat ini tabel utama adalah `pembayaran_zakat` (fitrah) dan `distribusi_zakat`.
- Disarankan menambah tabel baru untuk pemasukan uang multi-kategori (mis. `pemasukan_uang`) agar tidak memaksa field khusus fitrah (jumlah_jiwa).
- Jika perlu relasi, `pemasukan_uang` bisa mereferensi `muzakki_id` (nullable untuk infak anonim) dan `tahun_zakat_id`.
- Perlu enum/tipe kategori (fitrah_uang, fidyah_uang, maal_penghasilan_uang, infak_sedekah_uang).
- Role gating: gunakan `users.role` untuk membatasi halaman rekonsiliasi dan input Hak Amil ke admin.
- Audit: gunakan `audit_logs` untuk mencatat perubahan hak amil/rekonsiliasi.

## 8. Success Metrics
- Dashboard menampilkan metrik baru tanpa error dan sesuai data transaksi.
- Petugas berhasil mencatat fidyah dan maal penghasilan (uang) dan muncul di dashboard.
- Kelebihan bayar zakat fitrah (uang) tercatat sebagai infak/sedekah dengan konfirmasi.
- Admin dapat membuat penyesuaian rekonsiliasi dan tercatat di audit/log.

## 9. Open Questions
1. Parameter nisab untuk zakat maal penghasilan mengikuti Baznas: sumber/angka nisab (emas per gram) dan cara update nilainya di sistem.
2. Distribusi uang saat ini dianggap “zakat” saja; apakah distribusi fidyah/infak perlu dipisah kategori juga? (Jika iya, perlu perluasan `distribusi_zakat` atau tabel baru.)
3. Apakah infak/sedekah hanya berasal dari “kelebihan bayar” atau juga bisa dicatat sebagai transaksi mandiri?
4. Apakah pemasukan maal/fidyah wajib memiliki muzakki, atau boleh anonim?

