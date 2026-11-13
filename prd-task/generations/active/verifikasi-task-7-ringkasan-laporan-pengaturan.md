# Verifikasi task 7: ringkasan, laporan dan pengaturan

Tanggal: 11 November 2026. Pengujian menggunakan Supabase lokal dan fixture sintetis; tidak ada perubahan data online atau reset database.

## Implementasi

- Ringkasan menampilkan empat angka terverifikasi dengan tanggal posisi dan peringatan data tidak lengkap. Empat kelompok pekerjaan menampilkan maksimal lima entri, jumlah total dan tautan ke antrean atau daftar dengan filter server yang sesuai. Draft dinilai dari persyaratan tersimpan; kategori perhatian dapat saling tumpang tindih dan tidak dijumlahkan sebagai pinjaman unik.
- Migrasi `148` menambah filter server untuk jatuh tempo, tunggakan dan draft belum lengkap sebelum paginasi; daftar biasa tetap menghitung posisi hanya pada halaman yang ditampilkan. Migrasi `149` menyelaraskan hitungan draft ringkasan dengan pemeriksaan kesiapan tersimpan. Kedua migrasi diterapkan dan dicatat hanya pada Supabase lokal.
- Laporan memiliki filter utama dan lanjutan, tombol Terapkan dan Reset, deskripsi filter aktif, cakupan dan waktu pemuatan. Distribusi, tren dan tunggakan menggunakan filter yang diterapkan. CSV dan PDF mengambil kumpulan baris lengkap yang sama untuk jenis laporan yang dipilih; ekspor tidak terbatas pada halaman tampilan dan CSV tetap menetralkan formula.
- Pengaturan menampilkan kebijakan, kolektabilitas dan template sesuai peran, serta pengelolaan izin viewer bagi admin. Petugas melihat informasi yang diizinkan tanpa kontrol admin. Perubahan tetap melalui aturan server existing. Label sumber dana tetap metadata pencairan; tidak ada mutasi kas baru.

## Bukti pengujian

- `node tests/loan-overview-attention-local.mjs`: lulus untuk angka terverifikasi, daftar maksimal lima entri, konsistensi tiga filter perhatian dan batas role.
- `node tests/task8-dashboard-api-local.mjs`: lulus untuk proyeksi, snapshot wilayah, transaksi dan privasi admin/petugas/viewer/nasabah.
- `node tests/loan-collectibility-local.mjs`: lulus untuk aturan kolektabilitas, status, batas DPD dan otorisasi dalam transaksi yang di-rollback.
- `npx playwright test tests/browser/loan-report-settings.spec.mjs tests/browser/task8-dashboard.spec.mjs tests/browser/loan-payment-workflows.spec.mjs`: tiga skenario lulus, termasuk filter, ekspor seluruh 22 baris meskipun tabel dipaginasi, proteksi formula CSV, koreksi historis, hak pengaturan dan regresi pemilihan pinjaman pembayaran.
- `npm test`: 22 berkas dan 64 tes lulus. `npm run lint` dan `npm run build`: lulus.

Migrasi 148 dan 149 perlu diterapkan melalui proses migrasi biasa pada lingkungan lain sebelum filter baru digunakan. Audit visual dan aksesibilitas menyeluruh serta pengujian performa tetap menjadi cakupan task 8 dan 9.
