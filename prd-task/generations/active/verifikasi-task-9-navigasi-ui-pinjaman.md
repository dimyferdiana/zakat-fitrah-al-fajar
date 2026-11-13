# Verifikasi task 9: navigasi dan UI pinjaman

Tanggal: 12 November 2026. Pengujian menggunakan Supabase lokal dan fixture sintetis, bukan data produksi. Task 9 belum ditutup: uji tugas oleh admin dan petugas sungguhan masih menunggu peserta.

## Kriteria penerimaan

| AC | Bukti dan hasil lokal |
|---|---|
| 01 | `loan-navigation.spec.mjs`: enam menu, halaman awal dan penanda aktif lulus. |
| 02 | Tes navigasi: redirect/anchor lama, refresh, deep link, Back/Forward dan ID tidak tersedia lulus. |
| 03 | Tes navigasi, `task3.spec.mjs`, `task3-security-local.mjs` dan `task6-role-guard-local.mjs`: batas admin, petugas, viewer, nasabah, sesi nonaktif dan mode nasabah lulus. |
| 04 | `loan-overview-attention-local.mjs`, `loan-report-settings.spec.mjs` dan `task8-dashboard-api-local.mjs`: ringkasan terverifikasi, pekerjaan, filter dan keadaan kosong diperiksa. |
| 05–06 | `loan-data-navigation.spec.mjs` dan `loan-navigation-data-local.mjs`: 57 pinjaman, pencarian di luar halaman pertama, filter, halaman dan pengembalian konteks lulus. |
| 07–08 | `loan-customer-profile.spec.mjs`, `task3.spec.mjs` dan `loan-recovery-e2e-local.mjs`: identitas existing, nama sama, rumah tangga, akun, pemulihan dan batas peran lulus. |
| 09–10 | `loan-create-workflow.spec.mjs` dan `loan-draft-readiness-local.mjs`: jadwal mingguan, bulanan dan khusus, invalidasi pratinjau, retry, kegagalan dan perlindungan isian lulus. |
| 11–12 | `task4-6.spec.mjs`, `loan-draft-readiness-local.mjs` dan `task4-6-integration-local.mjs`: syarat kontrak, jadwal, kewajiban aktif, pencairan dan idempotensi lulus. |
| 13 | `loan-payment-workflows.spec.mjs`, `loan-payment-lists-local.mjs` dan tes integrasi: pembayaran, penolakan, koreksi, antrean, retry dan konkurensi lulus. |
| 14 | `loan-report-settings.spec.mjs` dan `task8-dashboard.spec.mjs`: CSV/PDF, formula aman, filter dan ekspor lintas halaman lulus. |
| 15 | Tes integrasi dan keamanan: snapshot, pembagian/pencabutan serta isolasi dokumen, audit, pembatalan dan laporan historis diperiksa. |
| 16 | `loan-report-settings.spec.mjs`, `loan-collectibility-local.mjs` dan `task6-role-guard-local.mjs`: batas pengaturan dan role lulus; kolektabilitas default tidak aktif. |
| 17 | `loan-ui-accessibility.spec.mjs` pada 1366 × 768 dan 390 × 844 serta `sidebar-layout.spec.mjs` lulus; audit komponen Shadcn dan batas pengujian dicatat pada [task 8](verifikasi-task-8-ui-aksesibilitas.md). |
| 18 | Fingerprint isi enam tabel kas/penerimaan sebelum/sesudah ekspor pada `task8-dashboard.spec.mjs` cocok; 14 fixture SQL, regresi akun, konkurensi, RLS, audit dan Storage privat lulus. Fingerprint ini mencakup alur yang diuji, bukan seluruh kemungkinan operasi produksi. |

## Perintah dan hasil

Dijalankan dari `zakat-fitrah-app` dengan Node 24.19.0, Supabase lokal dan Edge headless:

- `npm.cmd test`: 23 berkas, 66 tes lulus.
- `npm.cmd run lint`: lulus tanpa peringatan; sama dengan baseline aktual [task 1](baseline-perapihan-ui-pinjaman.md).
- `npm.cmd run build`: lulus; peringatan Browserslist lama dan impor campuran `export.ts` masih sama seperti baseline. Tindak lanjut: perbarui data Browserslist dan evaluasi pemisahan impor saat pemeliharaan dependensi, lalu ulangi build.
- `npm.cmd run test:local:sql`: 14 fixture lulus dengan rollback.
- `node tests/task3-security-local.mjs`: lulus isolasi 51 tabel/view, viewer, akun nonaktif, RPC anonim, bucket dan dokumen privat.
- `node tests/loan-navigation-data-local.mjs`, `loan-overview-attention-local.mjs`, `loan-payment-lists-local.mjs`, `loan-draft-readiness-local.mjs`, `task4-6-integration-local.mjs`, `task6-role-guard-local.mjs`, `task8-dashboard-api-local.mjs`, `loan-collectibility-local.mjs` dan `loan-recovery-e2e-local.mjs` (masing-masing di bawah `tests/`): semua lulus.
- `npx.cmd playwright test tests/browser/loan-navigation.spec.mjs tests/browser/loan-data-navigation.spec.mjs tests/browser/loan-create-workflow.spec.mjs tests/browser/loan-customer-profile.spec.mjs tests/browser/loan-payment-workflows.spec.mjs tests/browser/loan-report-settings.spec.mjs tests/browser/loan-ui-accessibility.spec.mjs tests/browser/sidebar-layout.spec.mjs tests/browser/task3.spec.mjs tests/browser/task4-6.spec.mjs tests/browser/task8-dashboard.spec.mjs --workers=1`: 13 skenario lulus.

