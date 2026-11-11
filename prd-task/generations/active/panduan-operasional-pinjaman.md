# Panduan operasional dan dukungan pinjaman

Panduan ini menjelaskan alur yang telah disiapkan pada **lingkungan lokal**, bukan persetujuan penggunaan produksi. Sebelum operasional, pengurus perlu menetapkan teks kontrak, penandatangan/saksi, sumber dana, penanggung jawab dan prosedur dukungan; penerapan online dan pengujian pemulihan lengkap masih memerlukan rencana rilis tersendiri.

## Menjalankan lingkungan lokal

Jalankan Docker Desktop. Buka PowerShell pada folder aplikasi, lalu jalankan `npm run supabase:start` dan `npm run supabase:functions`. Biarkan terminal fungsi terbuka. Pada terminal lain di folder yang sama jalankan `npm run dev` dan buka alamat yang ditampilkan. Pembuatan akun, unggahan dan pemulihan memakai fungsi lokal.

Jangan menjalankan `supabase db reset` pada database yang berisi data pengguna. Jangan menggunakan `--remote` atau melakukan penyelarasan riwayat migrasi online tanpa rencana yang diuji pada salinan representatif. Proyek online memiliki riwayat dan konfigurasi bucket yang berbeda dari lokal.

## Identitas dan akses

1. Cari orang pada data induk. Pastikan identitas individu benar; nama dan nomor telepon yang sama tidak membuktikan dua catatan orang itu sama. Verifikasi individu dan daftarkan sebagai nasabah.
2. Admin membuat akun memakai email unik dan password awal melalui form akun nasabah. Sampaikan password melalui saluran pribadi; jangan menuliskannya pada catatan, audit, chat dukungan, atau tiket. Nomor telepon profil dapat dipakai anggota keluarga bersama.
3. Pengurus yang juga nasabah ditautkan admin setelah memastikan identitas, kemudian dapat mengganti mode pengurus/nasabah pada aplikasi. Mode nasabah hanya untuk pinjaman sendiri.
4. Jika akses hilang, admin memverifikasi identitas sebelum menggunakan pemulihan email/password. Perubahan mencabut sesi lama. Nasabah masuk kembali dengan kredensial baru. Jika pemulihan terputus dan akun tetap tertangguh, ikuti bagian pemulihan terputus pada [verifikasi task 3](verifikasi-task-3-lokal.md); jangan membuka penangguhan langsung tanpa memastikan perubahan kredensial selesai.

## Kontrak, pencairan, pembayaran dan koreksi

1. Admin menyimpan versi template yang sudah ditetapkan pengurus. Buat draft dengan tujuan, pokok, petugas, tanggal rencana, dan jadwal. Tinjau nominal dan tanggal angsuran.
2. Pilih versi template dan unduh preview DRAFT. Setelah kontrak ditandatangani para pihak, pilih tanggal pencairan, unggah dokumen, centang bahwa tanda tangan sudah diperiksa, dan simpan. Pengurus dapat membagikan kontrak ke nasabah pemilik. Jika data kontraktual draft berubah, periksa kembali keabsahannya dan unggah kontrak bertanda tangan yang sesuai; arsip lama tidak ditimpa.
3. Catat pencairan dengan tanggal, metode dan label sumber dana; lampirkan bukti pencairan bila tersedia. Pencairan ditahan jika masih ada kewajiban bersaldo positif atau kontrak yang sesuai belum tersedia. Label dana adalah metadata: pencatatan pinjaman tidak otomatis mengubah kas, rekening, zakat, atau infak. Jika pencairan sudah tercatat tetapi unggahan bukti gagal, gunakan tombol ulangi unggah atau tambahkan bukti pada rincian pinjaman; jangan mencatat pencairan lagi.
4. Catat pembayaran tunai/transfer yang diterima. Nasabah dapat mengirim satu sampai tiga bukti transfer (JPG, PNG, atau PDF; maksimal 5 MB masing-masing). Pengurus memeriksa dan mengonfirmasi atau menolak dengan alasan. Klaim yang menunggu atau ditolak tidak mengurangi saldo. Unduh tanda terima jika diperlukan; bagikan melalui perangkat secara manual.
5. Jika pencatatan pembayaran salah, admin/petugas membatalkan pembayaran terkonfirmasi dengan alasan, lalu mencatat transaksi pengganti jika diperlukan. Nomor tanda terima lama tetap ditelusuri dan unduhan berikutnya bertanda dibatalkan. Jangan menghapus orang, berkas, atau audit sebagai cara koreksi.
6. Jika pembatalan menghidupkan kembali utang lama ketika ada pinjaman lain, kedua kewajiban tetap terlihat. Tidak ada pencairan tambahan sampai kewajiban yang bersaldo positif diselesaikan. Segera cocokkan kondisi ini bersama pengurus.

