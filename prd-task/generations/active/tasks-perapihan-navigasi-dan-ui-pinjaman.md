 

# Tasks: Perapihan Navigasi dan UI Pinjaman Jamaah

Sumber: [PRD Perapihan Navigasi dan UI Pinjaman](prd-perapihan-navigasi-dan-ui-pinjaman.md).

Panduan: [generate-tasks.md](../../generate-tasks.md).

Tanggal: 10 November 2026.

Status: **Task 0 sampai 8 selesai; task 9 belum selesai.**

## Relevant Files

Path kode berikut relatif terhadap root repository. Nama berkas baru merupakan usulan dan dapat disesuaikan saat implementasi.

- `zakat-fitrah-app/src/App.tsx` — rute halaman baru, redirect URL lama dan perlindungan akses.
- `zakat-fitrah-app/src/components/layouts/AppLayout.tsx` — enam menu sidebar, menu aktif dan navigasi ponsel.
- `zakat-fitrah-app/src/components/layouts/AppSwitcher.tsx` — halaman awal modul dan navigasi ringkasan terbatas.
- `zakat-fitrah-app/src/store/appStore.ts` — konsistensi modul aktif dengan URL.
- `zakat-fitrah-app/src/pages/LoanManagement.tsx` — sumber alur yang akan dipisah menjadi halaman dan komponen.
- `zakat-fitrah-app/src/pages/LoanOverview.tsx`, `LoanCustomers.tsx`, `LoanCustomerDetail.tsx`, `LoanList.tsx`, `LoanCreate.tsx`, `LoanDetail.tsx`, `LoanPayments.tsx`, `LoanReports.tsx`, `LoanSettings.tsx` — usulan halaman baru untuk memisahkan navigasi dan konteks kerja.
- `zakat-fitrah-app/src/pages/LoanViewerSummary.tsx` — ringkasan terbatas dan pengelolaan izin viewer yang harus dipertahankan.
- `zakat-fitrah-app/src/pages/LoanCustomerPortal.tsx` — cakupan regresi portal dan isolasi mode nasabah.
- `zakat-fitrah-app/src/components/loans/` — dashboard, kontrak, jadwal, akun, pembayaran, tindak lanjut serta kebijakan yang dapat digunakan ulang.
- `zakat-fitrah-app/src/components/ui/` — komponen visual dan aksesibilitas yang menjadi fondasi tampilan.
- `zakat-fitrah-app/src/lib/loanSchedule.ts` dan `loanCalculations.ts` — aturan jadwal dan perhitungan saldo yang harus dipertahankan.
- `zakat-fitrah-app/src/lib/loanReport.ts` — perhitungan laporan dan ekspor sesuai filter.
- `zakat-fitrah-app/src/lib/loanReport.test.ts`, `loanSchedule.test.ts`, `loanCalculations.test.ts` — regresi perhitungan laporan, jadwal dan saldo.
- `zakat-fitrah-app/src/hooks/` — lokasi usulan untuk query, filter dan pembaruan cache data pinjaman per halaman.
- `zakat-fitrah-app/src/lib/auth.tsx` — izin role serta pemisahan mode pengurus dan nasabah.
- `zakat-fitrah-app/supabase/migrations/` — migrasi tambahan jika query/RPC untuk pencarian, paginasi dan ringkasan memerlukannya.
- `zakat-fitrah-app/tests/browser/` — regresi browser navigasi, formulir, transaksi, laporan dan ponsel.
- `zakat-fitrah-app/tests/browser/task3.spec.mjs`, `task4-6.spec.mjs`, `task8-dashboard.spec.mjs`, `task9-mobile.spec.mjs` — skenario existing yang perlu disesuaikan dengan rute dan tampilan baru.
- `zakat-fitrah-app/tests/browser/loan-navigation.spec.mjs`, `loan-workflows.spec.mjs` — usulan skenario browser untuk deep link, filter, formulir, transaksi dan pengalaman ponsel.
- `zakat-fitrah-app/tests/loan-navigation-data-local.sql` — usulan uji SQL untuk fungsi atau query baru, bila diperlukan.
- `prd-task/generations/active/` — lokasi usulan wireframe, matriks FR/AC dan laporan hasil verifikasi.
- `zakat-fitrah-app/tests/task3-security-local.mjs` — regresi akses pengurus, nasabah, viewer dan endpoint privat.
- `zakat-fitrah-app/tests/task4-6-integration-local.mjs` — regresi transaksi, kontrak, konkurensi, idempotensi dan isolasi keuangan.
- `zakat-fitrah-app/tests/task8-dashboard-api-local.mjs` — regresi proyeksi dan privasi dashboard/laporan.
- `zakat-fitrah-app/tests/task9-performance-local.mjs` — referensi dataset sintetis dan metode pengukuran; pengujian target PRD baru wajib memakai API sebenarnya.

