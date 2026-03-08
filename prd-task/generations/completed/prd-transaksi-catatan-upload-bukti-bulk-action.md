# PRD: Catatan Bukti Sedekah, Upload Bukti Bayar, dan Revamp Bulk Action Transaction

## 1) Introduction / Overview
Dokumen ini mendefinisikan peningkatan fitur transaksi pada aplikasi Zakat Fitrah Al-Fajar dengan prioritas implementasi bertahap dari yang paling mudah: **(1) catatan transaksi tampil di Bukti Sedekah/PDF**, **(2) upload bukti bayar gambar per transaksi**, lalu **(3) perubahan bulk action transaction** sesuai format tabel input massal.

Masalah saat ini:
- Catatan transaksi belum konsisten tampil pada halaman Bukti Sedekah dan output PDF.
- Belum ada kolom upload bukti bayar gambar pada transaksi Penerimaan Uang dan Penerimaan Beras.
- Bulk action belum mendukung kebutuhan tipe transaksi dan media pembayaran baru (uang, beras kg, beras liter) dengan aturan validasi yang jelas.

Tujuan:
- Memastikan data transaksi lebih lengkap, audit-friendly, dan mudah diproses secara massal sesuai kebutuhan operasional masjid.

## 2) Goals
1. Menampilkan **catatan per transaksi** pada halaman Bukti Sedekah dan di file PDF Bukti Sedekah.
2. Menyediakan upload **1 file gambar bukti bayar** per transaksi (maksimal **1 MB**) untuk:
   - Penerimaan Uang
   - Penerimaan Beras
3. Memperbarui bulk action transaction ke format tabel input massal per baris dengan validasi kolom.
4. Mendukung 4 tipe transaksi pada bulk action: **zakat fitrah, maal, infak, fidyah**.
5. Menegakkan aturan media pembayaran:
   - **Maal** dan **fidyah**: hanya uang.
   - **Fitrah** dan **infak**: uang, beras (kg), atau beras (liter).
   - Satu transaksi hanya boleh satu media pembayaran.
6. Memperbaiki bug widget **Hak Amil** yang mencampur perhitungan uang dan beras, dengan memisahkan widget Hak Amil Uang dan widget Hak Amil Beras secara independen.

## 3) User Stories
1. Sebagai amil, saya ingin mengisi catatan pada transaksi agar informasi tambahan muncul pada Bukti Sedekah dan PDF sebagai arsip.
2. Sebagai amil, saya ingin mengunggah bukti bayar gambar di tiap transaksi agar ada dokumentasi pembayaran yang mudah diverifikasi.
3. Sebagai amil, saya ingin input transaksi massal dengan format tabel agar pekerjaan lebih cepat dan mengurangi input manual satu per satu.
4. Sebagai admin, saya ingin validasi otomatis per tipe transaksi dan media pembayaran agar data tidak salah format.

## 4) Functional Requirements

### Phase 1 (Prioritas 1): Catatan pada Bukti Sedekah + PDF
1. Sistem harus menyediakan field `catatan` pada form transaksi (create/edit) sebagai catatan per transaksi.
2. Sistem harus menampilkan nilai `catatan` transaksi pada halaman Bukti Sedekah.
3. Sistem harus menyertakan nilai `catatan` transaksi pada output file PDF Bukti Sedekah.
4. Jika `catatan` kosong, sistem harus menampilkan placeholder yang konsisten (mis. `-`) tanpa merusak layout.
5. Pemetaan data catatan antara transaksi → halaman Bukti Sedekah → generator PDF harus konsisten.

### Phase 2 (Prioritas 2): Upload Bukti Bayar per Transaksi
6. Sistem harus menambahkan field upload bukti bayar pada transaksi **Penerimaan Uang**.
7. Sistem harus menambahkan field upload bukti bayar pada transaksi **Penerimaan Beras**.
8. Sistem hanya menerima **1 file gambar** per transaksi.
9. Sistem hanya menerima format gambar umum (minimal jpg/png, opsional webp jika sudah didukung storage).
10. Ukuran file maksimum yang diterima adalah **1 MB**.
11. Sistem harus menolak file yang tidak valid (tipe/ukuran) dengan pesan error yang jelas.
12. Sistem harus menyimpan URL/path bukti bayar dan menampilkannya kembali saat transaksi dibuka.
13. Sistem harus mengizinkan penggantian gambar bukti bayar pada edit transaksi.
14. Sistem harus tetap aman terhadap akses file (mengikuti kebijakan akses/storage yang berlaku).

### Phase 3 (Prioritas 3): Revamp Bulk Action Transaction
15. Sistem harus mengubah bulk action menjadi format **tabel input massal per baris transaksi**.
16. Setiap baris bulk action minimal memiliki kolom: tipe transaksi, media pembayaran, nominal/kuantitas, satuan, catatan (opsional), dan data identitas yang sudah berlaku di sistem.
17. Sistem harus menyediakan 4 tipe transaksi: `zakat fitrah`, `maal`, `infak`, `fidyah`.
18. Sistem harus menyediakan media pembayaran: `uang (Rp)`, `beras (kg)`, `beras (liter)`.
19. Validasi aturan tipe-media wajib diterapkan:
    - `maal` dan `fidyah` hanya boleh `uang (Rp)`.
    - `zakat fitrah` dan `infak` boleh `uang (Rp)`, `beras (kg)`, atau `beras (liter)`.
