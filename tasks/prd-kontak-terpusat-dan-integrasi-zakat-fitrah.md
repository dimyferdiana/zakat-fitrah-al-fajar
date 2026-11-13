# PRD Kontak Terpusat dan Integrasi Zakat Fitrah serta Qurban

Tanggal penyusunan 12 November 2026. Status rancangan produk untuk ditinjau dan diturunkan menjadi task implementasi.

## 1. Pendahuluan

Data pribadi jamaah digunakan saat mencatat muzakki, mustahik, peserta Qurban, penerima distribusi, dan pengguna aplikasi. Pengurus membutuhkan satu sumber identitas yang dapat dipilih dari setiap alur tersebut. Modul Data Master menjadi tempat pengelolaan Kontak. Aplikasi UPZ Al-Fajar menangani keikutsertaan dan transaksi Zakat Fitrah, sedangkan modul Qurban menangani peserta, slot hewan, pembayaran dan distribusi pada setiap event.

Setiap Kontak mewakili satu individu. Individu dapat menjadi muzakki, mustahik, pengurus, atau pengguna aplikasi sesuai hubungan dan izin yang dimilikinya. Keluarga dicatat melalui hubungan antar-Kontak. Data lama yang mewakili rumah tangga memerlukan pemetaan tersendiri agar transaksi historis tetap dapat ditelusuri.

Dokumen ini mengikuti kebutuhan pada Note.md, jawaban klarifikasi pengguna, dan pemeriksaan source repository. Temuan repository merupakan gambaran implementasi saat diperiksa. Inventaris data operasional dilakukan pada awal tahap 1.

Sumber kebutuhan dan panduan tersedia pada [Note.md](../prd-task/generations/active/Note.md) dan [create-prd.md](../prd-task/create-prd.md).

### 1.1 Keputusan pengguna

| Keputusan | Ketentuan |
|---|---|
| Bentuk Kontak | Satu Kontak selalu individu. Keluarga disimpan sebagai hubungan antar-Kontak. |
| Perubahan identitas | Admin dan petugas dapat memperbarui identitas utama. Setiap perubahan memiliki riwayat. |
| Migrasi | Pencatatan baru wajib terhubung ke Kontak. Data lama dipetakan bertahap sambil operasi berjalan. |
| Fokus penerapan | Data Master, aplikasi UPZ Al-Fajar untuk Manajemen Zakat Fitrah, serta integrasi identitas pada Qurban sesuai perluasan kebutuhan pengguna. |
| Penyusunan | Satu PRD induk dengan lima tahap yang mempunyai kriteria penerimaan tersendiri. Tahap 5 memuat dua bagian integrasi Qurban. |

### 1.2 Kondisi awal dari repository

| Area | Kondisi yang ditemukan | Implikasi kebutuhan |
|---|---|---|
| Data Master Warga | `DataMasterWarga.tsx` menggunakan `useMuzakkiList` dan tabel `muzakki` | Tampilan Kontak membutuhkan definisi individu dan pembeda dari partisipasi sebagai muzakki. |
| Pencatatan pemasukan | `useMuzakki.ts` dapat memilih atau membuat baris `muzakki` | Penambahan saat transaksi perlu menggunakan aturan Kontak bersama. |
| Mustahik | `useMustahik.ts` menyimpan nama, alamat, telepon dan `orang_id` opsional | Identitas utama dan atribut program perlu memiliki sumber yang jelas. |
| Impor | `WargaImportDialog.tsx` memasukkan data langsung ke `muzakki`. Mustahik mempunyai alur impor tahun lalu | Impor memerlukan pemilihan atau pembuatan Kontak serta hasil per baris yang dapat ditinjau. |
| Identitas existing | Migrasi 065–070 memuat perlindungan identitas, pemetaan mustahik, serta penanganan individu dan rumah tangga | Pengembangan memakai fondasi dan ID existing melalui rancangan kompatibilitas. |
| Akun | Profil pengurus berada di `public.users`, autentikasi berada di Supabase Auth | Hubungan akun dengan Kontak perlu didukung pada undangan, pembuatan, dan pemulihan data akun existing. |
| Riwayat | Sebagian riwayat orang dan transaksi sudah tersedia | Daftar dan rincian muzakki/mustahik perlu menampilkan riwayat sesuai hak akses dan relasi aktual. |
| Peserta Qurban | `AddPesertaDialog.tsx` dan `SlotAssignDialog.tsx` memilih atau membuat data melalui `muzakki`. `qurban_shares.muzakki_id` menghubungkan peserta ke slot hewan | Pilihan peserta perlu memakai Kontak individu serta hubungan partisipasi Qurban yang jelas. |
| Kupon Qurban | `qurban_coupons` memakai `recipient_type` dan `recipient_id` untuk muzakki/mustahik. Tersedia kupon terkait share serta kupon distribusi pengurban dengan jumlah tertentu | Identitas penerima, sumber hak, kuota, event dan status penebusan perlu dapat ditelusuri bersama. |
| Pemilih penerima | `MustahikCouponPicker.tsx` memakai mustahik aktif dengan batas muat 200 | Pencarian dan pemilihan penerima perlu menjangkau seluruh hasil berizin melalui paginasi. |
| Qurban lama | `QurbanForm.tsx` dan `useQurban.ts` menyimpan identitas pendaftar serta nama peserta pada model registrasi lama | Inventaris menentukan pemakaian entry point lama dan rekonsiliasi ke model event/hewan/share. |
| Dokumen dan scan | Bukti PDF, gambar/cetak kupon, unduhan massal, dan `QurbanScan.tsx` memakai identitas peserta/penerima | Perubahan Kontak perlu memperhitungkan identitas historis, token kupon, izin dan riwayat penebusan. |

## 2. Tujuan

1. Seluruh pencatatan muzakki, mustahik, dan akun baru pada tahap yang sudah diaktifkan mempunyai referensi Kontak yang valid, termasuk melalui impor dan permintaan API.
2. Informasi pribadi yang ditampilkan pada daftar program berasal dari identitas Kontak terkini, dengan konteks historis tersedia untuk transaksi dan dokumen terdahulu.
3. Pengurus dapat memilih Kontak existing atau menambahkan Kontak saat bekerja dari halaman Zakat Fitrah.
4. Pengurus dapat membuka riwayat transaksi dari individu yang dipilih dan mengenali cakupan data rumah tangga lama.
5. Perubahan identitas, hubungan program, dan tautan akun dapat ditelusuri melalui riwayat pelaku, waktu, dan alasan yang relevan.
6. Pemetaan bertahap mempertahankan akses operasional terhadap data lama serta menyediakan daftar pekerjaan yang perlu diselesaikan.
7. Pendaftaran peserta dan penerima Qurban baru mengacu ke Kontak pada tahap 5, dengan slot, hak distribusi, pembayaran dan riwayat yang dapat direkonsiliasi per event.

## 3. Istilah dan aturan data

