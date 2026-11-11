# Matriks hasil verifikasi task 9 - lokal

Diperiksa 11 November 2026 dengan data sintetis pada Supabase lokal. **Lokal** menunjukkan bukti lokal sesuai kolom, bukan kesiapan produksi. **Parsial** berarti masih ada bagian yang perlu diuji. Task 8 telah diuji di lokal; kesiapan rilis menyeluruh masih memiliki pekerjaan terbuka. OTP/SMS dan impor historis ditunda sesuai keputusan pengguna.

Bukti: 63 Vitest; 14 fixture SQL lokal termasuk fingerprint seluruh baris enam tabel kas/penerimaan; pengujian browser dan integrasi task 3-7 sesuai dokumen verifikasi. Lint global lulus tanpa error dan peringatan. Restore sintetis memeriksa skema aplikasi/Auth/Storage, sesi, RLS dan hak terpilih serta isi berkas privat terpisah; ini tidak membuktikan backup atau pemulihan lingkungan operasional.

## Kriteria penerimaan

| ID | Skenario | Hasil | Bukti atau pekerjaan tersisa |
|---|---|---|---|
| AC-01 | Orang yang sama sudah membayar zakat dan mengikuti qurban lalu menjadi nasabah | Lokal | people-foundation-local.sql; peopleHistory.test.ts |
| AC-02 | Baris lama ternyata mewakili satu keluarga, peminjam adalah salah satu anggota | Lokal | people-foundation-local.sql |
| AC-03 | Dua orang bernama sama atau berbagi telepon | Lokal | people-foundation-local.sql |
| AC-04 | Orang lama/baru dipilih dari form pinjaman | Lokal | people-foundation-local.sql; task4-6.spec.mjs |
| AC-05 | Pinjaman Rp1.000.000 dengan tiga angsuran otomatis | Lokal | loanSchedule.test.ts; task4-6.spec.mjs |
| AC-06 | Jadwal bulanan mulai 31 Januari 2027 | Lokal | loanSchedule.test.ts |
| AC-07 | Jadwal khusus totalnya tidak sama dengan pokok atau mempunyai tanggal ganda | Lokal | loan-draft-schedule-local.sql |
| AC-08 | Petugas mencairkan draft lengkap dengan kontrak bertanda tangan dan kebijakan terpenuhi | Lokal | task4-6-integration-local.mjs; task4-6.spec.mjs |
| AC-09 | Nasabah mengirim bukti Rp250.000 | Lokal | task9-acceptance-local.sql |
| AC-10 | Bukti ditolak | Lokal | task9-acceptance-local.sql |
| AC-11 | Pengurus mengonfirmasi Rp250.000 pada contoh bagian 4.6.1 | Lokal | task9-acceptance-local.sql; loanCalculations.test.ts |
| AC-12 | Bayar tambahan Rp550.000 dalam contoh yang sama | Lokal | task9-acceptance-local.sql |
| AC-13 | Pelunasan sisa pokok Rp400.000 | Lokal | task9-acceptance-local.sql |
| AC-14 | Dua petugas mengonfirmasi bersamaan atau browser mengirim ulang request | Lokal | task4-6-integration-local.mjs |
| AC-15 | Pembayaran melebihi sisa pokok | Lokal | task4-6-integration-local.mjs |
| AC-16 | Admin atau petugas membatalkan pembayaran yang membuat pinjaman lunas | Lokal | task9-acceptance-local.sql; task4-6.spec.mjs |
| AC-17 | Hari jatuh tempo dan satu hari sesudahnya | Lokal | loanCalculations.test.ts |
| AC-18 | Uji batas kolektabilitas 0/1/7/8/30/31/90/91 hari | Lokal | loan-collectibility-local.mjs: batas 0/1/7/8/30/31/90/91; fixture rollback |
| AC-19 | Kolektabilitas dimatikan | Lokal | loan-collectibility-local.mjs dan loanCollectibility.test.ts: label nonaktif, DPD dan tunggakan tetap tersedia |
| AC-20 | Nasabah mengganti ID URL/API ke pinjaman, bukti, atau kontrak orang lain | Lokal | task3-security-local.mjs, task4-6-integration-local.mjs dan task8-dashboard-api-local.mjs: akses silang/ekspor ditolak |
| AC-21 | Nasabah mengakses endpoint lama Data Master, users, kas, atau laporan global | Lokal | task3-security-local.mjs |
| AC-22 | Alamat/nama orang atau template kontrak diubah setelah dokumen final terbit | Lokal | loan-contract-local.sql; task4-6-integration-local.mjs |
| AC-23 | Dashboard difilter kategori/wilayah/periode | Lokal | loanReport.test.ts; task8-dashboard.spec.mjs: filter, angka dashboard, CSV dan PDF |
| AC-24 | Menambah, mengonfirmasi, menolak, membatalkan, dan mengekspor transaksi pinjaman | Lokal | task9-acceptance-local.sql dan task8-dashboard.spec.mjs: fingerprint enam tabel tetap sama; impor historis ditunda |
| AC-25 | Individu terkait pinjaman dihapus/nonaktif | Lokal | people-foundation-local.sql; task9-acceptance-local.sql |
| AC-26 | Input pembayaran mundur, lalu hitung laporan periode sebelumnya | Lokal | task8-dashboard.spec.mjs: pembayaran bertanggal mundur, pembatalan, hitung ulang dan ekspor CSV periode sebelumnya diuji sebelum dan sesudah koreksi |
| AC-27 | Unggahan terlalu besar/tipe isi tidak sah atau berkas milik orang lain | Lokal | task4-6-integration-local.mjs |
| AC-28 | Nasabah yang masih berhutang dibuatkan pinjaman kedua | Lokal | task4-6-integration-local.mjs |
| AC-29 | Draft belum mempunyai kontrak final bertanda tangan, atau jadwal berubah setelah kontrak ditandatangani | Lokal | loan-draft-schedule-local.sql; task4-6.spec.mjs |
| AC-30 | Pinjaman historis telah dicairkan tetapi kontrak tidak tersedia | Ditunda | Penanda dokumen historis diuji; impor historis task 5 ditunda |
| AC-31 | Login menggunakan email/password pada akun yang dibuat admin | Lokal | task3.spec.mjs; task3-security-local.mjs; loan-recovery-e2e-local.mjs |
| AC-32 | Nomor telepon profil digunakan bersama dua anggota keluarga | Lokal | people-foundation-local.sql; loan-auth-credentials-local.mjs |
| AC-33 | Impor pokok Rp1.000.000 dengan saldo cut-off Rp600.000 dan sisa per angsuran Rp300.000 + Rp300.000, tanpa rincian pembayaran lama | Ditunda | Impor historis task 5 ditunda |
| AC-34 | Setelah AC-33, terima pembayaran Rp100.000 setelah cut-off | Ditunda | Impor historis task 5 ditunda |
| AC-35 | Impor ulang batch yang sama, saldo/jadwal tidak cocok, atau dua pinjaman aktif untuk orang yang sama | Ditunda | Impor historis task 5 ditunda |
| AC-36 | Nominal/tenor melanggar kebijakan atau penjamin wajib belum tercatat | Lokal | loan-policy-local.sql |
| AC-37 | Pengguna petugas mencoba mencairkan, memverifikasi, dan membatalkan pembayaran | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs |
| AC-38 | Pengguna mencoba menghapus permanen identitas, bukti, kontrak, atau audit | Lokal | task9-acceptance-local.sql; people-foundation-local.sql |

