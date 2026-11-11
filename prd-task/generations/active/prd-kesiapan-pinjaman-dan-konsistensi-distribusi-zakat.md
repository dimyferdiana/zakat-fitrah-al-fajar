# PRD: Kesiapan pinjaman dan konsistensi distribusi zakat

## 1. Gambaran masalah

Modul pinjaman sudah melewati pengujian lokal, tetapi masih ada persiapan sebelum digunakan secara operasional: akun nasabah di lingkungan tujuan, keputusan pengurus, kesiapan skema, pemulihan, pemantauan dan pengujian lingkungan nyata. Checklist lama masih menyisakan 1.6 dan 9.10; fitur migrasi pinjaman historis 5.0–5.10 dan uji 9.7 ditunda sampai benar-benar diperlukan.

Selain itu, skema lokal `distribusi_zakat` menyimpan jumlah dalam `jumlah_beras_kg` atau `jumlah_uang_rp`, sedangkan sebagian kode membaca atau menulis `jumlah`. Kondisi ini dapat menyebabkan kegagalan query dan perhitungan tidak dapat diandalkan. Pada pemeriksaan stok saat pembuatan, kegagalan query tertentu saat ini dapat diperlakukan sebagai data kosong. Struktur dan isi database online perlu diperiksa ulang secara aman; komentar kode tentang kolom lama bukan bukti kondisi online saat ini.

Tujuan dokumen ini adalah menyelesaikan kesiapan yang masih berlaku dan memastikan perubahan pada distribusi serta perubahan lint/performa sebelumnya tidak merusak data maupun alur aplikasi yang sudah ada. Pelaksanaan produksi dilakukan pada tahap berikutnya.

## 2. Tujuan

- Setiap transaksi distribusi memiliki satu jenis, beras dalam kilogram atau uang dalam rupiah, dan satu jumlah positif; total kedua jenis selalu disajikan terpisah.
- Input, stok, daftar, dashboard, laporan, riwayat, ekspor dan bukti menampilkan nilai yang konsisten untuk data yang sama.
- Kesalahan pembacaan stok terlihat oleh petugas dan menghentikan proses yang bergantung pada stok, bukan dianggap saldo nol.
- Persyaratan operasional pinjaman memiliki pemilik, langkah, bukti dan status; pekerjaan yang menunggu keputusan atau lingkungan tujuan tetap terbuka.
- Perubahan divalidasi secara lokal dan disertai rencana penerapan serta pemulihan yang melindungi data lama.

## 3. Pengguna dan cerita pengguna

- Sebagai petugas, saya ingin mencatat 2,5 kg beras atau Rp100.000 untuk penerima, agar jenis dan jumlah penyaluran terbaca jelas.
- Sebagai petugas, saya ingin stok dan pesan kegagalan yang akurat, agar saya tidak membuat distribusi berdasarkan hasil pembacaan yang gagal.
- Sebagai pengurus, saya ingin membandingkan laporan, bukti dan dashboard dengan transaksi, agar dapat mempertanggungjawabkan penyaluran.
- Sebagai admin, saya ingin menyiapkan akses email/password dan pemulihannya di lingkungan yang digunakan, agar nasabah dapat menggunakan portal dengan aman.
- Sebagai pengelola, saya ingin daftar syarat rilis dan bukti pemeriksaan agar dapat memutuskan kapan program siap dipakai.

## 4. Persyaratan fungsional

### A. Audit dan konsistensi distribusi