| Istilah | Arti |
|---|---|
| Kontak | Identitas satu individu dengan ID stabil. |
| Hubungan keluarga | Keanggotaan atau hubungan antarindividu dalam satu keluarga, dengan penanggung jawab bila tersedia. |
| Muzakki | Hubungan individu dengan pencatatan zakat. Seseorang dapat membayar atas nama keluarga sesuai aturan transaksi. |
| Mustahik | Hubungan individu dengan program penerima, termasuk kategori, status, dan atribut kelayakan program. |
| Akun | Identitas autentikasi dan hak akses aplikasi yang ditautkan ke individu. |
| Catatan rumah tangga lama | Rekaman sumber yang mewakili keluarga atau mempunyai jenis identitas yang perlu ditinjau. |
| Snapshot historis | Informasi identitas yang disimpan atau tersedia pada saat transaksi/dokumen dibuat. |
| Pemetaan | Penetapan hubungan catatan sumber ke Kontak dengan bukti dan keputusan petugas. |
| Peserta/pengurban | Individu yang tercatat pada partisipasi Qurban dan dapat mempunyai beberapa share sesuai aturan event. |
| Share Qurban | Satu slot partisipasi pada hewan, dengan nominal dan status pembayaran. |
| Penerima Qurban | Individu yang ditetapkan memperoleh hak distribusi pada event dan kategori penerima tertentu. |
| Hak distribusi | Dasar penerbitan kupon, termasuk hak pengurban atau penerima yang dipilih pengurus, beserta kuota dan event. |

Jumlah jiwa pada transaksi Zakat Fitrah menyatakan cakupan pembayaran. Pengisian jumlah jiwa dapat dilakukan sesuai alur transaksi yang berlaku. Penambahan nama anggota keluarga dapat dilakukan ketika informasinya tersedia.

Identitas Kontak dan keikutsertaan program mempunyai status masing-masing. Satu Kontak dapat memiliki beberapa hubungan program. Hubungan identitas akun dan pemberian hak akses diperiksa sebagai operasi tersendiri.

## 4. Cerita pengguna

| ID | Pengguna dan kebutuhan | Manfaat |
|---|---|---|
| US-01 | Petugas mencari individu sebelum mencatat pemasukan | Transaksi merujuk orang yang benar. |
| US-02 | Petugas menambahkan individu dari formulir transaksi | Pencatatan dapat diselesaikan tanpa berpindah modul. |
| US-03 | Petugas memakai individu existing sebagai mustahik | Identitas orang yang sama tersedia pada beberapa program. |
| US-04 | Admin atau petugas memperbarui telepon/alamat dari Kontak | Daftar program menampilkan informasi terkini. |
| US-05 | Admin memeriksa pelaku dan isi perubahan identitas | Koreksi dapat ditelusuri. |
| US-06 | Pengurus membuka rincian muzakki dan riwayatnya | Transaksi lintas tahun dapat diperiksa dengan cakupan yang jelas. |
| US-07 | Pengurus membedakan dua individu bernama sama | Pemilihan didukung ID, alamat, telepon dan hubungan keluarga. |
| US-08 | Admin memilih Kontak saat mengundang pengguna | Identitas akun dan role yang diberikan dapat diperiksa. |
| US-09 | Petugas meninjau data lama yang belum terhubung | Pemetaan dapat dilakukan selama operasi berjalan. |
| US-10 | Pengurus mengimpor daftar individu dan partisipasi | Hasil impor, duplikasi potensial dan kegagalan dapat ditinjau per baris. |
| US-11 | Petugas memilih Kontak saat mendaftarkan peserta atau mengisi slot hewan | Individu yang sama dapat digunakan lintas event dan program. |
| US-12 | Pengurus memilih penerima distribusi Qurban dari Kontak dan data mustahik yang tersedia | Penetapan penerima tercatat sesuai konteks event. |
| US-13 | Petugas memindai kupon dan memeriksa identitas serta sumber hak | Penebusan sesuai event dan kupon yang berlaku. |
| US-14 | Pengurus membuka profil Kontak untuk memeriksa partisipasi dan penerimaan Qurban lintas tahun | Riwayat peserta, pembayaran dan distribusi dapat ditelusuri. |

## 5. Tahap pelaksanaan dan dependensi

| Tahap | Cakupan utama | Dependensi | Syarat penerimaan tahap |
|---|---|---|---|
| 1. Fondasi Kontak | Inventaris, identitas individu, hubungan keluarga, pemetaan awal, audit, akses, navigasi Kontak | Fondasi identitas existing | FR-KON-001–012 dan 032–038 terkait tahap 1 lulus. Relasi keuangan dan konsumen shared tervalidasi. |
| 2. Integrasi Zakat Fitrah | Daftar Muzakki/Mustahik, tambah langsung, impor, transaksi massal, riwayat dasar | Tahap 1 | FR-KON-013–024 lulus. Semua jalur penambahan baru dalam cakupan wajib terhubung. |
| 3. Akun pengguna | Tautan Kontak, undangan, pembuatan, penyelesaian profil akun existing | Tahap 1 dan regresi tahap 2 | FR-KON-025–031 lulus. Pembuatan dan penerimaan undangan teruji menyeluruh. |
| 4. Penyempurnaan operasional | Antrean masalah data, penyelesaian pemetaan, pencarian dan riwayat lintas periode, uji tugas pengurus | Tahap 2 dan 3 | FR-KON-039–043 lulus. Hambatan operasional dan cakupan pemetaan tersisa tercatat. |
| 5A. Identitas peserta Qurban | Pemilihan/tambah Kontak, peserta, slot hewan, pembayaran, bukti dan pemetaan registrasi lama | Tahap 1–2 dan kontrak akun tahap 3 untuk petugas | FR-KON-044–047, 052–055 terkait peserta dan AC-KON-23–25 serta 29–31 lulus. |
| 5B. Penerima dan distribusi Qurban | Penetapan penerima per event, kupon, scan, unduhan, riwayat serta audit | Tahap 5A dan antrean pemeriksaan tahap 4 | FR-KON-048–055 serta AC-KON-26–31 lulus. |

Validasi, pencegahan duplikasi dasar, akses, riwayat perubahan, dan pengujian menyertai tahap yang memperkenalkan operasi tersebut. Tahap 4 melengkapi alat penyelesaian masalah dan pengalaman penggunaan.

Inventaris konsumen Qurban dilakukan sejak tahap 1 karena struktur identitas dipakai bersama. Tahap 5A dan 5B menjadi bagian penerimaan PRD ini. Pembagian keduanya memberi ukuran pekerjaan yang dapat diuji secara terpisah. Rancangan detail slot, kuota dan aturan penebusan existing didokumentasikan sebelum implementasi tahap 5.

Setiap tahap dapat diturunkan menjadi daftar task tersendiri dengan referensi FR dan AC dokumen ini. Tahap 1 mencakup rancangan kompatibilitas dan prosedur pemulihan sebelum perubahan skema diterapkan. Estimasi waktu ditentukan setelah inventaris dan pemetaan jalur tulis.

## 6. Persyaratan fungsional

### 6.1 Fondasi Kontak dan keluarga

