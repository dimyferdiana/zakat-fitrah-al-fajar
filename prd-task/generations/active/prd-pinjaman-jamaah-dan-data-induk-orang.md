# PRD: Pinjaman Jamaah dan Data Induk Orang Lintas Program

> **Perubahan keputusan akses — 8 November 2026:** Untuk tahap sekarang, nasabah masuk menggunakan **email dan password**; akun nasabah dibuatkan oleh **admin**. Kebutuhan OTP email/SMS dan penyedia SMS pada dokumen versi 1.1 ditunda ke tahap berikutnya. Instruksi ini menggantikan bagian OTP yang bertentangan, termasuk FR-083–FR-086 dan AC-31–AC-32; pembatasan akses data dan aktivasi oleh admin tetap wajib.

> **Perubahan kebijakan — 8 November 2026:** Saat ini tidak ada batas minimum/maksimum nominal atau tenor, dan tidak ada kondisi yang mewajibkan penjamin. Pengaturan batas dan penjamin dapat disiapkan untuk masa depan, tetapi tidak boleh memblokir pencairan karena belum dikonfigurasi. Pokok tetap harus positif, jadwal valid, satu pinjaman aktif, dan kontrak bertanda tangan wajib.
>
> **Klarifikasi data pinjaman lama — 8 November 2026:** Pengguna menyatakan belum ada data pinjaman sebelumnya yang perlu dimigrasikan. Identifikasi sumber, referensi, cut-off, dan rekonsiliasi pinjaman lama tidak berlaku untuk peluncuran awal; fitur impor pinjaman historis pada FR-080 dan FR-087–FR-092 serta pengujiannya ditunda untuk kebutuhan mendatang. Ini menggantikan pernyataan sebelumnya bahwa pinjaman berjalan wajib dimigrasikan. Data induk jamaah dan transaksi zakat/qurban yang sudah ada tetap harus dipertahankan dan dilindungi.

## Kontrol Dokumen

| Atribut | Nilai |
|---|---|
| Nama fitur | Pinjaman Jamaah dan Data Induk Orang |
| Tanggal dibuat / diperbarui | 26 Oktober 2026 / 8 November 2026 |
| Versi dokumen | 1.1; bukan nomor rilis aplikasi |
| Status | Draft lengkap untuk review kebutuhan; keputusan utama sudah dikonfirmasi |
| Lokasi | `prd-task/generations/active/` sesuai permintaan pengguna |
| Panduan | `prd-task/create-prd.md` |
| Cakupan pekerjaan ini | Penyusunan PRD, tanpa implementasi aplikasi atau migrasi database |

### Keputusan yang Sudah Dikonfirmasi

1. Nasabah mengembalikan **pokok pinjaman saja**, tanpa bunga dan tanpa biaya administrasi.
2. Aplikasi digunakan **pengurus dan jamaah**. Jamaah dapat masuk untuk melihat pinjamannya dan mengirim bukti pembayaran.
3. **Pencatatan langsung** oleh petugas berwenang, tanpa persetujuan pinjaman berjenjang. Verifikasi pembayaran tetap diperlukan.
4. Tahap awal merupakan **pencatatan terpisah dari kas/rekening**. Pencairan dan pembayaran tidak otomatis mengubah saldo atau membuat entri ledger aplikasi saat ini.
5. Tidak ada data pinjaman lama yang perlu dimigrasikan untuk peluncuran awal. Satu nasabah hanya boleh memiliki satu pinjaman aktif.
6. Kontrak bertanda tangan **wajib sebelum pencairan baru**. Seluruh pengguna dengan role `admin` dan `petugas` dapat mencairkan, memverifikasi, serta membatalkan pembayaran dengan alasan.
7. Jamaah masuk menggunakan **email dan password** melalui akun yang dibuat oleh admin; OTP dan SMS ditunda.
8. Kolektabilitas pada awalnya **nonaktif**. Sumber dana wajib dicatat sebagai label metadata, tanpa penarikan dana otomatis dari zakat/infak.
9. Pengurus menyiapkan redaksi kontrak; aplikasi menyediakan template, preview, dan arsip versi. Saat ini tidak ada batas nominal/tenor atau kewajiban penjamin; pengaturan opsional disiapkan untuk masa depan.
10. Identitas, bukti, kontrak, dan audit **tidak dihapus**; perubahan dan pembatalan tetap mempertahankan riwayat.

### Asumsi Produk untuk Draft Ini

Asumsi berikut merupakan usulan agar kebutuhan dapat diimplementasikan secara jelas, bukan keputusan tambahan dari pengguna. Perubahan asumsi harus memperbarui aturan dan kriteria penerimaan yang terdampak.

- Program berlaku untuk satu organisasi Masjid Al-Fajar; semua nominal menggunakan rupiah bulat.
- Pengurus membuat pinjaman; jamaah belum mengajukan pinjaman sendiri melalui portal.
- Satu pinjaman dicairkan satu kali sebesar seluruh pokok. Pencairan bertahap dan penambahan pokok menggunakan pengembangan berikutnya.
- Kolektabilitas dapat diaktifkan admin kemudian; keterlambatan dan sisa tagihan tetap dihitung walaupun fitur dimatikan. Batas DPD contoh belum disetujui sebagai kebijakan.
- Bukti pembayaran dapat diunduh atau dibagikan secara manual. Pengiriman otomatis melalui WhatsApp/email belum termasuk MVP.

## 1. Introduction / Overview

Masjid mempunyai program bantuan pinjaman bagi jamaah. Pengurus membutuhkan pencatatan nasabah, penggunaan dana, tenor, jadwal angsuran, pencairan, pembayaran, tunggakan, bukti transaksi, dan dokumen perjanjian. Jamaah membutuhkan akses pribadi untuk mengetahui kewajiban dan mengirim bukti pembayaran tanpa harus menanyakan saldo kepada pengurus.

Program ini juga membutuhkan dasar data orang yang konsisten. Orang yang sama dapat menjadi nasabah pinjaman, pembayar zakat fitrah atau maal, pemberi infak, peserta qurban, maupun penerima bantuan. Identitas orang harus menjadi data induk bersama; keikutsertaan dan transaksi disimpan dalam masing-masing program.

Produk terdiri atas dua bagian yang saling bergantung:

1. **Data Induk Jamaah/Orang**, melanjutkan Data Master yang ada dengan identitas stabil dan relasi lintas program.
2. **Modul Pinjaman Jamaah**, meliputi operasional pengurus dan portal nasabah dalam aplikasi yang sama.

Istilah **nasabah** berarti orang yang mengikuti program pinjaman, bukan jenis identitas baru dan bukan akun login pengurus. Nilai pencairan dan pengembalian dalam modul ini merupakan catatan operasional; kesesuaiannya dengan uang aktual diperiksa pengurus di luar integrasi ledger MVP.

### 1.1 Konteks Aplikasi yang Sudah Ada

Temuan berikut berasal dari source dan migrasi dalam repository, bukan hasil pemeriksaan database produksi:

| Area | Kondisi yang ditemukan | Implikasi kebutuhan |
|---|---|---|
| Data warga | Tabel `muzakki` digunakan Data Master, zakat, pencarian donor, dan peserta qurban; kolom nama masih `nama_kk` | Lanjutkan identitas dan UUID yang sama; jangan membuat tabel nasabah berisi salinan identitas |
| Atribut orang | Migrasi 040 menambah NIK, RT/RW, jenis kelamin, tanggal lahir, dan `user_id` | Gunakan fondasi ini; keterhubungan ke login belum berarti hak akses nasabah sudah tersedia |
| Granularitas | Data lama memakai nama kepala keluarga dan transaksi zakat memiliki jumlah jiwa | Jangan menganggap semua baris lama sudah mewakili individu yang terverifikasi |
| Mustahik | Masih mempunyai tabel identitas terpisah | Hubungkan ke data induk melalui pemetaan yang diverifikasi; hindari pencocokan otomatis berdasarkan nama |
| Riwayat bersama | Panel warga sudah menampilkan zakat fitrah dan qurban | Tambahkan pinjaman dan riwayat program lain yang mempunyai relasi identitas valid |
| Login | Role yang ada: `admin`, `petugas`, `viewer`; login pengurus memakai email dan kata sandi | Portal nasabah memerlukan akun email/password yang dibuat admin dan otorisasi terpisah |
| Keuangan | Sudah ada `accounts` dan `account_ledger_entries` | Jangan melakukan posting dari modul pinjaman pada MVP; simpan referensi metode pembayaran saja |
| Navigasi | App switcher memuat zakat, qurban, dan Data Master | Tambahkan Pinjaman Jamaah dengan pola navigasi yang sama |

## 2. Goals

1. Semua nasabah pinjaman merujuk satu identitas orang yang stabil dan dapat dipakai lintas program.
2. Pengurus dapat mencatat satu pinjaman, meninjau jadwal, dan mencatat pencairan tanpa persetujuan berjenjang.
3. Setiap pinjaman menampilkan pokok, nominal pembayaran terkonfirmasi, sisa pokok, jumlah transaksi bayar, angsuran lunas, dan tunggakan yang dapat dijelaskan dari detail transaksi.
4. Jamaah dapat mengakses data pinjamannya sendiri dan mengirim bukti pembayaran untuk diverifikasi pengurus.
5. Tersedia dashboard distribusi pinjaman dan pemantauan pembayaran dengan angka yang sama dengan laporan detail.
6. Seluruh pencairan, konfirmasi pembayaran, pembatalan pembayaran, dan penerbitan dokumen dapat ditelusuri pelaku serta waktunya.
7. Seluruh alur pinjaman MVP berjalan tanpa menambah atau mengubah entri saldo kas/rekening yang ada.

