## Relevant Files

- [zakat-fitrah-app/src/pages/SedekahReceipt.tsx](zakat-fitrah-app/src/pages/SedekahReceipt.tsx) - Halaman daftar dan aksi Bukti Sedekah, termasuk redownload PDF.
- [zakat-fitrah-app/src/components/sedekah/SedekahReceiptForm.tsx](zakat-fitrah-app/src/components/sedekah/SedekahReceiptForm.tsx) - Form pembuatan/edit Bukti Sedekah, sumber notes/catatan.
- [zakat-fitrah-app/src/utils/sedekahReceipt.ts](zakat-fitrah-app/src/utils/sedekahReceipt.ts) - Generator PDF Bukti Sedekah dan mapping field notes.
- [zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx](zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx) - Form Penerimaan Uang, kandidat field upload bukti bayar.
- [zakat-fitrah-app/src/components/pemasukan/PemasukanBerasForm.tsx](zakat-fitrah-app/src/components/pemasukan/PemasukanBerasForm.tsx) - Form Penerimaan Beras, kandidat field upload bukti bayar.
- [zakat-fitrah-app/src/hooks/usePemasukanUang.ts](zakat-fitrah-app/src/hooks/usePemasukanUang.ts) - Mutasi create/update pemasukan uang dan payload DB.
- [zakat-fitrah-app/src/hooks/usePemasukanBeras.ts](zakat-fitrah-app/src/hooks/usePemasukanBeras.ts) - Mutasi create/update pemasukan beras dan payload DB.
- [zakat-fitrah-app/src/pages/PemasukanUang.tsx](zakat-fitrah-app/src/pages/PemasukanUang.tsx) - Integrasi form, tabel data, dan mode bulk untuk uang.
- [zakat-fitrah-app/src/pages/PemasukanBeras.tsx](zakat-fitrah-app/src/pages/PemasukanBeras.tsx) - Integrasi form, tabel data, dan mode bulk untuk beras.
- [zakat-fitrah-app/src/components/pemasukan/BulkPemasukanForm.tsx](zakat-fitrah-app/src/components/pemasukan/BulkPemasukanForm.tsx) - UI bulk action berbasis tabel yang akan diubah.
- [zakat-fitrah-app/src/hooks/useBulkPembayaran.ts](zakat-fitrah-app/src/hooks/useBulkPembayaran.ts) - Logika submit bulk dan mapping transaksi per baris.
- [zakat-fitrah-app/src/types/bulk.ts](zakat-fitrah-app/src/types/bulk.ts) - Definisi tipe data row bulk, result, dan meta.
- [zakat-fitrah-app/src/types/database.types.ts](zakat-fitrah-app/src/types/database.types.ts) - Tipe DB generated, wajib sinkron jika ada kolom baru.
- [zakat-fitrah-app/supabase/migrations](zakat-fitrah-app/supabase/migrations) - Migrasi kolom/constraint/rls terkait bukti bayar atau satuan beras liter.
- [zakat-fitrah-app/src/hooks/useBulkPembayaran.test.ts](zakat-fitrah-app/src/hooks/useBulkPembayaran.test.ts) - Unit test aturan bisnis bulk action.
- [zakat-fitrah-app/src/hooks/usePemasukanUang.test.ts](zakat-fitrah-app/src/hooks/usePemasukanUang.test.ts) - Unit test mutasi pemasukan uang.
- [zakat-fitrah-app/src/hooks/usePemasukanBeras.test.ts](zakat-fitrah-app/src/hooks/usePemasukanBeras.test.ts) - Unit test mutasi pemasukan beras.

### Notes