- **FR-KON-001.** Sistem menyediakan halaman Kontak pada Data Master dengan nama, alamat, telepon, status, ID dan akses ke rincian. Petugas dapat mencari seluruh data yang diizinkan melalui paginasi server.
- **FR-KON-002.** Kontak baru mewakili individu dan mempunyai ID stabil serta nama lengkap wajib. Alamat, telepon, RT/RW, NIK dan atribut pribadi tambahan dapat diisi sesuai ketersediaan. Nilai yang belum tersedia ditampilkan dengan keterangan yang jelas. Kelengkapan khusus suatu program divalidasi pada pendaftaran program tersebut.
- **FR-KON-003.** Sistem mendukung hubungan keluarga, pilihan penanggung jawab, serta penambahan anggota. Hubungan ke diri sendiri dan pasangan hubungan yang sama dua kali harus ditolak. Perubahan hubungan dicatat dalam audit.
- **FR-KON-004.** Sistem mempertahankan referensi rumah tangga dan jenis identitas catatan lama untuk ditinjau. Petugas dapat mengonfirmasi individu existing atau membuat individu anggota dan menghubungkannya ke sumber. Penetapan pemilik transaksi lama memerlukan keputusan eksplisit sesuai cakupan transaksi sumber.
- **FR-KON-005.** Daftar Kontak menyediakan pembeda nama sama melalui ID, alamat, telepon dan hubungan keluarga yang tersedia. Telepon yang digunakan bersama dapat dihubungkan ke beberapa individu.
- **FR-KON-006.** Pembuatan Kontak menampilkan kandidat duplikat sebelum penyimpanan berdasarkan atribut yang tersedia. Petugas dapat memilih kandidat atau melanjutkan pembuatan individu berbeda dengan alasan. NIK terisi yang sama harus mengikuti pemeriksaan keunikan identitas existing. Konflik data lama masuk antrean peninjauan.
- **FR-KON-007.** Admin dan petugas dapat menambah serta memperbarui identitas. Perubahan nama, identitas, pemetaan dan status harus merekam alasan. Audit menyimpan pelaku, waktu, nilai sebelum/sesudah, dan sumber alur tanpa merekam kredensial.
- **FR-KON-008.** Jika dua petugas mengubah Kontak yang sama, penyimpanan kedua mendeteksi perubahan versi. Sistem menampilkan data terbaru dan memberi pilihan meninjau ulang input agar perubahan pertama tetap dapat diperiksa.
- **FR-KON-009.** Kontak dapat dinonaktifkan dan diaktifkan sesuai izin. Kontak nonaktif tetap dapat ditemukan dalam riwayat dan untuk koreksi transaksi lama. Pemilihan baru menjelaskan status serta menyediakan jalur aktivasi bagi pengurus yang berwenang.
- **FR-KON-010.** Inventaris migrasi menghasilkan jumlah individu, rumah tangga, jenis belum jelas, tautan program, akun belum terhubung, kandidat duplikat dan referensi rusak. Laporan menyertakan cakupan serta waktu pemeriksaan.
- **FR-KON-011.** Pemetaan lama dapat disimpan per catatan atau batch dengan hasil berhasil, tertahan, dan gagal. Pengulangan batch melanjutkan hasil yang belum selesai berdasarkan referensi sumber yang stabil. Keputusan pemetaan dan koreksi dapat ditelusuri.
- **FR-KON-012.** Pemetaan mempunyai status belum ditinjau, perlu keputusan, dan terhubung. Operasi existing terhadap catatan lama menyediakan konteks sumber. Saat operasi membuat hubungan program atau akun baru, sistem memandu pemilihan/pembuatan Kontak yang valid terlebih dahulu.

### 6.2 Muzakki dan mustahik pada Zakat Fitrah

- **FR-KON-013.** Navigasi UPZ menggunakan label Daftar Muzakki dan Daftar Mustahik. Daftar Muzakki menampilkan individu yang mempunyai hubungan muzakki atau transaksi zakat yang terpetakan. Semua Kontak dapat dicari pada pemilih untuk pendaftaran/pembayaran baru. Rancangan migrasi mempertahankan akses ke catatan muzakki lama yang masih ditinjau.
- **FR-KON-014.** Daftar Muzakki memuat nama, alamat, telepon, status hubungan serta aksi Riwayat Transaksi. Informasi pribadi terkini dibaca melalui Kontak terkait.
- **FR-KON-015.** Tambah Muzakki mendukung pencarian Kontak existing dan Tambah Kontak. Kontak baru tersedia di Data Master setelah berhasil disimpan. Hubungan muzakki yang sama dipakai kembali ketika individu sudah terdaftar.
- **FR-KON-016.** Pencatatan pemasukan memilih Kontak pembayar dan mempertahankan jenis pembayaran, tahun, jumlah jiwa, nominal, serta aturan perhitungan yang berlaku. Pembayaran atas nama keluarga menyimpan konteks penanggung jawab dan cakupan pembayaran.
- **FR-KON-017.** Daftar Mustahik menggunakan identitas Kontak dan atribut program berupa kategori/asnaf, jumlah anggota, catatan program serta status. Data Master dan UPZ menampilkan hubungan mustahik yang sama melalui izin yang sesuai.
- **FR-KON-018.** Tambah Mustahik mendukung Kontak existing atau pembuatan Kontak langsung. Relasi baru selalu menunjuk individu. Pengulangan pendaftaran untuk individu yang sama menunjukkan hubungan existing dan tindakan yang dapat dilakukan.
- **FR-KON-019.** Perubahan identitas dari halaman program mengarahkan pengurus ke editor Kontak yang berwenang. Perubahan atribut program disimpan pada hubungan program. Setelah berhasil, daftar dan rincian terkait menampilkan hasil terkini.
- **FR-KON-020.** Pembuatan Kontak beserta hubungan program menjamin hasil yang konsisten saat gagal atau diulang. Jika Kontak sudah tersimpan ketika langkah berikutnya gagal, formulir mempertahankan ID tersebut dan menawarkan melanjutkan operasi. Percobaan ulang dengan permintaan sama menggunakan hasil yang sudah dibuat.
- **FR-KON-021.** Aturan Kontak berlaku pada formulir utama, tambah langsung di transaksi, impor CSV/Excel, impor mustahik tahun lalu, transaksi massal dan API terkait. Server memvalidasi referensi, status dan kewenangan pada setiap operasi baru yang sudah diaktifkan.
- **FR-KON-022.** Impor menyediakan pratinjau, kandidat Kontak existing, keputusan pakai/buat/tunda, validasi per baris, dan ringkasan hasil. Impor tahun lalu memakai identitas existing serta meninjau ulang atribut program yang perlu diperbarui. Pengulangan impor dengan referensi batch/baris sama menggunakan hasil sebelumnya.
- **FR-KON-023.** Rincian Muzakki menampilkan transaksi yang terhubung, filter tahun/periode, tanggal, jenis, nominal uang/beras, status dan tautan rincian. Transaksi batal/koreksi dan cakupan rumah tangga diberi penanda. Rincian Mustahik menyediakan riwayat distribusi dengan prinsip yang sama.
- **FR-KON-024.** Dokumen dan transaksi historis mempertahankan identitas yang tersimpan saat pencatatan. Jika sumber historis hanya menyediakan identitas terkini, UI menyatakan keterbatasan cakupannya. Koreksi dokumen mengikuti mekanisme audit/versi existing. Total keuangan dapat direkonsiliasi terhadap sumber sebelum dan sesudah perubahan.