## 3. User Stories

| ID | Sebagai | Saya ingin | Agar |
|---|---|---|---|
| US-01 | Admin data | Memilih jamaah dari data induk atau menambahkan individu yang belum terdaftar | Identitas yang sama digunakan berbagai program |
| US-02 | Petugas pinjaman | Mencatat tujuan, pokok, tenor, dan pola jadwal | Kewajiban nasabah jelas sejak awal |
| US-03 | Petugas berwenang | Mencatat pencairan langsung | Pinjaman aktif tanpa antrean persetujuan berjenjang |
| US-04 | Pengurus | Melihat jumlah pembayaran dan sisa hutang setiap nasabah | Saya dapat menjawab pertanyaan dan menindaklanjuti tunggakan |
| US-05 | Nasabah | Melihat jadwal, saldo, dan riwayat pinjaman sendiri | Saya mengetahui jumlah serta tanggal pembayaran berikutnya |
| US-06 | Nasabah | Mengirim bukti transfer dengan nominal dan tanggal | Pembayaran dapat diperiksa pengurus |
| US-07 | Petugas verifikasi | Mengonfirmasi atau menolak laporan pembayaran | Saldo hanya berubah atas pembayaran yang valid |
| US-08 | Nasabah/petugas | Mengunduh tanda terima pembayaran terkonfirmasi | Ada bukti pencatatan yang dapat disimpan |
| US-09 | Pengurus | Melihat sebaran pinjaman per kategori, orang, dan wilayah | Program dapat dievaluasi dan dijalankan secara merata |
| US-10 | Admin | Meninjau draft kontrak dan menyimpan versi yang disepakati | Perubahan data tidak mengubah dokumen historis |
| US-11 | Pengurus | Melihat indikator keterlambatan dan riwayat tindak lanjut | Penagihan mempunyai acuan yang konsisten |
| US-12 | Admin atau petugas | Membatalkan transaksi salah dengan alasan dan jejak audit | Koreksi tidak menghilangkan bukti pencatatan sebelumnya |
| US-13 (ditunda) | Petugas | Mengimpor pinjaman yang sudah berjalan dan memeriksa saldo awal jika diperlukan kemudian | Riwayat dan kewajiban yang ada dapat diteruskan |
| US-14 | Nasabah | Masuk dengan email dan password pada akun yang dibuat admin | Saya dapat mengakses pinjaman sendiri |
| US-15 | Pengurus | Menentukan batas pinjaman, tenor, penjamin, dan pengecualian | Pencairan mengikuti kebijakan program |

## 4. Functional Requirements

Semua kebutuhan **P0** wajib untuk MVP. **P1** merupakan pengembangan setelah MVP, kecuali fitur kolektabilitas opsional yang tetap disediakan pada MVP di balik pengaturan admin.

### 4.1 Data Induk Orang dan Keikutsertaan Program — P0

- **FR-001.** Sistem harus menampilkan identitas bersama dengan istilah **Jamaah / Data Orang** pada area Data Master yang terdampak. Muzakki, mustahik, donor, dan nasabah merupakan konteks keikutsertaan, bukan label eksklusif untuk orang tersebut.
- **FR-002.** Sistem harus mempertahankan UUID data `muzakki` yang sudah digunakan transaksi. Pada MVP, tabel ini menjadi fondasi data orang bersama dengan penambahan atribut yang diperlukan; penggantian nama tabel secara menyeluruh tidak diwajibkan.
- **FR-003.** Sistem harus membedakan baris **individu**, **kepala keluarga/rumah tangga**, dan **belum diverifikasi**. Baris lama tidak boleh otomatis diperlakukan sebagai individu hanya karena mempunyai nama. Nasabah harus merujuk baris individu yang telah diverifikasi petugas.
- **FR-004.** Jika data lama benar-benar mewakili individu kepala keluarga, petugas dapat mengonfirmasinya sebagai individu sambil mempertahankan ID lama. Jika baris mewakili rumah tangga, buat individu anggotanya sebagai identitas terpisah dan simpan hubungan ke rumah tangga sumber. Jangan memindahkan transaksi rumah tangga ke anggota secara otomatis.
- **FR-005.** Identitas individu minimal memuat ID, nama lengkap, alamat, RT/RW bila tersedia, telepon/WhatsApp opsional, NIK opsional, tanggal lahir opsional, jenis kelamin opsional, catatan umum, dan status aktif. Tambahkan nama lengkap kanonis dengan lapisan kompatibilitas untuk `nama_kk`; hindari mengubah arti data historis.
- **FR-006.** Nama saja tidak boleh menjadi kunci pencocokan orang. NIK yang diisi harus valid 16 digit dan unik; tanpa NIK, pencarian nama, telepon, serta alamat harus ditampilkan untuk ditinjau petugas. Nomor telepon boleh dipakai beberapa anggota keluarga.
- **FR-007.** Pemilihan nasabah harus mencari data induk terlebih dahulu. Tambah orang dari form pinjaman harus menyimpan ke sumber data induk yang sama, kemudian membuat keikutsertaan nasabah. Data nasabah hanya berisi atribut khusus program.
- **FR-008.** Sistem harus mendukung satu orang mengikuti banyak program tanpa otomatis menganggap orang tersebut pembayar zakat, mustahik, atau nasabah hanya karena identitasnya tersimpan. Keikutsertaan disimpulkan dari relasi program yang sah.
- **FR-009.** Detail orang harus menyediakan riwayat program yang telah terhubung melalui ID, termasuk pinjaman. Ringkasan zakat/infak/maal harus mengikuti jenis transaksi aktual; jangan membangun riwayat melalui kesamaan nama. Riwayat sensitif pinjaman hanya ditampilkan kepada pengguna yang berhak.
- **FR-010.** Untuk mustahik yang masih terpisah, sistem harus menyediakan pemetaan ke orang kanonis yang diverifikasi petugas, termasuk status belum dipetakan. Tambahkan relasi tanpa mengganti ID mustahik atau merusak transaksi distribusi. Seluruh record lama tetap dapat dibaca selama transisi.
- **FR-011.** Orang dengan relasi program atau transaksi tidak boleh dihapus permanen melalui aplikasi. Penonaktifan mempertahankan riwayat dan tetap mengizinkan penyelesaian pinjaman berjalan, tetapi memblokir pembuatan pinjaman baru.
- **FR-012.** Perubahan alamat/telepon memperbarui profil terkini, tetapi tidak mengubah identitas pada kontrak dan bukti transaksi yang sudah diterbitkan. Simpan snapshot identitas pada dokumen dan wilayah saat pencairan untuk laporan historis.

### 4.2 Akses Pengurus dan Portal Nasabah — P0

- **FR-013.** Semua pengguna aktif dengan role `admin` atau `petugas` yang ada harus memiliki hak operasional modul pinjaman, termasuk pencairan, verifikasi, dan pembatalan pembayaran; jangan mensyaratkan hak pinjaman tambahan bagi kedua role tersebut. Role `viewer` memerlukan izin baca program yang eksplisit; akun nasabah tidak memperoleh hak pengurus.
- **FR-014.** Admin harus dapat membuat akun nasabah email/password dan menautkannya ke satu orang terverifikasi. Nasabah tidak dapat mengubah sendiri ID orang yang diwakilinya dan tidak memperoleh role pengurus.
- **FR-015.** Satu akun nasabah hanya boleh mewakili satu individu dan satu individu hanya mempunyai satu tautan akun nasabah aktif. Pengurus yang juga nasabah dapat mempunyai kedua kemampuan; mode nasabah tetap membatasi data pada dirinya sendiri.
- **FR-016.** Portal nasabah harus menampilkan pinjaman sendiri, jadwal, pembayaran, status verifikasi bukti, tanda terima, dan kontrak final miliknya. Nasabah tidak boleh melihat direktori orang, data pinjaman orang lain, catatan pengurus internal, atau laporan distribusi bernama.
- **FR-017.** Pembatasan berlaku pada database/API, Storage, ekspor, dan akses langsung URL/ID dokumen; menyembunyikan menu saja tidak cukup. Akun nonaktif harus kehilangan akses baru pada semua jalur tersebut.
- **FR-018.** Pengubahan identitas inti oleh nasabah belum termasuk MVP. Nasabah dapat melihat kontak petugas untuk meminta koreksi. Tidak tersedia pendaftaran publik yang langsung memberikan akses ke data jamaah. Ketentuan akun email/password tercantum pada FR-083–FR-086.

Matriks kemampuan minimum:

| Aksi | Admin program | Petugas pinjaman berwenang | Pengawas dengan izin baca | Nasabah |
|---|---|---|---|---|
| Kelola izin, kategori, template | Ya | Tidak | Tidak | Tidak |
| Buat draft dan catat pencairan langsung | Ya | Ya | Tidak | Tidak |
| Catat/verifikasi pembayaran | Ya | Ya | Tidak | Kirim klaim milik sendiri |
| Batalkan pembayaran terkonfirmasi | Ya, alasan wajib | Ya, alasan wajib | Tidak | Tidak |
| Lihat detail semua pinjaman | Ya | Ya | Ya | Hanya milik sendiri |
| Lihat catatan tindak lanjut internal | Ya | Ya | Sesuai izin eksplisit | Tidak |
| Unduh dokumen nasabah | Ya | Ya | Sesuai izin baca dokumen | Hanya milik sendiri |

