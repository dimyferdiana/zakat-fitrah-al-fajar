# Baseline task 1: perapihan UI pinjaman

11 November 2026, sebelum refactor, branch `feature/perapihan-ui-pinjaman`, commit dasar `7c6e491`. Perubahan pengguna yang sudah ada pada `tests/local-supabase.mjs` tetap digunakan dan tidak diubah. Hasil ini hanya baseline, bukan bukti bahwa pekerjaan navigasi baru sudah lulus.

| Pemeriksaan | Hasil |
|---|---|
| `npm.cmd test` | Lulus: 21 berkas, 63 tes. |
| `npm.cmd run lint` | Lulus tanpa error atau peringatan. |
| `npm.cmd run build` | Lulus; peringatan data Browserslist lama dan `export.ts` diimpor statis sekaligus dinamis. |
| `npm.cmd run test:local:sql` | Lulus 14 berkas regresi; runner membungkus fixture dalam subtransaksi rollback. |
| `npm.cmd run test:task3:security` | Lulus, termasuk 51 tabel/view, viewer, mode sesi, nonaktif, Storage dan RPC anonim. |
| `npm.cmd run test:task4-6:integration` | Lulus, termasuk kontrak, pencairan, pembayaran, idempotensi dan konkurensi. |
| `npm.cmd run test:task8:api` | Lulus proyeksi, snapshot, role dan privasi dashboard. |
| `npx.cmd playwright test tests/browser/task3.spec.mjs tests/browser/task4-6.spec.mjs tests/browser/task8-dashboard.spec.mjs tests/browser/task9-mobile.spec.mjs` | 4/4 lulus dengan Edge headless, termasuk alur akun, transaksi, dashboard dan layar sempit. |

PowerShell memblokir `npm.ps1`/`npx.ps1`; varian `.cmd` berhasil tanpa mengubah execution policy. Sandbox awal menolak akses Docker dan penulisan telemetry CLI, sehingga pemeriksaan dan uji lokal dijalankan dengan akses yang diperlukan. Docker client/server 29.9.2, Node 24.19.0, Supabase CLI 3.0.0 dan Playwright 1.65.0. Container database, Auth, REST, Storage dan Edge Runtime proyek sudah aktif; alamat API diverifikasi `127.0.0.1:54321`. Tidak dilakukan reset atau migrasi. Uji keamanan, integrasi, API dan browser memakai `task3Fixture` dengan ID acak dan `finally` cleanup; runner SQL melakukan rollback. Fixture mengembalikan pengaturan portal awal. Edge Functions yang relevan digunakan oleh pengujian lokal; tidak perlu memulai ulang runtime milik pengguna.

Sebelum implementasi, ulangi pemeriksaan jika lingkungan atau kode dasar berubah. Setelah refactor jalankan kembali baseline dan skenario baru, termasuk role-guard, regresi bisnis, performa API lokal dan seluruh AC sebagaimana task 9. Uji tugas dengan admin/petugas sungguhan tetap diperlukan; hasil sintetis tidak menggantikannya.
