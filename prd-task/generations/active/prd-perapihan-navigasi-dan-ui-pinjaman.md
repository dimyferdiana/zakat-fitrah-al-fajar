# PRD: Perapihan Navigasi, Tampilan, dan Alur Kerja Pinjaman Jamaah

## Kontrol dokumen

| Atribut | Nilai |
|---|---|
| Tanggal | 10 November 2026 |
| Versi | 1.0 |
| Status | Draft kebutuhan untuk review dan pembuatan task list |
| Target | Modul Pinjaman Jamaah, khusus pengurus dengan role admin dan petugas |
| Halaman awal | `http://localhost:5173/pinjaman` |
| Lokasi | `prd-task/generations/active/`, mengikuti lokasi dokumen aktif yang diminta pengguna |
| Panduan | [create-prd.md](../../create-prd.md) |
| PRD fondasi | [Pinjaman Jamaah dan Data Induk Orang](prd-pinjaman-jamaah-dan-data-induk-orang.md) |
| Cakupan dokumen | Kebutuhan produk dan kriteria penerimaan; implementasi dilakukan setelah PRD |

## 1. Pendahuluan

Modul Pinjaman Jamaah sudah menyediakan pendaftaran nasabah, draft dan jadwal pinjaman, kontrak, pencairan, pencatatan pembayaran, pemeriksaan bukti, laporan, serta pengaturan. Masalah berikutnya adalah kemudahan penggunaannya: banyak fungsi dikumpulkan pada satu halaman panjang dan satu menu **Nasabah & Pinjaman**. Pengguna harus berpindah bagian dengan menggulir halaman, sedangkan formulir, pengaturan, informasi ringkasan, dan transaksi saling berebut perhatian.

PRD ini memisahkan pekerjaan tersebut menjadi halaman dan menu yang jelas, menyederhanakan alur harian, serta merapikan tampilan untuk desktop dan ponsel. Aturan bisnis dan perlindungan data pada PRD fondasi tetap menjadi acuan.

### 1.1 Keputusan pengguna

1. Perbaikan mencakup tiga masalah sekaligus: kepadatan informasi, konsistensi visual, dan alur kerja yang panjang atau membingungkan.
2. Susunan halaman, formulir, dan navigasi boleh diubah.
3. Fungsi harus dipindahkan ke **menu terpisah**; tidak lagi ditumpuk di menu **Nasabah & Pinjaman**. Nama menu perlu diperjelas.
4. Prioritas adalah halaman pengurus/admin yang nyaman digunakan pada desktop maupun ponsel.

### 1.2 Dasar peninjauan

Peninjauan dilakukan pada kode `LoanManagement.tsx`, `LoanDashboard.tsx`, `AppLayout.tsx`, `AppSwitcher.tsx`, `LoanClaimQueue.tsx`, `LoanViewerSummary.tsx`, dan definisi rute aplikasi. Halaman aktif belum ditinjau secara visual pada sesi penyusunan PRD; temuan berikut merupakan temuan struktur kode, bukan hasil pengukuran tampilan atau pengujian pengguna.

| Temuan saat ini | Dampak | Arah perbaikan |
|---|---|---|
| Sidebar modul hanya memiliki menu Nasabah & Pinjaman | Pengguna tidak langsung mengetahui tempat bekerja | Enam menu dengan tujuan terpisah |
| Navigasi dalam halaman menggunakan tautan ke bagian halaman yang sama | Perpindahan tetap berada dalam halaman panjang | Halaman dengan URL sendiri dan penanda menu aktif |
| Dashboard, antrean pembayaran, pengaturan, pendaftaran, akun dan draft ditampilkan berurutan | Pekerjaan rutin bercampur dengan konfigurasi | Tampilkan informasi sesuai tujuan halaman |
| Formulir akun dan pemulihan akses berada dalam halaman pengelolaan umum | Formulir administratif selalu memenuhi ruang | Kelola akses dari profil nasabah khusus admin |
| Daftar pinjaman memuat 50 pinjaman terbaru | Pinjaman di luar 50 baris tidak dapat ditemukan melalui daftar tersebut | Pencarian, filter dan paginasi seluruh data yang diizinkan |
| Rincian pinjaman dibuka di bagian bawah halaman dan dicapai melalui scroll | Konteks daftar serta pinjaman terpilih sulit dipertahankan | Halaman rincian dengan URL dan tombol kembali |
| Status transaksi/pinjaman sebagian ditampilkan sebagai kode internal | Istilah kurang mudah dipahami | Label bahasa Indonesia yang konsisten |
| Dashboard menggabungkan pemantauan, profil nasabah dan ekspor terperinci | Halaman awal terlalu banyak memuat tujuan berbeda | Pisahkan ringkasan, profil nasabah dan laporan |

## 2. Tujuan

