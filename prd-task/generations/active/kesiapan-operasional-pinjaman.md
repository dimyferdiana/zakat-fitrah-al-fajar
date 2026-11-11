# Kesiapan operasional program pinjaman

Dokumen ini mencatat apa yang telah dibuktikan di lingkungan lokal dan apa yang harus tersedia sebelum penggunaan operasional. Ini bukan persetujuan penerapan ke proyek Supabase online.

| Kebutuhan | Kondisi | Tindakan sebelum operasional |
|---|---|---|
| Pokok dan kebijakan | Hanya pokok; tanpa batas nominal/tenor dan tanpa penjamin wajib saat ini. Pengaturan opsional tersedia. | Pengurus mempertahankan atau mengubah kebijakan melalui keputusan yang tercatat. |
| Kolektabilitas | Nonaktif secara default; rentang contoh tidak otomatis disahkan. | Pengurus menetapkan aturan sebelum admin mengaktifkan. |
| Kontrak | Template, preview dan arsip versi tersedia secara lokal; kontrak bertanda tangan yang diperiksa wajib untuk pencairan baru. | Pengurus menyiapkan redaksi final, pihak penandatangan, dan kebutuhan saksi. |
| Sumber dana | Label sumber dana wajib sebagai metadata; pinjaman tidak otomatis memindahkan dana zakat/infak atau mengubah kas. | Pengurus menetapkan label yang akan dipakai dan penanggung jawab dana. |
| Identitas dan akun | Akun email/password dibuat admin; perubahan dan pemulihan akses telah diuji lokal. OTP/SMS ditunda. | Admin memeriksa individu dan menyiapkan akun di lingkungan yang akan digunakan; verifikasi email, secrets, pemulihan dan hak pada lingkungan itu. |
| Data lama | Tidak ada impor pinjaman historis pada peluncuran awal menurut klarifikasi pengguna. Data jamaah/program existing harus dipertahankan. | Jika muncul kebutuhan historis, selesaikan task 5 dan rekonsiliasi sebelum impor. |
| Keamanan dan migrasi | Role, Storage, RLS dan RPC telah diuji lokal. Riwayat migrasi/bucket proyek online diketahui berbeda dan belum diubah. | Cocokkan skema dan riwayat online, uji migrasi pada salinan terisolasi dan putuskan rencana rilis; jangan melakukan reset massal. |
| Backup dan pemulihan | Latihan dengan data sintetis telah menguji restore skema aplikasi/Auth/Storage, kebijakan dan hak terpilih serta bytes berkas terpisah. Wrapper `graphql_public` direkonstruksi dari definisi lokal; fungsi platform, konfigurasi, roles global dan data lingkungan operasional belum dibuktikan. | Tetapkan pengelola, lokasi aman, jadwal dan target pemulihan; jalankan backup serta restore lengkap yang sesuai lingkungan operasional dan cocokkan data, hak, sesi, dan objek. |
| Monitoring dan dukungan | Panduan insiden dan audit ada; petugas/admin dapat memeriksa transaksi. | Tetapkan pengelola teknis, cara memantau error/backup/unggahan, saluran dukungan, dan prosedur eskalasi. |
| Verifikasi dan lint | Lint global, build, unit test, regresi browser/SQL/keamanan dan benchmark HTTP/PostgREST dengan data sintetis lulus di lokal. | Ulangi verifikasi pada lingkungan yang akan digunakan; uji beban dan jaringan operasional belum dibuktikan. |

Langkah pemeriksaan yang dapat diulang, batas pengujian, dan penanganan masalah terdapat pada [panduan operasional](panduan-operasional-pinjaman.md), [verifikasi task 8](verifikasi-task-8-lokal.md), dan [matriks task 9](matriks-hasil-task-9-lokal.md). Jangan menaruh backup, password, token, atau isi dokumen nasabah di repository atau chat.