### 6.3 Pengguna dan autentikasi

- **FR-KON-025.** Setiap akun aplikasi baru dalam cakupan mempunyai tautan ke individu sebelum aktif digunakan. Pembuatan profil pengurus dan undangan menyediakan pilihan Kontak existing atau Tambah Kontak bagi admin yang berwenang.
- **FR-KON-026.** Istilah pengguna biasa mencakup viewer dan akun nasabah yang tersedia pada aplikasi. Tautan nasabah existing ke individu menjadi bagian inventaris kompatibilitas. Jenis profil, kemampuan dan mode akses setiap akun diperiksa sesuai mekanisme existing.
- **FR-KON-027.** Undangan menyimpan referensi Kontak, email tujuan, role yang dipilih, pengundang dan masa berlaku. Saat diterima, sistem memvalidasi ulang undangan, hak pemberian role, keberadaan Kontak dan akun yang sudah terhubung. Tautan akun ditetapkan melalui operasi server yang diaudit.
- **FR-KON-028.** Rancangan awal mendukung satu akun aktif per individu dengan kemampuan sesuai aplikasi, termasuk pengurus yang juga nasabah. Konflik beberapa akun existing untuk satu individu masuk peninjauan admin. Pengulangan permintaan pembuatan/penerimaan undangan menghasilkan hubungan konsisten.
- **FR-KON-029.** Perubahan nama/alamat/telepon Kontak dan perubahan email login mempunyai alur validasi masing-masing. Perubahan identitas umum oleh petugas tetap mengikuti izin Kontak. Perubahan role, status akun dan kredensial mengikuti izin pengelolaan akun existing.
- **FR-KON-030.** Akun lama yang belum terhubung tetap mempunyai jalur masuk dan operasi sesuai kebijakan akses existing selama pemetaan bertahap. Admin memperoleh daftar akun untuk dipetakan. Pembuatan akun administratif langsung melalui Supabase dilengkapi prosedur pembuatan/penautan profil sebelum akun digunakan.
- **FR-KON-031.** Penonaktifan Kontak, hubungan program, dan akun mempunyai dampak yang dijelaskan sebelum konfirmasi. Penonaktifan akun mengikuti pencabutan akses existing. Hak melihat direktori Kontak dan data pribadi ditetapkan server sesuai role dan mode sesi.

### 6.4 Akses, kompatibilitas, dan tampilan

- **FR-KON-032.** Admin dan petugas dapat membaca/mengelola Kontak sesuai keputusan pengguna. Viewer dan nasabah memperoleh data yang diizinkan oleh kemampuan existing. Pengujian meliputi API, ekspor dan akses langsung ke URL.
- **FR-KON-033.** Akses audit identitas mengikuti izin pengurus. Ekspor data Kontak mempunyai pemeriksaan izin, pembatasan kolom sensitif dan pencatatan pelaku. Pencarian identitas sensitif menggunakan state aplikasi yang sesuai.
- **FR-KON-034.** Label Warga pada cakupan Data Master menjadi Kontak. URL baru yang diusulkan adalah `/data-master/kontak`. Tautan lama `/data-master/warga` dan tautan rincian existing memiliki pemetaan tujuan dan mempertahankan konteks yang masih valid.
- **FR-KON-035.** Daftar memakai paginasi server, pencarian seluruh data berizin, keadaan memuat/kosong/gagal, serta filter aktif yang terlihat. Perubahan filter kembali ke halaman pertama. Navigasi ke rincian dan kembali mempertahankan konteks daftar.
- **FR-KON-036.** Komponen antarmuka dalam cakupan menggunakan Shadcn UI yang tersedia pada repository. Pemilih Kontak dapat dioperasikan dengan keyboard, menampilkan pembeda individu, dan menyediakan Tambah Kontak saat hasil belum ditemukan.
- **FR-KON-037.** Formulir dan dialog menjaga input ketika gagal, menandai kolom bermasalah, mengarahkan fokus, menahan pengiriman berulang saat proses, dan menyediakan konfirmasi untuk perubahan belum tersimpan. Tampilan diuji pada 1366 × 768 dan 390 × 844.
- **FR-KON-038.** Setiap tahap melindungi referensi transaksi, perhitungan, izin dan dokumen pada Zakat, Qurban serta Pinjaman yang menggunakan identitas shared. Migrasi diuji pada salinan skema/data sintetis, mempunyai laporan sebelum/sesudah dan prosedur pemulihan yang dapat dijalankan.

### 6.5 Penyempurnaan operasional

- **FR-KON-039.** Pengurus memperoleh antrean akun/program belum terhubung, identitas belum jelas, konflik identitas dan kandidat duplikat. Setiap masalah mempunyai sumber, status, keputusan, pelaku dan waktu penyelesaian.
- **FR-KON-040.** Antrean menyediakan filter jenis masalah, status dan sumber serta tautan ke data terkait. Kandidat yang dinyatakan individu berbeda menyimpan keputusan agar dapat ditelusuri ketika ditinjau ulang.
- **FR-KON-041.** Admin dapat memperbaiki tautan yang keliru setelah memeriksa dampak pada transaksi, keluarga, akun dan program lain. Sistem menampilkan referensi yang terdampak sebelum konfirmasi serta menyimpan alasan dan jejak koreksi.
- **FR-KON-042.** Profil Kontak menampilkan informasi terkini, hubungan keluarga, hubungan program yang diizinkan dan riwayat perubahan. Riwayat transaksi Zakat Fitrah dapat ditelusuri lintas periode dengan penanda sumber lama.
- **FR-KON-043.** Panduan pengurus menjelaskan tambah langsung, pemilihan nama sama, pembaruan identitas, pemetaan rumah tangga lama dan pengelolaan akun. Uji tugas admin/petugas menghasilkan hambatan dan tindak lanjut yang dicatat sebelum penerimaan akhir.

### 6.6 Integrasi identitas pada Qurban