### Notes

- Branch kerja: `feature/perapihan-ui-pinjaman`, dibuat dari `feature/pinjaman-jamaah` pada commit `7c6e491`. Perubahan sebelumnya pada `zakat-fitrah-app/tests/local-supabase.mjs` tetap tersedia setelah checkout; tidak ada reset atau stash.
- Rujukan FR dan AC pada sub-task menunjukkan cakupan yang harus diperiksa; tugas verifikasi 9.0 menentukan hasil akhir setiap AC.
- P1 `FR-UI-041` dan `FR-UI-042` merupakan peningkatan opsional setelah P0 diterima; tidak menjadi syarat penutupan pekerjaan P0.
- Enam menu harus menjadi halaman berbeda, bukan anchor/tab yang tetap menumpuk seluruh pekerjaan pada satu halaman.
- Pertahankan `/pinjaman/ringkasan` sebagai ringkasan terbatas existing; dashboard pengurus memakai `/pinjaman/dashboard`.
- Gunakan Supabase lokal dan data sintetis untuk validasi. Pengujian atau migrasi tidak boleh memerlukan reset database pengguna.
- Pertahankan aturan bisnis, hak akses server, idempotensi, audit, snapshot kontrak dan Storage privat.
- Jalankan Vitest melalui `npm test`, lint melalui `npm run lint`, build melalui `npm run build`, serta pengujian SQL/integrasi/browser yang relevan dari `zakat-fitrah-app`. Gunakan script proyek yang sesuai, bukan Jest dari contoh panduan.
- Catat baseline lint ulang sebelum implementasi. Pada 11 November 2026 lint global lulus tanpa error atau peringatan (baseline sebelumnya 271 error dan 16 peringatan); kode baru/perubahan tidak boleh menambah pelanggaran. Hasil uji sebelumnya bukan bukti otomatis untuk hasil refactor.
- Urutan kerja: fondasi dan wireframe (1.0), navigasi dan kontrak data (2.0–3.0), halaman fungsional (4.0–7.0), penyelarasan UI (8.0), lalu verifikasi menyeluruh (9.0). Pengujian terkait tetap dijalankan saat masing-masing bagian dibuat.
- Hasil task 1: [fondasi dan matriks](fondasi-perapihan-ui-pinjaman.md), [wireframe](wireframe-perapihan-ui-pinjaman.md), dan [baseline serta lingkungan](baseline-perapihan-ui-pinjaman.md).
- Hasil task 2: [verifikasi navigasi](verifikasi-task-2-navigasi.md). Fitur data dan penyempurnaan alur tetap mengikuti task 3 sampai 8.
- Hasil task 3: [kontrak data dan verifikasi](verifikasi-task-3-data-pinjaman.md). Migrasi 142 dan 143 sudah diuji pada Supabase lokal.
- Hasil task 4: [verifikasi nasabah dan akses akun](verifikasi-task-4-nasabah.md). Migrasi 144 dan 145 telah diuji pada Supabase lokal.
- Hasil task 5: [verifikasi daftar dan alur pinjaman](verifikasi-task-5-pinjaman.md). Migrasi 146 dan 147 telah diuji pada Supabase lokal.
- Hasil task 6: [verifikasi pembayaran](verifikasi-task-6-pembayaran.md).
- Hasil task 7: [verifikasi ringkasan, laporan dan pengaturan](verifikasi-task-7-ringkasan-laporan-pengaturan.md). Migrasi 148 dan 149 telah diuji pada Supabase lokal.
- Hasil task 8: [verifikasi UI dan aksesibilitas](verifikasi-task-8-ui-aksesibilitas.md).

## Instructions for Completing Tasks

