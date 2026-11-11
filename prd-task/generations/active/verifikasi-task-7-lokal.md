# Verifikasi task 7 — kontrak dan dokumen pinjaman lokal

Tanggal: 9 November 2026. Implementasi dan migrasi `106`–`111` diterapkan dan diuji pada Supabase lokal. Supabase online tidak diubah.

## Hasil

- Admin dapat membuat versi template; contoh teks awal perlu ditinjau dan dilengkapi pengurus. Preview PDF berlabel DRAFT menggunakan data pinjaman dan penjamin.
- Sebelum mengunggah kontrak, pengurus memilih versi template dan menyatakan telah memeriksa tanda tangannya. Dokumen menyimpan snapshot versi dan teks template, identitas, penjamin, pokok, jadwal, pembuat, pemeriksa, dan waktu. Perubahan berikutnya tidak menimpa arsip; perubahan data kontraktual draft membatalkan kontrak yang tidak lagi sesuai.
- Pengurus dapat membagikan atau menghentikan akses kontrak yang sah kepada nasabah pemilik. Berkas disimpan di bucket privat dan diunduh melalui permintaan terautentikasi yang memeriksa hak pada setiap akses; aplikasi tidak menerbitkan URL publik maupun signed URL.
- Nasabah dapat mengirim satu sampai tiga berkas bukti per klaim. Server memeriksa isi JPG/PNG/PDF dan batas 5 MB per berkas. Bukti tidak otomatis menjadi pembayaran terkonfirmasi.
- Berkas unggahan memiliki catatan staging sebelum dikirim. Berkas yang sudah terhubung ke dokumen tidak masuk pembersihan. Unggahan belum terhubung yang berusia lebih dari satu hari ditandai dan dibersihkan pada unggahan berikutnya; bila tidak ada unggahan berikutnya, berkas tersebut tetap tercatat untuk pemulihan dan belum dibersihkan otomatis. Berkas lama yang tidak tercatat sebagai staging tidak dihapus.
- Tanda terima memiliki nomor dan snapshot tetap; unduhan setelah pembatalan menampilkan DIBATALKAN dengan nomor yang sama. Ringkasan pencairan dan kartu pinjaman/riwayat dapat diunduh sebagai PDF oleh pengurus dan nasabah pemilik. Kontrak historis tanpa dokumen ditandai belum tersedia; fitur impor historis tetap ditunda pada task 5.

## Pengujian

- `npm test`: 54 tes lulus. `npm run build` dan lint terarah file pinjaman lulus.
- `npm run test:local:sql`: 13 fixture PostgreSQL lulus dalam transaksi rollback, termasuk perubahan kontrak dan snapshot.
- `npm run test:task4-6:integration`: uji API/Storage lokal lulus untuk tiga lampiran, batas ukuran/jumlah dan isi palsu, pemeriksaan kontrak, snapshot template dan identitas, pembagian dan pencabutan akses, penolakan akses lintas nasabah, kontrak historis tidak tersedia, serta pemulihan unggahan gagal tanpa menghapus bukti yang terpasang.
- `npm run test:task4-6:browser`: pembuatan draft, preview jadwal, unggahan dan pemeriksaan kontrak, pencairan, pembagian kontrak, tiga bukti nasabah, pengunduhan PDF, pembayaran dan pembatalan lulus. Isi PDF tanda terima setelah pembatalan memuat status DIBATALKAN dan mempertahankan nama/nomor dokumen.
- `npm run test:task3:security`: pengujian keamanan lokal lulus pada 50 tabel/view, termasuk tabel staging baru dan Storage privat.

Seluruh tes API memakai data sintetis yang dibersihkan; SQL fixture di-rollback. Pengujian lokal bukan bukti kesiapan produksi. Sebelum penggunaan operasional, pengurus harus menetapkan redaksi final, penandatangan, dan kebutuhan saksi; penerapan online dan kesiapan rilis tetap berada pada task 9.

## Cara mencoba

Di folder `zakat-fitrah-app`, jalankan Docker dan `npm run supabase:start`, kemudian jalankan `npm run supabase:functions` di terminal yang tetap terbuka. Di terminal lain jalankan `npm run dev`. Masuk sebagai admin, pilih **Pinjaman Jamaah**, lalu buat versi template. Pada draft, pilih versi tersebut, unggah kontrak yang sudah ditandatangani, centang pemeriksaan, dan simpan. Setelah pencairan, gunakan **Bagikan ke nasabah** jika kontrak boleh diakses lewat portal.