Petugas pada matriks berarti **seluruh** pengguna aktif role `petugas`; admin program berarti seluruh pengguna aktif role `admin`. Pengawas tidak memperoleh akses hanya karena memiliki role `viewer` saat ini. Pengelolaan izin baca pengawas dilakukan admin melalui otorisasi server.

### 4.3 Pengaturan Program dan Pembuatan Pinjaman — P0

- **FR-019.** Sistem harus menyediakan master kategori tujuan, misalnya modal usaha, pendidikan, kesehatan, kebutuhan mendesak, dan lainnya. Kategori dapat ditambah atau dinonaktifkan; kategori yang sudah dipakai tidak dapat dihapus sehingga merusak riwayat.
- **FR-020.** Pengurus harus dapat membuat draft dengan nasabah, kategori, uraian penggunaan, nominal pokok, rencana tanggal pencairan, jadwal, catatan, dan petugas penanggung jawab. Nama/ID pinjaman harus unik dan stabil.
- **FR-021.** Nominal pokok harus rupiah bulat lebih besar dari nol. Tidak boleh ada bunga, biaya administrasi, denda keterlambatan, atau kewajiban donasi tambahan pada perhitungan pinjaman ini.
- **FR-022.** Sistem harus mendukung jadwal mingguan, bulanan, dan tanggal khusus. Form harus menampilkan jumlah angsuran, tanggal angsuran pertama, tanggal terakhir, serta tenor yang dapat dipahami sebelum disimpan.
- **FR-023.** Sistem harus memblokir pencairan pinjaman baru jika nasabah masih mempunyai pinjaman bersisa pokok positif. Tampilkan nomor pinjaman dan saldo terkait; draft dapat disimpan untuk dilanjutkan setelah pinjaman lama lunas.
- **FR-024.** Sistem harus menyimpan referensi sumber dana program atau label dana pinjaman yang diwajibkan saat pencairan. Ini merupakan metadata, bukan persetujuan penggunaan dana dari program lain. Kelayakan sumber dana ditentukan pengurus di luar aplikasi.

### 4.4 Tenor dan Jadwal Angsuran — P0

- **FR-025.** Jadwal mingguan harus memakai jumlah angsuran positif dan tanggal jatuh tempo pertama. Angsuran berikutnya berselisih tujuh hari kalender. Contoh: empat kali mulai 6 November berarti 6, 13, 20, dan 27 November.
- **FR-026.** Jadwal bulanan harus memakai jumlah angsuran positif dan tanggal pertama sebagai acuan hari. Jika hari tidak tersedia pada bulan berikutnya, gunakan hari terakhir bulan itu tanpa menggeser acuan bulan selanjutnya. Contoh: 31 Januari 2027, 28 Februari 2027, 31 Maret 2027.
- **FR-027.** Jadwal tanggal khusus harus memungkinkan petugas mengisi tanggal dan nominal setiap angsuran. Tanggal harus unik, berurutan, dan sama atau setelah tanggal pencairan aktual. Nominal tiap baris harus positif dan jumlahnya tepat sama dengan pokok.
- **FR-028.** Pembagian otomatis harus menghasilkan rupiah bulat. Angsuran awal memakai pembulatan ke bawah dan sisa pembulatan ditambahkan pada angsuran terakhir. Contoh Rp1.000.000 / 3 menjadi Rp333.333, Rp333.333, dan Rp333.334. Blokir jumlah angsuran yang menghasilkan nominal nol.
- **FR-029.** Tenor jadwal rutin harus ditampilkan sebagai jumlah periode beserta rentang tanggal pencairan sampai jatuh tempo terakhir. Jadwal khusus menampilkan jumlah angsuran dan durasi kalender dari pencairan hingga tanggal terakhir. Jangan menyamakan jumlah transaksi pembayaran dengan panjang tenor.
- **FR-030.** Pengurus harus dapat meninjau serta mengedit jadwal dalam draft. Perubahan tanggal pencairan aktual harus memicu validasi ulang dan preview jadwal sebelum konfirmasi. Jadwal dikunci setelah pencairan; perubahan berikutnya menggunakan alur restrukturisasi pada P1.

### 4.5 Pencairan dan Status Pinjaman — P0

- **FR-031.** Petugas atau admin harus dapat mencatat pencairan langsung dari draft tanpa persetujuan orang kedua, setelah pemeriksaan kontrak bertanda tangan serta kebijakan pada FR-056 dan FR-093–FR-096. Form konfirmasi harus memuat tanggal pencairan aktual, nominal sama dengan pokok, metode tunai/transfer/lainnya, referensi transaksi opsional, label sumber dana, dan bukti opsional. Tanggal pencairan aktual tidak boleh melewati hari ini di Asia/Jakarta; tanggal rencana dalam draft boleh berada di masa depan.
- **FR-032.** Setelah konfirmasi pencairan berhasil, pinjaman menjadi `aktif` dan kewajiban pembayaran mulai berlaku. Pencatatan harus atomik sehingga kegagalan sebagian tidak meninggalkan pinjaman aktif tanpa pencairan.
- **FR-033.** Status minimum: `draft`, `aktif`, `lunas`, dan `dibatalkan`. Keterlambatan/kolektabilitas merupakan indikator terpisah, bukan pengganti status kontrak. Tidak ada status persetujuan pinjaman berjenjang pada MVP.
- **FR-034.** Draft dapat dibatalkan dengan alasan tanpa memunculkan piutang atau catatan kas. Pinjaman yang sudah dicairkan tidak dapat dibatalkan untuk menghapus hutang. Kesalahan pencairan harus ditandai untuk penanganan admin; koreksi pencairan aktif yang mengubah pokok berada di luar MVP.
- **FR-035.** Sistem harus menyatakan dengan jelas bahwa pencairan dan pengembalian hanya dicatat pada modul pinjaman, tidak memindahkan uang dan tidak mengubah ledger kas/rekening. Pilihan rekening, jika dipakai sebagai referensi, tidak boleh memanggil posting otomatis.

### 4.6 Pembayaran, Alokasi, dan Perhitungan Saldo — P0

- **FR-036.** Pengurus harus dapat mencatat pembayaran tunai atau transfer dengan pinjaman, tanggal pembayaran aktual, nominal, metode, referensi opsional, lampiran, dan catatan. Pengurus dapat langsung mengonfirmasi penerimaan yang telah diperiksa dalam satu alur.
- **FR-037.** Portal harus memungkinkan nasabah mengirim laporan pembayaran untuk pinjaman aktif miliknya: tanggal, nominal, metode transfer, referensi opsional, catatan, dan lampiran bukti wajib. Nasabah tidak dapat mengonfirmasi pembayaran sendiri.
- **FR-038.** Laporan pembayaran nasabah harus mempunyai status `menunggu_verifikasi`, `terkonfirmasi`, `ditolak`, atau `dibatalkan`. Penolakan/pembatalan harus menyimpan alasan. Laporan menunggu, ditolak, dan dibatalkan tidak mengurangi hutang atau melunasi jadwal.
- **FR-039.** Verifikasi harus menampilkan lampiran, nominal, tanggal, dan indikasi duplikasi sebelum petugas mengonfirmasi. Sistem harus mencatat pengirim laporan, pemeriksa, waktu konfirmasi, tanggal bayar efektif, dan waktu input sebenarnya secara terpisah.
- **FR-040.** Sistem harus mendukung pembayaran sebagian angsuran, beberapa angsuran sekaligus, dan pelunasan lebih awal tanpa biaya. Alokasikan pembayaran secara otomatis ke angsuran belum lunas yang paling awal, lalu angsuran berikutnya. Tidak tersedia alokasi bebas pada MVP.
- **FR-041.** Nominal pembayaran harus positif dan tidak melebihi sisa pokok saat konfirmasi. Tolak kelebihan dengan penjelasan; jangan otomatis mengubahnya menjadi infak atau saldo titipan. Beberapa klaim menunggu boleh ada, tetapi konfirmasi harus memeriksa ulang saldo secara atomik.
- **FR-042.** Tanggal pembayaran tidak boleh sebelum pencairan atau melebihi tanggal hari ini di Asia/Jakarta. Input terlambat dengan tanggal lampau diperbolehkan dan tetap menyimpan waktu input serta verifikator untuk audit. Untuk pinjaman migrasi dengan tanggal pencairan tidak diketahui, pembayaran operasional harus setelah cut-off migrasi; tanggal pencairan tetap ditandai tidak diketahui.
- **FR-043.** Sistem harus menampilkan dua ukuran berbeda: **jumlah transaksi pembayaran terkonfirmasi** dan **jumlah angsuran lunas / total angsuran**. Pembayaran Rp250.000 terhadap angsuran Rp500.000 berarti satu transaksi bayar, tetapi nol angsuran lunas. Untuk migrasi dengan rincian historis tidak lengkap, tampilkan jumlah transaksi yang diketahui dan keterangan riwayat tidak lengkap; jangan menganggap agregat saldo awal sebagai satu transaksi.
- **FR-044.** Untuk pinjaman baru, saldo dihitung dari pokok dan transaksi terkonfirmasi yang belum dibatalkan. Pinjaman migrasi menggunakan saldo awal dan transaksi efektif sesudah cut-off sesuai FR-088–FR-092. Saldo tidak dihitung dari jumlah berkas bukti atau nilai yang dapat diedit bebas. Pinjaman otomatis `lunas` jika sisa pokok nol.
- **FR-045.** Admin dan petugas harus dapat membatalkan pembayaran terkonfirmasi dengan alasan. Data dan tanda terima lama tetap tersimpan sebagai dibatalkan. Sistem menghitung ulang alokasi, saldo, keterlambatan, dan status; jika sebelumnya lunas, pinjaman kembali aktif. Koreksi nilai dilakukan melalui pembatalan lalu pencatatan pengganti. Jika nasabah telanjur memiliki pinjaman baru, pemulihan kewajiban lama tetap dilakukan dan ditandai sebagai pengecualian akibat koreksi; larang pencairan tambahan sampai seluruh kewajiban aktif diselesaikan. Batas satu pinjaman tidak boleh menghalangi pemulihan saldo yang benar.
- **FR-046.** Konfirmasi ganda, klik berulang, retry jaringan, atau dua petugas bersamaan tidak boleh menghasilkan pembayaran/alokasi ganda atau saldo negatif. Klaim yang mirip harus ditandai untuk ditinjau, bukan otomatis dianggap sama hanya berdasarkan tanggal dan nominal.