1. Pengurus dapat mengenali tempat untuk mengelola nasabah, pinjaman, pembayaran, laporan dan pengaturan langsung dari navigasi utama modul.
2. Halaman awal menampilkan ringkasan dan pekerjaan yang membutuhkan perhatian; formulir pendaftaran, akun dan pinjaman hanya tampil saat diminta.
3. Pengurus dapat membuka rincian pinjaman dari daftar atau pekerjaan tertunda dalam satu aksi, serta kembali tanpa kehilangan filter dan halaman daftar.
4. Semua pinjaman yang boleh diakses dapat ditemukan, termasuk pinjaman di luar 50 data terbaru.
5. Alur utama dapat diselesaikan pada viewport desktop 1366 × 768 dan ponsel 390 × 844 tanpa scroll horizontal pada halaman.
6. Perubahan navigasi tidak mengubah saldo, jadwal, kewenangan, privasi dokumen, atau aturan keuangan yang sudah berlaku.

## 3. Pengguna dan user stories

| Pengguna | Kebutuhan |
|---|---|
| Petugas operasional | Menemukan pinjaman, memeriksa kewajiban, mencatat pembayaran, memeriksa bukti dan menindaklanjuti tunggakan |
| Admin | Semua pekerjaan petugas, pengelolaan akses nasabah, template kontrak, kebijakan dan izin sesuai kewenangan existing |
| Viewer | Tetap menggunakan ringkasan terbatas dengan izin eksplisit; aksesnya tidak diperluas oleh perapihan ini |
| Nasabah | Portal tetap dapat digunakan dengan data dan hak akses yang berlaku; desain ulang portal tidak termasuk cakupan |

- Sebagai petugas, saya ingin membuka menu **Pinjaman** dan mencari nama atau nomor pinjaman agar tidak perlu melewati dashboard serta formulir lain.
- Sebagai petugas, saya ingin membuat pinjaman dengan tahapan yang jelas agar dapat memeriksa nasabah, nominal dan jadwal sebelum menyimpan.
- Sebagai petugas, saya ingin melihat sisa pokok dan jadwal pada rincian pinjaman sebelum mencatat pembayaran.
- Sebagai petugas, saya ingin membuka menu **Pembayaran** untuk memeriksa bukti yang menunggu dan mengetahui klaim yang sudah diproses.
- Sebagai admin, saya ingin membuat atau memulihkan akses dari profil nasabah yang benar agar tidak salah memilih orang pada formulir terpisah.
- Sebagai pengurus, saya ingin membuka **Laporan Pinjaman** untuk memilih periode, tanggal posisi dan jenis ekspor tanpa memenuhi halaman ringkasan.
- Sebagai pengurus di ponsel, saya ingin membuka menu dan menjalankan aksi yang sama dengan desktop melalui susunan yang sesuai layar kecil.

## 4. Kebutuhan fungsional

Prioritas **P0** wajib untuk perapihan ini. **P1** dapat dilakukan setelah seluruh P0 diterima.

### 4.1 Navigasi dan penamaan — P0

Nama berikut merupakan keputusan desain usulan PRD berdasarkan permintaan pengguna untuk memisahkan dan mengganti nama menu.

| Menu sidebar | Rute usulan | Isi utama | Aksi utama |
|---|---|---|---|
| Ringkasan Pinjaman | `/pinjaman/dashboard` | Ringkasan saldo, pekerjaan tertunda dan pintasan | Buka daftar yang relevan |
| Nasabah | `/pinjaman/nasabah` | Daftar, pencarian dan profil nasabah | Daftarkan Nasabah |
| Pinjaman | `/pinjaman/daftar` | Semua pinjaman beserta pencarian/filter | Buat Pinjaman |
| Pembayaran | `/pinjaman/pembayaran` | Antrean verifikasi dan riwayat pembayaran | Catat Pembayaran |
| Laporan Pinjaman | `/pinjaman/laporan` | Filter laporan, distribusi, tren dan ekspor | Unduh Laporan |
| Pengaturan Pinjaman | `/pinjaman/pengaturan` | Konfigurasi program sesuai kewenangan | Simpan perubahan pada bagian terkait |

**FR-UI-001.** Sistem harus mengganti menu gabungan **Nasabah & Pinjaman** dengan enam menu terpisah tersebut pada sidebar modul Pinjaman Jamaah. Enam menu ini harus membuka halaman berbeda, bukan sekadar anchor, accordion, atau tab pada satu halaman panjang.

**FR-UI-002.** Nama modul pada pemilih aplikasi tetap **Pinjaman Jamaah**. Pemilihan modul oleh admin/petugas harus membuka Ringkasan Pinjaman. Sidebar pada ponsel harus menyediakan tujuan navigasi yang sama melalui menu yang dapat dibuka dan ditutup.

**FR-UI-003.** Setiap halaman harus memiliki satu judul utama, deskripsi singkat bila membantu, serta penanda menu aktif. Halaman rincian harus menampilkan breadcrumb atau tautan kembali yang jelas. Nama pada sidebar, judul halaman dan tujuan tautan harus konsisten.

