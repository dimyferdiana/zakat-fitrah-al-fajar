# Verifikasi task 5: daftar dan alur pinjaman

Tanggal: 11 November 2026. Pengujian memakai Supabase lokal dan fixture sintetis; tidak ada migrasi atau pengujian terhadap data online.

## Implementasi

- Daftar pinjaman menggunakan tabel Shadcn, filter dan paginasi server, dengan jatuh tempo terdekat yang belum lunas dan tautan rincian. Migrasi `146` menambahkan proyeksi tersebut tanpa mengubah aturan saldo.
- Formulir tiga tahap mempertahankan isian, memeriksa nasabah dan kewajiban, membuat jadwal mingguan, bulanan atau khusus, meninjau data, dan menyimpan melalui RPC draft existing dengan ID permintaan yang sama saat retry. Navigasi internal dan Back memunculkan dialog Shadcn; refresh menggunakan konfirmasi bawaan browser.
- Rincian menggunakan tab URL tervalidasi. Progres draft diambil dari data tersimpan lewat migrasi `147`; persyaratan tetap diperiksa ulang oleh server ketika pencairan. Kontrak, jadwal, dokumen, pembayaran dan tindak lanjut tetap tersedia pada konteks pinjaman.
- Konfirmasi pencairan menampilkan identitas, nomor, nominal, tanggal, sumber dana dan status kontrak. Penyimpanan, audit, aturan kebijakan, idempotensi dan Storage privat tetap menggunakan mekanisme server existing.
- Migrasi `146` dan `147` diterapkan dan dicatat pada riwayat Supabase lokal. Keduanya perlu diterapkan melalui proses migrasi biasa pada lingkungan lain sebelum UI digunakan di sana.

## Bukti pengujian

- `node tests/loan-navigation-data-local.mjs`: lulus, termasuk 57 pinjaman, pencarian, filter, saldo dan isolasi role.
- `node tests/loan-draft-readiness-local.mjs`: lulus, termasuk jadwal, kontrak belum ada, kewajiban aktif, retry dan pembatasan role.
- `npx playwright test tests/browser/loan-create-workflow.spec.mjs`: lulus untuk tiga pola, akhir bulan, tanggal ganda, Back, refresh, kegagalan simpan, retry dengan ID yang sama dan reload tab rincian.
- `npx playwright test tests/browser/loan-navigation.spec.mjs tests/browser/loan-data-navigation.spec.mjs tests/browser/loan-customer-profile.spec.mjs`: empat skenario lulus, termasuk menu ponsel, riwayat dan akses.
- `npx playwright test tests/browser/task4-6.spec.mjs`: lulus untuk draft, kontrak, pencairan, pembayaran dan koreksi.
- `node tests/task4-6-integration-local.mjs`: lulus untuk pencairan atomik/idempoten, kontrak wajib, berbagi dan isolasi dokumen privat, kewajiban aktif serta transaksi bersamaan.
- `npm test`: 22 berkas dan 64 tes lulus. `npm run lint`: lulus. `npm run build`: lulus.

Penyeragaman menyeluruh, audit seluruh komponen Shadcn dan aksesibilitas lintas halaman tetap merupakan cakupan task 8; verifikasi seluruh AC, performa, dan uji tugas oleh peserta manusia tetap pada task 9.