## Kebutuhan fungsional

Hasil berikut menunjukkan bukti pada cakupan yang tercantum, bukan pembuktian setiap varian. Teks lengkap dan pemetaan terdapat dalam [matriks kebutuhan](matriks-fr-ac-pinjaman.md).

| ID | Task | Hasil | Bukti atau pekerjaan tersisa |
|---|---|---|---|
| FR-001 | 2.1 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-002 | 2.1 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-003 | 2.1, 2.3 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-004 | 2.1, 2.3 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-005 | 2.1, 2.2 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-006 | 2.2, 2.5 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-007 | 2.5 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-008 | 2.5, 2.6 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-009 | 2.6 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-010 | 2.4 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-011 | 2.7 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-012 | 2.6 | Lokal | people-foundation-local.sql; peopleHistory.test.ts; rincian lihat AC |
| FR-013 | 3.1, 3.2 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-014 | 3.1 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-015 | 3.1, 8.2 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |
| FR-016 | 3.2, 8.2 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |
| FR-017 | 3.2, 3.3, 7.2, 8.2 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-018 | 8.2 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |
| FR-019 | 4.1, 4.2 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-020 | 4.1, 4.3 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-021 | 4.1, 4.3 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-022 | 4.1, 4.3 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-023 | 4.1, 4.3, 4.8 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-024 | 4.1, 4.3 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-025 | 4.4 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-026 | 4.4 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-027 | 4.4 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-028 | 4.5 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-029 | 4.5 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-030 | 4.5 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-031 | 4.9 | Lokal | task4-6-integration-local.mjs dan task4-6.spec.mjs: kontrak, pencairan, bukti opsional, retry dan isolasi ledger |
| FR-032 | 4.9 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-033 | 4.10 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-034 | 4.10 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-035 | 4.10 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-036 | 6.1, 6.2 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-037 | 6.1, 6.2 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-038 | 6.1, 6.2, 6.3 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-039 | 6.1, 6.3 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-040 | 6.4 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-041 | 6.6, 6.7 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-042 | 6.6 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-043 | 6.5 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-044 | 5.9, 6.5 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |
| FR-045 | 4.8, 6.6, 6.8 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-046 | 6.4, 6.7 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-047 | 7.1 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-048 | 7.1, 7.2 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-049 | 7.6 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-050 | 7.6 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-051 | 7.7 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-052 | 7.7 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-053 | 7.3 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-054 | 7.3 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-055 | 7.4 | Lokal | task9-acceptance-local.sql; task4-6-integration-local.mjs; verifikasi-task-7-lokal.md |
| FR-056 | 4.9, 5.8, 7.4, 7.5 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |
| FR-057 | 7.2, 8.2 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |
| FR-058 | 8.3 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-059 | 8.8 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-060 | 8.8 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-061 | 8.8 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-062 | 8.8 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-063 | 6.9 | Lokal | Tindak lanjut dan pembatasan akses lokal; ulangi regresi task 8 |
| FR-064 | 8.8 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-065 | 8.4 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-066 | 8.5 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-067 | 8.6 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-068 | 8.6 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-069 | 8.7 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-070 | 8.9 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-071 | 8.5 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-072 | 8.10 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-073 | 8.9, 8.10 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-074 | 8.7 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-075 | 8.7 | Lokal | verifikasi-task-8-lokal.md; loanReport.test.ts; task8-dashboard-api-local.mjs dan browser sesuai kebutuhan |
| FR-076 | 6.1, 6.10 | Lokal | loan-audit-local.sql; task9-acceptance-local.sql |
| FR-077 | 6.10 | Lokal | loan-audit-local.sql; task9-acceptance-local.sql |
| FR-078 | P1 / lanjutan | P1 ditunda | Di luar cakupan MVP |
| FR-079 | P1 / lanjutan | P1 ditunda | Di luar cakupan MVP |
| FR-080 | Ditunda: 5.1–5.10 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-081 | P1 / lanjutan | P1 ditunda | Di luar cakupan MVP |
| FR-082 | P1 / lanjutan | P1 ditunda | Di luar cakupan MVP |
| FR-083 | 3.4, 3.5, 3.9 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-084 | 3.4, 3.9 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-085 | 3.1 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-086 | 3.6, 3.7 | Lokal | verifikasi-task-3-lokal.md; task3-security-local.mjs |
| FR-087 | Ditunda: 5.1 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-088 | Ditunda: 5.1, 5.2, 5.8 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-089 | Ditunda: 5.2, 5.3, 5.4 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-090 | Ditunda: 5.2, 5.5, 5.7, 5.9, 8.3 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-091 | Ditunda: 5.5 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-092 | Ditunda: 5.6, 5.7, 5.8, 5.9 | Ditunda | Task 5; guard lokal bukan fitur impor historis |
| FR-093 | 4.1, 4.2 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-094 | 4.1, 4.6, 7.4 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-095 | 4.1 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-096 | 4.1, 4.7 | Lokal | loan-policy-local.sql; loan-draft-schedule-local.sql; task4-6-integration-local.mjs |
| FR-097 | 2.7 | Parsial | Sebagian lokal tersedia; periksa portal, bukti pencairan, historis atau restore sesuai FR |