Setelah implementasi dimulai, ubah `- [ ]` menjadi `- [x]` hanya ketika pekerjaan dan verifikasinya telah selesai. Pada fase 2, perbarui setiap sub-task setelah selesai; parent task baru dicentang jika seluruh sub-task wajibnya selesai. Pekerjaan yang tertahan harus mencantumkan alasan dan bukti yang masih dibutuhkan.

## Tasks

- [X] 0.0 Create feature branch — siapkan branch `feature/perapihan-ui-pinjaman` dengan menjaga perubahan pekerjaan sebelumnya.
  - [X] 0.1 Periksa branch, status Git dan perubahan pengguna yang belum tersimpan; tentukan cara membuat branch tanpa menghapus, mereset, atau menimpa pekerjaan yang sudah ada.
  - [X] 0.2 Buat dan checkout `feature/perapihan-ui-pinjaman` atau nama yang tidak berbenturan; pastikan perubahan sebelumnya tetap tersedia dan catat branch yang digunakan.
- [X] 1.0 Tinjau fondasi, catat baseline, dan siapkan wireframe desktop/ponsel serta pemetaan komponen, data, hak akses dan kriteria penerimaan sebelum refactor.
  - [X] 1.1 Inventarisasi rute, komponen, state, query, RPC, dokumen dan alur mutasi `LoanManagement` beserta dependensinya; petakan tujuan keenam halaman dan fitur existing yang harus tetap tersedia.
  - [X] 1.2 Catat baseline unit test, build, lint, SQL, integrasi, keamanan dan browser yang relevan; tuliskan kegagalan atau batas lingkungan sebelum perubahan, termasuk status lint global.
  - [X] 1.3 Susun matriks akses admin, petugas, viewer berizin/tanpa izin, nasabah dan pengguna nonaktif untuk halaman, RPC dan Storage; cocokkan dengan pengujian keamanan existing. (AC-UI-03, AC-UI-08, AC-UI-16)
  - [X] 1.4 Buat wireframe desktop 1366 ? 768 dan ponsel 390 ? 844 untuk sidebar, ringkasan, daftar, pembuatan bertahap, rincian dan verifikasi pembayaran; sertakan keadaan kosong dan error.
  - [X] 1.5 Petakan FR-UI-001?FR-UI-040 dan AC-UI-01?AC-UI-18 ke implementasi serta bukti uji; catat definisi angka, interaksi satu aksi, dan kondisi data tidak lengkap.
  - [X] 1.6 Siapkan Docker, Supabase dan Edge Functions lokal serta fixture sintetis yang dapat dibersihkan atau di-rollback tanpa reset; catat versi dan keadaan lingkungan.
- [X] 2.0 Pisahkan enam menu dan rute modul; perbarui pemilih aplikasi, menu aktif, deep link, riwayat browser dan kompatibilitas tautan lama tanpa memperluas akses. (FR-UI-001–FR-UI-006)
  - [X] 2.1 Buat enam rute dan halaman terpisah untuk dashboard, nasabah, daftar pinjaman, pembayaran, laporan dan pengaturan; masing-masing memiliki judul dan konteks kerja sendiri. (FR-UI-001, FR-UI-003)
  - [X] 2.2 Ganti menu Nasabah & Pinjaman dengan enam menu di sidebar; sesuaikan pemilih aplikasi dan penanda menu aktif pada desktop dan ponsel, termasuk saat URL dibuka langsung. (FR-UI-001?FR-UI-003)
  - [X] 2.3 Pertahankan `/pinjaman/ringkasan` untuk viewer sesuai izin existing; arahkan `/pinjaman` pengurus ke `/pinjaman/dashboard` dan pastikan mode aplikasi mengikuti URL. (FR-UI-002, FR-UI-004)
  - [X] 2.4 Petakan anchor lama dashboard, nasabah, draft, klaim, pengaturan dan rincian tanpa ID ke tujuan baru yang tepat; tangani hash sebelum redirect dan jangan memilih pinjaman sembarang. (FR-UI-005)
  - [X] 2.5 Buat deep link `/pinjaman/daftar/:loanId`, `/pinjaman/nasabah/:customerId` dan `/pinjaman/baru`; pastikan refresh, breadcrumb, Back/Forward, parameter tidak valid dan akses ditolak ditangani aman. (FR-UI-006)
  - [X] 2.6 Terapkan route guard sesuai role dan mode sesi; periksa nasabah, viewer berizin/tanpa izin, akun nonaktif dan bypass URL/API secara lokal. (AC-UI-01?AC-UI-03)
