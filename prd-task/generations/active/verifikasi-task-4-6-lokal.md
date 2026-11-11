# Verifikasi task 4 dan 6 — pinjaman dan pembayaran lokal

Tanggal: 9 November 2026. Seluruh pengujian database dan Edge Function menggunakan Supabase lokal, bukan proyek online. Migrasi `090`–`092` dan `100`–`105` telah diterapkan di lokal.

Task 4 mencakup draft dengan penanggung jawab dan catatan, jadwal yang ditinjau sebelum disimpan, kebijakan dan penjamin opsional, kontrak bertanda tangan, serta pencairan. Pencairan pinjaman baru ditahan jika masih ada kewajiban bersaldo positif; referensi dan sisa kewajiban ditampilkan. Perubahan jadwal draft membatalkan keabsahan kontrak dan pengecualian terkait.

Pembaruan task 9: bukti pencairan opsional dapat dipilih pada form pencairan atau ditambahkan kemudian pada rincian pinjaman. Unggahan memiliki identitas retry dan pemeriksaan hak; jika unggahan gagal setelah pencairan berhasil, pengurus dapat mengulang unggahan tanpa mencatat pencairan lagi. Pengujian API dan browser lokal mencakup bukti tersebut.

Task 6 mencakup pembayaran pengurus, klaim dengan bukti dari nasabah, peninjauan klaim, alokasi berdasarkan tanggal efektif dan ID, saldo dan tunggakan, pembatalan beralasan, tanda terima dan audit. Jika pembatalan menghidupkan kembali pinjaman lama saat pinjaman lain aktif, kedua kewajiban tetap terlihat dan dapat dilunasi; pencairan berikutnya ditahan. Catatan internal tidak disertakan dalam riwayat nasabah. Transaksi pinjaman tidak mencatat pemasukan atau mengubah ledger kas.

Pemeriksaan akses menemukan bahwa kebijakan profil lama memungkinkan pengguna mengubah role atau statusnya sendiri. Migrasi `104` menutup celah tersebut; operasi admin dalam mode pengurus tetap tersedia. Migrasi `105` menolak pencatatan atau konfirmasi pembayaran pasca-cut-off ketika saldo awal dan jadwal migrasi tidak lengkap atau tidak cocok. Fitur impor dan rekonsiliasi historis tetap ditunda pada task 5.

## Hasil pengujian

- `npm test`: 54 tes lulus; `npm run build` dan lint terarah pada file pinjaman lulus.
- `node tests/loan-db.integration.mjs`: skema terisolasi, kebijakan, penjamin, pengecualian, pencairan dan pembatalan lulus.
- `npm run test:local:sql`: 13 fixture PostgreSQL lokal lulus dan perubahan di-rollback, termasuk perubahan jadwal, audit, dan validasi saldo migrasi.
- `npm run test:task4-6:integration`: uji API dan Storage lokal lulus untuk pembayaran Rp250.000/Rp550.000, tanggal mundur, saldo, pelunasan, pembatalan, kewajiban yang aktif kembali, kontrak wajib, bukti, retry dan transaksi bersamaan. Tidak ada perubahan ledger atau penerimaan.
- `npm run test:task6:role-guard`: petugas, viewer, nasabah, dan admin dalam mode nasabah tidak dapat mengubah role, status atau email sendiri; admin dalam mode pengurus tetap dapat mengelola role.
- `npm run test:task4-6:browser`: draft dan pembulatan, kontrak wajib, pencairan, pembayaran dengan bukti, portal nasabah, serta pembatalan lulus tiga kali berturut-turut melalui browser. Pengujian juga memastikan form pembayaran tidak terduplikasi setelah pencairan.
- `npm run test:task3:security`, `npm run test:task3:accounts` dan `npm run test:task3:browser` lulus kembali setelah migrasi audit dan hak akses.

Pengujian API memakai akun dan data sintetis yang dibersihkan setelah tes. Uji SQL menggunakan rollback. Password, token, isi berkas dan catatan internal tidak dicatat dalam audit. Uji keamanan dan akun yang mengubah pengaturan portal perlu dijalankan berurutan.

## Menjalankan lokal

Pastikan Docker Desktop berjalan, kemudian buka terminal PowerShell:

```powershell
cd C:\Codes\Al-Fajar\zakat-fitrah-al-fajar\zakat-fitrah-app
npm run supabase:start
npm run supabase:functions
```

Biarkan fungsi berjalan dan buka terminal kedua pada folder yang sama:

```powershell
npm run dev
```

Buka alamat yang ditampilkan Vite dan masuk dengan admin lokal. Pengurus dapat memilih nasabah, membuat dan meninjau jadwal draft, mengunggah kontrak bertanda tangan, mencatat pencairan dan pembayaran, serta membatalkan pembayaran dengan alasan. Nasabah yang sudah dibuatkan akun dapat masuk menggunakan email dan password.

Pembaruan task 7: sebelum menyimpan kontrak bertanda tangan, admin perlu membuat versi template, lalu pengurus memilih versi tersebut dan mencentang pemeriksaan tanda tangan. Lihat [verifikasi-task-7-lokal.md](verifikasi-task-7-lokal.md).

Untuk mengulangi pengujian setelah fungsi lokal berjalan, jalankan `npm test`, `npm run test:local:sql`, `npm run test:task4-6:integration`, `npm run test:task6:role-guard`, dan `npm run test:task4-6:browser` secara berurutan dari folder aplikasi. Kebutuhan Docker, fungsi lokal, dan pembersihan data sintetis berlaku untuk tes database.

Hasil ini menunjukkan kesiapan pada lingkungan lokal. Redaksi dan penandatangan kontrak final masih perlu disiapkan pengurus. Penerapan Supabase online, persiapan rilis dan pengujian integrasi keseluruhan tetap termasuk task 9; tidak dilakukan dalam pekerjaan ini.
