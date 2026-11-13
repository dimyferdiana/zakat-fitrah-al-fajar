# Wireframe perapihan UI pinjaman

Rancangan struktur, bukan hasil implementasi atau uji visual. Desktop 1366 × 768: sidebar tetap dan konten yang dapat menggulir vertikal. Ponsel 390 × 844: header dengan tombol menu membuka Sheet, konten satu kolom. Gunakan komponen Shadcn UI dan token aplikasi; semua aksi berlabel, fokus terlihat, dialog mengembalikan fokus dan area sentuh utama minimal 44 × 44 px.

## Kerangka navigasi

```text
DESKTOP                                     PONSEL
+----------------+------------------------+ +----------------------+
| Pinjaman Jamaah | Judul halaman         | | ☰  Judul halaman     |
| • Ringkasan     | Deskripsi             | +----------------------+
|   Nasabah       |                       | | Konten satu kolom    |
|   Pinjaman      | Konten halaman        | |                      |
|   Pembayaran    |                       | |                      |
|   Laporan       |                       | |                      |
|   Pengaturan    |                       | +----------------------+
+-----------------+------------------------+  ☰ membuka daftar enam
                                               tujuan dan tombol tutup
```

Menu aktif ditandai teks/keadaan, tidak hanya warna. Halaman rincian menampilkan tautan kembali; Sheet menutup setelah memilih tujuan dan fokus berpindah ke judul.

## Ringkasan

```text
DESKTOP: Ringkasan Pinjaman                      [Lihat pinjaman]
         [Sisa pokok] [Tunggakan] [Aktif] [Perlu verifikasi]
         [Bukti menunggu: 5 baris · jumlah · Lihat semua]
         [Jatuh tempo 7 hari] [Tunggakan] [Draf perlu dilengkapi]

PONSEL:  Ringkasan Pinjaman
         [Sisa pokok] [Tunggakan]
         [Aktif]      [Perlu verifikasi]
         [Bukti menunggu · Lihat semua]
         [Jatuh tempo] [Tunggakan] [Draf]  (susunan vertikal)
```

Masing-masing angka menyebut tanggal posisi atau waktu saat ini; peringatan data tidak lengkap di dekat angka. Setiap entri langsung menuju rincian. Kosong: “Belum ada pekerjaan” dan tautan relevan; gagal: pesan serta Coba lagi, bukan angka nol.

## Daftar pinjaman

```text
DESKTOP: Pinjaman                                [Buat Pinjaman]
         [Cari nama/nomor] [Status] [Kategori]   [Reset]
         Hasil N | Nomor · Nasabah · Pokok · Sisa · Status · Jatuh tempo | Lihat rincian
         [25/50 per halaman] [Sebelumnya] 1/N [Berikutnya]

PONSEL:  Pinjaman                  [Buat Pinjaman]
         [Cari nama/nomor] [Filter]
         [Nomor · Status                 >]
         [Nama · Sisa · Jatuh tempo       ]
         [Sebelumnya] 1/N [Berikutnya]
```

Filter ponsel dibuka sebagai Sheet berlabel dengan Terapkan dan Reset; daftar mempertahankan filter dan halaman saat kembali. Kosong: “Belum ada pinjaman” dengan Buat Pinjaman; tanpa hasil: “Tidak ada yang cocok” dengan Reset; gagal: Coba lagi.

## Buat pinjaman bertahap

```text
DESKTOP: Pinjaman / Buat pinjaman
         1 Nasabah ───── 2 Detail & Jadwal ───── 3 Tinjau & Simpan
         [Cari dan pilih nasabah / kewajiban]
         [Kategori, tujuan, pokok, tanggal, penanggung jawab, catatan]
         [Pola jadwal; tanggal | nominal | hapus; tambah baris]
         [Ringkasan tenor, rentang, total]       [Kembali] [Lanjut]

PONSEL:  ‹ Pinjaman     Buat pinjaman
         Tahap 2 dari 3: Detail & Jadwal
         [Input tersusun vertikal]
         [Tanggal] [Nominal] [Hapus]
         [+ Tambah baris]
         [Ringkasan] [Kembali] [Lanjut]
```

Hanya tahap aktif tampil. Tahap 3 menampilkan identitas, kewajiban, data dan jadwal sebelum Simpan draf. Error berada pada kolom dengan fokus ke error pertama; kegagalan menyimpan mempertahankan input. Navigasi dengan perubahan belum disimpan membuka AlertDialog Tetap mengisi / Tinggalkan perubahan.

## Rincian pinjaman

```text
DESKTOP: Pinjaman / ← Kembali ke daftar
         #Nomor · Nasabah · Status               [Aksi sesuai status]
         [Pokok] [Bayar terkonfirmasi] [Sisa] [Jatuh tempo/tunggakan]
         [Ringkasan] [Jadwal] [Pembayaran] [Dokumen] [Tindak Lanjut]
         Draf: Lengkapi → Jadwal → Kontrak → Pencairan
         [Isi tab; alasan hambatan dan tautan ke bagian terkait]

PONSEL:  ‹ Daftar
         #Nomor · Nasabah · Status
         [Aksi sesuai status]
         [Pokok / pembayaran] [Sisa / jatuh tempo]
         [Pemilih/tab bagian]  [Isi bagian]
```

Jadwal lebar boleh scroll horizontal di dalam kontainer dengan penanda. Tidak tersedia/tidak berwenang: pesan aman dan kembali tanpa menampilkan identitas. Dialog konfirmasi pencairan menampilkan nasabah, nomor, nominal, tanggal, dana dan kontrak; kegagalan memberi tindakan perbaikan.

## Verifikasi pembayaran

```text
DESKTOP: Pembayaran                              [Catat Pembayaran]
         [Perlu Verifikasi] [Riwayat Pembayaran]
         Nasabah · Nomor · Nominal · Tanggal · Bukti · Duplikat | [Periksa]
         [Panel: identitas + transaksi + bukti + Konfirmasi / Tolak]

PONSEL:  Pembayaran                [Catat Pembayaran]
         [Perlu Verifikasi] [Riwayat]
         [Nasabah · Nomor · Nominal · Periksa]
         [Sheet/dialog: transaksi, bukti, aksi; isi bisa digulir]
```

Tolak/batal memerlukan alasan melalui dialog; muat ulang jika klaim sudah diproses orang lain. Kosong: “Tidak ada bukti menunggu”; gagal: Coba lagi. Bukti yang tidak tersedia tidak boleh dikonfirmasi. Formulir dan panel tidak boleh terpotong di viewport.