## Performa

`node tests/task9-navigation-performance-api-local.mjs`: 1.000 pinjaman, 12.000 pembayaran dan 12.000 angsuran sintetis pada database sementara dengan salinan skema, PostgREST terpisah, JWT hasil login Auth lokal dan RLS. Browser menggunakan bundle produksi melalui proxy localhost. Setelah pemanasan diukur lima kali; setiap rincian memakai pinjaman berbeda dan menunggu respons PostgREST. Data dan database sementara dibersihkan setelah pengukuran.

| Halaman | Median | Maksimum | Target maksimum |
|---|---:|---:|---:|
| Ringkasan | 922,5 ms | 1.019,0 ms | 3.000 ms |
| Daftar | 946,7 ms | 954,9 ms | 3.000 ms |
| Rincian | 70,9 ms | 125,0 ms | 2.000 ms |

Perangkat: Intel Core i7-10750H, 12 prosesor logis, RAM 15,8 GiB, Windows x64 10.0.26300, Microsoft Edge headless 157.0.4341.42, viewport 1366 × 768. Hasil memenuhi target lokal, tetapi bukan pengukuran jaringan atau beban produksi. Jalankan ulang pada perangkat dan kondisi operasional menjelang rilis.

## Panduan operasional dan URL

| Menu | Tujuan dan alur |
|---|---|
| Ringkasan | `/pinjaman/dashboard`: posisi, pekerjaan yang perlu ditangani, dan tautan ke rincian atau daftar terfilter. |
| Nasabah | `/pinjaman/nasabah`: cari nasabah, buka profil, atau pilih `/pinjaman/nasabah/baru`; admin mengelola akses dari profil. |
| Pinjaman | `/pinjaman/daftar`: cari/filter, pilih pinjaman untuk `/pinjaman/daftar/:id`, atau buat melalui `/pinjaman/baru`. Tab rincian memisahkan jadwal, pembayaran, dokumen dan tindak lanjut. |
| Pembayaran | `/pinjaman/pembayaran`: catat pembayaran; tab verifikasi menangani bukti, tab riwayat menampilkan transaksi dan koreksi. |
| Laporan | `/pinjaman/laporan`: pilih filter dan unduh CSV/PDF untuk seluruh hasil filter. |
| Pengaturan | `/pinjaman/pengaturan`: kebijakan, template dan izin sesuai role. |

URL lama `/pinjaman` menuju ringkasan. Anchor `#loan-dashboard`, `#loan-customers`, `#loan-drafts`, `#loan-claims`, `#loan-settings`, `#rincian-pinjaman` dan `#loan-detail` masing-masing menuju ringkasan, nasabah, pembuatan, antrean verifikasi, pengaturan, daftar dan daftar. Anchor rincian lama tanpa ID menuju daftar agar pinjaman dapat dipilih. Filter dan halaman dipertahankan ketika kembali dari rincian; pencarian tidak dimasukkan ke URL.

## Uji tugas manusia dan tindak lanjut

Belum ada hasil dari peserta admin dan petugas yang dapat diverifikasi. Untuk masing-masing peserta, catat tanggal, peran, hasil dan hambatan pada lima alur PRD: mencari pinjaman, membuat draf, mencatat pembayaran, memeriksa klaim, dan mengunduh laporan. Minimal empat dari lima harus berhasil per orang tanpa arahan langkah demi langkah; catat tindak lanjut tiap hambatan dan ulangi bila perlu. Uji otomatis tidak menggantikan peserta. Task 9.7 dan penutupan P0 tetap terbuka sampai bukti ini ada.

FR-UI-041 adalah P1 opsional untuk mengingat jumlah baris dan filter nonrahasia per pengguna, hanya jika kebutuhan muncul setelah uji penggunaan; pastikan filter tidak tersembunyi dan tidak terbawa ke pengguna lain. FR-UI-042 adalah P1 opsional untuk pratinjau berkas aman; pertahankan unduhan privat jika pratinjau tidak tersedia. Keduanya masuk backlog setelah P0 diterima dan bukan syarat penutupan P0.

Migrasi 142–149 telah diterapkan pada lingkungan lokal; lingkungan lain memerlukan proses migrasi biasa dan verifikasi rilis tersendiri. Matriks FR dan rincian implementasi terkait tersedia pada [fondasi task 1](fondasi-perapihan-ui-pinjaman.md) dan bukti task 2–8 di direktori ini.