- **FR-KON-044.** Tambah Peserta pada daftar peserta dan pengisian slot di rincian hewan memakai pemilih Kontak bersama. Kontak dapat ditambahkan langsung dengan pemeriksaan kandidat duplikat. Label yang mengacu pada orang menggunakan Kontak atau Peserta Qurban sesuai konteks. Hubungan partisipasi Qurban disimpan per event dan share.
- **FR-KON-045.** Satu individu dapat mempunyai beberapa share pada hewan atau event sesuai aturan partisipasi. Sistem memvalidasi kapasitas hewan, urutan slot dan kepemilikan share di server. Pendaftaran baru, retry dan dua petugas yang mengisi slot bersamaan menghasilkan alokasi konsisten dan pesan konflik yang dapat ditindaklanjuti.
- **FR-KON-046.** Formulir membedakan individu peserta, pendaftar/pembayar bila berbeda, serta nama atas nama yang memang tersedia pada sumber registrasi. Referensi individu diketahui memakai Kontak. Nama atas nama lama dan konteks sumber disimpan untuk ditinjau. Aturan tambahan bagi perwakilan atau atas nama almarhum ditetapkan dari contoh operasional sebelum alurnya diaktifkan.
- **FR-KON-047.** Daftar peserta, rincian hewan/share, status pembayaran dan bukti menggunakan relasi Kontak yang sama. Nominal, status pembayaran, biaya hewan/perawatan dan event tetap dapat direkonsiliasi terhadap sumber bisnis. Hubungan dengan Kontak tersedia pada riwayat partisipasi, dan informasi dokumen historis mengikuti FR-KON-024.
- **FR-KON-048.** Penerima distribusi Qurban ditetapkan per event dengan referensi Kontak serta sumber/kategori hak. Data mustahik menjadi sumber kandidat yang dapat dipilih dan ditinjau pengurus. Keputusan penerimaan Qurban dan kategori kelayakan Zakat Fitrah dikelola pada konteks program masing-masing. Individu baru dapat dibuat dari alur penetapan penerima menggunakan aturan Kontak bersama.
- **FR-KON-049.** Pencarian dan pemilihan massal penerima menjangkau seluruh data berizin melalui paginasi server. UI menjelaskan apakah Pilih Semua mencakup halaman atau seluruh hasil filter. Penerbitan menyertakan ringkasan event, kategori, jumlah individu dan jumlah kupon, lalu melaporkan hasil per penerima.
- **FR-KON-050.** Setiap kupon mempunyai hubungan yang dapat divalidasi ke event, Kontak penerima dan sumber hak. Pemeriksaan duplikasi memakai sumber hak, share bila relevan, kuota dan event. Individu dengan beberapa share atau kategori hak tetap dapat ditelusuri melalui satu Kontak. Rancangan teknis menginventaris batas satu kupon mustahik per event, kupon terkait share, dan kupon distribusi pengurban berjumlah tertentu yang tersedia pada kode, lalu mempertahankan kuota sah dalam transisi identitas.
- **FR-KON-051.** Penerbitan kupon baru/ulang, pembatalan dan penebusan memvalidasi status, kedaluwarsa, event yang dipilih serta kewenangan di server. Retry penerbitan memakai hasil yang sudah dibuat sesuai referensi permintaan. Dua pemindaian serentak atas token yang sama menghasilkan satu keberhasilan penebusan, disertai pelaku dan waktu yang dapat diperiksa.
- **FR-KON-052.** Kupon yang sudah diterbitkan tetap dapat dikenali melalui nomor/token dan referensi penerbitannya selama pemetaan Kontak. Koreksi identitas penerima menampilkan dampak pada hak dan kupon, mempertahankan jejak pemilik sebelumnya serta status penebusan, dan memerlukan alasan. Cetak ulang, unduhan PDF/gambar dan unduhan massal menyajikan identitas penerbitan atau versi koreksi yang dapat ditelusuri.
- **FR-KON-053.** Profil Kontak menyediakan riwayat Qurban berdasarkan izin, meliputi event/tahun, hewan, share, nominal/status pembayaran serta kupon dan status penebusan. Riwayat sumber registrasi lama dan hasil konversinya diberi referensi asal agar agregasi memakai satu pencatatan bisnis yang sama. Dashboard membedakan jumlah share, individu peserta unik dan penerima sesuai labelnya.
- **FR-KON-054.** Migrasi menginventaris `qurban_registrations`, `qurban_participants`, `qurban_shares`, penerima muzakki/mustahik dan `qurban_coupons` beserta konsumen API-nya. Sumber berupa nama bebas atau rumah tangga masuk alur peninjauan. Bila entry point registrasi lama masih aktif, pembuatan identitas baru melalui jalur tersebut mengikuti validasi Kontak sejak aktivasi tahap 5A.
- **FR-KON-055.** Pengujian Qurban mencakup peserta baru/existing/nama sama, beberapa share, penerima lintas kategori, daftar melebihi 200 orang, slot bersamaan, penerbitan batch sebagian gagal, retry, kupon lama, koreksi tautan, pembatalan, kedaluwarsa dan pemindaian serentak. Role/mode sesi, akses identitas, ekspor, dokumen/foto privat, dashboard dan bukti PDF mengikuti pengujian lintas tahap. Uji tugas pengurus menambah skenario pendaftaran peserta, penetapan penerima dan penebusan kupon.

### 6.7 Pemetaan bagian Qurban yang dilibatkan

| Bagian | Keterlibatan pada integrasi Kontak | Tahap |
|---|---|---|
| Daftar peserta dan Tambah Peserta | Cari/pilih/tambah Kontak, pembeda nama sama dan partisipasi per event | 5A |
| Event, hewan dan pengisian slot | Hubungkan share ke individu, validasi kapasitas dan alokasi bersamaan | 5A |
| Pembayaran dan bukti Qurban | Tampilkan peserta/pembayar sesuai konteks, nominal dan riwayat yang dapat ditelusuri | 5A |
| Registrasi Qurban lama | Inventaris nama pendaftar/peserta, pemetaan sumber dan jalur penambahan yang masih aktif | 1 dan 5A |
| Pemilih mustahik/penerima | Kandidat dari Kontak dan hubungan program, keputusan penerima per event, paginasi seluruh hasil | 5B |
| Kupon peserta dan distribusi | Identitas penerima, sumber hak, kuota, batch, cetak/unduh dan koreksi yang diaudit | 5B |
| Scan dan penebusan manual | Konteks individu/event, status kupon dan pengendalian penebusan serentak | 5B |
| Dashboard dan riwayat Kontak | Jumlah individu/share yang jelas, partisipasi dan penerimaan lintas event | 5A–5B |
| Petugas penerbit/pemindai | Tautan akun ke Kontak melalui tahap 3 dan audit tindakan pada event | 3 dan 5B |
| Identitas pemasok hewan atau wakil pengambil | Eksplorasi dari kebutuhan pengurus dan relasi aktual | P1 setelah kebutuhan perwakilan/pemasok dikonfirmasi |

## 7. Batas cakupan dan pengembangan lanjutan

Lima tahap dokumen ini mencakup Data Master, integrasi Zakat Fitrah, hubungan identitas akun aplikasi, serta integrasi peserta dan distribusi Qurban. Integrasi penuh alur Pinjaman Jamaah dijadwalkan sebagai PRD lanjutan setelah kontrak Kontak serta tahap awal diterima.

Penggabungan massal individu, verifikasi identitas melalui layanan pemerintah, portal mandiri pembaruan biodata, pencarian kemiripan lanjutan, dan aturan persetujuan berjenjang menjadi kandidat pengembangan berikutnya. Prioritasnya ditentukan dari hasil penggunaan dan inventaris data.

## 8. Pertimbangan desain

### 8.1 Peta menu yang diusulkan

