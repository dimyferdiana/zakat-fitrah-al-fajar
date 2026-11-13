# Verifikasi task 6: pembayaran

Tanggal: 11 November 2026. Pengujian memakai Supabase lokal dan fixture sintetis; tidak ada perubahan data online atau migrasi baru.

## Implementasi

- Halaman Pembayaran memiliki tab Perlu Verifikasi dan Riwayat Pembayaran serta aksi Catat Pembayaran. Pemilihan pinjaman mencari dan memaginasi pinjaman aktif atau yang perlu rekonsiliasi; formulir dibuka pada tab pembayaran pinjaman dengan nama, nomor dan sisa pokok yang tersedia.
- Antrean berhalaman mempertahankan relasi klaim dan dokumen berdasarkan ID pembayaran. Dialog pemeriksaan Shadcn menampilkan informasi transaksi, waktu pengiriman, referensi, indikasi duplikat dan bukti. Konfirmasi memerlukan bukti yang dapat diakses dan ringkasan transaksi; server tetap memeriksa ulang bukti dan status.
- Penolakan dan pembatalan menggunakan dialog alasan masing-masing. Saat transaksi sudah diproses petugas lain, status terbaru diambil dari server, ditampilkan, dan proyeksi terkait diperbarui. RPC existing tetap menangani kunci idempotensi, penguncian, audit dan alokasi.
- Riwayat mendukung pencarian, periode, status dan paginasi server, memperlihatkan alasan serta menyediakan bukti dan tanda terima sesuai izin. Rincian pinjaman menggunakan pemeriksaan dan pembatalan yang sama.

## Bukti pengujian

- `node tests/loan-payment-lists-local.mjs`: lulus untuk 56 klaim, paginasi antrean dan riwayat, indikasi duplikat, filter dan isolasi role.
- `node tests/task4-6-integration-local.mjs`: lulus untuk pembayaran langsung, validasi nominal/tanggal, retry, pembatalan idempoten, klaim duplikat, transaksi bersamaan dan isolasi dokumen privat.
- `npx playwright test tests/browser/loan-payment-workflows.spec.mjs tests/browser/task4-6.spec.mjs`: dua skenario lulus, termasuk viewport ponsel, pemilihan pinjaman, bukti hilang, penolakan, konflik antarpetugas, pencairan, pencatatan, koreksi, bukti dan tanda terima.
- `npx playwright test tests/browser/loan-navigation.spec.mjs`: dua skenario navigasi lulus.
- `npm test`: 22 berkas dan 64 tes lulus. `npm run lint` dan `npm run build`: lulus.

Audit visual dan aksesibilitas seluruh modul serta verifikasi menyeluruh tetap tercakup pada task 8 dan 9.
