# Task 3: kontrak data dan verifikasi

11 November 2026. Migrasi `142` dan `143` diterapkan dan dicatat pada Supabase lokal saja, tanpa reset atau perubahan database online. Seluruh RPC baru memeriksa `loan_is_staff()` di server, menolak anon/viewer/nasabah/nonaktif, dan memvalidasi batas halaman serta filter. Fungsi perhitungan internal tidak diberikan langsung kepada klien.

## Kontrak query

| Konteks | Query, batas dan urutan | Cakupan dan data |
|---|---|---|
| Ringkasan | `loan_navigation_overview`, maksimal lima entri untuk setiap pekerjaan | Agregat terverifikasi per hari WIB, jumlah klaim pending saat ini, jumlah data/riwayat tidak lengkap dan contoh pekerjaan. Tidak mengirim seluruh riwayat pembayaran atau formulir. |
| Nasabah | `loan_navigation_customers`, 25/50; `created_at DESC, id DESC`; total dikembalikan bahkan saat halaman kosong | Nama/ID, alamat, status dan ID untuk membedakan nama sama; hanya data yang diizinkan pengurus. Pencarian dan hitungan dilakukan sebelum LIMIT. |
| Pinjaman | `loan_navigation_loans`, 25/50; `created_at DESC, id DESC`; total terpisah | Nomor/nama, pokok, status dan saldo/tunggakan yang dapat diverifikasi; filter nama/nomor, status dan kategori sebelum LIMIT. |
| Riwayat pembayaran | `loan_navigation_payments`, 25/50; `payment_date DESC, id DESC`; total terpisah | Identitas pinjaman, nama, nominal, tanggal, status, metode dan alasan koreksi; filter nama/nomor, status dan periode sebelum LIMIT. Bukti/tanda terima tetap diakses dari rincian sesuai izin. |
| Rincian | Query per ID melalui RLS untuk pinjaman dan relasinya; hanya saat rincian dibuka | Data jadwal, pembayaran dan dokumen untuk pinjaman terpilih; akses dokumen tetap privat. |
| Laporan | `loan_dashboard_report_data`, hanya saat halaman laporan dibuka | Proyeksi existing diperlukan untuk filter historis dan ekspor penuh. Proyeksi ini masih memuat seluruh data laporan; pengurangan lebih lanjut tidak boleh mengubah definisi atau cakupan ekspor. |

Pencarian nama/nomor disimpan pada state riwayat browser, bukan URL. Halaman, ukuran, status, kategori dan tanggal divalidasi sebelum dikirim; perubahan filter mengembalikan halaman ke satu dan halaman di luar rentang menampilkan tindakan kembali. Query memakai abort signal dan kunci yang memisahkan setiap konteks/filter. Mutasi terkait menandai daftar, rincian, antrean, profil, ringkasan dan laporan untuk refetch; pengujian unit memeriksa invalidasi kunci terkait dalam cache dan memastikan data lain tidak ikut ditandai.

Perhitungan hanya menerapkan pembayaran terkonfirmasi sampai tanggal posisi, dan setelah cutoff migrasi jika ada. Jumlah jadwal, snapshot saldo awal, tanggal urut dan kelebihan pembayaran diperiksa; saldo/tunggakan yang tidak dapat diverifikasi menjadi `null`, bukan nol. Agregat memberi keterangan data tidak lengkap. Pending, ditolak, dibatalkan dan pembayaran bertanggal masa depan tidak mengurangi saldo posisi.

## Hasil

- `node tests/loan-navigation-data-local.mjs`: lulus fixture 57 pinjaman, halaman 25/50 dan halaman kosong, dua nama sama, filter, periode, pembayaran berbagai status dan masa depan, jadwal tidak lengkap, akun nonaktif serta akses langsung termasuk viewer yang diberi izin ringkasan.
- `loan-data-navigation.spec.mjs`: lulus pencarian di luar 50 terbaru, halaman, URL tervalidasi, kembali dari rincian, nama tidak masuk URL, dan pemeriksaan bahwa ringkasan tidak memanggil proyeksi seluruh laporan.
- Regresi browser navigasi, akun, transaksi, laporan dan ponsel lulus. `npm.cmd test`: 22 berkas/64 tes lulus; lint dan build lulus dengan peringatan build yang sama seperti baseline. `npm.cmd run test:local:sql`: 14 berkas lulus melalui rollback.

Task 4–8 tetap menyempurnakan profil, tindakan, formulir, laporan dan tampilan. Pengukuran target performa pada dataset 1.000/12.000 melalui API sebenarnya tetap bagian task 9; indeks urutan ditambahkan di migrasi ini, tetapi target performa belum diklaim tercapai.
