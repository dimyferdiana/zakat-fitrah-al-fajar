# Tasks: Persiapan deployment Vercel dan Supabase

Tujuan: menyiapkan preview yang dapat diuji, lalu rencana produksi yang aman untuk aplikasi pinjaman dan fitur zakat yang sudah ada. Dokumen ini merupakan rincian tambahan untuk [task kesiapan](tasks-kesiapan-pinjaman-dan-konsistensi-distribusi-zakat.md) dan [checklist pinjaman awal](tasks-pinjaman-jamaah-dan-data-induk-orang.md).

## Kondisi awal dan batasan

- Branch kerja saat dokumen dibuat: `feature/pinjaman-jamaah`; banyak perubahan belum di-commit. Status integrasi Vercel, production branch dan variabel aktual belum diverifikasi.
- Migrasi dan pengujian keamanan telah dilakukan secara lokal. Penerapan migrasi, Edge Functions, RLS dan bucket pinjaman ke Supabase online belum dibuktikan. Riwayat skema online berbeda dari lokal.
- Preview Vercel tidak otomatis memisahkan database: variabel Preview harus diarahkan ke proyek Supabase staging terpisah. `localhost` pada browser pengunjung bukan Supabase lokal pengembang.
- PRD perbaikan distribusi zakat masih perlu dikerjakan; jangan menganggap masalah kolom jumlah dan stok sudah selesai.
- Impor pinjaman historis dan OTP/SMS ditunda. Tidak menjalankan reset database atau mengubah data produksi dalam rangka persiapan ini.

## 0.0 Inventaris perubahan dan keputusan rilis

- [ ] 0.1 Periksa `git status`, branch tujuan, perubahan tracked/untracked dan file yang diabaikan; pisahkan kode, migrasi, tes dan dokumen yang memang diperlukan.
- [ ] 0.2 Periksa perubahan yang akan masuk Git untuk memastikan tidak ada token, password, service-role key, backup atau data pribadi; jangan commit berkas tersebut.
- [ ] 0.3 Tentukan commit/branch untuk preview dan catat SHA; periksa apakah integrasi GitHub–Vercel aktif dan branch production sebenarnya di pengaturan Vercel.
- [ ] 0.4 Catat hambatan rilis, termasuk konsistensi distribusi, keputusan kontrak dan pengujian lingkungan tujuan; bedakan preview teknis dengan persetujuan penggunaan operasional.

## 1.0 Siapkan Supabase staging

- [ ] 1.1 Siapkan proyek staging terpisah dari `zuykdhqdklsskgrtwejg`; catat project ref dan lingkungan tanpa menyimpan rahasia.
- [ ] 1.2 Inventaris read-only riwayat migrasi, tabel, kolom, view, fungsi, trigger, ekstensi, role, grants, RLS, bucket dan konfigurasi Auth online dan lokal; cocokkan perbedaan tanpa mencetak data sensitif.
- [ ] 1.3 Susun urutan migrasi berdasarkan keadaan aktual dan dependensi, termasuk migrasi pinjaman, data orang, kebijakan Storage dan perubahan `141`; uji di staging. Jangan langsung menjalankan seluruh migrasi lama atau `db reset` pada proyek online.
- [ ] 1.4 Untuk data representatif gunakan data sintetis atau salinan yang telah diotorisasi dan dilindungi; periksa relasi, identitas lama dan isi sebelum serta sesudah migrasi.
- [ ] 1.5 Konfigurasikan Auth staging: email/password, pembuatan akun oleh admin, pemulihan, URL situs dan redirect yang diperlukan; uji signup umum sesuai kebijakan, role rangkap, akses nonaktif dan pencabutan sesi. SMS/OTP tetap ditunda.
- [ ] 1.6 Periksa pembuatan bucket, akses privat dan kebijakan objek; uji upload dan download berkas yang sah serta penolakan lintas nasabah.
- [ ] 1.7 Deploy dan uji Edge Functions yang diperlukan pada staging: `loan-customer-account`, `loan-contract-upload`, `loan-disbursement-evidence`, `loan-payment-claim`, `loan-staff-payment-evidence`, serta fungsi existing yang terpengaruh. Inventaris dependensi dan konfigurasi secret server; jangan menaruh service-role key di `VITE_` atau Git.