#### 4.6.1 Definisi Perhitungan

Untuk tanggal acuan `T` dalam Asia/Jakarta:

| Ukuran | Definisi |
|---|---|
| Pokok dicairkan | Nominal pencairan aktual pinjaman yang sudah aktif |
| Pembayaran efektif sampai T | Total pembayaran terkonfirmasi, belum dibatalkan, dengan tanggal bayar tidak melewati T |
| Sisa pokok pada T | Pokok dicairkan sampai T dikurangi pembayaran efektif sampai T |
| Angsuran lunas | Baris jadwal yang nominalnya telah dipenuhi alokasi pembayaran efektif |
| Sisa suatu angsuran | Nominal tagihan dikurangi alokasi pembayaran efektif ke baris itu |
| Tunggakan pada T | Total sisa angsuran dengan tanggal jatuh tempo **sebelum T** |
| Tagihan hari ini | Sisa angsuran dengan tanggal jatuh tempo sama dengan T; belum dihitung terlambat |
| Hari keterlambatan / DPD | Selisih hari kalender antara T dan jatuh tempo paling awal yang masih bersisa dan sebelum T; nol jika tidak ada tunggakan |

Tabel ini berlaku untuk pinjaman baru. Untuk pinjaman migrasi, pada dan setelah cut-off berlaku `sisa pokok = saldo awal terverifikasi − pembayaran efektif setelah cut-off`; komposisi angsuran awal berasal dari data migrasi tervalidasi, bukan pembayaran fiktif. Laporan sebelum cut-off hanya tersedia jika data historis lengkap; jika tidak, tampilkan **data tidak tersedia**, bukan nol. Arus pembayaran historis hanya mencakup transaksi nyata yang tanggal dan nominalnya tersedia, dan diberi penanda cakupan tidak lengkap.

Alokasi dihitung berurutan menurut tanggal bayar efektif lalu ID transaksi stabil untuk tanggal yang sama. Input mundur dan pembatalan harus menghitung ulang secara konsisten. Dokumen tanda terima tetap merupakan snapshot saat diterbitkan; layar transaksi memperlihatkan saldo terkini.

Contoh: pokok Rp1.200.000 dengan tiga angsuran Rp400.000 jatuh tempo 10 November, 10 Desember 2026, dan 10 Januari 2027. Pembayaran terkonfirmasi Rp250.000 pada 10 November menghasilkan sisa pokok Rp950.000, satu transaksi bayar, nol angsuran lunas. Pada 11 November tunggakan Rp150.000 dan DPD satu hari. Pembayaran berikutnya Rp550.000 melunasi sisa angsuran pertama dan seluruh angsuran kedua: sisa pokok Rp400.000, dua transaksi bayar, dua dari tiga angsuran lunas.

### 4.7 Bukti Pembayaran dan Dokumen Transaksi — P0

- **FR-047.** Sistem harus membedakan **lampiran bukti transfer dari nasabah** dan **tanda terima pembayaran dari pengurus**. Unggahan bukti bukan tanda terima dan tidak otomatis mengonfirmasi uang diterima.
- **FR-048.** Lampiran harus menerima JPG, PNG, dan PDF maksimal 5 MB per berkas, maksimal tiga berkas per laporan. Server harus memvalidasi ukuran, tipe isi, dan hak akses; jangan mengandalkan ekstensi. Simpan berkas pada storage privat dengan akses sementara setelah otorisasi.
- **FR-049.** Tanda terima PDF hanya dapat diterbitkan untuk pembayaran terkonfirmasi. Isinya minimal nomor unik, nama lembaga, nomor pinjaman, nama nasabah, tanggal bayar, nominal angka/terbilang, metode, referensi bila ada, penerima/pemeriksa, waktu terbit, sisa pokok saat terbit, dan keterangan bahwa ini bukti pencatatan penerimaan.
- **FR-050.** Pengurus dan nasabah pemilik harus dapat mengunduh/cetak ulang tanda terima yang sama. Pengurus dapat menyiapkan pesan dan membagikan PDF secara manual melalui perangkatnya. Aksi berbagi tidak boleh membuat lampiran atau data pinjaman tersedia melalui tautan publik permanen.
- **FR-051.** Tanda terima yang pembayarannya dibatalkan harus menampilkan status dibatalkan pada tampilan dan unduhan berikutnya. Nomor lama tidak digunakan ulang; file yang telanjur diunduh tidak dapat ditarik kembali dan tetap dapat ditelusuri berdasarkan nomor dokumen.
- **FR-052.** Sistem harus menyediakan ringkasan pencairan dan kartu pinjaman/riwayat pembayaran PDF yang bisa dicetak. Nasabah hanya dapat mengunduh dokumennya sendiri.

### 4.8 Draft Kontrak dan Arsip Perjanjian — P0

- **FR-053.** Admin harus dapat mengelola template draft kontrak dengan versi. Templat awal memuat bagian identitas para pihak, nomor/tanggal, pokok, tujuan penggunaan, tenor, jadwal, cara pembayaran, ketentuan pokok saja, penanganan kendala pembayaran, kontak pengurus, dan area tanda tangan. Penandatangan dan kebutuhan saksi mengikuti template final yang ditetapkan pengurus.
- **FR-054.** Sistem harus mengisi placeholder dari data pinjaman dan menyediakan preview/cetak PDF berlabel **DRAFT**. Isi ketentuan perjanjian ditetapkan pengurus; PRD ini menentukan kemampuan aplikasi dan tidak menetapkan redaksi kontrak final.
- **FR-055.** Pengurus harus dapat menyimpan versi final yang dipakai dan mengunggah hasil perjanjian yang ditandatangani. Simpan snapshot identitas, jadwal, pokok, versi template, pembuat, dan tanggal penerbitan. Perubahan template/profil tidak mengubah kontrak yang sudah diterbitkan.
- **FR-056.** Pencairan baru wajib diblokir di server sampai kontrak final sesuai pokok, nasabah, tenor, dan jadwal saat ini telah diunggah dalam keadaan bertanda tangan dan ditandai lengkap oleh admin atau petugas. Perubahan data kontraktual setelah finalisasi membuat kontrak tidak berlaku untuk pencairan sampai diperbarui dan ditandatangani ulang; versi lama tetap diarsipkan. Catat pelaku dan waktu pemeriksaan. Pinjaman historis yang sudah dicairkan sebelum migrasi tetap dapat dimigrasikan tanpa membuat pencairan baru; dokumen yang belum tersedia ditandai **kontrak historis belum tersedia**, tidak dianggap lengkap atau diada-adakan.
- **FR-057.** Jamaah hanya dapat membaca kontrak final miliknya yang telah dibagikan pengurus. Penandatanganan digital tersertifikasi dan negosiasi kontrak melalui portal berada di luar MVP.

### 4.9 Profil Nasabah dan Kolektabilitas Opsional — P0, Dapat Dinonaktifkan

- **FR-058.** Profil nasabah harus menampilkan identitas, daftar pinjaman, total pokok dicairkan, pembayaran, sisa pokok, tunggakan, transaksi bayar, jumlah angsuran lunas, riwayat penyelesaian, dan kontak pengurus. Untuk data migrasi tidak lengkap, tampilkan nilai yang tidak diketahui sebagai tidak tersedia beserta cakupannya. Catatan sensitif internal harus terpisah dari profil yang dilihat nasabah.
- **FR-059.** Jika kolektabilitas diaktifkan, sistem harus menampilkan status per pinjaman berdasarkan DPD beserta nilai tunggakan, jatuh tempo tertua belum lunas, dan tanggal perhitungan. Label merupakan acuan internal program, bukan skor biro kredit atau klasifikasi regulator.
- **FR-060.** Sebagai contoh pengaturan internal yang belum disahkan: lancar DPD 0; perhatian DPD 1–7; kurang lancar DPD 8–30; bermasalah DPD 31–90; macet DPD lebih dari 90. Admin harus menetapkan dan menyimpan rentang yang disetujui sebelum mengaktifkan fitur. Rentang harus berurutan, tidak tumpang tindih, dan tanpa celah; contoh ini bukan kebijakan yang sudah disahkan.
- **FR-061.** Status harus dihitung ulang saat tanggal berganti, pembayaran dikonfirmasi/dibatalkan, atau pengaturan berubah. Tidak boleh ada label macet yang diedit bebas tanpa dasar. Perubahan batas menyimpan versi serta pelaku; laporan menyebut versi aturan.
- **FR-062.** Ringkasan orang mengikuti status terburuk dari pinjaman bersisa pokok positif. Orang tanpa pinjaman aktif ditampilkan sebagai tidak ada kewajiban aktif; draft yang belum dicairkan ditampilkan belum dicairkan. Riwayat keterlambatan tidak hilang setelah lunas.
- **FR-063.** Pengurus harus dapat mencatat tindak lanjut: tanggal, petugas, kanal komunikasi, hasil, janji bayar opsional, tanggal tindak lanjut berikutnya, dan catatan internal. Janji bayar tidak mengubah jadwal maupun saldo.
- **FR-064.** Kolektabilitas harus **nonaktif secara default**. Saat dimatikan, label profil disembunyikan tetapi jadwal, tunggakan, DPD, dan riwayat pembayaran tetap tersedia jika data memadai. Keterlambatan tidak menambahkan biaya atau memblokir layanan program lain secara otomatis.