**FR-UI-004.** `/pinjaman` harus tetap valid dan mengarahkan admin/petugas ke `/pinjaman/dashboard`. URL `/pinjaman/ringkasan` yang sudah digunakan untuk ringkasan terbatas harus tetap berfungsi dengan pembatasan aksesnya. Halaman dashboard pengurus tidak boleh memakai rute tersebut.

**FR-UI-005.** Tautan lama `#loan-dashboard`, `#loan-customers`, `#loan-drafts`, `#loan-claims`, dan `#loan-settings` pada `/pinjaman` harus diarahkan ke tujuan baru yang sesuai: dashboard, nasabah, formulir baru, pembayaran tab verifikasi, dan pengaturan. Anchor rincian tanpa ID cukup diarahkan ke daftar pinjaman; sistem tidak boleh memilih pinjaman sembarang.

**FR-UI-006.** Halaman rincian harus mempunyai URL yang dapat dimuat ulang: `/pinjaman/daftar/:loanId` dan `/pinjaman/nasabah/:customerId`. Tombol Back/Forward browser harus bekerja. Sistem harus menampilkan keadaan tidak tersedia/tidak berwenang yang aman ketika ID tidak bisa diakses, tanpa membocorkan data pemiliknya.

### 4.2 Ringkasan Pinjaman — P0

**FR-UI-007.** Halaman ringkasan harus mengutamakan empat angka: sisa pokok, tunggakan, jumlah pinjaman aktif, dan jumlah pembayaran menunggu verifikasi. Setiap angka harus memiliki label dan basis waktu yang jelas. Angka tersebut mengikuti definisi perhitungan existing dan hanya mencakup data yang terverifikasi; data tidak lengkap harus diberi keterangan.

**FR-UI-008.** Ringkasan harus menampilkan pekerjaan yang perlu perhatian: bukti menunggu verifikasi, jatuh tempo dalam tujuh hari, tunggakan, dan draft yang perlu dilengkapi sebelum pencairan. Setiap bagian menampilkan maksimal lima entri awal, jumlah keseluruhan dan tautan **Lihat semua** menuju daftar terfilter. Peringatan yang saling tumpang tindih tidak boleh dijumlahkan sebagai jumlah pinjaman unik.

**FR-UI-009.** Pengurus harus dapat membuka rincian pinjaman langsung dari pekerjaan tertunda. Halaman ringkasan tidak boleh memuat formulir lengkap pendaftaran nasabah, pembuatan akun, pembuatan pinjaman, kontrak atau pengaturan.

### 4.3 Nasabah dan pengelolaan akses — P0

**FR-UI-010.** Halaman Nasabah harus menampilkan pencarian, jumlah hasil, paginasi dan daftar dengan nama, pengenal nasabah, alamat/wilayah, status aktif serta ringkasan kewajiban yang tersedia. Informasi identitas pribadi harus dibatasi pada yang diperlukan dan diizinkan; nama sama harus tetap dapat dibedakan tanpa membuka identitas sensitif penuh.

**FR-UI-011.** Aksi **Daftarkan Nasabah** harus membuka proses khusus untuk mencari dan memilih orang dari data induk. Pembuatan individu baru hanya ditawarkan setelah pencarian dan menggunakan mekanisme data induk yang sudah tersedia. Data rumah tangga tidak dapat langsung menjadi nasabah individu. Konfirmasi individu, pemeriksaan duplikasi dan hubungan program existing harus dipertahankan.

**FR-UI-012.** Profil nasabah harus mengelompokkan **Profil**, **Pinjaman**, dan **Akses Akun**. Akses Akun hanya terlihat dan dapat digunakan admin. Pinjaman pada profil harus ditautkan ke rincian pinjaman; aksi Buat Pinjaman dari profil membawa nasabah terpilih ke formulir, dengan kewajiban tetap diperiksa server.

**FR-UI-013.** Pembuatan akun email/password, pemulihan akses, penonaktifan atau penautan akun yang memang tersedia harus dikerjakan dari konteks nasabah yang jelas. Tampilkan nama dan pengenal nasabah sebelum aksi. Jangan meminta admin memilih ulang nasabah pada setiap formulir. Jangan menampilkan password yang sudah tersimpan atau membawa password ke URL, log atau draft formulir.

### 4.4 Daftar dan pembuatan pinjaman — P0

**FR-UI-014.** Halaman Pinjaman harus menyediakan pencarian nomor/nama, filter status dan kategori, serta paginasi dengan pilihan 25 atau 50 baris. Pencarian dan filter berlaku pada seluruh data yang boleh diakses, bukan hanya baris yang sudah dimuat. Jumlah hasil, halaman aktif dan keadaan tidak ada hasil harus jelas.

**FR-UI-015.** Daftar harus menampilkan nomor pinjaman, nama nasabah, pokok, sisa pokok terverifikasi, status dan jatuh tempo relevan jika tersedia. Draft ditandai belum dicairkan; data yang tidak dapat dihitung tidak boleh ditampilkan sebagai nol. Aksi baris utama adalah **Lihat rincian**. Pencairan dan pembatalan pembayaran tidak boleh dijalankan langsung melalui klik baris.