## 2.0 Audit dan verifikasi RLS, hak dan fungsi

- [ ] 2.1 Buat matriks objek aktual × role (`anon`, admin, petugas, viewer berizin/tanpa izin, nasabah sendiri/nasabah lain, akun nonaktif, mode pengurus/nasabah) × SELECT/INSERT/UPDATE/DELETE/EXECUTE. Sertakan tabel, view, RPC, Storage dan Edge Functions.
- [ ] 2.2 Pastikan RLS aktif pada seluruh tabel aplikasi yang terekspos dan periksa kebijakan efektif, termasuk kombinasi permissive/restrictive, grants dan default privileges. Bandingkan hasil migrasi terakhir; kebijakan awal mungkin telah diganti migrasi berikutnya.
- [ ] 2.3 Verifikasi nasabah hanya melihat proyeksi pinjaman, angsuran, pembayaran dan dokumen miliknya melalui jalur yang diizinkan; akses langsung ke data sensitif yang dibatasi dan akses lintas nasabah ditolak. Hak viewer mengikuti izin eksplisit.
- [ ] 2.4 Verifikasi akses pengurus aktif pada operasi yang memang diizinkan; administrasi akun dan perubahan role hanya oleh pihak berwenang. Pastikan nasabah tidak mendapat hak legacy zakat/qurban dan pengguna nonaktif tidak lolos menggunakan sesi lama.
- [ ] 2.5 Periksa fungsi `SECURITY DEFINER`, `search_path`, validasi identitas/mode/role, izin `EXECUTE`, view dan endpoint; RLS bukan satu-satunya batas ketika fungsi atau service role dapat melewatinya.
- [ ] 2.6 Periksa semua policy `storage.objects`, status public/private bucket dan pemeriksaan setiap request; uji berkas kontrak, klaim, pencairan dan bukti serta dampak pada bucket zakat/qurban existing.
- [ ] 2.7 Uji negatif melalui API, RPC dan Storage memakai identitas sintetis: anonymous, ID milik orang lain, viewer tanpa izin, akun nonaktif dan akses langsung URL; uji positif untuk admin/petugas dan pemilik yang sah.
- [ ] 2.8 Verifikasi ulang aturan keuangan dan integritas: satu pinjaman aktif, kontrak bertanda tangan sebelum pencairan, tanpa bunga/biaya dan tanpa perubahan otomatis ledger kas/zakat. Catat hasil dan perbedaan terhadap lokal.

## 3.0 Bangun dan uji preview Vercel

- [ ] 3.1 Verifikasi project Vercel terhubung ke repository yang benar, root directory `zakat-fitrah-app`, build Vite dan rewrite `vercel.json`; pastikan production branch diketahui sebelum push.
- [ ] 3.2 Atur `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` untuk Preview ke proyek staging; pastikan `VITE_OFFLINE_MODE` tidak mengaktifkan data demo untuk uji integrasi. Periksa variabel berdasarkan nama dan lingkungan tanpa membagikan secret.
- [ ] 3.3 Jalankan `npm run lint -- --max-warnings 0`, `npm test`, `npm run build` dan tes keamanan/integrasi yang relevan dari `zakat-fitrah-app`; catat hasil, revisi dan batas pengujian.
- [ ] 3.4 Commit perubahan yang telah ditinjau dan push branch preview; pastikan deployment Vercel selesai dan gunakan URL deployment yang sesuai. Periksa log build tanpa membocorkan secrets.
- [ ] 3.5 Uji browser: login pengurus, akun nasabah, akses berbasis role, alur pinjaman, kontrak, pembayaran/bukti, data orang dan regresi zakat/qurban; gunakan data sintetis. Uji URL langsung, desktop dan ponsel.
- [ ] 3.6 Selesaikan dan uji konsistensi distribusi beras/uang, stok dan laporan sesuai PRD terkait sebelum menyatakan alur distribusi siap operasional.
- [ ] 3.7 Ukur kinerja dan kegagalan menggunakan API, jaringan dan data representatif di staging; catat hasil dan target. Pengujian lokal sebelumnya tidak mewakili seluruh jaringan pengguna.