- [X] 3.0 Siapkan akses data sesuai halaman, pencarian seluruh data berizin, paginasi, ringkasan terverifikasi dan pembaruan cache lintas halaman; perluas query/RPC dengan perlindungan akses bila diperlukan. (FR-UI-010, FR-UI-014–FR-UI-016, FR-UI-030, FR-UI-040)
  - [X] 3.1 Rancang query terpisah untuk ringkasan, daftar nasabah, daftar pinjaman, riwayat pembayaran, rincian dan laporan; tentukan field minimum, urutan stabil, filter, jumlah total serta batas data tiap halaman. (FR-UI-010, FR-UI-014, FR-UI-030, FR-UI-040)
  - [X] 3.2 Implementasikan pencarian/filter pada seluruh data berizin dan paginasi server dengan hasil deterministik; uji kecocokan nama/nomor, status, kategori, periode dan data di luar 50 baris terbaru. (FR-UI-014, FR-UI-030; AC-UI-05)
  - [X] 3.3 Bila fungsi baru diperlukan, buat migrasi terpisah yang dapat ditinjau dengan RLS/izin RPC, indeks yang sesuai dan respons minimal; uji role termasuk bypass langsung tanpa mengubah data online.
  - [X] 3.4 Gunakan perhitungan terverifikasi untuk sisa, tunggakan dan status; pastikan pembayaran pending/ditolak/dibatalkan serta data belum lengkap tidak menghasilkan saldo palsu. (FR-UI-007, FR-UI-015)
  - [X] 3.5 Validasi filter dan nomor halaman nonrahasia pada URL; pertahankan saat kembali dari rincian, reset ke halaman pertama bila filter berubah, dan tangani halaman yang tidak tersedia. (FR-UI-016; AC-UI-06)
  - [X] 3.6 Atur pembatalan/refetch query dan invalidasi cache lintas daftar, rincian, antrean, profil, ringkasan serta laporan setelah mutasi; cegah respons lama menimpa konteks yang baru. (FR-UI-029, FR-UI-040)
  - [X] 3.7 Uji query/paginasi pada fixture kosong, nama sama, volume melebihi satu halaman, role berbeda dan data tidak lengkap; pastikan dashboard tidak memuat data atau formulir yang tidak dibutuhkan.
- [X] 4.0 Bangun halaman Nasabah dan profil terpisah; pindahkan pendaftaran individu serta pengelolaan akun admin ke konteks nasabah yang jelas. (FR-UI-010–FR-UI-013)
  - [X] 4.1 Buat daftar nasabah dengan pencarian, jumlah hasil, paginasi, nama, pengenal, wilayah, status dan ringkasan kewajiban yang tersedia; bedakan nama sama tanpa membuka identitas sensitif penuh. (FR-UI-010)
  - [X] 4.2 Buat alur Daftarkan Nasabah: cari data induk terlebih dahulu, pilih orang, konfirmasi individu dan tawarkan pembuatan individu baru melalui mekanisme existing bila perlu. (FR-UI-011)
  - [X] 4.3 Pertahankan pemeriksaan duplikasi, perlindungan hubungan lintas program dan larangan menjadikan data rumah tangga sebagai nasabah individu; sediakan pesan tindakan yang jelas. (FR-UI-011; AC-UI-07)
  - [X] 4.4 Buat profil dengan bagian Profil, Pinjaman dan Akses Akun; hubungkan pinjaman ke rincian dan teruskan nasabah terpilih ke formulir baru sambil tetap memeriksa kewajiban server. (FR-UI-012)
  - [X] 4.5 Pindahkan pembuatan akun, pemulihan, penonaktifan dan penautan yang tersedia ke profil admin; tampilkan nama/pengenal sebelum tindakan dan pertahankan perlindungan password serta izin server. (FR-UI-013; AC-UI-08)
  - [X] 4.6 Uji pendaftaran, profil, akun dan pemulihan dengan individu existing, nama sama, rumah tangga, admin dan petugas; pastikan portal dan hubungan data existing tetap berfungsi.