- Unit test sebaiknya ditempatkan berdampingan dengan file yang diuji jika pola tersebut sudah digunakan di modul terkait.
- Ikuti prioritas delivery: catatan → upload bukti bayar → bulk action.
- Jalankan pengujian spesifik fitur terlebih dahulu, lalu `npm run build` sebelum task dinyatakan selesai.
- Pastikan setiap sub-task di bawah ini di-checklist (`[ ]` menjadi `[x]`) saat selesai dikerjakan.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`.

## Tasks

- [x] 0.0 Create feature branch
	- [x] 0.1 Create and checkout branch `feature/transaksi-catatan-upload-bulk-action`

- [x] 1.0 Implement catatan transaksi on Bukti Sedekah page and PDF output
	- [x] 1.1 Audit alur data catatan dari transaksi dan bukti sedekah (source of truth: catatan transaksi).
	- [x] 1.2 Tambahkan/rapikan mapping catatan pada tampilan daftar/detail Bukti Sedekah.
	- [x] 1.3 Update generator PDF Bukti Sedekah agar menampilkan catatan transaksi secara konsisten.
	- [x] 1.4 Terapkan fallback tampilan `-` saat catatan kosong tanpa merusak layout PDF/UI.
	- [x] 1.5 Verifikasi redownload PDF menampilkan catatan yang sama dengan data tersimpan.

- [x] 2.0 Add upload bukti bayar image per transaksi (Penerimaan Uang & Penerimaan Beras)
	- [x] 2.1 Tentukan desain data penyimpanan bukti bayar (kolom URL/path pada pemasukan uang & beras atau tabel terpisah sesuai pola existing).
	- [x] 2.2 Buat migrasi DB + update tipe database generated untuk field bukti bayar.
	- [x] 2.3 Tambahkan field upload pada `PemasukanForm` dengan batas 1 file gambar maksimal 1 MB.
	- [x] 2.4 Tambahkan field upload pada `PemasukanBerasForm` dengan batas 1 file gambar maksimal 1 MB.
	- [x] 2.5 Implement upload ke storage, simpan URL/path pada mutasi create/update pemasukan uang.
	- [x] 2.6 Implement upload ke storage, simpan URL/path pada mutasi create/update pemasukan beras.
	- [x] 2.7 Tambahkan preview/indikator file bukti bayar pada mode edit agar file dapat diganti.
	- [x] 2.8 Tampilkan pesan error yang jelas untuk file invalid (tipe tidak didukung atau >1 MB).

- [x] 3.0 Revamp bulk action transaction to table input + new payment rules
	- [x] 3.1 Redesign struktur `BulkRow` untuk model per baris transaksi dengan kolom tipe, media, nilai, satuan, dan catatan.
	- [x] 3.2 Update UI `BulkPemasukanForm` ke format tabel input massal per baris sesuai spec.
	- [x] 3.3 Tambahkan opsi tipe transaksi: zakat fitrah, maal, infak, fidyah.
	- [x] 3.4 Tambahkan opsi media pembayaran: uang (Rp), beras (kg), beras (liter).
	- [x] 3.5 Implement aturan validasi tipe-media: maal/fidyah hanya uang; fitrah/infak dapat uang, beras kg, beras liter.
	- [x] 3.6 Implement aturan satu transaksi satu media pembayaran (tidak boleh gabungan).
	- [x] 3.7 Update `submitBulk` agar menghasilkan payload pemasukan sesuai mapping tipe-media baru.
	- [x] 3.8 Update komponen hasil/rekap bulk agar menampilkan output sukses/gagal per baris dengan alasan error.

- [x] 4.0 Add validation, error handling, and compatibility safeguards
	- [x] 4.1 Tambahkan validasi client-side (Zod/form rules) untuk semua field baru dan conditional field bulk.
	- [x] 4.2 Tambahkan validasi server-side (hook/service layer) untuk mencegah bypass aturan tipe-media.
	- [x] 4.3 Pastikan kompatibilitas data existing (record lama tetap terbaca normal tanpa bukti bayar).
	- [x] 4.4 Cek dampak ke receipt lama/reprint agar tidak memutus alur operasional yang sudah berjalan.

- [x] 5.0 Add/update tests and run build verification
	- [x] 5.1 Update unit test `useBulkPembayaran.test.ts` untuk skenario media beras liter dan aturan tipe-media.
	- [x] 5.2 Tambah/update test hook pemasukan untuk field bukti bayar dan fallback catatan.
	- [x] 5.3 Tambahkan test validasi form (minimal untuk batas ukuran file 1 MB dan tipe file gambar).
	- [x] 5.4 Jalankan test terfokus fitur transaksi/bulk/sedekah receipt.
	- [x] 5.5 Jalankan `npm run build` dan pastikan hasil lulus tanpa error.

- [x] 6.0 Bug fix widget Hak Amil: pisahkan perhitungan uang dan beras
	- [x] 6.1 Reproduksi bug pada skenario transaksi beras (contoh: Fidyah Beras 5,4 kg) dan dokumentasikan sumber double-counting.
	- [x] 6.2 Hapus komponen/perhitungan beras dari widget Hak Amil berbasis uang agar tidak ikut akumulasi nominal Rupiah.
	- [x] 6.3 Buat widget baru khusus Hak Amil Beras (terpisah dari Hak Amil uang) dengan tampilan dan agregasi satuan beras.
	- [x] 6.4 Pastikan widget Hak Amil Beras tidak melakukan konversi ke Rupiah dalam kondisi apa pun.
	- [x] 6.5 Sesuaikan perhitungan widget Hak Amil Beras untuk mendukung satuan `kg` dan `liter` dari perubahan terakhir.
	- [x] 6.6 Update konfigurasi editor/list widget agar tipe widget Hak Amil Uang dan Hak Amil Beras dapat dipilih terpisah.
	- [x] 6.7 Tambahkan/update test unit/integrasi untuk mencegah regresi konversi beras->Rupiah dan validasi total per media.
	- [x] 6.8 Jalankan verifikasi akhir (`npm run test` terkait dashboard/hak amil + `npm run build`).
