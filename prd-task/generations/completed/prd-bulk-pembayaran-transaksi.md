# PRD: Bulk Pembayaran Transaksi (Multi-Muzakki + Multi-Jenis)

## Document Control
- **Version:** V1.5.0
- **Created Date:** 2026-02-22
- **Last Updated:** 2026-02-26
- **Summary of Addition/Adjustment:** Menambahkan alur input transaksi massal multi-muzakki dan multi-jenis dengan bukti terima tabel gabungan yang konsisten.

## 1. Introduction/Overview
Masjid membutuhkan fitur bulk action untuk mencatat beberapa transaksi pembayaran sekaligus dalam satu waktu. Fitur ini harus mendukung beberapa muzakki, masing-masing muzakki bisa melakukan lebih dari satu jenis transaksi (zakat maal, zakat fitrah, infak/sedekah), dengan pilihan uang dan beras. Sistem juga harus menghasilkan tanda terima berbentuk tabel seperti contoh foto, dengan header dan footer yang sama seperti tanda terima pembayaran muzakki yang sudah ada (hanya konten inti yang berubah).

## 2. Goals
- Mempercepat input transaksi saat penerimaan zakat/infak massal.
- Mengurangi input ulang untuk transaksi multi-jenis dari banyak muzakki.
- Menghasilkan tanda terima gabungan yang rapi dan konsisten dengan format existing.
- Mendukung muzakki baru langsung dari flow bulk.

## 3. User Stories
- Sebagai petugas, saya ingin memilih beberapa muzakki dan memasukkan beberapa jenis transaksi agar input lebih cepat.
- Sebagai petugas, saya ingin menambah muzakki baru tanpa keluar dari flow bulk.
- Sebagai admin, saya ingin melihat tanda terima gabungan berbentuk tabel agar mudah diverifikasi dan dicetak.

## 4. Functional Requirements
1. Sistem harus menyediakan mode "Bulk" pada flow Pembayaran yang sudah ada.
2. Sistem harus memungkinkan memilih banyak muzakki melalui multi-select dan menambah muzakki baru langsung dari flow bulk.
3. Sistem harus menyediakan tabel input transaksi dengan baris per muzakki dan kolom per jenis transaksi:
   - Zakat Fitrah (Beras KG, Uang RP)
   - Zakat Maal (Beras KG, Uang RP)
   - Infak/Sedekah (Beras KG, Uang RP)
4. Sistem harus mengizinkan setiap muzakki mengisi lebih dari satu jenis transaksi dalam satu submission.
5. Sistem harus menghitung dan menampilkan total ringkas (jumlah orang, total uang, total beras) untuk seluruh submission.
6. Sistem harus membatasi jumlah baris per tanda terima sesuai konfigurasi admin (default: 10 baris).
7. Sistem harus membuat tanda terima gabungan (1 dokumen) dalam format tabel seperti foto terlampir.
8. Header dan footer tanda terima harus sama dengan tanda terima pembayaran muzakki yang sudah ada; hanya konten inti diganti dengan tabel bulk.
9. Sistem harus menyimpan transaksi ke tabel existing yang relevan (pembayaran zakat/infak) sesuai jenis dan satuan.
10. Sistem harus menyimpan metadata submission bulk (operator, waktu, nomor urut tanda terima) untuk audit.
11. Sistem harus menangani validasi input:
    - Angka tidak boleh negatif.
    - Baris muzakki tanpa transaksi harus ditolak atau dihapus sebelum submit.
    - Beras dan uang boleh diisi bersamaan pada jenis yang sama.
12. Sistem harus menampilkan pesan sukses/gagal dan menampilkan tautan untuk unduh/print tanda terima.
13. Sistem harus menjalankan auto-split atau perhitungan hak amil otomatis sesuai aturan existing pada transaksi yang tersimpan.
14. Sistem harus mencetak nomor urut per muzakki pada tanda terima bulk, mengacu pada nomor dokumen yang sama.
15. Sistem harus memungkinkan muzakki baru dibuat dengan data minimal (nama) dan dapat dilengkapi kemudian.

## 5. Non-Goals (Out of Scope)
- Import bulk dari file CSV/Excel.
- Integrasi tanda tangan digital.
- Workflow approval multi-level.

## 6. Design Considerations (Optional)
- Gunakan layout tabel yang mengikuti contoh foto: header institusi, judul tanda terima, dan tabel dengan kolom kompak.
- Header dan footer harus mengacu pada template tanda terima pembayaran muzakki existing.
- Mode bulk tetap berada di halaman Pembayaran dengan toggle yang jelas.
- Sediakan tombol "Tambah muzakki" inline pada multi-select.

## 7. Technical Considerations (Optional)
- Reuse komponen receipt existing untuk header/footer; hanya bagian konten inti yang diganti.
- Pastikan tabel input dapat menangani 10+ baris tanpa lag (virtualisasi opsional).
- Simpan nomor urut tanda terima bulk sesuai pola existing (jika ada).
- Pastikan transaksi per muzakki tetap tersimpan sebagai transaksi individual di database.

## 8. Success Metrics
- Waktu input untuk 10 muzakki turun minimal 50% dibanding input satuan.
- 0 error validasi pada 3 sesi bulk input berurutan.
- Penerbitan tanda terima bulk sukses pada 100% pengujian.

## 9. Open Questions
1. Jumlah baris per tanda terima dapat diubah oleh admin (misal 10/20/30).
2. Kombinasi uang dan beras dalam jenis yang sama diizinkan.
3. Nomor urut per muzakki dicetak dan mengacu pada nomor dokumen yang sama.
4. Muzakki baru dapat dibuat dengan data minimal dan dilengkapi kemudian.