- [X] 5.0 Bangun daftar dan rincian Pinjaman, formulir tiga tahap, editor jadwal khusus, perlindungan input belum tersimpan serta alur kontrak dan pencairan sesuai status. (FR-UI-014–FR-UI-026)
  - [X] 5.1 Bangun daftar pinjaman dengan pencarian, status/kategori, jumlah hasil, pilihan 25/50 baris, kolom yang ditetapkan dan aksi Lihat rincian; tampilkan data belum tersedia dengan jelas. (FR-UI-014?FR-UI-016)
  - [X] 5.2 Bangun formulir `/pinjaman/baru` dalam tahap Nasabah, Detail & Jadwal, dan Tinjau & Simpan; pertahankan input saat berpindah tahap dan periksa ulang kewajiban saat nasabah berubah. (FR-UI-017)
  - [X] 5.3 Pindahkan seluruh field draft existing, perhitungan tenor/rentang dan pola mingguan/bulanan/khusus; invalidasikan pratinjau saat input yang memengaruhi jadwal berubah. (FR-UI-018)
  - [X] 5.4 Buat editor jadwal khusus berbasis baris tanggal/nominal dengan tambah/hapus; validasi tanggal ganda/tidak valid, pokok positif, total jadwal, pembulatan dan tanggal pencairan melalui aturan existing. (FR-UI-019)
  - [X] 5.5 Buat tahap tinjauan identitas, kewajiban, nominal, tujuan, kategori, petugas dan jadwal; pertahankan idempotensi simpan, arahkan ke rincian draft dan tampilkan hasil. (FR-UI-020)
  - [X] 5.6 Lindungi input belum tersimpan ketika navigasi, Back atau refresh; kegagalan menyimpan mempertahankan input dan memberi pesan yang dapat diperbaiki, tanpa menyimpan password/berkas di storage umum browser. (FR-UI-021; AC-UI-10)
  - [X] 5.7 Buat rincian dengan ringkasan status, nasabah, pokok, pembayaran, sisa dan jatuh tempo; kelompokkan Ringkasan, Jadwal, Pembayaran, Dokumen dan Tindak Lanjut dengan tab URL tervalidasi. (FR-UI-022, FR-UI-023)
  - [X] 5.8 Tampilkan progres draft berdasarkan data tersimpan serta alasan dan tautan untuk persyaratan yang belum terpenuhi; pertahankan pengeditan jadwal dan pembatalan kesesuaian kontrak. (FR-UI-024, FR-UI-025)
  - [X] 5.9 Pindahkan pemilihan template, preview, unggah/verifikasi kontrak, tanggal, sumber dana, metode, referensi dan bukti pencairan; tampilkan konfirmasi kontekstual sebelum pencairan. (FR-UI-025, FR-UI-026, FR-UI-034)
  - [X] 5.10 Pertahankan arsip kontrak, berbagi sesuai izin, kartu/ringkasan pinjaman, bukti, tindak lanjut, validasi satu pinjaman aktif dan kebijakan existing pada setiap status. (AC-UI-11, AC-UI-12, AC-UI-15)
  - [X] 5.11 Uji tiga pola jadwal, akhir bulan, kesalahan masukan, retry dan draft tanpa kontrak atau dengan kewajiban aktif; verifikasi pencairan sah, pemuatan ulang rincian dan keamanan dokumen. (AC-UI-09?AC-UI-12)
