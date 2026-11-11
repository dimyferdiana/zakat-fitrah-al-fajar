# Verifikasi task 3 — akun dan otorisasi lokal

Tanggal: **9 November 2026 (Asia/Jakarta)**. Lingkungan: Supabase lokal `127.0.0.1:54321`, database `127.0.0.1:54322`, aplikasi dalam `zakat-fitrah-app`.

## Hasil

Task 3 selesai dalam cakupan implementasi dan pengujian lokal. Migrasi tambahan `085`–`089` sudah diterapkan di lokal. Proyek online `zuykdhqdklsskgrtwejg` belum diubah. Penerapan online tetap mengikuti rekonsiliasi riwayat migrasi, backup dan verifikasi rilis pada kelompok 9; hasil lokal bukan bukti penerapan produksi.

Pembaruan saat pengujian task 4 dan 6: migrasi lokal `104` menutup celah pada kebijakan profil lama yang memungkinkan pengguna mengubah role, status aktif, atau email sendiri. Regresi REST pada petugas, viewer, nasabah, dan admin dalam mode nasabah lulus; admin dalam mode pengurus tetap dapat mengelola role. Suite keamanan, pemulihan akun dan browser task 3 juga lulus kembali. Rinciannya terdapat pada [verifikasi-task-4-6-lokal.md](verifikasi-task-4-6-lokal.md).

| Butir | Implementasi dan bukti |
|---|---|
| 3.1 | UUID orang dan akun unik; individu terverifikasi; admin dapat menautkan akun pengurus existing secara eksplisit. Satu login dapat beralih mode. Mode dicatat per sesi server, bukan hanya state/menu browser. |
| 3.2 | Admin/petugas aktif mempunyai operasi pinjaman; viewer memerlukan izin eksplisit. Nasabah hanya menerima proyeksi pinjaman/dokumen sendiri. Akun nonaktif dan sesi dicabut ditolak. |
| 3.3 | Guard seluruh tabel legacy, view invoker, fungsi anonymous dicabut, role helper lama menghormati mode. Fungsi undangan lama diperbaiki agar hanya admin aktif dalam mode pengurus dapat membuat undangan. Bucket programme privat; signed URL pengguna ditolak; unduhan memeriksa sesi setiap permintaan. |
| 3.4 | Edge Function `loan-customer-account` membuat akun via admin Auth API dan RPC memeriksa identitas. Tidak membuat profil pengurus untuk nasabah baru. Uji API serta browser lulus. |
| 3.5 | Email/password; provider email aktif; signup umum dan SMS nonaktif. Login pengurus serta alur undangan tetap teruji. |
| 3.6 | Email unik di Auth; password baru minimal delapan karakter di server dan form akun. Password/token tidak masuk audit, log fungsi akun, atau artefak browser. Service key hanya di server/CLI dan tidak diberi awalan `VITE_`. Pembatasan percobaan mengikuti konfigurasi rate limit Auth lokal. |
| 3.7 | Admin mengubah email/password setelah pemeriksaan identitas; operasi mempunyai referensi unik dan menolak pemulihan bersamaan. Akun ditangguhkan, sesi lama dan sesi yang dibuat selama pemulihan dicabut, lalu perubahan diaudit. Perubahan kredensial nasabah di luar alur ini ditolak oleh database. |
| 3.8 | Uji role rangkap, viewer/grant/revoke, akun nonaktif, email duplikat, password salah, ID pinjaman/dokumen orang lain, CSV, GraphQL dan endpoint undangan lama lulus. |
| 3.9 | Browser Edge headless: admin membuat akun, nasabah login dan hanya melihat pinjaman sendiri, pemulihan password/email, pergantian mode rangkap, izin viewer dan akun nonaktif lulus. OTP/SMS tetap ditunda. |

## Bukti yang dapat diulang

- `npm test`: **49 tes**, 14 file, lulus.
- `npm run build`: lulus. Peringatan existing Browserslist dan pembagian chunk tidak menghalangi build.
- `node tests/loan-db.integration.mjs`: fixture terisolasi mencakup migrasi sampai `089`, lulus.
- `node tests/run-local-sql-regressions.mjs`: **10 fixture PostgreSQL lokal**, lulus; semuanya di-rollback.
- `npm run test:task3:security`: pemeriksaan nyata melalui API/Storage dan CLI pada **49 tabel/view**, lulus. Ringkasan tanpa data pribadi disimpan di `tests/task3-security-local.results.json`.
- `node tests/loan-auth-credentials-local.mjs`: password lemah, email duplikat, password salah, login dan penggantian kredensial Auth, lulus.
- `npm run test:task3:accounts`: pembuatan akun, login, email/password recovery, sesi lama dan audit, lulus.
- `npm run test:task3:browser`: satu skenario lengkap di browser Edge, lulus. Browser pengujian dapat diganti dengan variabel `PLAYWRIGHT_CHANNEL`.
- Lint terarah pada implementasi Auth, portal, proyeksi berkas dan kontrol akun lulus. Lint seluruh repository masih memiliki masalah existing di luar task ini.

