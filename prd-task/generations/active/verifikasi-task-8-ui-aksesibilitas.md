# Verifikasi task 8: UI dan aksesibilitas pinjaman

Tanggal: 12 November 2026. Verifikasi browser memakai Supabase lokal dan data uji; tidak ada migrasi atau perubahan data online.

## Perubahan dan temuan

- Audit sumber untuk kontrol interaktif dan tabel pada halaman serta komponen pinjaman, layout, pemilih aplikasi, dan formulir Data Master yang dipakai pendaftaran: tidak ditemukan elemen `button`, `select`, `input`, `textarea`, `table`, atau `dialog` mentah. Kontrol yang ditemukan telah menggunakan komponen Shadcn yang tersedia, termasuk tabel portal nasabah dan pilihan tindak lanjut.
- Tanggal kalender ditampilkan dengan format Indonesia melalui fungsi yang memformat tanggal bisnis dalam UTC tanpa menggeser harinya; timestamp memakai WIB. Status ditampilkan dengan istilah Indonesia. Nilai input dan tanggal untuk RPC tetap dalam format bisnis semula.
- Daftar pinjaman ponsel menggunakan kartu ringkas. Tabel desktop menjaga nomor dan status tetap terbaca; jadwal dan laporan membatasi geser horizontal ke kontainer tabel serta memberi penanda pada ponsel. Tab rincian dapat membungkus ke baris berikutnya. Kartu ringkasan ponsel ditata dua kolom.
- Dialog Shadcn dibatasi ke viewport dan dapat digulir; tombol dialog dan aksi utama memiliki target minimal 44 piksel. Label pagination telah diperbaiki. Dialog perubahan belum disimpan mendukung Escape dan mengembalikan fokus ke pemicu. Audit juga menemukan token `.dark` dibuang dari CSS build; safelist memastikan token tema gelap tersedia.
- Validasi utama pembuatan, pembayaran, bukti, tindak lanjut, jadwal, akun dan pengaturan menampilkan pesan pada konteks formulir; fokus diarahkan ke masalah pertama pada alur yang memerlukan input. Mutasi terkait ditahan saat proses, menampilkan kemajuan, dan input tetap dapat diperbaiki ketika gagal. Keadaan kosong, tanpa hasil dan gagal pada daftar utama dibedakan dan menyediakan tindakan yang sesuai.

## Bukti pengujian

- `npx playwright test tests/browser/loan-ui-accessibility.spec.mjs`: lulus pada 1366 × 768 dan 390 × 844. Memeriksa sepuluh rute, profil/akses akun dan tab rincian, label kontrol yang terlihat, luapan halaman, tinggi baris desktop, kartu ponsel, ukuran aksi pembayaran, error/fokus, dialog, Escape, pengembalian fokus, dan token warna dialog gelap. Tangkapan layar seluruh rute ditinjau, termasuk sidebar, ringkasan, daftar, laporan, pengaturan, pembuatan dan rincian.
- `npx playwright test tests/browser/loan-create-workflow.spec.mjs tests/browser/loan-customer-profile.spec.mjs tests/browser/loan-payment-workflows.spec.mjs tests/browser/task4-6.spec.mjs tests/browser/task3.spec.mjs tests/browser/task8-dashboard.spec.mjs tests/browser/sidebar-layout.spec.mjs`: tujuh skenario lulus untuk validasi, pendaftaran/akun, jadwal, pembayaran, laporan dan sidebar. Audit viewport berjalan sebagai dua skenario tambahan.
- `npm test`: 23 berkas dan 66 tes lulus, termasuk pengujian tanggal lintas batas hari/tahun dan label status. `npm run lint` dan `npm run build` lulus.

Pengujian ini memeriksa alur dan kontrol yang ditampilkan pada fixture lokal, bukan sertifikasi aksesibilitas otomatis penuh atau pengganti uji pengguna. Pengujian menyeluruh seluruh kriteria, performa dan tugas peserta manusia tetap pada task 9.