## Dokumen dan gangguan unggahan

Kontrak dan bukti yang tercatat disimpan privat; akses memerlukan sesi dan hak yang sesuai. File sementara yang belum pernah terhubung ke dokumen dicatat pada staging. Jika lebih dari satu hari belum terhubung, pembersihan dicoba saat ada unggahan berikutnya; jika tidak ada unggahan lagi, status staging tetap tercatat dan belum dibersihkan otomatis. Jangan menghapus file yang sudah terhubung untuk menangani kegagalan unggah.

Jika unggahan gagal, periksa koneksi, ukuran, isi berkas dan status transaksi. Ulangi operasi dari form yang sama. Untuk bukti pembayaran pengurus, periksa apakah pembayaran sudah terkonfirmasi terlebih dahulu: jika ya, gunakan tombol ulangi unggah bukti, bukan mencatat pembayaran baru. Jika masalah berlanjut, catat waktu, ID pinjaman, status, dan pesan kesalahan tanpa password, token, atau isi dokumen; teruskan kepada pengelola teknis.

## Dashboard dan laporan

Dashboard memisahkan rentang transaksi dari tanggal posisi saldo. Pilih filter sebelum mengunduh CSV atau PDF. Angka merupakan catatan pinjaman, bukan saldo kas. Koreksi dapat mengubah laporan periode lampau; data historis yang tidak lengkap ditandai. Dari antrean pembayaran pengurus dapat membuka seluruh bukti dan rincian pinjaman. Teks pengingat dapat disiapkan untuk dikirim secara manual; sistem tidak mengirim pesan otomatis.

Kolektabilitas awalnya nonaktif. Pengurus dapat mengaktifkannya setelah menetapkan rentang yang disetujui; status dihitung dari tanggal keterlambatan dan saldo, bukan skor kredit eksternal. Sebelum operasional, uji performa pada skala data yang ditetapkan PRD dan periksa kebutuhan paginasi atau agregasi server.

## Backup, pemulihan dan migrasi

Jadwalkan backup database **dan isi objek Storage**; backup SQL saja tidak memuat bytes berkas. Simpan terenkripsi dan batasi akses, serta tetapkan pemilik, frekuensi, retensi, target kehilangan data dan target pemulihan. Lakukan dan dokumentasikan restore pada lingkungan terisolasi, termasuk skema, data, relasi, RLS/hak, Auth, metadata dan sampel objek; cocokkan jumlah, total, audit dan checksum. Bukti uji sintetis sebagian tidak membuktikan restore lengkap atau backup produksi. Lihat [rencana backup dan migrasi](tinjauan-fondasi-dan-rencana-migrasi.md) dan [matriks hasil lokal](matriks-hasil-task-9-lokal.md).

Tidak ada impor pinjaman historis yang diperlukan untuk peluncuran awal menurut klarifikasi pengguna; task 5 ditunda. Jika kebutuhan muncul, tentukan sumber, identitas, cut-off dan penanggung jawab, gunakan alur impor serta rekonsiliasi setelah fitur itu dibangun, dan jangan menciptakan transaksi, kontrak atau tanggal historis fiktif.

Sebelum perubahan online, cocokkan riwayat migrasi dan definisi skema aktual, backup, uji restore dan latihan migrasi pada salinan yang aman. Jika terjadi gangguan, hentikan akses/operasi baru, amankan bukti dan audit, catat cut-off, lalu pilih perbaikan aditif atau pemulihan terisolasi setelah rekonsiliasi. Jangan mereset atau menghapus data secara otomatis.