Pengujian membuat akun dan transaksi sintetis, lalu membersihkan hanya UUID yang baru dibuat. Pengaturan akses portal dikembalikan seperti semula oleh setiap fixture. Data lokal pengguna dan data online tidak dijadikan fixture. Tidak ada password, token akses atau service key yang dicetak oleh pengujian. Trace, video dan penyimpanan sesi browser dimatikan.

## Menjalankan aplikasi

Docker Desktop harus berjalan. Semua terminal berikut memakai direktori ini:

```powershell
cd C:\Codes\Al-Fajar\zakat-fitrah-al-fajar\zakat-fitrah-app
```

Terminal pertama:

```powershell
npm run supabase:start
npm run supabase:functions
```

Biarkan proses fungsi tetap berjalan; pembuatan akun, pemulihan dan unggahan menggunakan Edge Function lokal. Terminal kedua:

```powershell
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`, lalu masuk memakai admin lokal yang sudah dibuat. Pilih aplikasi **Pinjaman Jamaah**. Daftarkan nasabah dari individu terverifikasi, kemudian gunakan **Buat akun nasabah**. Password awal ditentukan admin pada form; bagikan melalui saluran pribadi. Untuk pengurus yang juga nasabah, gunakan **Pengurus yang juga nasabah** untuk menautkan akun yang sudah ada setelah memastikan identitasnya.

Akun pengurus yang ditautkan perlu memuat ulang aplikasi agar tombol **Mode nasabah** muncul. Dalam mode nasabah, tombol **Mode pengurus** tersedia. Pergantian mode memuat ulang halaman dan cache; tab lain dengan sesi yang sama ikut dimuat ulang. Sesi pada browser lain tetap mempunyai modenya sendiri.

Pemulihan tersedia pada bagian **Pemulihan akun nasabah**. Email/password baru tidak disimpan di audit. Nasabah harus masuk kembali setelah perubahan. Password pengurus lama yang masih memenuhi kebijakan ketika dibuat tetap dapat digunakan untuk login; password baru mengikuti minimum delapan karakter.

## Mengulang pengujian

Setelah fungsi lokal berjalan, gunakan terminal ketiga:

```powershell
npm test
npm run test:task3:security
npm run test:task3:accounts
npm run test:task3:browser
```

Jalankan ketiga suite task 3 **berurutan**, karena masing-masing memulihkan pengaturan portal setelah pengujian. Browser suite menjalankan Vite sendiri pada port `5174`, sehingga tidak memakai sesi browser pengguna pada port `5173`. Semua suite menolak URL API yang bukan `127.0.0.1`.

Pembuatan akun lokal dapat diaktifkan sesudah verifikasi dengan `npm run portal:enable:local`. Skrip tersebut memeriksa provider email, penutupan signup umum, RLS, view, fungsi anonim dan bucket privat; skrip hanya menargetkan lokal. Migrasi tetap menyimpan default nonaktif untuk lingkungan baru sampai audit lingkungan tersebut selesai.

## Pemulihan terputus dan penerapan online

Jika proses server terputus di tengah pemulihan, akun tetap ditangguhkan. Admin teknis perlu memeriksa `customer_recovery_started` beserta referensi operasi pada `loan_audit`, memastikan permintaan lama sudah berhenti, lalu menandai operasi tersebut gagal melalui CLI sebelum mengulangi pemulihan. Jangan membuka `access_paused` langsung tanpa menyelesaikan perubahan kredensial. Kegagalan yang dikembalikan normal oleh Auth sudah ditandai gagal secara otomatis dan dapat dicoba kembali dari form.

Bucket privat mempertahankan seluruh objek dan referensi historis. Aplikasi menerjemahkan URL foto publik lama menjadi path untuk unduhan terautentikasi; nilai historis tidak ditimpa. Tautan publik lama tidak lagi dapat diunduh tanpa sesi. Sebelum penerapan online, inventaris objek, kompatibilitas aplikasi, cache/tautan lama dan signed URL yang pernah diterbitkan harus ditangani dalam rencana rilis. Tidak ada perubahan status bucket online selama task ini.

Referensi teknis: [Supabase — sesi pengguna](https://supabase.com/docs/guides/auth/sessions), [Storage helper dan pembatasan operasi](https://supabase.com/docs/guides/storage/schema/helper-functions), [unduhan privat](https://supabase.com/docs/guides/storage/serving/downloads).
