# Template bukti rekonsiliasi pinjaman

Gunakan untuk setiap dry-run atau impor nyata. Ini template kosong, bukan bukti bahwa migrasi telah dilakukan. Salinan yang diisi dengan informasi nasabah atau angka keuangan disimpan pada tempat terbatas yang ditetapkan pengurus, bukan di repository atau chat.

## Identitas kegiatan

| Item | Isian |
| --- | --- |
| Lingkungan dan nama proyek | |
| ID batch / versi percobaan | |
| Sumber dan pemilik/penanggung jawab sumber | |
| Referensi sumber dan checksum/versi | |
| Tanggal cut-off dan zona waktu | |
| Petugas pelaksana dan waktu | |
| Admin/petugas pemeriksa dan waktu | |
| Backup database dan objek yang relevan, waktu dan lokasi aman | |
| Bukti uji restore terisolasi dan pemeriksa | |

## Perbandingan dengan sumber

Semua angka dan cakupan tanggal harus berasal dari sumber yang dapat diperiksa. Jangan mengisi tanggal, transaksi, kontrak, penjamin, atau identitas yang belum diketahui.

| Ukuran pada cut-off | Nilai sumber | Hasil preview | Hasil impor | Selisih / tindak lanjut |
| --- | ---: | ---: | ---: | --- |
| Baris/pinjaman sumber | | | | |
| Nasabah unik yang terverifikasi | | | | |
| Pinjaman siap / tertahan | | | | |
| Total pokok | | | | |
| Total saldo awal | | | | |
| Jumlah dan total transaksi historis yang benar-benar diketahui | | | | |
| Agregat historis tanpa rincian | | | | |
| Jadwal yang direkonsiliasi | | | | |

## Konflik dan hasil pemeriksaan

- Referensi pinjaman sumber duplikat dan tindakan: 
- Individu ambigu, rumah tangga atau belum terverifikasi dan tindakan: 
- Pokok, saldo, sisa jadwal atau histori tidak cocok dan tindakan: 
- Lebih dari satu pinjaman aktif, tanggal tidak valid, atau referensi sudah diimpor: 
- Kontrak historis, tanggal pencairan, kategori/tujuan, atau sumber dana yang belum tersedia: 
- Pemeriksaan bahwa saldo awal dan pembayaran tidak masuk ledger kas/rekening atau penerimaan lama: 
- Hasil impor ulang/retry menggunakan kunci yang sama dan pemeriksaan duplikasi: 
- Referensi laporan kesalahan per baris dan penyimpanannya: 

## Keputusan batch

- Status: belum diperiksa / perlu rekonsiliasi / siap impor / selesai diperiksa.
- Alasan, perubahan dan versi koreksi: 
- Sisa perbedaan dan penanggung jawab tindak lanjut: 
- Pemeriksa admin/petugas dan waktu pemeriksaan: 
- Referensi bukti hasil impor, audit, monitoring dan pembandingan pascaimpor: 

Jangan menandai batch siap bila identitas, saldo/jadwal, referensi sumber, atau konflik pinjaman aktif belum diselesaikan. Izin untuk merekam dan memeriksa hasil tersedia bagi seluruh admin dan petugas sesuai keputusan pengguna.