| Modul | Halaman | Fungsi |
|---|---|---|
| Data Master | Kontak | Identitas individu, keluarga, profil dan audit sesuai izin. |
| Data Master | Daftar Mustahik | Tampilan keikutsertaan program yang sama dengan UPZ. |
| Data Master | Pengguna | Undangan dan akun yang terhubung ke Kontak. |
| Data Master | Pemeriksaan Data | Antrean pemetaan dan konflik, dengan versi dasar sejak tahap 1. |
| UPZ Al-Fajar | Daftar Muzakki | Daftar partisipasi, akses tambah/pilih Kontak dan riwayat transaksi. |
| UPZ Al-Fajar | Daftar Mustahik | Identitas dari Kontak, kategori dan riwayat distribusi. |
| UPZ Al-Fajar | Pemasukan/Distribusi | Alur transaksi dengan identitas dan konteks program yang dipilih. |
| Qurban | Peserta (`/qurban/peserta`) | Kontak peserta, share dan status pembayaran per event. |
| Qurban | Event dan hewan (`/qurban/events`) | Partisipasi individu pada slot hewan yang dipilih. |
| Qurban | Distribusi (`/qurban/distribusi`) | Penetapan penerima, sumber hak dan penerbitan kupon. |
| Qurban | Scan (`/qurban/scan`) | Pemeriksaan dan penebusan kupon sesuai identitas/event. |
| Qurban | Dashboard (`/qurban/dashboard`) | Ringkasan peserta/share, pembayaran dan distribusi dengan basis hitung yang jelas. |

Susunan menu dan nama Pemeriksaan Data merupakan usulan rancangan untuk ditinjau pada wireframe tahap 1. Rute program existing dipertahankan melalui peta navigasi yang divalidasi saat implementasi.

### 8.2 Alur utama

1. Petugas membuka pencatatan zakat dan mencari nama/ID Kontak.
2. Sistem menampilkan kandidat dengan pembeda identitas.
3. Petugas memilih individu existing atau mengisi Kontak baru.
4. Sistem memeriksa kandidat duplikat dan menyimpan keputusan petugas.
5. Formulir memakai Kontak terpilih, kemudian mencatat transaksi dan hubungan program melalui validasi server.
6. Setelah berhasil, pengurus dapat membuka riwayat individu dari daftar atau transaksi tersebut.

Rincian muzakki dan mustahik menggunakan ringkasan identitas yang konsisten. Informasi sensitif, status rumah tangga lama dan konteks pembayaran keluarga diberi label yang membantu petugas mengambil keputusan.

## 9. Pertimbangan teknis

### 9.1 Kontrak data

| Objek | Tanggung jawab |
|---|---|
| Kontak individu | Identitas kanonis dan status individu. |
| Keluarga dan keanggotaan | Hubungan antarindividu serta referensi sumber rumah tangga. |
| Hubungan muzakki | Partisipasi zakat dan hubungan ke transaksi. |
| Hubungan mustahik | Kategori, kelayakan, jumlah anggota dan status program. |
| Partisipasi Qurban | Individu peserta, event, hewan, share dan konteks pendaftar/pembayar yang tersedia. |
| Hak dan kupon Qurban | Kontak penerima, event, sumber hak, kuota, nomor/token dan riwayat status. |
| Tautan akun | Referensi Auth/profil ke individu beserta kemampuan existing. |
| Audit dan pemetaan | Perubahan identitas, keputusan tautan, batch dan masalah data. |
| Transaksi/dokumen | Nilai bisnis, referensi identitas, cakupan keluarga serta informasi historis. |

Repository menggunakan `muzakki.id` sebagai identitas shared pada beberapa area. Implementasi perlu menetapkan kontrak Kontak di atas struktur existing dengan ID dan relasi yang dapat dipertahankan. Pilihan tabel, view atau relasi penghubung ditetapkan pada rancangan teknis tahap 1 berdasarkan inventaris foreign key dan konsumen API.

Catatan rumah tangga lama disimpan sebagai sumber dengan jenis identitas yang jelas. Migrasi bertahap memerlukan cara membedakan operasi baru dari referensi historis yang diizinkan. Aturan server harus menguji keduanya melalui entry point yang dipakai aplikasi.

### 9.2 Migrasi dan pengujian

- Inventaris jalur baca/tulis mencakup formulir, hook, RPC, Edge Functions, impor, ekspor, transaksi massal, undangan dan mode offline/demo yang tersedia.
- Rencana migrasi menetapkan backup, langkah penerapan, verifikasi jumlah/relasi, deteksi konflik dan pemulihan per tahap.
- Data identitas sumber dan keputusan pemetaan disimpan untuk penelusuran. Penetapan individu berdasarkan nama yang sama memerlukan peninjauan dengan atribut pendukung.
- Total dan fingerprint isi tabel transaksi keuangan dibandingkan sebelum/sesudah migrasi yang hanya mengubah identitas. Jika migrasi menambahkan referensi pada tabel transaksi, bandingkan seluruh kolom bisnis dan catat perubahan referensi yang memang direncanakan secara terpisah.
- Uji API dan database mencakup hak akses, nama sama, rumah tangga lama, retry, permintaan bersamaan, impor sebagian gagal dan koreksi tautan.
- Unit test, lint, build, regresi SQL lokal dan browser yang relevan dijalankan per tahap. Hasil dicatat terhadap baseline aktual beserta keterbatasannya.
- Uji regresi Qurban dan Pinjaman mencakup akses identitas, referensi transaksi, akun rangkap, mode sesi, riwayat dan dokumen privat yang terdampak struktur shared.

## 10. Kriteria penerimaan

