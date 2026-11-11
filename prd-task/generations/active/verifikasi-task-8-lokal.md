# Verifikasi task 8 — portal, dashboard dan laporan lokal

Tanggal 9 November 2026. Implementasi diuji dengan Supabase lokal dan data sintetis. Migrasi `120`, `121`, `130`, `131` dan `140` telah diterapkan di lokal; proyek online belum diubah.

Pengurus mendapat navigasi nasabah, draft, jadwal/laporan, antrean pembayaran dan pengaturan. Dashboard memisahkan arus transaksi dalam periode dari posisi pada tanggal yang dipilih. Filter mencakup kategori, nama/nomor, wilayah snapshot saat pencairan, status, dan kolektabilitas ketika aktif. Ringkasan menampilkan jumlah nasabah/pinjaman, arus pencairan/pembayaran, sisa, tunggakan, antrean dan rasio dengan basis tanggal. Ada distribusi kategori/nasabah/wilayah, tren, daftar jatuh tempo, tunggakan, janji, kontrak belum lengkap, tautan ke pinjaman serta teks pengingat manual dengan kontak organisasi yang tersedia.

Portal nasabah menampilkan profil dan kontak pengurus, pinjaman milik sendiri, jadwal dan saldo yang dapat diverifikasi, pengingat tagihan, status klaim, dokumen yang dibagikan dan tanda terima. Data migrasi yang belum lengkap diberi tanda dan jadwal/saldo yang belum terverifikasi tidak disajikan sebagai angka pasti. Admin dapat menyimpan versi rentang kolektabilitas; default tetap nonaktif. Label berasal dari DPD dan saldo, bukan input bebas atau skor kredit eksternal.

Ekspor CSV menetralkan teks yang dapat ditafsirkan sebagai formula spreadsheet, dan mencantumkan filter, waktu serta basis tanggal. Ringkasan PDF mencantumkan filter dan basis perhitungan. Riwayat periode memakai status transaksi terkini, sehingga koreksi dapat mengubah hasil periode sebelumnya. Dokumen pinjaman lain tersedia dari rincian dan portal.

## Bukti pengujian

- `npm test`: 63 tes lulus termasuk jadwal, saldo, perhitungan laporan, filter, CSV dan kolektabilitas.
- `npm run test:task8:api`: proyeksi dashboard, transaksi, snapshot wilayah, privasi catatan, serta penolakan viewer/nasabah/anon lulus. Profil nasabah hanya dapat diakses sesi pemilik.
- `npm run test:task8:collectibility`: PostgreSQL lokal menguji default nonaktif, batas DPD, validasi rentang tanpa celah/tumpang tindih, izin, audit versi, koreksi dan migrasi tidak lengkap; fixture di-rollback.
- `npm run test:task8:browser`: pada viewport 390 × 844, filter menampilkan angka sintetis yang cocok dengan transaksi; navigasi, profil, pengingat, CSV aman, PDF dan tautan rincian lulus. Pembayaran bertanggal mundur dan koreksinya diuji kembali pada dashboard dan nilai CSV periode historis. Fingerprint enam tabel kas/penerimaan tetap sama sebelum dan sesudah ekspor.
- `npm run test:task9:mobile`: login dan tampilan pengurus/nasabah pada viewport 390 × 844 lulus, termasuk pemeriksaan overflow horizontal.
- `npx --no-install playwright test`: seluruh enam skenario browser lulus berurutan, termasuk akun, dokumen, pembayaran, dashboard, smoke test program lama dan tampilan ponsel.
- `npm run test:task3:security`: pemeriksaan akses/RLS/Storage dan endpoint legacy lulus pada 51 tabel/view. Bukti pencairan opsional diuji pada `npm run test:task4-6:integration` dan `npm run test:task4-6:browser`, termasuk retry dan penolakan akses.

Benchmark `npm run test:task9:performance:api` memakai bundle produksi, HTTP/PostgREST dan RLS pada database lokal sementara berisi 1.000 pinjaman serta 12.000 pembayaran sintetis. Lima pengukuran dashboard menghasilkan median 989 ms dan maksimum 1.168 ms; rincian median 97 ms dan maksimum 212 ms. Pengujian lokal memakai browser headless dan proxy localhost; jaringan serta beban lingkungan operasional belum dibuktikan. Dashboard masih memuat proyeksi seluruh pinjaman ke klien. Data sintetis dibersihkan dan fixture SQL di-rollback.

Untuk mengulang, jalankan Docker serta Supabase dan Edge Function lokal, lalu jalankan perintah di atas secara berurutan dari folder `zakat-fitrah-app`. Panduan pengguna ada di [panduan operasional](panduan-operasional-pinjaman.md); status penerimaan dan rilis ada di [matriks task 9](matriks-hasil-task-9-lokal.md).