- [X] 6.0 Bangun halaman Pembayaran dengan antrean verifikasi, riwayat, pencatatan, pemeriksaan bukti dan dialog koreksi; pertahankan konsistensi transaksi saat retry atau konflik antarpetugas. (FR-UI-027–FR-UI-030)
  - [X] 6.1 Bangun halaman Pembayaran dengan tab Perlu Verifikasi dan Riwayat Pembayaran; sediakan Catat Pembayaran melalui pemilihan pinjaman atau langsung dari rincian. (FR-UI-027)
  - [X] 6.2 Tampilkan antrean berhalaman dengan nasabah, nomor, nominal, tanggal, pengiriman, bukti dan indikasi duplikat; pertahankan keterkaitan data, dokumen dan aksi pada ID klaim yang benar. (FR-UI-028)
  - [X] 6.3 Buat panel pemeriksaan responsif serta konfirmasi kontekstual; minta alasan melalui dialog khusus untuk penolakan dan pembatalan, dan cegah konfirmasi ketika bukti tidak tersedia. (FR-UI-028, FR-UI-029)
  - [X] 6.4 Pindahkan formulir pembayaran dengan identitas dan sisa terlihat; pertahankan alokasi, validasi nominal/tanggal, bukti privat dan tanda terima sesuai aturan existing. (FR-UI-027, FR-UI-030)
  - [X] 6.5 Buat riwayat pembayaran dengan pencarian, periode, status dan paginasi seluruh data berizin; tampilkan status/alasan pembatalan, bukti dan tanda terima sesuai izin. (FR-UI-030)
  - [X] 6.6 Tangani proses bersamaan, retry dan klaim yang sudah diproses petugas lain; tampilkan status terbaru dan perbarui cache seluruh halaman terkait. (FR-UI-029; AC-UI-13)
  - [X] 6.7 Uji bayar langsung, bukti nasabah, duplikat, konfirmasi, penolakan, pembatalan, transaksi bersamaan dan akses silang dokumen pada data lokal sintetis. (AC-UI-13, AC-UI-15, AC-UI-18)
- [X] 7.0 Pisahkan Ringkasan Pinjaman, Laporan Pinjaman dan Pengaturan Pinjaman; rapikan pekerjaan tertunda, filter, ekspor, template kontrak serta konfigurasi sesuai kewenangan. (FR-UI-007–FR-UI-009, FR-UI-031–FR-UI-034)
  - [X] 7.1 Bangun ringkasan dengan sisa pokok, tunggakan, pinjaman aktif dan antrean verifikasi; tampilkan basis waktu serta peringatan jika data tidak lengkap. (FR-UI-007; AC-UI-04)
  - [X] 7.2 Tampilkan maksimal lima entri awal dan jumlah keseluruhan untuk bukti, jatuh tempo tujuh hari, tunggakan dan draft belum lengkap; sediakan tautan ke daftar terfilter dan rincian tanpa menghitung ganda pinjaman unik. (FR-UI-008, FR-UI-009)
  - [X] 7.3 Pindahkan distribusi, tren, tunggakan dan laporan ke halaman Laporan Pinjaman; pisahkan filter utama/lanjutan dengan Terapkan dan Reset yang jelas. (FR-UI-031, FR-UI-032)
  - [X] 7.4 Pertahankan kategori, nasabah/nomor, wilayah snapshot, status, periode, tanggal posisi dan kolektabilitas saat aktif; tampilkan filter aktif, cakupan data dan waktu laporan. (FR-UI-031, FR-UI-032)
  - [X] 7.5 Pertahankan ekspor CSV/PDF sesuai filter untuk seluruh hasil meskipun tampilan dipaginasi; uji metadata, formula CSV dan dampak koreksi terhadap laporan historis. (FR-UI-032; AC-UI-14, AC-UI-15)
  - [X] 7.6 Kelompokkan kebijakan, kolektabilitas, template kontrak dan izin viewer pada Pengaturan Pinjaman; admin dapat mengubah sesuai izin, petugas hanya melihat yang diizinkan. (FR-UI-033; AC-UI-16)
  - [X] 7.7 Pertahankan label sumber dana sebagai metadata pencairan, konfigurasi opsional yang belum ditetapkan, kolektibilitas nonaktif dan pemilihan template pada rincian; jangan membuat mutasi kas otomatis. (FR-UI-034)
  - [X] 7.8 Uji kesesuaian ringkasan dengan rincian/laporan, hasil kosong, pekerjaan tertunda, filter dan ekspor; uji pengaturan admin/petugas serta privasi viewer. (AC-UI-04, AC-UI-14, AC-UI-16)
