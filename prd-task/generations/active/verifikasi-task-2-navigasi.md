# Verifikasi task 2: navigasi pinjaman

11 November 2026. Validasi menggunakan Supabase lokal dan fixture sintetis; tidak ada reset database.

- `loan-navigation.spec.mjs`: 2 tes lulus untuk enam halaman dan penanda aktif, redirect termasuk hash lama, refresh, Back/Forward, ID tidak valid/tidak tersedia, akses admin/petugas/viewer/nasabah/nonaktif, RPC dan menu ponsel.
- Regresi browser `task3.spec.mjs`, `task4-6.spec.mjs`, `task8-dashboard.spec.mjs`, `task9-mobile.spec.mjs`: 4 tes lulus setelah disesuaikan dengan rute baru. Regresi `task9-legacy-smoke.spec.mjs`: 2 tes lulus untuk modul existing.
- `npm.cmd run test:task6:role-guard`: lulus pembatasan perubahan role dan mode sesi di server.
- `npm.cmd test`: 21 berkas, 63 tes lulus; `npm.cmd run lint` dan `npm.cmd run build` lulus. Build masih menampilkan peringatan Browserslist lama dan modul `export.ts` yang diimpor statis sekaligus dinamis, sesuai baseline.

Halaman baru memisahkan bagian existing sebagai fondasi navigasi. Pencarian dan paginasi seluruh data, profil dan pengelolaan akses kontekstual, formulir bertahap, riwayat pembayaran, ringkasan yang lebih terfokus dan audit semua komponen Shadcn UI tetap merupakan pekerjaan task 3–8; daftar pinjaman sementara masih dibatasi 50 data seperti sebelumnya. Tidak ada perubahan pada aturan keuangan atau database dalam task 2.
