# Verifikasi task 4: nasabah dan akses akun

Tanggal: 11 November 2026. Pengujian dilakukan pada Supabase lokal dengan data sintetis yang dibersihkan setelah pengujian; tidak ada reset atau perubahan pada database online.

## Hasil implementasi

- Daftar Nasabah menyediakan pencarian, jumlah hasil, paginasi, ID, alamat/wilayah, status dan kewajiban terverifikasi; pinjaman yang tidak dapat dihitung diberi keterangan.
- Pendaftaran dilakukan di `/pinjaman/nasabah/baru`: cari Data Master terlebih dahulu, pilih individu dan konfirmasi; data rumah tangga ditolak, nasabah existing dikenali, dan penambahan data orang baru memakai formulir Data Master dengan pemeriksaan duplikasi existing.
- Profil memiliki bagian Profil, Pinjaman dan Akses Akun. Daftar pinjaman dan kewajiban sesuai nasabah terpilih; tindakan Buat Pinjaman membawa pilihan ke formulir dan pemeriksaan kewajiban tetap dilakukan server.
- Pembuatan, pemulihan dan penautan akun ditempatkan pada profil admin dengan nama serta ID nasabah; password tidak masuk URL atau penyimpanan browser umum. Status akun dibaca lewat RPC yang memeriksa izin admin. Fungsi penonaktifan akun nasabah terpisah belum tersedia pada alur existing, sehingga tidak ditambahkan tindakan baru.
- Migrasi lokal `144` menambahkan ringkasan kewajiban ke daftar nasabah; `145` menambahkan proyeksi status akun khusus admin. Kedua migrasi telah diterapkan dan dicatat di Supabase lokal, dan perlu diterapkan pada lingkungan tujuan saat deployment.

## Pengujian

- `loan-customer-profile.spec.mjs`: individu existing dan baru, nama sama, rumah tangga, profil, preseleksi, akses petugas dan tampilan ponsel lulus.
- `task3.spec.mjs`: pembuatan akun, pemulihan termasuk kegagalan yang menangguhkan akses dan pemulihan ulang, penautan pengurus, mode nasabah, viewer dan portal lulus.
- `loan-navigation.spec.mjs` dan `task4-6.spec.mjs`: navigasi, role, draft, kontrak, pencairan, pembayaran dan koreksi lulus.
- `loan-navigation-data-local.mjs`: paginasi, kewajiban terverifikasi/tidak lengkap dan pembatasan role lulus. `test:local:sql`: 14 berkas lulus, termasuk hubungan data induk dan pemulihan akun.
- `npm test`: 22 berkas / 64 tes lulus; lint dan build lulus. Build masih memiliki peringatan Browserslist dan impor campuran `export.ts` seperti baseline.