### 4.10 Dashboard dan Laporan — P0

- **FR-065.** Dashboard harus mempunyai filter rentang transaksi, tanggal posisi saldo, kategori tujuan, nasabah, wilayah/RT/RW, status pinjaman, dan kolektabilitas jika aktif. Bedakan **arus selama periode** dengan **saldo pada tanggal posisi** secara eksplisit.
- **FR-066.** Kartu utama harus mencakup jumlah nasabah unik, pinjaman aktif, pokok dicairkan selama periode, pembayaran terkonfirmasi selama periode, sisa pokok pada tanggal posisi, tunggakan, jumlah nasabah menunggak, dan jumlah laporan pembayaran menunggu verifikasi saat ini. Setiap kartu menampilkan basis tanggalnya.
- **FR-067.** Dashboard distribusi harus menyediakan ringkasan per kategori tujuan, per nasabah, dan per RT/RW/alamat terstruktur: jumlah pinjaman, nasabah unik, pokok dicairkan, pembayaran, sisa pokok, dan tunggakan. Nilai kosong masuk kelompok **Wilayah belum diisi**, tidak dibuang.
- **FR-068.** Pengelompokan wilayah historis memakai snapshot saat pencairan sebagai default. Jika tersedia tampilan alamat terkini, pengguna harus melihat perbedaan basisnya. Peta geografis tidak wajib; tabel dan grafik batang cukup.
- **FR-069.** Dashboard pendukung harus memuat tren pencairan/pembayaran bulanan, daftar jatuh tempo tujuh hari ke depan, daftar tunggakan menurut umur, antrean verifikasi, serta kelengkapan kontrak. Semua daftar dapat dibuka menuju transaksi sumber sesuai izin.
- **FR-070.** Laporan harus menyediakan daftar pinjaman, kartu nasabah, jadwal jatuh tempo, pembayaran, tunggakan, dan distribusi pinjaman. Mendukung CSV untuk data tabular dan PDF untuk ringkasan/kartu. Ekspor mengikuti filter dan izin akses layar.
- **FR-071.** Rasio tunggakan harus didefinisikan sebagai tunggakan dibagi sisa pokok pada tanggal posisi. Jika sisa pokok nol, tampilkan tidak berlaku. Angka ini berbeda dari proporsi nasabah menunggak terhadap nasabah aktif; keduanya harus berlabel jelas.
- **FR-072.** Laporan tidak boleh menyebut total pencatatan sebagai saldo kas atau dana siap disalurkan. Draft, klaim belum diverifikasi, serta transaksi dibatalkan tidak termasuk nominal keuangan terkonfirmasi.
- **FR-073.** Laporan historis dihitung dengan data terkonfirmasi terkini dan tanggal efektif transaksi. Input mundur atau koreksi dapat mengubah hasil periode lama; setiap ekspor menyimpan waktu dibuat dan menerangkan basis ini. Untuk data migrasi yang belum lengkap, arus historis dan saldo sebelum cut-off diberi label tidak lengkap/tidak tersedia; agregat historis tanpa tanggal tidak dimasukkan ke tren bulanan atau dihitung dua kali. Laporan yang dikunci per penutupan periode berada pada P1.

### 4.11 Pengingat dan Kontrol Operasional — P0

- **FR-074.** Pengurus harus mempunyai daftar kerja jatuh tempo, tunggakan, janji bayar, laporan belum diverifikasi, dan dokumen belum lengkap. Nasabah mempunyai pengingat di portal untuk tagihan berikutnya dan hasil verifikasi.
- **FR-075.** Pengurus harus dapat menyiapkan teks pengingat berisi nama, nomor pinjaman, jatuh tempo, nominal yang perlu dibayar, dan kontak petugas. Pengiriman pengingat dilakukan manual.
- **FR-076.** Sistem harus menyimpan audit untuk perubahan identitas terkait pinjaman, tautan akun nasabah, izin akses, draft/jadwal, pencairan, verifikasi, pembatalan, dokumen, dan pengaturan. Audit memuat aktor, waktu, referensi entitas, tindakan, alasan bila diwajibkan, serta perubahan nilai yang relevan. Jangan menyalin isi berkas atau kredensial ke log.
- **FR-077.** Seluruh layar harus menampilkan status proses dan pesan kegagalan yang dapat ditindaklanjuti. Retry aman tidak boleh menduplikasi orang, pencairan, pembayaran, atau dokumen.

### 4.12 Pengembangan Lanjutan dan Migrasi

- **FR-078.** Penjadwalan ulang/restrukturisasi dengan alasan, versi jadwal lama/baru, pembayaran terdahulu tetap utuh, dan persetujuan sesuai kebijakan baru yang ditetapkan pengurus. Mengubah jadwal bukan cara menghapus riwayat keterlambatan.
- **FR-079.** Integrasi kas/rekening melalui referensi sumber yang eksplisit, transaksi atomik, dan rekonsiliasi; keputusan pembukuan dibuat dalam PRD lanjutan. Jangan melakukan posting retroaktif otomatis atas seluruh catatan MVP.
- **FR-080. [Ditunda]** Jika kebutuhan data pinjaman historis muncul kemudian, sediakan impor saldo awal dengan template, preview, pemetaan identitas, tanggal cut-off, rekonsiliasi, audit, dan pencegahan pencatatan ganda sesuai FR-087–FR-092. Ini bukan syarat peluncuran awal.
- **FR-081. [P1]** Pengajuan mandiri jamaah, lebih dari satu pinjaman aktif baru, pencairan bertahap, pengelolaan agunan fisik, penghapusan kewajiban, pembebasan sebagian pokok, dan penanganan pembayaran berlebih membutuhkan keputusan serta alur khusus pada pengembangan berikutnya. Data penjamin serta kebijakan batas dan pengecualian merupakan P0 sesuai FR-093–FR-096.
- **FR-082.** Pengingat otomatis, integrasi perbankan, penandatanganan digital, dan penguncian laporan periode dapat dikembangkan setelah pencatatan inti stabil.

### 4.13 Akun Email dan Password untuk Portal — P0

- **FR-083.** Nasabah masuk menggunakan email dan password pada akun yang dibuat admin; OTP email dan SMS ditunda. Sistem tidak membuat akun atau menautkan identitas otomatis melalui pendaftaran publik.
- **FR-084.** Admin memeriksa identitas dan menautkan akun ke individu terverifikasi. Pembuatan akun melalui server memeriksa hak admin tanpa mengekspos service role.
- **FR-085.** Email login harus unik. Nomor telepon profil dapat sama antaranggota keluarga. Penggantian email login dan pemulihan akses dikelola admin dan dicatat.
- **FR-086.** Password dan token tidak disimpan di log. Gunakan autentikasi dan pembatasan percobaan yang aman, serta sediakan pemulihan akses dan pencabutan sesi; OTP/SMS bukan kebutuhan tahap ini.

### 4.14 Migrasi Pinjaman Berjalan — Ditunda

FR-087–FR-092 dan skenario historis terkait disimpan sebagai acuan pengembangan lanjutan, bukan syarat peluncuran awal karena belum ada data pinjaman lama.