**FR-UI-016.** Pencarian, filter dan nomor halaman harus dipertahankan saat membuka rincian dan kembali ke daftar. Perubahan filter harus kembali ke halaman pertama. Filter yang disimpan pada URL hanya berisi nilai nonrahasia dan harus divalidasi.

**FR-UI-017.** Aksi **Buat Pinjaman** harus membuka `/pinjaman/baru` dengan tiga tahap: **Nasabah**, **Detail & Jadwal**, dan **Tinjau & Simpan**. Pengguna dapat kembali ke tahap sebelumnya tanpa kehilangan input dalam sesi pengisian yang sama. Perubahan nasabah harus memeriksa ulang kewajiban dan perubahan nominal/tanggal/pola harus membatalkan pratinjau jadwal lama.

**FR-UI-018.** Formulir harus mempertahankan nasabah, kategori, tujuan, nominal pokok, rencana tanggal pencairan, penanggung jawab, catatan, pola mingguan/bulanan/tanggal khusus, jumlah angsuran dan tanggal jatuh tempo. Tenor, rentang jadwal dan total angsuran ditampilkan sebagai ringkasan yang mudah diperiksa. Formulir baru ini menyimpan draft existing, bukan menciptakan mekanisme persetujuan baru.

**FR-UI-019.** Jadwal khusus harus dapat diisi melalui baris **Tanggal** dan **Nominal** dengan aksi tambah/hapus baris; pengguna tidak diwajibkan mengetik format `tanggal,nominal` pada textarea. Validasi tanggal ganda, tanggal tidak valid, pokok positif dan total angsuran yang sesuai harus tetap berlaku. Pembulatan tetap mengikuti aturan existing.

**FR-UI-020.** Tahap Tinjau & Simpan harus menampilkan identitas nasabah, kewajiban existing, pokok, tujuan, kategori, penanggung jawab dan jadwal yang benar-benar akan disimpan. Sesudah berhasil, arahkan ke rincian draft yang baru dibuat dengan pesan keberhasilan. Klik ulang atau retry tidak boleh membuat pinjaman ganda.

**FR-UI-021.** Jika pengguna berpindah halaman saat input berubah dan belum disimpan, sistem harus menawarkan **Tetap mengisi** atau **Tinggalkan perubahan**. Kegagalan simpan mempertahankan input agar dapat diperbaiki. Penyimpanan draft formulir lintas sesi/perangkat tidak wajib; kata sandi dan berkas tidak boleh disimpan pada penyimpanan browser umum untuk tujuan ini.

### 4.5 Rincian, kontrak dan pencairan — P0

**FR-UI-022.** Bagian atas rincian harus memuat nomor, nasabah, status, pokok, total pembayaran terkonfirmasi, sisa pokok dan ringkasan jatuh tempo/tunggakan. Aksi utama harus sesuai status pinjaman, tanpa menampilkan formulir yang tidak relevan.

**FR-UI-023.** Rincian harus mempunyai bagian/tab lokal **Ringkasan**, **Jadwal**, **Pembayaran**, **Dokumen**, dan **Tindak Lanjut**. Tab ini hanya mengelompokkan informasi satu pinjaman; tidak menggantikan enam menu utama. Tab aktif dapat dimuat ulang melalui URL atau parameter yang divalidasi.

**FR-UI-024.** Draft harus menampilkan urutan pekerjaan **Lengkapi data → Periksa jadwal → Siapkan dan verifikasi kontrak → Catat pencairan**. Indikator harus berasal dari data tersimpan, bukan semata checkbox lokal. Tampilkan alasan konkret ketika pencairan belum dapat dilakukan dan tautan ke bagian yang perlu dilengkapi.

**FR-UI-025.** Pengeditan jadwal, pilihan versi template, preview, unggahan kontrak bertanda tangan, pemeriksaan tanda tangan, tanggal pencairan, label sumber dana, metode, referensi dan bukti pencairan opsional harus tetap tersedia pada konteks draft. Perubahan yang membatalkan kesesuaian kontrak harus ditampilkan jelas dan tetap diperiksa server.

**FR-UI-026.** Sebelum pencairan, tampilkan konfirmasi berisi nasabah, nomor, nominal, tanggal, label dana dan status kontrak. Persyaratan satu pinjaman aktif, kontrak wajib, validasi tanggal dan kebijakan tetap berlaku. Pinjaman aktif/lunas harus menampilkan arsip dokumen, pembayaran dan tindak lanjut sesuai fitur existing, bukan formulir pencairan baru.

### 4.6 Pembayaran — P0

**FR-UI-027.** Menu Pembayaran harus memisahkan tab **Perlu Verifikasi** dan **Riwayat Pembayaran**. Aksi Catat Pembayaran membuka pemilihan pinjaman yang dapat dibayar, kemudian rincian formulir dengan nasabah, nomor dan sisa yang terlihat. Aksi dari rincian pinjaman langsung menggunakan pinjaman tersebut.