## 4.0 Siapkan produksi dan rencana pemulihan

- [ ] 4.1 Pengurus menetapkan isi kontrak final, penandatangan/saksi, label sumber dana, kebijakan dan penanggung jawab. Akun, SMTP/pemulihan, monitoring dan prosedur dukungan siap; jangan tandai selesai jika masih menunggu.
- [ ] 4.2 Tentukan pemilik, jadwal, lokasi aman, retensi dan target pemulihan backup; lakukan latihan restore lengkap pada lingkungan terisolasi termasuk database, Auth, Storage, objek dan hak.
- [ ] 4.3 Cocokkan ulang migrasi dan konfigurasi online dengan staging, termasuk RLS, grants, view, fungsi dan bucket; buat urutan penerapan, verifikasi setelah tiap langkah, rencana penghentian dan pemulihan. Jangan mereset produksi.
- [ ] 4.4 Siapkan variabel Production dan alamat/redirect Auth yang benar, terpisah dari staging, serta rencana deploy Edge Functions dan pengujian kompatibilitas aplikasi/database selama transisi.
- [ ] 4.5 Catat kriteria go/no-go, penanggung jawab, waktu pemeliharaan, uji pascarilis dan jalur rollback frontend serta prosedur pemulihan database yang mempertimbangkan data baru sejak backup.
- [ ] 4.6 Lakukan migrasi/deployment produksi hanya pada tahap pelaksanaan yang telah disepakati; verifikasi hasil, log, akses, transaksi dan monitoring, lalu catat bukti dan kendala.

## Peta awal RLS yang harus diverifikasi

Ini adalah peta ruang lingkup, bukan perintah SQL untuk dijalankan. Migrasi berlapis dapat mengganti policy sebelumnya, dan akses beberapa operasi melalui RPC/Edge Function, sehingga policy efektif harus dinilai pada database tujuan.

| Area | Yang harus dilindungi | Acuan lokal |
|---|---|---|
| Nasabah dan transaksi | `loan_customers`, `loans`, `loan_installments`, `loan_payments`, `loan_disbursements`, `loan_receipts`; petugas sesuai hak, nasabah sebatas jalur/proyeksi miliknya | Migrasi `041`, `045`, `052`, `055`, `083`, `087`, `091`, `141` |
| Dokumen dan objek | `loan_documents`, `loan_upload_staging`, bucket dokumen pinjaman dan `storage.objects`; tidak ada akses lintas nasabah | `051`, `087`–`089`, `108`–`111`, `140` |
| Konfigurasi dan audit | `loan_categories`, `loan_policies`, `loan_policy_exceptions`, template kontrak, follow-up, kolektabilitas dan audit; pengelolaan lewat jalur yang berwenang | `041`, `058`–`059`, `071`, `103`–`104`, `130` |
| Identitas, role dan sesi | `loan_portal_settings`, `loan_viewer_permissions`, `loan_session_modes`, profil orang/pengurus; cegah eskalasi role dan sesi nonaktif | `050`, `065`–`070`, `080`–`087`, `104` |
| Aplikasi legacy dan Storage | Tabel zakat, mustahik, muzakki, qurban, data orang dan bucket lama; akses nasabah tidak boleh meluas dan alur pengurus tidak rusak | `043`, `047`, `064`–`065`, `085`, `088`, `141` |

**Penting:** policy permissive PostgreSQL dapat saling membuka akses melalui OR; policy restrictive membatasi bersamaan dengan policy yang mengizinkan. Periksa semua policy dan grants yang efektif, bukan hanya nama policy yang diharapkan. Service role dan fungsi tertentu dapat melewati RLS, sehingga otorisasi pada fungsi dan Edge Function wajib diuji terpisah.

## Kriteria selesai

Preview menggunakan staging terpisah dan seluruh alur yang berlaku lulus dengan bukti; matriks RLS dan akses berkas menunjukkan hasil positif/negatif; PRD distribusi dan syarat operasional yang berlaku terpenuhi; rencana produksi, backup, restore, pemantauan dan keputusan pengurus tersedia. Pekerjaan produksi dan migrasi historis tidak dianggap selesai hanya karena preview lulus.