- **FR-087.** Sistem harus menyediakan impor melalui template terstruktur, minimal CSV, serta input manual untuk koreksi sebelum impor. Admin dan petugas dapat mengunduh template, memetakan kolom, melakukan preview, melihat kesalahan per baris, dan menyelesaikan impor batch yang telah divalidasi. Simpan identitas batch, sumber, operator, waktu, versi berkas atau referensi sumber, dan tanggal cut-off.
- **FR-088.** Setiap pinjaman harus dipetakan secara eksplisit ke individu yang sudah terverifikasi. Data minimal untuk diaktifkan: nomor/referensi sumber unik, nasabah, pokok dicairkan, tanggal pencairan bila diketahui, tanggal cut-off, saldo pokok pada cut-off, kategori/tujuan atau label **belum diketahui**, label sumber dana atau **belum diketahui—migrasi**, serta jadwal angsuran dan jumlah tersisa per angsuran yang dapat direkonsiliasi. Tidak boleh mengarang tanggal pencairan atau sumber dana untuk memenuhi form pinjaman baru.
- **FR-089.** Validasi saldo awal harus memastikan `0 ≤ saldo awal ≤ pokok`, jumlah nominal jadwal sama dengan pokok, dan jumlah sisa per angsuran sama dengan saldo awal. Petugas dapat mengimpor transaksi pembayaran historis yang diketahui dengan tanggal, nominal, dan referensi sumber bila ada; jumlahnya tidak boleh melebihi `pokok − saldo awal`. Selisih yang belum terjelaskan dicatat sebagai **agregat pembayaran historis tanpa rincian**, bukan transaksi pembayaran fiktif. Jumlah transaksi historis tidak boleh disimpulkan dari agregat ini.
- **FR-090.** Sistem harus menyimpan saldo awal terverifikasi, posisi setiap angsuran pada cut-off, dan riwayat transaksi nyata yang tersedia sebagai data dasar migrasi. Pembayaran operasional baru harus bertanggal setelah cut-off; koreksi data sebelum atau pada cut-off dilakukan melalui alur koreksi migrasi dengan alasan, audit, rekalkulasi, dan tanpa membuat entri transaksi fiktif. Jika posisi angsuran tidak diketahui, pinjaman dapat disimpan sebagai **perlu rekonsiliasi** dan tidak boleh ditampilkan sebagai data jadwal/tunggakan yang pasti atau dipublikasikan ke portal sampai diverifikasi.
- **FR-091.** Validasi harus menandai referensi sumber duplikat, ketidakseimbangan saldo/jadwal, identitas yang belum jelas, tanggal yang tidak masuk akal, serta lebih dari satu pinjaman bersisa positif untuk orang yang sama. Baris bermasalah disimpan sebagai perlu rekonsiliasi tanpa transaksi aktif; petugas menyelesaikannya sebelum aktivasi. Bila sumber memang mencatat beberapa pinjaman aktif untuk satu orang, jangan menghapus atau menggabungkan data otomatis: tampilkan konflik dan tahan aktivasi sampai pengurus memutuskan penanganan.
- **FR-092.** Sebelum commit, tampilkan jumlah baris siap, tertahan, dan total pokok serta saldo awal; setelahnya tampilkan hasil berhasil/gagal dan total untuk dicocokkan dengan sumber. Proses impor harus idempoten per referensi sumber dan batch, dengan pencatatan koreksi yang dapat ditelusuri. Saldo awal tidak membuat entri ledger kas/rekening dan tidak dihitung sebagai penerimaan periode migrasi. Dokumen historis yang tersedia dapat dilampirkan; yang tidak tersedia ditandai, tanpa menghambat aktivasi catatan historis atau mengarang tanda tangan.

### 4.15 Batas, Penjamin, dan Pengecualian — P0

- **FR-093.** Saat ini tidak ada batas minimum/maksimum nominal atau tenor dan tidak ada kewajiban penjamin. Admin dapat mengatur kebijakan berversi di masa depan; nilai kosong berarti tidak dibatasi dan tidak menghalangi pencairan.
- **FR-094.** Penjamin opsional dapat dipilih dari data induk sebagai individu berbeda dan dicatat beserta hubungan dan kontak. Jika digunakan, sertakan snapshot dalam kontrak; tanda tangan mengikuti template pengurus.
- **FR-095.** Sistem wajib memeriksa pokok positif, jadwal valid, identitas, satu pinjaman aktif, serta kontrak bertanda tangan saat pencairan. Batas atau penjamin yang tidak dikonfigurasi tidak boleh menghalangi pencairan.
- **FR-096.** Jika pengurus mengaktifkan batas opsional di masa depan, pengecualian yang diizinkan dicatat per pinjaman dengan alasan, pelaku, waktu, dan versi kebijakan. Pengecualian tidak meniadakan kontrak bertanda tangan, prinsip tanpa biaya/bunga, atau batas satu pinjaman aktif.

### 4.16 Penyimpanan dan Pelindungan Riwayat — P0

- **FR-097.** Identitas, dokumen bukti, kontrak, dan audit disimpan tanpa batas waktu dan tidak menyediakan penghapusan permanen melalui alur aplikasi. Perubahan memakai versi/riwayat, pembatalan, atau penonaktifan tanpa menghapus sumber. Backup, pemulihan, dan penggantian penyimpanan harus menjaga keterbacaan serta keterlacakan. Kebijakan ini mencerminkan keputusan pengguna; mekanisme penanganan permintaan khusus dan kewajiban yang berlaku perlu ditetapkan pengurus tanpa mengaktifkan penghapusan otomatis.

## 5. Non-Goals / Out of Scope

- Bunga, biaya administrasi, denda, perhitungan margin, atau donasi wajib dalam pinjaman.
- Persetujuan pinjaman berjenjang; pengguna memilih pencatatan langsung.
- Posting ke `accounts`/`account_ledger_entries`, pengiriman uang, payment gateway, dan verifikasi rekening otomatis pada MVP.
- Portal publik yang menampilkan nama nasabah, hutang, atau kolektabilitas kepada jamaah lain.
- Penilaian biro kredit, daftar hitam lintas program, atau keputusan kelayakan otomatis.
- Aplikasi mobile native, multi-organisasi, dan penggantian seluruh modul zakat/qurban.
- Migrasi otomatis yang menganggap dua orang sama berdasarkan nama, atau menganggap rumah tangga sama dengan satu anggota.
- Implementasi teknis, pembuatan task implementasi, dan penetapan redaksi kontrak final sebagai bagian dari pekerjaan PRD ini.

## 6. Design Considerations

### 6.1 Navigasi

Tambahkan **Pinjaman Jamaah** pada app switcher pengurus dengan menu Dashboard, Nasabah, Pinjaman, Pembayaran/Verifikasi, Jadwal & Tindak Lanjut, Laporan, serta Pengaturan sesuai izin. Data Orang tetap dikelola melalui Data Master dan dapat dipilih dari form pinjaman.

Portal nasabah mempunyai navigasi ringkas: **Ringkasan**, **Pinjaman Saya**, **Kirim Bukti**, dan **Dokumen**. Nasabah tidak mendapatkan sidebar global pengurus. Peralihan mode bagi pengurus yang juga nasabah harus terlihat jelas.

### 6.2 Halaman Utama

| Halaman | Isi dan tindakan utama |
|---|---|
| Daftar nasabah | Pencarian nama/telepon/ID, saldo agregat, indikator tunggakan; NIK tidak ditampilkan utuh di daftar |
| Buat pinjaman | Pilih orang → tujuan/pokok → tenor/jadwal → cek kebijakan/penjamin → kontrak final bertanda tangan → catat pencairan; draft dapat disimpan pada setiap tahap |
| Detail pinjaman | Ringkasan saldo, jadwal, transaksi bayar, dokumen, dan audit/tindak lanjut menurut izin |
| Verifikasi | Antrean klaim, preview berkas, deteksi kemungkinan duplikasi, konfirmasi/tolak dengan alasan |
| Dashboard | Ringkasan operasional, distribusi, tren, dan daftar yang dapat ditelusuri |
| Portal jamaah | Tagihan berikutnya, sisa pokok, transaksi vs angsuran lunas, unggah bukti, status verifikasi |

Gunakan React, Tailwind, dan komponen shadcn/ui yang ada. Form dan portal harus nyaman digunakan pada layar ponsel. Status harus memakai teks/ikon selain warna. Uang menggunakan format rupiah dan tanggal menggunakan bahasa Indonesia.

Tombol pencairan langsung harus memperlihatkan ringkasan akhir sebelum disimpan. Tombol kirim bukti harus menjelaskan bahwa saldo diperbarui setelah verifikasi. Laporan dan dashboard harus menampilkan tanggal posisi saldo tanpa mengharuskan pengguna memahami istilah teknis database.

## 7. Technical Considerations

### 7.1 Fondasi dan Sumber Kebenaran

- Gunakan proyek React + TypeScript + Vite serta Supabase yang ada, bukan aplikasi terpisah.
- Pertahankan `muzakki.id` sebagai ID kompatibel data orang pada MVP. Tambahkan atribut nama kanonis, granularitas, status verifikasi, status aktif, dan hubungan rumah tangga sesuai FR-003–FR-005. Kontrak API bersama harus membedakan identitas orang dari atribut keikutsertaan program.
- Tautan `muzakki.user_id` yang tersedia harus divalidasi dan diberi batas keunikan untuk akun nasabah aktif sesuai aturan produk; periksa konflik data lama sebelum menambahkan constraint.
- Hubungkan mustahik melalui foreign key/pemetaan eksplisit yang tetap mempertahankan sumber lamanya. Jangan menjanjikan semua data lintas program telah menyatu sebelum pemetaan selesai.
- Otorisasi nasabah merupakan kemampuan baru. Jangan memberikan role pengurus pada akun jamaah agar lolos kebijakan RLS yang lama. Semua kebijakan tabel lama yang dapat diakses akun authenticated harus diperiksa terhadap tipe akses baru ini sebelum portal dibuka.
- Siapkan pembuatan akun nasabah oleh admin dan login email/password dengan pembatasan akses terpisah; login pengurus yang sudah ada tetap berfungsi. OTP dan SMS ditunda.

### 7.2 Model Data Konseptual

Nama selain tabel existing di bawah merupakan usulan, bukan kewajiban implementasi literal.