| AC | Tahap | Skenario | Hasil yang diharapkan |
|---|---|---|---|
| AC-KON-01 | 1 | Buka Data Master dan URL Warga lama | Halaman Kontak terbuka, tujuan navigasi dan izin sesuai. |
| AC-KON-02 | 1 | Cari individu di luar halaman pertama | Seluruh data berizin tercakup dan individu dapat dipilih. |
| AC-KON-03 | 1 | Tambah dua individu bernama sama dengan atribut berbeda | Keduanya dapat dibedakan dan keputusan kandidat tersimpan. |
| AC-KON-04 | 1 | Tambah anggota dari sumber rumah tangga lama | Individu dan hubungan keluarga tersimpan, cakupan transaksi asal dapat ditelusuri. |
| AC-KON-05 | 1 | Admin/petugas mengubah identitas, termasuk dua perubahan bersamaan | Audit lengkap tersedia dan konflik versi ditangani. |
| AC-KON-06 | 1 | Nonaktifkan Kontak yang mempunyai riwayat | Status terlihat, riwayat dapat dibuka, alur pemilihan baru menjelaskan tindakan yang diperlukan. |
| AC-KON-07 | 1 | Migrasi batch gagal sebagian lalu diulang | Hasil dan masalah per sumber tercatat, hasil berhasil dipakai kembali. |
| AC-KON-08 | 2 | Tambah muzakki dari Kontak existing atau langsung saat transaksi | Kontak dan hubungan valid, hasil tampak di Data Master dan UPZ. |
| AC-KON-09 | 2 | Tambah mustahik untuk individu yang juga muzakki | Identitas dipakai bersama dan atribut program tersimpan pada hubungan terkait. |
| AC-KON-10 | 2 | Simpan hubungan/transaksi gagal lalu dicoba ulang | Input dan Kontak terpilih dipertahankan, hasil sesuai referensi permintaan. |
| AC-KON-11 | 2 | Impor Kontak, impor mustahik tahun lalu dan transaksi massal | Semua pencatatan baru mempunyai referensi valid dan hasil baris dapat ditinjau. |
| AC-KON-12 | 2 | Kirim pencatatan baru melalui API dengan referensi hilang/tidak berizin | Server menolak dan menjelaskan masalah yang dapat ditindaklanjuti. |
| AC-KON-13 | 2 | Buka rincian muzakki/mustahik lintas tahun | Transaksi/distribusi, status dan cakupan sumber sesuai data yang diizinkan. |
| AC-KON-14 | 2 | Ubah identitas setelah dokumen/transaksi terbit | Profil terkini dan informasi historis dapat dibedakan serta ditelusuri. |
| AC-KON-15 | 3 | Undang admin, petugas atau viewer dari Kontak | Penerimaan undangan menghasilkan akun dengan tautan dan role yang sah. |
| AC-KON-16 | 3 | Pembuatan akun gagal, undangan diulang atau diterima bersamaan | Tautan akun konsisten dan konflik yang memerlukan admin ditampilkan. |
| AC-KON-17 | 3 | Akun lama belum terhubung dan pengurus merangkap nasabah | Jalur operasi bertahap tersedia dan tiap mode mengikuti batas akses existing. |
| AC-KON-18 | 3 | Petugas mengubah identitas dan mencoba mengubah role/kredensial | Editor identitas dan operasi akun memeriksa kewenangan masing-masing di server. |
| AC-KON-19 | 4 | Tinjau akun/program belum terhubung dan salah tautan | Masalah dapat ditemukan, keputusan diaudit dan dampak koreksi diperiksa. |
| AC-KON-20 | Semua | Jalankan alur pada desktop/ponsel menggunakan keyboard | Label, fokus, dialog, aksi, pesan gagal dan navigasi dapat digunakan dengan komponen Shadcn. |
| AC-KON-21 | Semua | Jalankan regresi keuangan, RLS, akun, Qurban dan Pinjaman terkait | Perhitungan dan akses sesuai kontrak, seluruh perbedaan migrasi yang direncanakan dapat direkonsiliasi. |
| AC-KON-22 | 4 | Admin dan petugas menyelesaikan tugas operasional | Hasil per peserta dan hambatan tersedia, perbaikan yang diperlukan tercatat. |
| AC-KON-23 | 5A | Pilih Kontak existing atau tambah individu dari daftar peserta dan slot hewan | Kontak tersedia di Data Master dan share menunjuk individu/event yang benar. |
| AC-KON-24 | 5A | Individu yang sama mendaftar beberapa share dan dua petugas berebut slot terakhir | Alokasi sah sesuai kapasitas, konflik dijelaskan dan retry memakai hasil permintaan sebelumnya. |
| AC-KON-25 | 5A | Petakan pendaftar dan nama peserta registrasi lama, lalu buka bukti/riwayat | Konteks sumber, identitas dan nilai pembayaran dapat direkonsiliasi serta agregasi sesuai referensi bisnis. |
| AC-KON-26 | 5B | Cari penerima di luar 200 data pertama dan terbitkan kupon massal | Seluruh hasil berizin dapat dicari, cakupan pilihan terlihat dan hasil per penerima tercatat. |
| AC-KON-27 | 5B | Satu individu mempunyai beberapa share dan dipilih pada kategori penerima lain | Hak/kuota diperiksa per sumber dan event dengan identitas Kontak yang sama. |
| AC-KON-28 | 5B | Dua petugas menebus token sama, atau memakai kupon batal/kedaluwarsa/event berbeda | Server memvalidasi konteks, hanya satu penebusan sah tersimpan dan audit tersedia. |
| AC-KON-29 | 5A–5B | Ubah Kontak atau koreksi tautan setelah bukti/kupon terbit | Identitas historis/versi koreksi, token, sumber hak dan status dapat ditelusuri pada cetak/unduhan. |
| AC-KON-30 | 5A–5B | Viewer/nasabah/petugas mencoba URL/API/ekspor, lalu jalankan pada desktop/ponsel | Hak akses dan privasi berlaku di server, alur dapat digunakan dengan Shadcn serta keyboard. |
| AC-KON-31 | 5A–5B | Bandingkan data migrasi dan jalankan tugas peserta/distribusi | Jumlah individu/share, nominal, kuota serta status kupon cocok dengan sumber dan hasil uji pengurus tercatat. |

## 11. Ukuran keberhasilan

| Ukuran | Target rancangan dan cara pemeriksaan |
|---|---|
| Hubungan baru | 100% hubungan muzakki/mustahik baru setelah tahap 2 dan akun baru setelah tahap 3 mempunyai Kontak valid pada jalur UI, impor dan API. |
| Hubungan Qurban | 100% peserta/share baru setelah tahap 5A dan penerima/hak kupon baru setelah tahap 5B mempunyai referensi Kontak valid pada seluruh jalur yang aktif. |
| Distribusi Qurban | Seluruh skenario retry dan scan bersamaan menghasilkan kuota sesuai sumber hak serta satu penebusan sah per token. Jumlah share, nominal dan status kupon dapat direkonsiliasi. |
| Konsistensi identitas | Pembaruan Kontak terlihat pada daftar/rincian terkait setelah penyimpanan dan pemuatan ulang data. |
| Audit | 100% perubahan identitas, pemetaan dan tautan akun pada skenario penerimaan merekam pelaku, waktu dan isi keputusan. |
| Retry dan konkurensi | Seluruh skenario uji pengiriman berulang/bersamaan menghasilkan keadaan yang konsisten. |
| Data lama | Jumlah total, terhubung, belum ditinjau dan perlu keputusan tersedia per sumber. Target penyelesaian batch ditentukan dari inventaris dan kapasitas pengurus. |
| Rekonsiliasi | Seluruh referensi dan nilai keuangan pada fixture migrasi cocok dengan hasil yang direncanakan. |
| Uji tugas | Usulan minimal satu admin dan satu petugas menyelesaikan empat dari lima tugas tanpa panduan langkah demi langkah. Tugas meliputi mencari nama sama, menambah saat transaksi, mendaftarkan mustahik, memperbarui identitas, dan membuka riwayat. |
| Uji tugas Qurban | Usulan satu admin dan satu petugas menyelesaikan pendaftaran peserta, penetapan penerima/penerbitan kupon, serta penebusan kupon. Catat hasil masing-masing tugas dan hambatan pada tahap 5. |
| Performa | Usulan awal daftar/pencarian siap dipakai maksimal 3 detik pada 10.000 Kontak sintetis. Ukur lima kali setelah pemanasan melalui API lokal sebenarnya dan catat median, maksimum, perangkat serta browser. Baseline tahap 1 menjadi dasar peninjauan target sebelum implementasi daftar. |

