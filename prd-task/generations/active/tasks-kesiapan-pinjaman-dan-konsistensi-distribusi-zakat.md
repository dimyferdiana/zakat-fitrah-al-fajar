# Tasks: Kesiapan pinjaman dan konsistensi distribusi zakat

Sumber: [PRD kesiapan pinjaman dan konsistensi distribusi zakat](prd-kesiapan-pinjaman-dan-konsistensi-distribusi-zakat.md). Ini daftar tugas tingkat utama; rincian subtask disusun setelah konfirmasi sesuai `prd-task/generate-tasks.md`.

Rincian khusus persiapan deployment dan audit RLS: [tasks deployment Vercel dan Supabase](tasks-deployment-vercel-supabase.md).

## Relevant Files

- `prd-task/generations/active/tasks-pinjaman-jamaah-dan-data-induk-orang.md` — status 1.6, 5.0–5.10, 9.7, dan 9.10 yang menjadi sumber pekerjaan lanjutan.
- `prd-task/generations/active/kesiapan-operasional-pinjaman.md` dan `matriks-hasil-task-9-lokal.md` — bukti lokal dan syarat operasional yang masih terbuka.
- `zakat-fitrah-app/src/hooks/useDistribusi.ts` — query, penyimpanan, validasi dan stok distribusi.
- `zakat-fitrah-app/src/components/distribusi/`, `src/pages/Distribusi.tsx` — form dan daftar distribusi.
- `zakat-fitrah-app/src/components/laporan/`, `src/hooks/useDashboard.ts`, riwayat mustahik, ekspor dan bukti — tampilan dan agregasi terkait yang perlu dipetakan.
- `zakat-fitrah-app/supabase/migrations/`, `src/types/database.types.ts` — skema, hak dan tipe lokal; verifikasi kondisi online sebelum merancang kompatibilitas.
- `zakat-fitrah-app/tests/` dan tes modul terkait — pengujian lokal, keamanan, regresi, backup dan performa.

### Notes

- Pekerjaan ini disiapkan dan diuji lokal; penerapan online dilakukan pada tahap berikutnya melalui rencana yang terverifikasi.
- Tugas impor historis 5.0–5.10 dan 9.7 tetap ditunda hingga diperlukan. Jangan mencentangnya sebagai selesai.
- Jangan memasukkan password, token, data pribadi atau salinan backup ke repository. Gunakan data sintetis untuk pengujian.
- Perintah pengujian dijalankan dari folder `zakat-fitrah-app` sesuai `package.json`.

## Instructions for Completing Tasks

Tandai setiap tugas selesai hanya setelah pekerjaannya dan bukti pengujiannya tersedia; sinkronkan checklist lama bila persyaratan aslinya benar-benar terpenuhi.

## Tasks

- [ ] 0.0 Create feature branch.
- [ ] 1.0 Audit skema dan data distribusi lokal/online secara aman, petakan perbedaan serta putuskan strategi kompatibilitas dan rekonsiliasi tanpa kehilangan data. (FR-04–06, AC-03)
- [ ] 2.0 Selaraskan pencatatan dan pembacaan jumlah distribusi beras/uang serta perlindungan terhadap error dan stok yang tidak valid. (FR-01–03, FR-07–10, AC-01–02)
- [ ] 3.0 Selaraskan dashboard, laporan, riwayat, ekspor dan bukti, kemudian verifikasi dampak perubahan lint dan performa pada fitur lama dan hak akses. (FR-07, FR-17–18, AC-01, AC-04)
- [ ] 4.0 Tuntaskan tindak lanjut akun dan susun checklist kesiapan operasional pinjaman, termasuk keputusan pengurus, keamanan, backup, pemulihan dan pemantauan. (FR-11–15, FR-21, AC-05)
- [ ] 5.0 Uji regresi dan kinerja pada lingkungan yang sesuai, dokumentasikan batas bukti lokal, dan siapkan rencana rilis serta pemulihan online yang dapat diuji. (FR-18–20, AC-04, AC-06)
- [ ] 6.0 Catat ketergantungan dan status pekerjaan historis yang ditunda; perbarui keterlacakan ke checklist lama tanpa menganggap tugas tertunda selesai. (FR-16, FR-21, AC-07)