| Entitas | Tanggung jawab dan relasi |
|---|---|
| Data orang existing (`muzakki`) | Identitas kanonis, status/granularitas, relasi rumah tangga, tautan akun; dipakai semua program |
| Pemetaan identitas legacy | Hubungan mustahik/sumber lama ke orang kanonis, status verifikasi, pelaku, waktu |
| `loan_customers` | Keikutsertaan program; satu orang satu profil nasabah, tanpa salinan master identitas |
| `loan_categories` | Master kategori tujuan dan status aktif |
| `loans` | Nomor, nasabah, pokok, tujuan, status, tenor, sumber dana, penanggung jawab, snapshot wilayah |
| `loan_disbursements` | Satu pencairan per pinjaman, tanggal efektif, metode, nominal, pencatat |
| `loan_installments` | Urutan, tanggal jatuh tempo, nominal tagihan; total sama dengan pokok |
| `loan_payments` | Klaim/pembayaran, tanggal efektif, nominal, status, pengirim, verifikator, referensi pembatalan |
| `loan_payment_allocations` | Relasi pembayaran terkonfirmasi ke angsuran; dapat dihitung ulang dengan urutan deterministik |
| `loan_attachments` | Metadata berkas privat, pemilik, jenis, ukuran, dan hubungan ke klaim/dokumen |
| `loan_documents` / versi template | Kontrak dan tanda terima bersnapshot, nomor, versi, status, pembuat, waktu |
| `loan_follow_ups` | Riwayat tindak lanjut internal dan janji bayar |
| Migrasi saldo awal / batch | Sumber, cut-off, pokok, saldo awal, posisi angsuran, pembayaran historis yang diketahui, hasil rekonsiliasi, referensi idempoten, pelaku, dan koreksi berversi |
| Kebijakan / penjamin / pengecualian | Batas pokok/tenor, aturan penjamin, referensi identitas penjamin, versi kebijakan, nilai yang dikecualikan, alasan dan pelaku |
| Kemampuan akses program | Hubungan akun ke hak admin/petugas/pengawas/nasabah tanpa membuka modul lain |
| Pengaturan / audit | Batas kolektabilitas berversi, kategori, template, dan perubahan yang dapat ditelusuri |

### 7.3 Konsistensi dan Keamanan

- Validasi nominal, tanggal, total jadwal, status, kepemilikan, dan batas pinjaman aktif harus ditegakkan di server/database, bukan hanya form.
- Gunakan operasi atomik dan penguncian/strategi konkurensi setara pada pencairan, konfirmasi, pembatalan, serta perhitungan alokasi. Terapkan kunci idempotensi dan constraint unik yang sesuai.
- Representasikan nominal tanpa galat floating point. Gunakan tanggal kalender untuk jatuh tempo/tanggal bayar, serta timestamp untuk kejadian audit; semua evaluasi hari bisnis menggunakan Asia/Jakarta.
- Simpan berkas privat dengan kebijakan akses berdasarkan pemilik dan izin program; signed URL dibatasi masa berlaku maksimal lima menit. Tautan sementara yang sudah diterbitkan dapat berlaku sampai kedaluwarsa.
- Jangan meletakkan service role key dalam frontend. Aktivasi akun, penautan identitas, dan tindakan admin yang membutuhkan hak khusus harus melalui jalur server yang memeriksa kewenangan.
- Dokumen final bersifat snapshot; perubahan data terkini tidak boleh memodifikasi file final diam-diam. Tanda terima menyimpan saldo saat terbit, bukan menggantikan saldo transaksi terkini.
- Penambahan relasi pinjaman harus melarang penghapusan orang yang dipakai. Periksa FK legacy yang memakai cascade agar jalur penghapusan Data Master tidak menghapus riwayat finansial.
- Unggahan gagal tidak boleh meninggalkan klaim dianggap lengkap; pembersihan berkas yatim harus aman terhadap berkas yang sudah direferensikan. Pembatalan transaksi tidak otomatis menghapus lampiran audit.
- Format ekspor harus menangani input pengguna sebagai data, termasuk mencegah formula spreadsheet dari sel teks yang diekspor.
- Tentukan jadwal backup database dan berkas privat, penanggung jawab, serta uji pemulihan sebelum penggunaan operasional. Data pada FR-097 disimpan tanpa batas waktu; jangan menerapkan penghapusan otomatis berdasarkan usia data.

### 7.4 Strategi Peralihan Data

1. Inventaris jumlah record, relasi, NIK ganda, tautan akun ganda, dan baris rumah tangga/individu yang belum jelas. Hasilkan daftar masalah untuk ditinjau, bukan menggabungkannya otomatis.
2. Terapkan perubahan skema secara aditif dengan backup dan pemetaan ID. Data lama tetap dapat dibaca modul existing.
3. Verifikasi individu yang akan menjadi nasabah; aktivasi portal hanya setelah tautan akun dan identitas disahkan petugas.
4. Sediakan pemetaan mustahik ke orang bersama dan tampilkan progres data yang belum terhubung. Proses pemetaan penuh seluruh riwayat tidak menjadi prasyarat mencatat pinjaman baru.
5. Untuk peluncuran awal, mulai pencatatan pinjaman baru tanpa impor pinjaman lama. Jika kebutuhan historis muncul kemudian, tetapkan sumber dan cut-off lalu lakukan rekonsiliasi dan impor sesuai FR-080 dan FR-087–FR-092.
6. Verifikasi transaksi zakat, infak, maal, qurban, pencarian donor, dan Data Master tetap membaca ID yang benar. Jangan menjalankan perubahan database produksi hanya berdasarkan dokumen ini.

Referensi implementasi existing yang perlu diperiksa pengembang:

- `zakat-fitrah-app/src/hooks/useMuzakki.ts`
- `zakat-fitrah-app/src/hooks/useDonor.ts`
- `zakat-fitrah-app/src/components/data-master/WargaHistorySheet.tsx`
- `zakat-fitrah-app/src/pages/DataMasterMustahik.tsx`
- `zakat-fitrah-app/src/components/layouts/AppSwitcher.tsx`
- `zakat-fitrah-app/src/store/appStore.ts`
- `zakat-fitrah-app/supabase/migrations/001_initial_schema_safe.sql`
- `zakat-fitrah-app/supabase/migrations/028_accounts_and_account_ledger_schema.sql`
- `zakat-fitrah-app/supabase/migrations/039_data_master_tables.sql`
- `zakat-fitrah-app/supabase/migrations/040_warga_expand_fields.sql`

### 7.5 Urutan Implementasi yang Disarankan

1. Fondasi identitas individu, pemetaan legacy, kemampuan akses, akun email/password, dan RLS portal.
2. Nasabah, kebijakan batas dan penjamin, draft pinjaman, jadwal, kontrak bertanda tangan, dan pencairan langsung.
3. Migrasi saldo awal dan posisi angsuran, lalu klaim pembayaran, verifikasi, pembatalan, alokasi, dan audit.
4. Portal nasabah, tanda terima, dokumen kontrak, dan arsip privat.
5. Dashboard, ekspor, tindak lanjut, dan kolektabilitas opsional.
6. Uji skenario penerimaan pinjaman baru, regresi modul existing, otorisasi, backup/pemulihan, lalu persiapan peluncuran. Rekonsiliasi pinjaman historis hanya dilakukan jika kebutuhan tersebut muncul kemudian.

## 8. Success Metrics dan Acceptance Criteria

### 8.1 Ukuran Keberhasilan

| Ukuran | Target awal |
|---|---|
| Identitas nasabah | 100% pinjaman baru merujuk individu terverifikasi di data induk |
| Akurasi pokok | Selisih saldo terhadap transaksi efektif terkonfirmasi = Rp0 pada seluruh skenario penerimaan |
| Konsistensi jadwal | Total nominal jadwal = pokok untuk 100% pinjaman yang dicairkan |
| Isolasi akses | Tidak ada data/berkas jamaah lain atau modul pengurus yang dapat dibaca akun nasabah dalam uji akses negatif |
| Kelengkapan audit | 100% pencairan, konfirmasi, dan pembatalan mempunyai aktor, waktu, dan referensi |
| Efek ke ledger existing | Nol entri atau perubahan saldo kas/rekening dari seluruh alur pinjaman MVP |
| Migrasi pinjaman historis | Tidak berlaku pada peluncuran awal. Jika dibutuhkan kemudian, 100% pinjaman sumber tercatat dalam hasil impor atau daftar konflik dan saldo yang diaktifkan cocok dengan sumber. |
| Akses akun | Uji pembuatan akun oleh admin, login email/password, pemulihan, dan penolakan akses orang lain |
| Kemudahan pengurus | Petugas yang memahami data dapat membuat dan mencairkan pinjaman rutin maksimal tiga menit dalam uji kegunaan |
| Performa awal | Daftar 20 item/detail tampil dalam tiga detik pada set uji 1.000 pinjaman dan 12.000 pembayaran di lingkungan uji yang disepakati |
| Penggunaan portal | Dalam bulan pertama pilot, ukur nasabah aktif portal, klaim terkirim, waktu verifikasi median, dan kebutuhan bantuan; target adopsi ditetapkan setelah jumlah peserta pilot diketahui |

### 8.2 Skenario Penerimaan Minimum