**FR-UI-028.** Antrean verifikasi harus menampilkan nasabah, nomor pinjaman, nominal, tanggal bayar, tanggal pengiriman, bukti dan peringatan kemungkinan duplikat. Pemeriksaan dapat dibuka melalui panel/dialog responsif atau halaman khusus. Nominal, bukti dan aksi harus tetap terhubung dengan ID klaim yang sama saat daftar diperbarui.

**FR-UI-029.** Konfirmasi harus menyertakan ringkasan transaksi; penolakan dan pembatalan pembayaran harus meminta alasan dalam dialog khusus, bukan menyediakan banyak kolom alasan terbuka pada seluruh daftar. Setelah berhasil, antrean, riwayat, saldo, rincian, ringkasan dan laporan terkait harus diperbarui. Jika klaim sudah diproses petugas lain, tampilkan hasil terbaru dan hentikan pengiriman berulang.

**FR-UI-030.** Riwayat pembayaran harus mendukung pencarian nomor/nama, periode, status dan paginasi seluruh data yang boleh diakses. Riwayat pada rincian tetap terbatas pada pinjaman tersebut. Tanda terima, bukti dan status pembatalan harus dapat dibuka sesuai izin; data dibatalkan tidak dihapus atau disamarkan sebagai transaksi aktif.

### 4.7 Laporan dan pengaturan — P0

**FR-UI-031.** Laporan Pinjaman harus menyediakan periode transaksi, tanggal posisi, kategori, nasabah/nomor, wilayah snapshot, status, serta kolektabilitas ketika aktif. Filter utama ditampilkan lebih dahulu; filter lanjutan dapat dilipat. Sediakan **Terapkan filter** dan **Reset** dengan cakupan reset yang jelas.

**FR-UI-032.** Distribusi kategori/nasabah/wilayah, tren, daftar tunggakan dan ekspor terperinci dipindahkan ke halaman laporan. Filter aktif, definisi periode/posisi, data tidak lengkap dan waktu pembuatan harus tetap terbaca. CSV/PDF harus menggunakan filter yang sama dan mencakup seluruh hasil, walaupun tampilan dipaginasi. Perlindungan formula CSV tetap berlaku.

**FR-UI-033.** Pengaturan Pinjaman harus mengelompokkan konfigurasi yang sudah tersedia: kebijakan nominal/tenor/penjamin, kolektabilitas, template kontrak dan izin baca viewer. Admin mengubah konfigurasi sesuai kewenangan existing. Petugas hanya melihat informasi yang memang diizinkan, tanpa kontrol admin aktif. Pengelolaan template secara global dipusatkan di sini; pemilihan versi dan preview per pinjaman tetap tersedia pada rincian draft.

**FR-UI-034.** Label sumber dana tetap diisi saat pencairan sebagai metadata. PRD ini tidak menambahkan perpindahan kas otomatis atau kewajiban membuat master sumber dana baru. Pengaturan opsional yang belum ditetapkan tidak boleh menghalangi pencairan yang sah menurut kebijakan existing.

### 4.8 Tampilan, keadaan halaman dan aksesibilitas — P0

**FR-UI-035.** Seluruh komponen UI yang digunakan dalam cakupan perapihan modul Pinjaman Jamaah harus berasal dari Shadcn UI, termasuk header, tombol, kartu, input, tabel, badge dan dialog. Gunakan komponen Shadcn UI yang sudah tersedia di aplikasi atau tambahkan komponen Shadcn UI yang diperlukan, dengan token visual aplikasi untuk jarak dan tipografi. Satu area kerja memiliki satu aksi utama yang paling menonjol; aksi sekunder dan aksi berisiko harus dapat dibedakan. Status harus menggunakan teks dan boleh dilengkapi warna; warna saja tidak cukup.

**FR-UI-036.** Gunakan label Indonesia konsisten: **Draf**, **Aktif**, **Lunas**, **Dibatalkan**, **Perlu Rekonsiliasi**, **Menunggu Verifikasi**, **Terkonfirmasi**, dan **Ditolak**, sesuai jenis statusnya. Kode internal tetap menjadi urusan aplikasi. Nominal memakai format Rupiah, tanggal tampilan memakai format Indonesia yang konsisten, dan waktu yang relevan diberi zona WIB. Input tanggal tidak boleh mengubah tanggal bisnis akibat zona waktu.

**FR-UI-037.** Pada layar kecil, filter dan aksi harus dapat tersusun vertikal. Daftar dapat memakai kartu ringkas atau kolom prioritas dengan rincian yang dapat dibuka. Tabel jadwal/laporan boleh memiliki scroll horizontal lokal dengan penanda yang jelas, tetapi halaman keseluruhan tidak boleh meluber horizontal. Dialog harus muat dalam viewport dan dapat digulir sampai tombol aksi.

**FR-UI-038.** Kontrol harus memiliki label programatis, fokus keyboard terlihat dan urutan fokus logis. Dialog harus mengelola fokus, mendukung penutupan yang aman, dan mengembalikan fokus ke pemicu. Target sentuh aksi utama minimal 44 × 44 piksel atau memiliki area sentuh setara. Badge dan tombol harus tetap dapat dibedakan pada tema yang sudah didukung aplikasi.