Target uji tugas dan performa merupakan usulan perencanaan untuk divalidasi pada tahap 1. Hasil aktual dicatat dalam dokumen verifikasi setiap tahap.

## 12. Peluang perbaikan hasil eksplorasi

| Peluang | Prioritas rancangan | Penempatan dan alasan |
|---|---|---|
| Aturan Kontak pada seluruh jalur tulis | P0 | Tahap 1–3 sesuai operasi, supaya hasil formulir, impor dan API mengikuti aturan yang sama. |
| Pembedaan individu/keluarga dan data belum jelas | P0 | Tahap 1, karena sumber existing memakai nama kepala keluarga dan jumlah jiwa. |
| Penanganan nama sama, telepon bersama dan retry | P0 | Tahap 1–2, untuk membantu pemilihan serta pembuatan identitas yang konsisten. |
| Audit, konflik penyuntingan dan status per objek | P0 | Sejak tahap terkait, karena admin dan petugas mengelola identitas bersama. |
| Pengalaman pembuatan akun dari aplikasi | P0 | Tahap 3, untuk menyediakan hubungan Kontak dan profil akun yang dapat diperiksa admin. |
| Antrean kualitas data dan koreksi tautan | P0 | Versi dasar pada tahap 1, dilengkapi tahap 4 agar migrasi bertahap dapat dituntaskan secara terarah. |
| Pencarian kemiripan dan penggabungan massal | P1 | Ditinjau setelah pola duplikasi aktual serta dampak relasi dipahami. |
| Preferensi kolom/filter per pengguna | P1 | Ditinjau dari kebutuhan pengurus setelah uji tugas. |
| Pembaruan biodata mandiri | P1 | Memerlukan rancangan kewenangan dan verifikasi perubahan tersendiri. |
| Identitas peserta dan penerima Qurban | P0 tahap 5 | Memakai sumber Kontak bersama karena peserta/slot dan penerima kupon sudah merujuk data muzakki/mustahik. |
| Sumber hak dan kuota kupon | P0 tahap 5B | Mengakomodasi beberapa share/kategori hak dengan pemeriksaan event, retry dan scan bersamaan. |
| Pemilih penerima lebih dari 200 orang | P0 tahap 5B | Mengganti batas muat pada pemilih dengan pencarian/paginasi seluruh hasil berizin. |
| Pemasok hewan, wakil pengambil dan informasi atas nama tambahan | P1 | Memerlukan konfirmasi kebutuhan operasional serta contoh data pengurus. |
| Integrasi penuh Pinjaman | Tahap lanjutan | PRD lanjutan memakai kontrak Kontak dan bukti regresi shared yang sudah diterima. |

Prioritas rancangan di atas merupakan usulan hasil eksplorasi untuk ditinjau bersama PRD. P1 dapat dipilih berdasarkan manfaat penggunaan setelah kebutuhan P0 diterima.

## 13. Pertanyaan terbuka dan keputusan implementasi berikutnya

1. Siapa penanggung jawab pemetaan data lama dan berapa kapasitas peninjauan per minggu? Hasil inventaris tahap 1 digunakan untuk menyusun batch.
2. Bagaimana pengurus ingin mencatat hubungan keluarga yang berubah atau mempunyai beberapa konteks tanggungan? Wireframe dan contoh data tahap 1 digunakan untuk menetapkan pilihan hubungan minimum.
3. Apakah ada beberapa akun aktif milik individu yang sama pada data operasional? Jika ada, admin memerlukan keputusan penautan sesuai inventaris dan rancangan FR-KON-028.
4. Kolom pribadi tambahan apa yang benar-benar dibutuhkan pengurus? Nama lengkap wajib dan atribut tambahan opsional menjadi rancangan awal sampai kebutuhan khusus ditetapkan.
5. Berapa volume Kontak dan karakteristik perangkat operasional? Inventaris menjadi dasar penerimaan target performa.
6. Bagaimana aturan hak distribusi ketika individu mempunyai beberapa share atau beberapa kategori penerima dalam satu event? Inventaris aturan existing dan keputusan pengurus digunakan untuk memfinalkan kuota tahap 5B.
7. Apakah pendaftar, pembayar dan individu atas nama Qurban dapat berbeda, termasuk atas nama almarhum? Catat contoh aktual dan atribut minimum sebelum mengaktifkan alur perwakilan tambahan.
8. Apakah pengambilan kupon oleh wakil perlu dicatat? Jika diperlukan, tentukan identitas wakil dan bukti kewenangan sesuai prosedur pengurus pada pengembangan P1.
9. Kapan integrasi penuh Pinjaman diprioritaskan? Jadwal dan cakupan rinci ditetapkan pada PRD lanjutan.

## 14. Rujukan repository

- Fondasi Data Master dan kebutuhan navigasinya tersedia pada [PRD Data Master](../prd-task/generations/completed/prd-data-master.md).
- Aturan identitas individu, rumah tangga dan konsumen Pinjaman tersedia pada [PRD Pinjaman dan Data Induk Orang](../prd-task/generations/active/prd-pinjaman-jamaah-dan-data-induk-orang.md).
- Konsumen daftar identitas dan pembuatan saat transaksi tersedia pada [DataMasterWarga.tsx](../zakat-fitrah-app/src/pages/DataMasterWarga.tsx) dan [useMuzakki.ts](../zakat-fitrah-app/src/hooks/useMuzakki.ts).
- Pendaftaran mustahik dan jalur impor tersedia pada [useMustahik.ts](../zakat-fitrah-app/src/hooks/useMustahik.ts) dan [WargaImportDialog.tsx](../zakat-fitrah-app/src/components/data-master/WargaImportDialog.tsx).
- Pengelolaan pengguna tersedia pada [DataMasterPengguna.tsx](../zakat-fitrah-app/src/pages/DataMasterPengguna.tsx).
- Pendaftaran dan slot Qurban tersedia pada [AddPesertaDialog.tsx](../zakat-fitrah-app/src/components/qurban/AddPesertaDialog.tsx), [SlotAssignDialog.tsx](../zakat-fitrah-app/src/components/qurban/SlotAssignDialog.tsx) dan [useQurbanShares.ts](../zakat-fitrah-app/src/hooks/useQurbanShares.ts).
- Penerima dan siklus kupon tersedia pada [MustahikCouponPicker.tsx](../zakat-fitrah-app/src/components/qurban/MustahikCouponPicker.tsx), [useQurbanCoupons.ts](../zakat-fitrah-app/src/hooks/useQurbanCoupons.ts) dan [QurbanScan.tsx](../zakat-fitrah-app/src/pages/QurbanScan.tsx).
- Struktur Qurban, sumber lama dan dokumen tersedia pada [types/qurban.ts](../zakat-fitrah-app/src/types/qurban.ts), [useQurban.ts](../zakat-fitrah-app/src/hooks/useQurban.ts) dan [qurbanReceipt.ts](../zakat-fitrah-app/src/components/qurban/qurbanReceipt.ts).