20. Satu baris transaksi hanya boleh memilih **satu** media pembayaran.
21. Jika media pembayaran `uang (Rp)`, kolom nominal uang wajib terisi dan kolom beras harus kosong.
22. Jika media pembayaran `beras (kg)` atau `beras (liter)`, kolom kuantitas beras wajib terisi sesuai satuan dan kolom nominal uang harus kosong.
23. Sistem harus menampilkan error per baris/per kolom agar pengguna mudah memperbaiki data invalid.
24. Sistem harus menampilkan ringkasan hasil proses bulk (berhasil/gagal dan alasan gagal per baris).
25. Sistem harus mempertahankan output akhir sesuai format transaksi yang digunakan modul laporan saat ini (tanpa memecahkan kompatibilitas data existing).

### Phase 4 (Bug Fix, Sudah Selesai): Pisahkan Widget Hak Amil Uang dan Beras
26. Sistem harus memisahkan perhitungan widget Hak Amil Uang dari widget Hak Amil Beras agar tidak terjadi double-counting atau konversi satuan yang salah.
27. Widget Hak Amil Uang hanya beroperasi pada nominal Rupiah (tidak boleh menghitung beras sebagai Rp).
28. Widget Hak Amil Beras hanya beroperasi pada satuan beras (`kg` dan `liter`) dan tidak melakukan konversi ke Rupiah dalam kondisi apa pun.
29. Konfigurasi editor/list widget harus menyediakan dua tipe terpisah: **Hak Amil Uang** dan **Hak Amil Beras**, yang dapat dipilih secara independen.
30. Semua existing widget Hak Amil yang sebelumnya menggabungkan keduanya harus dimigrasikan ke tipe baru tanpa kehilangan data konfigurasi.

## 5) Non-Goals (Out of Scope)
1. Tidak mencakup OCR/ekstraksi otomatis dari gambar bukti bayar.
2. Tidak mencakup dukungan multi-file bukti bayar per transaksi.
3. Tidak mencakup redesign total halaman transaksi di luar kebutuhan field baru.
4. Tidak mencakup perubahan besar format PDF selain penambahan/penampilan catatan.
5. Tidak mencakup perubahan logika bisnis distribusi zakat di luar aturan tipe-media yang disebutkan.

## 6) Design Considerations
1. Bulk action mengikuti format tabel seperti referensi gambar dari stakeholder (detail visual final mengikuti handoff desain).
2. Field baru harus mengikuti komponen UI existing (shadcn/ui + pola form yang saat ini dipakai).
3. Penempatan catatan di Bukti Sedekah dan PDF harus mudah dibaca, tidak memotong informasi penting lain.

## 7) Technical Considerations
1. Gunakan pola validasi form yang sudah ada (React Hook Form + Zod) untuk field baru.
2. Pastikan perubahan skema data/migrasi mempertahankan kompatibilitas data transaksi existing.
3. Upload bukti bayar harus memanfaatkan mekanisme storage yang sudah dipakai project dan mengikuti kebijakan akses.
4. Generator PDF Bukti Sedekah perlu diperbarui agar menerima dan merender `catatan`.
5. Bulk processing perlu validasi server-side tambahan agar aturan tipe-media tetap aman walau validasi UI terlewati.

## 8) Success Metrics
1. 100% transaksi baru dapat menyimpan dan menampilkan catatan dengan konsisten di halaman Bukti Sedekah dan PDF.
2. >= 95% upload bukti bayar valid berhasil di percobaan pertama (error hanya untuk file invalid).
3. Penurunan kesalahan input transaksi massal (baris invalid karena aturan tipe-media) minimal 50% dalam 1 bulan setelah rilis.
4. Waktu input transaksi massal berkurang dibanding proses lama (indikator operasional internal).
5. Widget dashboard Hak Amil Uang dan Hak Amil Beras menampilkan nilai yang benar secara independen tanpa cross-contamination.

## 9) Open Questions
1. Referensi gambar final untuk format bulk action perlu dilampirkan agar detail layout/kolom 100% presisi.
2. Apakah format gambar yang diizinkan perlu dibatasi hanya `jpg/png` atau juga `webp`.
3. Apakah catatan perlu batas panjang karakter tertentu (mis. 255/500/1000).
4. Apakah bukti bayar perlu tampil juga di halaman detail transaksi lain selain form/edit dan bukti sedekah.
5. Apakah riwayat penggantian file bukti bayar perlu disimpan (versioning) atau cukup file terbaru.

## 10) Delivery Priority Plan
1. **Priority 1 (Easiest, SELESAI):** Catatan transaksi tampil di Bukti Sedekah dan PDF.
2. **Priority 2 (SELESAI):** Upload 1 gambar bukti bayar (maks 1 MB) di transaksi Penerimaan Uang dan Penerimaan Beras.
3. **Priority 3 (SELESAI):** Revamp bulk action transaction dengan tabel input massal + aturan tipe-media + output hasil proses.
4. **Priority 4 (Bug Fix, SELESAI):** Pisahkan widget Hak Amil Uang dan Hak Amil Beras agar tidak terjadi double-counting.