1. Sistem menyediakan pilihan satu jenis per transaksi: `beras` atau `uang`, satu input jumlah, dan satuan yang sesuai. Beras dan uang untuk penerima yang sama tidak otomatis menjadi satu transaksi; kebijakan transaksi terpisah tetap mengikuti aturan duplikasi yang berlaku dan perlu dikonfirmasi sebelum diubah.
2. Jumlah harus lebih besar dari nol; ketelitian dan pembulatan harus sesuai kemampuan skema dan ditampilkan secara konsisten. Tidak boleh mencampurkan kg dan rupiah dalam satu total.
3. Untuk skema lokal saat ini, jumlah beras berasal dari `jumlah_beras_kg` dan jumlah uang dari `jumlah_uang_rp`. Di tampilan, field umum `jumlah` boleh digunakan sebagai hasil pemetaan sesuai jenis; ia bukan jumlah jiwa atau jumlah penerima.
4. Sebelum menentukan implementasi definitif, bandingkan secara read-only skema lokal dan online: kolom, tipe, constraint, nilai default, trigger, hak dan dependensi, termasuk `jumlah` serta `petugas_distribusi`. Catat sumber, tanggal dan hasil tanpa menyalin identitas nasabah ke dokumen.
5. Audit agregat data yang tidak konsisten: kolom jenis kosong/tidak sesuai, kedua kolom terisi, nilai nonpositif, dan konflik antara kolom lama dengan kolom sesuai jenis jika kolom lama ada. Jangan menghapus, menimpa atau mengarang data; sediakan daftar kasus untuk rekonsiliasi berwenang.
6. Buat rencana kompatibilitas baca/tulis berdasarkan hasil audit; jika kolom lama wajib di online, pertahankan kompatibilitas sampai migrasi aman dan tervalidasi. Setiap perubahan skema harus dapat diuji dan dipulihkan; jangan otomatis menghapus kolom atau data lama.
7. Sesuaikan seluruh pembaca dan penulis yang terdampak, termasuk daftar/form distribusi, stok, riwayat mustahik/data orang, dashboard, perbandingan tahun, laporan, ekspor dan bukti terkait. Pemetaan nilai dan satuan harus konsisten.
8. Bila permintaan data stok atau distribusi gagal, tampilkan pesan yang dapat ditindaklanjuti dan hentikan simpan/perhitungan yang bergantung pada hasil tersebut. Nilai hilang atau konflik tidak boleh diam-diam menjadi nol.
9. Pertahankan aturan status dan cakupan tahun yang berlaku dalam penghitungan stok; inventarisasi sumber pemasukan dan setiap perbedaan definisi antarlaporan, lalu tetapkan hasil yang konsisten dengan data sumber. Perubahan aturan bisnis memerlukan keputusan pengurus dan pengujian tersendiri.
10. Uji pembuatan, pembacaan, pembaruan status, pembatalan yang tersedia, validasi stok dan duplikasi sesuai izin, termasuk kegagalan API dan data lama yang bermasalah. Uji menggunakan Supabase lokal, bukan hanya mode offline.

### B. Kesiapan pinjaman

11. Selesaikan tindak lanjut task lama 1.6 untuk lingkungan operasional: admin menyiapkan akun nasabah berbasis email/password, verifikasi dan pemulihan akses, konfigurasi email dan penyimpanan secrets yang aman. Bukti pengujian lokal yang sudah ada menjadi dasar, bukan pengganti pengujian lingkungan tujuan. OTP/SMS ditunda.
12. Siapkan daftar pemeriksaan task 9.10 beserta penanggung jawab dan bukti: kebijakan pokok tanpa bunga/biaya, batas nominal/tenor/penjamin yang saat ini tidak diwajibkan, kolektabilitas nonaktif, label sumber dana sebagai metadata, serta akun dan hak akses.
13. Pengurus menyiapkan redaksi kontrak final, penandatangan dan kebutuhan saksi; pastikan template, preview, arsip versi, serta keharusan kontrak bertanda tangan sebelum pencairan tersedia dan teruji. Status menunggu keputusan pengurus tidak boleh ditandai selesai.
14. Pastikan pinjaman tetap terpisah dari saldo kas/rekening dan tidak otomatis mengambil dana zakat/infak. Satu nasabah hanya boleh memiliki satu pinjaman aktif. Data pribadi, transaksi, kontrak, bukti dan audit tidak dijadwalkan untuk dihapus.
15. Tetapkan pemilik operasional/teknis, dukungan, pemantauan error dan backup, penanganan insiden serta prosedur pemulihan; buktikan backup dan restore lengkap di lingkungan tujuan sebelum penggunaan operasional, termasuk berkas, hak dan data.
16. Tugas lama 5.0–5.10 dan 9.7 tetap ditunda karena tidak ada kebutuhan impor pinjaman lama untuk peluncuran awal. Jika kebutuhan muncul, aktifkan kembali checklist lama dan rekonsiliasi terhadap sumber; jangan membuat transaksi atau histori fiktif.

### C. Regresi dan kesiapan rilis

17. Tinjau dampak perubahan sebelumnya pada lint global, komponen bersama, form, export, RLS dan migrasi performa pinjaman `141_loan_staff_rls_performance.sql`. Uji ulang hak akses dan alur utama pinjaman serta zakat, data orang, mustahik dan qurban yang terdampak.
18. Jalankan lint, build, unit test, pengujian SQL/keamanan dan regresi browser yang relevan, serta catat hasil dan keterbatasan. Hasil lulus sebelumnya di lokal tidak membuktikan kondisi produksi.
19. Uji kinerja dengan API, volume data dan jaringan yang mewakili lingkungan penggunaan, termasuk RLS dan pengguna yang berwenang; catat kondisi, median, nilai lambat dan target pada dokumen hasil. Benchmark sintetis lokal menjadi pembanding, bukan jaminan target jaringan produksi.
20. Siapkan rencana rilis: inventaris perbedaan migrasi dan Storage, dependensi, backup yang diuji, langkah penerapan berurutan, pemeriksaan pascarilis, penghentian bila gagal dan rencana pemulihan; uji pada salinan terisolasi yang layak. Jangan reset atau mengubah Supabase online dalam pekerjaan penyusunan dokumen ini.
21. Catat hasil tiap syarat dengan status `selesai`, `tertunda`, `menunggu keputusan`, atau `terhalang`, bukti dan penanggung jawab. Perbarui checklist lama hanya bila syarat sebenarnya sudah terpenuhi; jangan menutup task 5/9.7 hanya karena ditunda.