- [X] 8.0 Seragamkan tampilan, istilah Indonesia, format nominal/tanggal, keadaan halaman, validasi, dialog dan aksesibilitas; tuntaskan pengalaman desktop serta ponsel pada seluruh halaman baru. (FR-UI-035–FR-UI-039)
  - [X] 8.1 Gunakan komponen Shadcn UI untuk seluruh komponen UI dalam cakupan perapihan modul Pinjaman Jamaah, termasuk header, kartu, tombol, input, badge, tabel dan dialog; gunakan komponen yang tersedia atau tambahkan komponen Shadcn UI yang diperlukan, serta terapkan token visual aplikasi. Tetapkan satu aksi utama per area dan tampilkan status dengan teks. (FR-UI-035)
  - [X] 8.2 Seragamkan label status dalam bahasa Indonesia, format Rupiah, tanggal dan WIB sesuai PRD; pastikan input tanggal bisnis tidak bergeser karena zona waktu. (FR-UI-036)
  - [X] 8.3 Sesuaikan sidebar, filter, aksi, daftar dan dialog untuk viewport 1366 ? 768 serta 390 ? 844; batasi scroll horizontal ke kontainer tabel dengan penanda yang terlihat. (FR-UI-037)
  - [X] 8.4 Periksa label programatis, navigasi/fokus keyboard, urutan dan pengembalian fokus dialog, ukuran target sentuh 44 ? 44 piksel serta keterbacaan tema. (FR-UI-038; AC-UI-17)
  - [X] 8.5 Implementasikan keadaan memuat, kosong, tanpa hasil, gagal, tidak berwenang dan berhasil; tampilkan error di kolom terkait, fokus ke kesalahan pertama dan cegah klik ganda saat proses. (FR-UI-039)
  - [X] 8.6 Jalankan pemeriksaan visual dan interaksi seluruh halaman serta alur utama pada dua viewport dan keyboard; audit seluruh komponen UI dalam cakupan perapihan untuk memastikan berasal dari Shadcn UI, lalu catat dan perbaiki temuan. (FR-UI-035; AC-UI-17)
- [ ] 9.0 Verifikasi seluruh kriteria penerimaan, regresi bisnis/keamanan/keuangan, performa dengan API lokal sebenarnya, dan uji tugas admin/petugas; dokumentasikan hasil serta panduan navigasi baru. (AC-UI-01–AC-UI-18; ukuran keberhasilan PRD)
  - [X] 9.1 Jalankan dan catat AC-UI-01?AC-UI-06: menu, redirect/anchor, deep link, role, ringkasan, pencarian >50 data, filter serta Back/Forward.
  - [X] 9.2 Jalankan dan catat AC-UI-07?AC-UI-10: identitas existing, nama sama, rumah tangga, akses akun, tiga jenis jadwal, retry dan perlindungan input.
  - [X] 9.3 Jalankan dan catat AC-UI-11?AC-UI-16: syarat pencairan, kontrak, pembayaran/koreksi, konflik, ekspor semua halaman, privasi dokumen dan pengaturan role.
  - [X] 9.4 Jalankan dan catat AC-UI-17?AC-UI-18: ponsel/desktop, keyboard, fingerprint seluruh isi tabel kas/penerimaan, audit, RLS, akun, konkurensi dan Storage privat.
  - [X] 9.5 Jalankan `npm test`, `npm run lint`, `npm run build`, `npm run test:local:sql` serta pengujian keamanan, integrasi, dashboard dan Playwright yang relevan; perbaiki regresi terkait dan bandingkan lint dengan baseline aktual.
  - [X] 9.6 Siapkan 1.000 pinjaman dan 12.000 pembayaran sintetis yang terisolasi; ukur setelah login dengan API lokal/PostgREST dan RLS sebenarnya sebanyak lima kali setelah pemanasan. Catat median, maksimum, perangkat dan browser; uji target ringkasan/daftar ?3 detik dan rincian ?2 detik.
  - [X] 9.7 Lakukan uji tugas dengan minimal satu admin dan satu petugas pada lima alur PRD; catat keberhasilan minimal 4/5 per orang, hambatan dan tindak lanjut. Jika peserta belum tersedia, tandai belum selesai; uji sintetis tidak menggantikan partisipasi manusia.
  - [X] 9.8 Perbarui panduan operasional, peta menu/URL lama dan matriks FR/AC dengan perintah, bukti, hasil, keterbatasan serta tindak lanjut lint/performa; pastikan semua sub-task P0 selesai sebelum menutup parent task.
  - [X] 9.9 Dokumentasikan FR-UI-041 dan FR-UI-042 sebagai peningkatan P1 opsional yang hanya dikerjakan setelah P0 diterima; tentukan tindak lanjut tanpa menganggapnya wajib untuk penutupan P0.