**FR-UI-039.** Setiap daftar dan formulir harus membedakan keadaan **memuat**, **kosong**, **tidak ada hasil**, **gagal**, **tidak berwenang**, dan **berhasil**. Keadaan kosong memberikan aksi yang relevan. Error input ditampilkan di dekat kolom, tidak hanya melalui toast; fokus diarahkan ke masalah pertama. Tombol mutasi menampilkan proses dan mencegah pengiriman ganda tanpa menghilangkan input.

**FR-UI-040.** Sistem harus memuat data sesuai halaman dan konteks yang sedang dibuka. Membuka Ringkasan Pinjaman tidak boleh sekaligus memuat seluruh formulir admin, seluruh riwayat pembayaran dan seluruh rincian pinjaman. Pengurangan permintaan tidak boleh mengubah definisi laporan atau melewati pemeriksaan akses server.

### 4.9 Peningkatan lanjutan — P1

**FR-UI-041.** Preferensi jumlah baris dan filter nonrahasia dapat diingat per pengguna bila ada kebutuhan setelah uji penggunaan. Preferensi tidak boleh membuat filter lama tersembunyi atau terbawa ke pengguna lain setelah logout.

**FR-UI-042.** Pratinjau berkas langsung di panel pemeriksaan dapat ditambahkan untuk tipe yang didukung secara aman. Unduhan privat existing harus tetap menjadi pilihan ketika pratinjau tidak tersedia; tidak boleh mengubah bucket atau dokumen menjadi publik.

## 5. Di luar cakupan

- Desain ulang portal nasabah atau aplikasi lain seperti zakat, qurban dan Data Master secara menyeluruh.
- Perubahan hak akses, pembukaan pendaftaran mandiri, OTP atau SMS.
- Perubahan aturan pinjaman, bunga/biaya, mekanisme persetujuan berjenjang atau kolektabilitas otomatis baru.
- Integrasi kas/rekening, payment gateway, pengiriman pengingat otomatis atau penarikan dana dari program lain.
- Implementasi impor pinjaman historis yang sebelumnya ditunda.
- Penetapan redaksi kontrak final dan keputusan pengurus mengenai kebijakan operasional.
- Migrasi atau deployment Supabase online sebagai bagian dari penyusunan PRD.
- Perbaikan semua error lint legacy yang tidak terkait perubahan ini.

## 6. Pertimbangan desain dan alur

### 6.1 Hierarki halaman

| Halaman | Informasi awal | Informasi saat diminta |
|---|---|---|
| Ringkasan | Empat angka utama dan pekerjaan tertunda | Daftar lengkap melalui tautan |
| Nasabah | Pencarian dan daftar | Profil, pinjaman dan akses admin |
| Pinjaman | Pencarian, filter dan daftar | Formulir baru atau rincian pinjaman |
| Pembayaran | Antrean verifikasi dan jumlahnya | Pemeriksaan klaim, form bayar, riwayat |
| Laporan | Filter dan hasil ringkas | Distribusi terperinci dan ekspor |
| Pengaturan | Daftar kelompok konfigurasi | Formulir konfigurasi kelompok terpilih |

### 6.2 Alur utama

1. **Nasabah baru:** Nasabah → Daftarkan Nasabah → cari orang/konfirmasi individu → profil nasabah → Buat Pinjaman bila dibutuhkan.
2. **Pinjaman baru:** Pinjaman → Buat Pinjaman → Nasabah → Detail & Jadwal → Tinjau & Simpan → rincian draf → kontrak → konfirmasi pencairan.
3. **Bayar langsung:** Pinjaman → cari → rincian → Catat Pembayaran → tinjau → simpan → saldo dan riwayat diperbarui.
4. **Bukti dari nasabah:** Pembayaran → Perlu Verifikasi → periksa transaksi/bukti → konfirmasi atau tolak dengan alasan → antrean diperbarui.
5. **Koreksi:** Rincian pinjaman → Pembayaran → pilih transaksi terkonfirmasi → Batalkan Pembayaran → isi alasan dan konfirmasi → saldo, status dan laporan diperbarui.
6. **Akses akun:** Nasabah → profil → Akses Akun, khusus admin → pilih tindakan → verifikasi hasil.

### 6.3 Arah tampilan

Gunakan bahasa visual aplikasi yang sudah ada. Ringkasan memakai kartu angka yang singkat; halaman kerja mengutamakan daftar dan satu aksi utama. Formulir panjang dipisahkan ke langkah atau halaman khusus. Di desktop, informasi pendukung dapat berada di kolom samping; di ponsel, susun sesuai urutan keputusan pengguna. Nama, nomor pinjaman dan sisa pokok harus terlihat pada tindakan pembayaran atau pencairan agar konteks tidak bergantung pada ingatan.