## 5. Kriteria penerimaan

- **AC-01:** transaksi beras 2,5 kg dan transaksi uang Rp100.000 pada fixture yang sah ditampilkan sesuai jenis dan nilai di daftar, dashboard, laporan, bukti dan ekspor; keduanya tidak dijumlahkan silang.
- **AC-02:** perhitungan stok per jenis dan tahun cocok dengan sumber yang disepakati untuk status yang relevan; query stok yang sengaja digagalkan menghasilkan pesan dan tidak menyimpan transaksi berdasarkan nilai kosong.
- **AC-03:** audit skema dan data lama menghasilkan bukti yang dapat diperiksa; konflik ditahan untuk rekonsiliasi, tanpa kehilangan data atau penulisan otomatis ke produksi.
- **AC-04:** pengujian lokal membuktikan alur distribusi, izin dan regresi terdampak; lint, build dan tes relevan disertai hasil serta batas pengujiannya.
- **AC-05:** daftar kesiapan memisahkan bukti lokal dari syarat operasional, memuat pemilik dan status akun, kontrak, kebijakan, sumber dana, backup, pemulihan, monitoring dan keamanan.
- **AC-06:** rencana rilis dan pemulihan telah diuji pada lingkungan yang layak; pengujian performa dan akses pada lingkungan tujuan dicatat sebelum operasional. Syarat yang belum dilakukan tetap terbuka.
- **AC-07:** impor pinjaman historis tercatat sebagai ditunda, bukan selesai dan bukan penghalang peluncuran awal tanpa kebutuhan baru.

## 6. Di luar cakupan

- Deployment atau modifikasi database/Storage produksi dalam tahap penyusunan dan persiapan lokal ini.
- Implementasi impor pinjaman historis, SMS/OTP, bunga/biaya pinjaman, atau integrasi otomatis dengan kas dan sumber dana zakat/infak.
- Perubahan keputusan syariah atau nominal standar penyaluran; pengurus menetapkan kebijakan pembagian. Contoh angka di atas hanya contoh pengujian.
- Penghapusan atau koreksi massal data lama tanpa audit, rekonsiliasi dan prosedur yang disetujui.

## 7. Pertimbangan desain dan teknis

Pertahankan form yang jelas pada desktop dan ponsel, dengan label `kg` atau `Rp` sesuai jenis. Gunakan pesan kesalahan yang menjelaskan tindakan petugas. Pastikan `null`, nol, nilai tidak valid dan data konflik dibedakan.

Sumber awal: `zakat-fitrah-app/src/hooks/useDistribusi.ts`, `src/components/distribusi`, `src/components/laporan`, `src/hooks/useDashboard.ts`, riwayat mustahik, ekspor/bukti terkait, tipe database dan `supabase/migrations`. Skema online yang tercatat dalam inventaris belum cukup untuk membuktikan seluruh kolom. Gunakan data sintetis pada pengujian, dan hindari menyimpan rahasia atau data pribadi dalam repository.

## 8. Ukuran keberhasilan

- Seluruh AC yang berlaku lulus dengan bukti dan lingkungan tercatat; anomali data memiliki status rekonsiliasi.
- Tidak ada kehilangan data atau perbedaan jumlah/satuan yang tidak terjelaskan antara transaksi dan tampilan yang diuji.
- Tidak ada error/peringatan lint serta build dan tes relevan lulus pada revisi yang akan dirilis.
- Seluruh syarat sebelum operasional memiliki pemilik, bukti atau hambatan yang jelas; hasil performa di lingkungan tujuan memenuhi target yang disepakati.

## 9. Pertanyaan terbuka

1. Apa definisi final cakupan stok dan status untuk setiap laporan, termasuk transaksi pending dan sumber pemasukan lain? Tetapkan setelah memetakan perilaku yang ada bersama pengurus.
2. Bagaimana struktur dan kualitas nilai `jumlah` dan kolom terkait pada online saat ini, dan bagaimana penanganan setiap konflik setelah audit?
3. Siapa penanggung jawab teknis, backup dan dukungan, serta apa target pemulihan dan target performa lingkungan operasional?
4. Apa teks kontrak final, nama label sumber dana dan pihak yang menandatangani/menyaksikan? Ini keputusan pengurus, bukan asumsi teknis.

## 10. Referensi

- [Checklist pinjaman awal](tasks-pinjaman-jamaah-dan-data-induk-orang.md)
- [Kesiapan operasional pinjaman](kesiapan-operasional-pinjaman.md)
- [Matriks hasil pengujian lokal](matriks-hasil-task-9-lokal.md)
- [Inventaris fondasi online](inventaris-fondasi-supabase-online.json)