| ID | Skenario | Hasil yang wajib terlihat |
|---|---|---|
| AC-01 | Orang yang sama sudah membayar zakat dan mengikuti qurban lalu menjadi nasabah | ID orang tetap sama; riwayat program mengikuti hak akses |
| AC-02 | Baris lama ternyata mewakili satu keluarga, peminjam adalah salah satu anggota | Anggota mempunyai identitas individu sendiri; transaksi keluarga lama tidak dipindahkan otomatis |
| AC-03 | Dua orang bernama sama atau berbagi telepon | Tidak digabung otomatis; NIK ganda yang diisi ditolak |
| AC-04 | Orang lama/baru dipilih dari form pinjaman | Tidak muncul master identitas nasabah terpisah yang menduplikasi orang |
| AC-05 | Pinjaman Rp1.000.000 dengan tiga angsuran otomatis | Jadwal Rp333.333, Rp333.333, Rp333.334; total tepat Rp1.000.000 |
| AC-06 | Jadwal bulanan mulai 31 Januari 2027 | Jatuh tempo berikutnya 28 Februari lalu 31 Maret |
| AC-07 | Jadwal khusus totalnya tidak sama dengan pokok atau mempunyai tanggal ganda | Pencairan diblokir dengan pesan pada baris yang bermasalah |
| AC-08 | Petugas mencairkan draft lengkap dengan kontrak bertanda tangan dan kebijakan terpenuhi | Langsung aktif tanpa persetujuan berjenjang; satu catatan pencairan; ledger existing tetap |
| AC-09 | Nasabah mengirim bukti Rp250.000 | Status menunggu verifikasi; sisa pokok dan angsuran belum berubah |
| AC-10 | Bukti ditolak | Alasan terlihat nasabah; saldo tidak berubah; dapat mengirim laporan baru |
| AC-11 | Pengurus mengonfirmasi Rp250.000 pada contoh bagian 4.6.1 | Sisa Rp950.000; satu transaksi; nol angsuran lunas; pada 11 November tunggakan Rp150.000 |
| AC-12 | Bayar tambahan Rp550.000 dalam contoh yang sama | Sisa Rp400.000; dua transaksi; dua dari tiga angsuran lunas |
| AC-13 | Pelunasan sisa pokok Rp400.000 | Saldo nol dan status lunas, tanpa biaya tambahan |
| AC-14 | Dua petugas mengonfirmasi bersamaan atau browser mengirim ulang request | Tidak ada duplikasi/alokasi berlebih; saldo tidak negatif |
| AC-15 | Pembayaran melebihi sisa pokok | Ditolak tanpa membuat infak, saldo titipan, atau posting kas |
| AC-16 | Admin atau petugas membatalkan pembayaran yang membuat pinjaman lunas | Saldo, alokasi, dan status kembali sesuai; bukti lama ditandai dibatalkan; audit utuh |
| AC-17 | Hari jatuh tempo dan satu hari sesudahnya | Pada jatuh tempo belum terlambat; esoknya DPD satu jika masih bersisa |
| AC-18 | Uji batas kolektabilitas 0/1/7/8/30/31/90/91 hari | Label sesuai rentang, alasan/perhitungan terlihat; perubahan konfigurasi tercatat |
| AC-19 | Kolektabilitas dimatikan | Label hilang; tunggakan dan pembayaran masih benar |
| AC-20 | Nasabah mengganti ID URL/API ke pinjaman, bukti, atau kontrak orang lain | Ditolak oleh server/Storage, termasuk ekspor dan signed URL |
| AC-21 | Nasabah mengakses endpoint lama Data Master, users, kas, atau laporan global | Akses ditolak walaupun akun terautentikasi |
| AC-22 | Alamat/nama orang atau template kontrak diubah setelah dokumen final terbit | Profil terkini berubah; dokumen final dan snapshot wilayah historis tetap |
| AC-23 | Dashboard difilter kategori/wilayah/periode | Ringkasan cocok dengan detail; wilayah kosong tampil; saldo posisi tidak tercampur arus periode |
| AC-24 | Menambah, mengonfirmasi, menolak, membatalkan, dan mengekspor transaksi pinjaman | Tidak ada perubahan `account_ledger_entries`, saldo `accounts`, atau penerimaan zakat/infak |
| AC-25 | Individu terkait pinjaman dihapus/nonaktif | Hapus permanen ditolak; nonaktif tidak menghilangkan hutang/riwayat |
| AC-26 | Input pembayaran mundur, lalu hitung laporan periode sebelumnya | Urutan alokasi konsisten; hasil diperbarui dengan basis tanggal efektif dan waktu ekspor tercantum |
| AC-27 | Unggahan terlalu besar/tipe isi tidak sah atau berkas milik orang lain | Ditolak tanpa klaim dianggap lengkap; tidak ada kebocoran berkas |
| AC-28 | Nasabah yang masih berhutang dibuatkan pinjaman kedua | Draft dapat disimpan; pencairan pinjaman kedua diblokir dengan referensi kewajiban aktif |
| AC-29 | Draft belum mempunyai kontrak final bertanda tangan, atau jadwal berubah setelah kontrak ditandatangani | Pencairan ditolak di API dan UI sampai kontrak versi yang sesuai ditandatangani dan ditandai lengkap |
| AC-30 | Pinjaman historis telah dicairkan tetapi kontrak tidak tersedia | Saldo tervalidasi dapat dimigrasikan tanpa pencairan baru; kontrak ditandai belum tersedia |
| AC-31 | Login menggunakan email/password pada akun yang dibuat admin | Akun aktif masuk ke portal miliknya; password salah atau akun tidak aktif ditolak |
| AC-32 | Nomor telepon profil digunakan bersama dua anggota keluarga | Profil tetap boleh menyimpan nomor bersama; email akun login harus unik |
| AC-33 | Impor pokok Rp1.000.000 dengan saldo cut-off Rp600.000 dan sisa per angsuran Rp300.000 + Rp300.000, tanpa rincian pembayaran lama | Saldo awal Rp600.000, agregat historis Rp400.000; jumlah transaksi lama tidak diketahui; tidak ada pembayaran fiktif atau entri kas |
| AC-34 | Setelah AC-33, terima pembayaran Rp100.000 setelah cut-off | Sisa pokok Rp500.000; satu transaksi baru diketahui; alokasi ke angsuran tertua; riwayat lama tetap ditandai tidak lengkap |
| AC-35 | Impor ulang batch yang sama, saldo/jadwal tidak cocok, atau dua pinjaman aktif untuk orang yang sama | Tidak ada duplikasi; baris konflik tertahan dan harus direkonsiliasi; data sumber tidak digabung otomatis |
| AC-36 | Nominal/tenor melanggar kebijakan atau penjamin wajib belum tercatat | Draft dapat disimpan; pencairan ditolak kecuali pengecualian jenis tersebut diizinkan dan dicatat dengan alasan |
| AC-37 | Pengguna petugas mencoba mencairkan, memverifikasi, dan membatalkan pembayaran | Ketiga aksi diperbolehkan dengan validasi masing-masing dan audit; pembatalan wajib menyertakan alasan |
| AC-38 | Pengguna mencoba menghapus permanen identitas, bukti, kontrak, atau audit | Alur aplikasi tidak menyediakan/mengizinkan penghapusan permanen; pembatalan dan versi sebelumnya tetap dapat diaudit |

## 9. Open Questions dan Keputusan Lanjutan

Sepuluh jawaban pengguna pada 8 November 2026 sudah tercatat pada bagian **Keputusan yang Sudah Dikonfirmasi** dan diterapkan dalam kebutuhan. Detail di bawah belum diberikan dan perlu ditetapkan pengurus untuk implementasi atau peluncuran; jangan dianggap sudah disetujui.

| No. | Detail yang masih perlu ditetapkan | Dampak |
|---|---|---|
| 1 | Sumber dan format data pinjaman lama, cut-off, serta rekonsiliasi | Tidak berlaku untuk peluncuran awal; pengguna menyatakan belum ada data pinjaman lama. Jika muncul kebutuhan baru, admin/petugas memeriksa sumber dan konflik ditahan sampai cocok. |
| 2 | Apakah pengurus kelak ingin mengaktifkan batas atau penjamin? | Saat ini tidak ada batas nominal/tenor atau kewajiban penjamin; pengaturan opsional tidak memblokir pencairan |
| 3 | Redaksi kontrak final, para penandatangan, kebutuhan saksi, dan prosedur pemeriksaan tanda tangan | Pengurus menyiapkan template; kontrak bertanda tangan yang sesuai tetap wajib sebelum pencairan baru |
| 4 | Prosedur admin membuat akun dan memulihkan akses email/password | OTP dan SMS ditunda; akun nasabah harus diuji sebelum portal diluncurkan |
| 5 | Daftar label sumber dana dan penanggung jawab kebijakannya | Label wajib untuk pinjaman baru; data historis yang belum diketahui diberi penanda |
| 6 | Apakah dan kapan kolektabilitas diaktifkan serta batas DPD final | Default nonaktif; angka pada FR-060 hanya contoh yang perlu disetujui sebelum digunakan |
| 7 | Jadwal backup, penanggung jawab pemulihan, serta prosedur permintaan khusus terkait penyimpanan data | Keputusan saat ini adalah data tidak dihapus dan tidak ada retensi otomatis berbasis umur |

### Kebutuhan Tambahan yang Direkomendasikan

Di luar daftar awal pengguna, MVP ini memasukkan kontrol yang membantu operasional sehari-hari: verifikasi bukti, pembayaran sebagian dan pelunasan awal, pembeda jumlah transaksi vs angsuran lunas, audit/pembatalan, pencegahan duplikasi, validasi kontrak bertanda tangan, migrasi pinjaman lama, penjamin dan pengecualian, daftar tindak lanjut, serta perlindungan data portal. Restrukturisasi dan integrasi kas tetap menjadi pengembangan lanjutan.