## Batasan sebelum rilis

- Rekonsiliasi perbedaan riwayat migrasi dan bucket publik online sebelum penerapan; hasil lokal tidak membuktikan online aman.
- Task 5 dan impor pinjaman historis ditunda; guard/saldo sintetis tidak membuktikan impor atau rekonsiliasi sumber.
- Restore sintetis skema aplikasi/Auth/Storage, sesi, kebijakan, hak dan data lulus pada database sementara; wrapper GraphQL direkonstruksi dari definisi lokal. Bytes berkas privat diuji terpisah. Konfigurasi platform, roles global, login sebenarnya, dan backup/restore lingkungan operasional belum dibuktikan.
- Redaksi kontrak final, penandatangan, saksi, label dana, pengelola, monitoring dan kesiapan peluncuran harus dipastikan pengurus sebelum operasional.

- `npm run test:task9:performance:api`: bundle produksi lokal dengan HTTP/PostgREST, JWT, RLS dan browser; database sementara berisi 1.000 pinjaman, 12.000 pembayaran dan 12.000 angsuran sintetis. Lima pengukuran setelah pemanasan: dashboard median 989 ms, maksimum 1.168 ms; rincian median 97 ms, maksimum 212 ms. API plus parsing JSON 193 hingga 209 ms. Lingkungan memakai localhost, proxy lokal dan browser headless; hasil ini tidak membuktikan kinerja jaringan atau beban operasional. Migrasi `141` diterapkan dan tercatat di lokal; akses role dibandingkan sebelum dan sesudah di database sementara.
- `npm run lint` lulus tanpa error dan peringatan pada 11 November 2026. Aturan lint tetap aktif; hasil sebelumnya 271 error dan 16 peringatan merupakan baseline historis.
- Regresi lokal mencakup transaksi program lama dengan identitas legacy dan individu terpetakan, login/portal, smoke test halaman, dan unduhan PDF bukti sedekah setelah nama berubah (`npm run test:task9:legacy-smoke`). Tidak semua variasi antarmuka dan perangkat telah diuji.
- `npm run test:task9:restore` menguji skema, constraints, RLS, hak, sesi nasabah, dan data sintetis pada database sementara; `npm run test:task9:backup` memeriksa pemulihan bytes berkas privat. [Kesiapan operasional](kesiapan-operasional-pinjaman.md) mencatat keputusan dan pembuktian yang masih diperlukan.