Mockup belum menjadi lampiran PRD. Sebelum implementasi tampilan secara menyeluruh, siapkan wireframe desktop dan ponsel untuk sidebar, ringkasan, daftar pinjaman, formulir bertahap, rincian dan pemeriksaan pembayaran menggunakan kebutuhan ini.

## 7. Pertimbangan teknis dan perlindungan regresi

1. Pecah tanggung jawab `LoanManagement.tsx` menjadi halaman dan komponen sesuai navigasi. Gunakan ulang logika jadwal, perhitungan saldo, upload privat, dokumen, pembayaran dan recovery yang sudah diuji.
2. Perbarui rute di `App.tsx`, navigasi modul di `AppLayout.tsx`, serta tujuan pada `AppSwitcher.tsx`. Modul aktif dan menu terpilih harus mengikuti URL, termasuk ketika URL dibuka langsung dan state pemilih aplikasi sebelumnya berbeda.
3. Gunakan route guard dan pemeriksaan server existing. Menyembunyikan tombol tidak menggantikan pembatasan RPC, RLS atau Storage. Viewer dan mode nasabah tidak boleh mendapatkan menu/endpoint pengurus.
4. Paginasi dan pencarian daftar lengkap kemungkinan membutuhkan perluasan query/RPC. Kebutuhan ini harus ditinjau saat implementasi; jangan memakai proyeksi seluruh dashboard sebagai cara memuat seluruh tabel untuk setiap halaman. Endpoint baru, bila diperlukan, wajib mempertahankan hak dan privasi existing.
5. Ringkasan terverifikasi harus memakai sumber perhitungan yang sama dengan rincian/laporan. Jangan menghitung sisa pokok dari pembayaran `pending`, `rejected`, atau `cancelled`.
6. Simpan keberhasilan mutasi melalui mekanisme idempotensi existing. Setelah mutasi, perbarui cache lintas halaman yang berkaitan agar navigasi tidak menampilkan saldo/antrean lama. Tangani konflik transaksi dari petugas lain secara eksplisit.
7. Perubahan UI tidak boleh mengubah akun kas, ledger atau penerimaan existing. Kontrak bertanda tangan, snapshot historis, arsip versi, audit dan penyimpanan privat harus dipertahankan. Data tidak dihapus untuk menyederhanakan tampilan.
8. Auth email/password dan akun buatan admin tetap berlaku. Petugas/admin tetap dapat mencairkan, memverifikasi dan membatalkan dengan alasan sesuai izin existing. Kebijakan awal tetap hanya pokok, satu pinjaman aktif, kolektabilitas nonaktif, tanpa batas nominal/tenor atau penjamin wajib saat ini.
9. Baseline sebelumnya: 61 unit test, 14 fixture SQL, enam skenario browser dan pengujian integrasi/security lokal lulus. Lint global memiliki 271 error/16 peringatan yang tercatat; perubahan baru tidak boleh menambah pelanggaran pada cakupannya. Jumlah tes dapat berubah setelah refactor. Lihat [matriks task 9](matriks-hasil-task-9-lokal.md).
10. Target pengujian adalah Supabase lokal dengan data sintetis. Perubahan skema, bila dibutuhkan, harus berupa migrasi yang dapat ditinjau dan diuji tanpa reset database pengguna. Hasil pengujian lokal tidak otomatis menyatakan lingkungan operasional siap.

## 8. Kriteria penerimaan dan ukuran keberhasilan

### 8.1 Kriteria penerimaan P0

