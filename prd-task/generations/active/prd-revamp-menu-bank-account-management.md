# PRD: Revamp Navigasi + Manajemen Rekening/Kas

## 1) Introduction / Overview
Aplikasi membutuhkan perombakan struktur navigasi dan pemisahan alur data agar lebih jelas secara operasional. Fokus utama fitur ini adalah dua hal yang sama penting: (1) perbaikan UX melalui menu yang lebih terstruktur dan (2) penguatan kontrol keuangan melalui manajemen rekening/kas dengan ledger transaksi masuk, keluar, dan rekonsiliasi.

Revamp ini juga memisahkan Data Muzakki menjadi modul data master (CRUD orang) tanpa transaksi saat tambah orang. Selain itu, modul “Pemasukan” akan diganti terminologi menjadi “Penerimaan” untuk konsistensi bahasa bisnis.

## 2) Goals
1. Meningkatkan kejelasan navigasi aplikasi melalui menu berkelompok, urutan ulang, dan rute/section baru.
2. Mengubah terminologi UI dari “Pemasukan Uang/Beras” menjadi “Penerimaan Uang/Beras” secara konsisten.
3. Menjadikan Data Muzakki sebagai master data orang saja (tanpa input transaksi pada flow tambah orang).
4. Menyediakan manajemen akun keuangan (kas/bank/QRIS) yang mendukung tambah, ubah, hapus akun.
5. Menyediakan ledger per akun yang menampilkan transaksi in, out, dan rekonsiliasi.
6. Menjalankan model hybrid posting: auto-post dari modul terkait + manual in/out + manual rekonsiliasi + jejak audit.

## 3) User Stories
- Sebagai Admin, saya ingin menu aplikasi dikelompokkan agar saya cepat menemukan fitur berdasarkan konteks kerja.
- Sebagai Petugas, saya ingin istilah “Penerimaan” dipakai agar sesuai proses harian lapangan.
- Sebagai Admin, saya ingin menambah Muzakki sebagai data orang tanpa harus langsung membuat transaksi.
- Sebagai Bendahara/Admin, saya ingin mengelola daftar akun kas/bank/QRIS agar pembukuan terpisah per rekening.
- Sebagai Bendahara/Admin, saya ingin melihat mutasi masuk, keluar, dan rekonsiliasi per akun agar mudah audit.
- Sebagai Admin, saya ingin transaksi dari modul lain otomatis tercatat ke ledger akun tetapi tetap bisa input manual jika diperlukan.

## 4) Functional Requirements
### 4.1 Revamp Menu (Re-organize, Reorder, Group)
1. Sistem harus menyediakan struktur menu berkelompok (group menu) dan urutan baru berdasarkan alur kerja operasional.
2. Sistem harus mendukung perubahan nama halaman/fitur pada menu sesuai revamp.
3. Sistem harus mendukung perpindahan fitur ke section/rute baru sesuai desain menu final.
4. Sistem harus menjaga proteksi role-based access yang sudah ada saat menu dipindah/direname.
5. Sistem harus tetap memungkinkan deep-link langsung ke halaman yang dipindah (melalui redirect bila diperlukan).

### 4.2 Terminologi Penerimaan
6. Sistem harus mengganti label “Pemasukan Uang” menjadi “Penerimaan Uang”.
7. Sistem harus mengganti label “Pemasukan Beras” menjadi “Penerimaan Beras”.
8. Sistem harus mengganti istilah terkait di judul halaman, breadcrumb, filter, tombol, dan teks bantuan agar konsisten.

### 4.3 Data Muzakki = Master Data Only
9. Sistem harus memisahkan flow “Tambah Muzakki” dari flow transaksi.
10. Form tambah/edit Muzakki hanya berisi data orang (contoh: nama KK, alamat, no telp, atribut master terkait) tanpa field transaksi zakat.
11. Riwayat transaksi Muzakki tetap bisa dilihat dari halaman detail/list, tetapi bukan bagian dari proses create Muzakki.
12. Semua input transaksi baru harus dilakukan dari modul Penerimaan terkait, bukan dari create Muzakki.

### 4.4 Manajemen Akun Kas/Bank/QRIS
13. Sistem harus menyediakan halaman manajemen akun keuangan.
14. Sistem harus mendukung tambah akun baru dengan tipe akun minimal: kas, bank, qris.
15. Sistem harus mendukung edit akun (nama tampilan, status aktif/nonaktif, metadata akun).
16. Sistem harus mendukung hapus akun dengan aturan aman (misal soft delete atau blok hapus jika sudah ada transaksi, sesuai kebijakan teknis final).
17. Sistem harus menampilkan daftar akun default berikut saat inisialisasi pertama (prefill default, tetap configurable):
   - KAS
   - BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT
   - BCA-SYARIAH : MPZ LAZ AL FAJAR INFAK
   - BCA-SYARIAH : SAHABAT QURAN BAKTI JAYA
   - QRIS-BSI : UPZ BAZNAS AL FAJAR ZAKAT
   - QRIS-BSI : UPZ BAZNAS AL FAJAR INFAK

