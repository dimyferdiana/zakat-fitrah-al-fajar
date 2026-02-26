# PRD: Pengaturan Hak Amil (Uang & Beras)

## Document Control
- **Version:** V1.4.0
- **Created Date:** 2026-02-21
- **Last Updated:** 2026-02-26
- **Summary of Addition/Adjustment:** Menstandarkan aturan hak amil lintas kategori uang/beras, basis neto rekonsiliasi, konfigurasi per tahun, dan rekap laporan.

## 1. Introduction / Overview

Fitur ini bertujuan mengatur perhitungan dan pelaporan **hak amil** secara konsisten untuk seluruh kategori penerimaan zakat/sedekah/fidyah, mencakup **uang dan beras**.

Masalah saat ini: aturan hak amil belum terstandarisasi penuh antar kategori dan periode, sehingga berisiko menimbulkan ketidakkonsistenan laporan keuangan.

Goal utama: sistem mampu menghitung, menyimpan, dan menampilkan hak amil secara otomatis dengan formula yang disepakati, serta menyediakan output laporan dan export.

---

## 2. Goals

1. Sistem menghitung hak amil otomatis untuk setiap kategori sesuai formula:
   - Zakat Fitrah = 12,5%
   - Zakat Maal = 12,5%
   - Infak = 20%
   - Fidyah = 0%
   - Beras = 0%
2. Sistem mendukung basis perhitungan **neto setelah rekonsiliasi** sebagai default.
3. Admin dapat mengatur basis perhitungan per tahun zakat (opsi per tahun).
4. Sistem menyimpan hasil perhitungan (level transaksi) dan menampilkan rekap di dashboard/laporan.
5. Laporan hak amil tersedia per bulan dan per tahun, termasuk export PDF/Excel.

---

## 3. User Stories

1. Sebagai **admin**, saya ingin mengatur basis perhitungan hak amil per tahun zakat agar kebijakan tiap tahun dapat disesuaikan.
2. Sebagai **petugas**, saya ingin sistem menghitung hak amil otomatis saat transaksi dicatat agar tidak menghitung manual.
3. Sebagai **bendahara/admin**, saya ingin melihat rekap hak amil per bulan dan per tahun agar mudah audit dan pelaporan.
4. Sebagai **auditor internal**, saya ingin kategori beras/fidyah tetap ditampilkan dengan nilai hak amil 0 agar transparansi terjaga.
5. Sebagai **admin**, saya ingin export laporan hak amil ke PDF/Excel agar mudah dibagikan ke pengurus.

---

## 4. Functional Requirements

1. Sistem harus menyediakan konfigurasi hak amil per kategori dengan nilai default:
   1. Zakat Fitrah: 12,5%
   2. Zakat Maal: 12,5%
   3. Infak: 20%
   4. Fidyah: 0%
   5. Beras: 0%
2. Sistem harus menghitung hak amil pada level transaksi dan menyimpan nilainya.
3. Sistem harus menampilkan agregasi hak amil pada dashboard/laporan.
4. Sistem harus mendukung basis perhitungan **neto setelah rekonsiliasi**.
5. Sistem harus mendukung pengaturan basis perhitungan per tahun zakat oleh admin (per-year setting).
6. Sistem harus menyediakan grouping laporan:
   1. Per bulan
   2. Per tahun zakat
7. Sistem harus menampilkan kategori dengan hak amil 0% (fidyah dan beras) dengan nilai hasil 0 untuk transparansi.
8. Sistem harus menampilkan rincian komponen per kategori:
   - total bruto
   - total rekonsiliasi
   - total neto
   - persen hak amil
   - nominal hak amil
9. Sistem harus menyediakan export laporan hak amil ke PDF.
10. Sistem harus menyediakan export laporan hak amil ke Excel.
11. Sistem harus menerapkan role-based access:
    - Admin: atur konfigurasi dan lihat semua laporan
    - Petugas: input transaksi dan lihat laporan sesuai hak akses
12. Sistem harus mencatat audit log setiap perubahan konfigurasi hak amil per tahun.

---

## 5. Non-Goals (Out of Scope)

1. Tidak membahas perhitungan distribusi mustahik detail di PRD ini.
2. Tidak mengubah formula default yang sudah disepakati pada PRD ini.
3. Tidak mencakup approval workflow multi-level (mis. dual approval) untuk fase ini.
4. Tidak mencakup integrasi notifikasi eksternal (WhatsApp/email broadcast laporan) pada fase ini.

---

## 6. Design Considerations

1. Tambahkan section khusus “Hak Amil” pada dashboard keuangan.
2. Tambahkan halaman/filter laporan hak amil dengan tab:
   - Per bulan
   - Per tahun
3. Tampilkan badge kategori dengan warna konsisten.
4. Untuk kategori 0% (fidyah, beras), tampilkan label “0% (Tidak diambil)”.
5. Gunakan komponen UI yang sudah ada di sistem (shadcn/ui + style existing project).

---

## 7. Technical Considerations

1. Integrasi dengan modul transaksi keuangan yang sudah ada (pemasukan uang/beras, rekonsiliasi).
2. Tambahkan konfigurasi basis perhitungan per tahun zakat (table setting per tahun).
3. Simpan snapshot nilai hak amil per transaksi agar histori tidak berubah saat konfigurasi tahun berikutnya berubah.
4. Hitung neto setelah rekonsiliasi sesuai opsi basis yang aktif di tahun tersebut.
5. Pastikan RLS dan role check tetap konsisten untuk akses data konfigurasi/laporan.
6. Export PDF/Excel mengikuti pola modul laporan existing.

---

## 8. Success Metrics

1. 100% transaksi kategori terkait menghasilkan nilai hak amil otomatis tanpa input manual.
2. 0 mismatch pada audit sampling antara rumus sistem vs perhitungan manual bendahara.
3. Laporan hak amil bulanan dan tahunan dapat diexport (PDF/Excel) tanpa error.
4. Waktu pembuatan laporan hak amil berkurang minimal 50% dibanding proses manual.
5. Tidak ada komplain ketidaksesuaian rumus selama 1 periode pelaporan bulanan penuh.

---

## 9. Open Questions

1. Untuk opsi **basis per tahun**: apakah pilihan basis yang diizinkan hanya `neto` dan `bruto`, atau ada opsi lain di masa depan?
2. Jika ada perubahan basis di tengah tahun, apakah berlaku retrospektif ke transaksi lama atau hanya ke transaksi baru?
3. Apakah diperlukan lock periode (mis. setelah tutup buku bulanan, nilai hak amil tidak boleh berubah)?
4. Apakah export butuh tanda tangan/stempel otomatis seperti template laporan lain?

---

## Ringkasan Formula

Dengan basis perhitungan mengikuti setting tahun zakat (default: neto setelah rekonsiliasi):

- Hak Amil Zakat Fitrah = 12,5% × basis
- Hak Amil Zakat Maal = 12,5% × basis
- Hak Amil Infak = 20% × basis
- Hak Amil Fidyah = 0% × basis
- Hak Amil Beras = 0% × basis