| ID | Skenario | Hasil yang wajib |
|---|---|---|
| AC-UI-01 | Admin/petugas memilih modul Pinjaman Jamaah | Enam menu terpisah tersedia; menu gabungan lama hilang; halaman awal adalah Ringkasan Pinjaman |
| AC-UI-02 | Membuka `/pinjaman`, deep link rincian dan tautan anchor lama | Tujuan baru yang sesuai terbuka, refresh serta Back/Forward berfungsi, menu aktif benar |
| AC-UI-03 | Viewer berizin/tanpa izin dan nasabah mencoba rute baru | Izin existing dipertahankan; dashboard/data pengurus tidak terbuka; ringkasan viewer existing tetap berfungsi |
| AC-UI-04 | Membuka ringkasan pada data kosong dan data berisi | Keadaan kosong jelas; angka cocok sumber; hanya pekerjaan relevan tampil, tanpa formulir administratif lengkap |
| AC-UI-05 | Mencari nama/nomor pinjaman yang berada di luar 50 pinjaman terbaru | Pinjaman ditemukan melalui pencarian seluruh data berizin dan dapat dibuka |
| AC-UI-06 | Filter daftar, buka rincian, lalu kembali | Filter, posisi halaman dan konteks daftar dipertahankan; perubahan filter kembali ke halaman pertama |
| AC-UI-07 | Pendaftaran memakai orang existing, nama sama atau data rumah tangga | Identitas dapat dibedakan, hubungan program terjaga, rumah tangga tidak langsung terdaftar sebagai individu |
| AC-UI-08 | Admin dan petugas membuka profil nasabah | Admin dapat mengelola akses dari nasabah terpilih; petugas tidak mendapat fungsi admin; password tidak terekspos |
| AC-UI-09 | Membuat draf dengan pola mingguan, bulanan dan tanggal khusus | Tiga tahap berjalan; validasi dan total benar; pratinjau lama gugur saat input relevan berubah; satu draf tersimpan saat retry |
| AC-UI-10 | Meninggalkan input belum tersimpan atau simpan gagal | Ada pilihan mempertahankan pengisian; kegagalan mempertahankan input dan memberi pesan kolom yang jelas |
| AC-UI-11 | Draf belum berkontrak, kontrak tidak sesuai atau ada kewajiban aktif | Hambatan pencairan dijelaskan; tindakan menuju bagian terkait; server tetap menolak pencairan tidak sah |
| AC-UI-12 | Mencairkan draf yang sah | Konfirmasi memuat konteks; data/kontrak/bukti tersimpan sesuai aturan; status dan daftar diperbarui |
| AC-UI-13 | Mencatat pembayaran, memverifikasi, menolak atau membatalkan | Konteks nasabah/pinjaman terlihat; alasan wajib sesuai tindakan; saldo, antrean dan riwayat konsisten; konflik petugas ditangani |
| AC-UI-14 | Mengekspor hasil dengan filter dan banyak halaman | CSV/PDF sesuai seluruh hasil filter, bukan halaman aktif saja; formula dinetralkan dan metadata filter/tanggal tetap ada |
| AC-UI-15 | Membuka dokumen serta melakukan koreksi pada pinjaman lama | Akses privat, snapshot dokumen, audit, perubahan laporan historis dan arsip pembatalan tetap benar |
| AC-UI-16 | Mengubah konfigurasi sebagai admin dan mencoba sebagai petugas | Konfigurasi berada di Pengaturan Pinjaman; hak ubah tetap sesuai server; kolektabilitas tidak otomatis aktif |
| AC-UI-17 | Alur utama pada 1366 × 768 dan 390 × 844 dengan keyboard/sentuhan | Tidak ada overflow halaman, aksi dan dialog terjangkau, label/fokus terbaca, menu dapat dipakai, dan seluruh komponen UI dalam cakupan perapihan berasal dari Shadcn UI |
| AC-UI-18 | Membandingkan keuangan dan menjalankan regresi setelah refactor | Fingerprint tabel kas/penerimaan tetap; perhitungan, konkurensi, RLS, akun dan upload privat tetap lulus |

### 8.2 Ukuran keberhasilan

- Seluruh AC P0 di atas lulus pada pengujian lokal dengan data sintetis dan bukti hasil dicatat.
- Dari halaman kerja terkait, membuka rincian memerlukan satu aksi; memulai Catat Pembayaran dari rincian memerlukan satu aksi. Langkah pencarian atau konfirmasi keamanan transaksi tidak dihitung sebagai perpindahan navigasi.
- Uji tugas oleh minimal satu admin dan satu petugas: mencari pinjaman, membuat draf, mencatat pembayaran, memeriksa klaim dan mengunduh laporan. Target minimal empat dari lima tugas selesai per orang tanpa arahan langkah demi langkah. Catat hambatan; ini target validasi, bukan hasil yang sudah diperoleh.
- Dengan 1.000 pinjaman dan 12.000 pembayaran sintetis pada lingkungan uji yang dicatat, target daftar awal/ringkasan siap digunakan maksimal tiga detik dan rincian setelah dipilih maksimal dua detik setelah login. Ukur lima kali setelah pemanasan, laporkan median dan maksimum beserta perangkat/browser/lingkungan. Pengujian harus memakai API lokal sebenarnya; hasil mock hanya menjadi bukti tambahan. Kriteria ini memeriksa halaman yang diuji, bukan jaminan performa produksi.
- Unit test, build, regresi database dan browser terkait lulus; lint pada kode baru/perubahan tidak menambah masalah. Kegagalan lint global baseline tetap dilaporkan secara terpisah.

## 9. Pertanyaan terbuka

Tidak ada keputusan produk yang menghalangi penyusunan task list. Nama menu dan struktur enam halaman pada dokumen ini menjadi usulan awal yang dapat ditinjau pengguna.

1. Apakah urutan menu dan label **Ringkasan Pinjaman**, **Nasabah**, **Pinjaman**, **Pembayaran**, **Laporan Pinjaman**, dan **Pengaturan Pinjaman** perlu penyesuaian setelah wireframe ditinjau?
2. Apakah pratinjau berkas langsung pada panel verifikasi perlu diprioritaskan setelah P0, atau unduhan privat cukup untuk tahap awal?
3. Ketersediaan admin/petugas untuk uji tugas serta karakteristik perangkat operasional perlu dicatat saat validasi.

Keputusan operasional yang masih terbuka pada [kesiapan operasional](kesiapan-operasional-pinjaman.md) tetap mengikuti proses program pinjaman; perapihan tampilan ini tidak menetapkannya secara otomatis.