### 4.5 Ledger Per Akun (In / Out / Rekonsiliasi)
18. Sistem harus menyediakan halaman detail akun yang menampilkan ledger per akun.
19. Ledger harus menampilkan minimal: tanggal, tipe mutasi (IN/OUT/REKONSILIASI), nominal/kuantitas, referensi sumber, catatan, saldo berjalan.
20. Sistem harus mendukung filter ledger per akun (rentang tanggal, tipe mutasi, kata kunci).
21. Sistem harus mendukung posting otomatis dari transaksi modul terkait ke akun yang dipilih.
22. Sistem harus mendukung entry manual mutasi IN/OUT untuk kebutuhan operasional.
23. Sistem harus mendukung entry manual rekonsiliasi akun.
24. Sistem harus menyimpan jejak audit untuk entry manual (created_by, updated_by, timestamp, reason/catatan).
25. Sistem harus menjaga konsistensi saldo akun ketika data transaksi diubah atau dibatalkan.

### 4.6 Integrasi & Konsistensi Data
26. Sistem harus memetakan transaksi penerimaan/distribusi/rekonsiliasi ke akun yang tepat.
27. Sistem harus mencegah transaksi tanpa akun (kecuali didefinisikan eksplisit sebagai out of scope).
28. Sistem harus menjaga kompatibilitas data historis lama melalui migrasi/normalisasi data akun.

## 5) Non-Goals (Out of Scope)
- Tidak membangun ulang total seluruh modul keuangan di luar kebutuhan akun/ledger pada PRD ini.
- Tidak membahas integrasi pihak ketiga perbankan real-time.
- Tidak mencakup aplikasi mobile native.
- Tidak mencakup redesign visual total seluruh aplikasi (hanya area terdampak revamp menu dan fitur terkait).

## 6) Design Considerations
- Gunakan pola UI yang sudah ada (shadcn/ui + Tailwind) agar konsisten.
- Menu harus menampilkan group heading yang jelas dan mudah dipindai.
- Halaman akun harus mengutamakan keterbacaan mutasi (tabel + filter ringkas).
- Terminologi harus konsisten menggunakan “Penerimaan” pada area yang relevan.

## 7) Technical Considerations
- Perubahan rute diperlukan karena keputusan scope menu: reorder + group + rename + move ke section/rute baru.
- Diperlukan model data akun dan ledger (contoh konsep):
  - accounts
  - account_ledger_entries
  - linkage/source reference ke transaksi penerimaan, distribusi, rekonsiliasi
- Diperlukan strategi migrasi data historis agar transaksi lama tetap bisa ditelusuri.
- Diperlukan policy otorisasi per role untuk create/update/delete akun dan entry manual.
- Diperlukan mekanisme posting hybrid:
  - auto-post dari modul transaksi utama
  - manual adjustment (IN/OUT/REKONSILIASI)
  - audit trail wajib
- Perlu fallback yang aman untuk data legacy yang belum memiliki akun.

## 8) Success Metrics
1. 100% menu utama mengikuti struktur group dan urutan baru.
2. 100% label “Pemasukan” pada area terdampak berubah menjadi “Penerimaan”.
3. 100% flow create Muzakki tidak lagi meminta input transaksi.
4. Minimal 6 akun default tersedia pada first-run sebagai prefill yang tetap bisa diubah admin.
5. 100% transaksi baru pada modul terkait tercatat ke ledger akun (auto/manual sesuai aturan).
6. Saldos akun konsisten antara ledger dan ringkasan dashboard pada periode yang sama.
7. Penurunan komplain user terkait kebingungan navigasi dan pencatatan akun setelah rilis.

## 9) Open Questions
1. Kebijakan penghapusan akun final: soft delete wajib atau hard delete dengan guard?
2. Definisi saldo awal akun: apakah perlu fitur opening balance per akun saat go-live?
3. Apakah ledger beras dan uang dipisah ketat per satuan, atau tetap satu tabel dengan unit/type field?
4. Strategi redirect rute lama ke rute baru: permanen (301-like in app) atau sementara?
5. Apakah detail akun perlu export CSV/PDF pada fase pertama atau fase berikutnya?

---

### Scope Decisions Captured from Stakeholder
- Prioritas goal: UX revamp + financial control sama penting.
- Scope menu: reorder + group + rename + move ke section/rute baru.
- Data Muzakki: master data only (tanpa transaksi saat tambah orang).
- Model akun: hybrid (auto-post + manual in/out + manual rekonsiliasi + audit).
- Akun default: prefill first-run, tetap configurable.
