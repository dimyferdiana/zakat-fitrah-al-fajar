# PRD – Aplikasi Manajemen Zakat Fitrah Masjid

Dokumen ini berisi **Product Requirements Document (PRD)** dan **Task List** untuk pengembangan aplikasi manajemen zakat fitrah masjid.

Target utama: **memudahkan petugas masjid (non-IT)** dalam mencatat pemasukan, distribusi, dan laporan zakat fitrah secara rapi, aman, dan berkelanjutan antar tahun.

**Tech Stack:**
- Frontend: React + Vite + shadcn/ui (TailwindCSS)
- Backend: Supabase (Database, Auth, Storage)
- Deployment: Shared Hosting (Static Build)

---

## 1. Latar Belakang

Pengelolaan zakat fitrah di masjid umumnya masih manual (buku tulis / Excel terpisah) sehingga:
- Sulit memantau pemasukan & distribusi
- Data penerima tahun lalu sering hilang
- Laporan akhir Ramadhan rawan salah hitung
- Tidak ada histori data jangka panjang

Aplikasi ini dirancang **sederhana, aman, dan bisa dipakai bertahun-tahun**.

---

## 2. Tujuan Produk

### Tujuan Utama
- Mencatat pemasukan zakat fitrah (beras & uang)
- Mengelola data mustahik (penerima zakat)
- Membandingkan data antar tahun
- Mempermudah laporan & transparansi

### Tujuan Sekunder
- Mengurangi beban kerja petugas
- Mengurangi kesalahan pencatatan
- Menyediakan data historis yang konsisten

---

## 3. Target Pengguna

- **Primary**: Petugas zakat masjid, bendahara
- **Secondary**: Ketua DKM / takmir (read-only)

---

## 4. User Stories

### As a Petugas Zakat (Admin/Petugas):
1. **US-001**: Sebagai petugas, saya ingin login dengan email dan password, agar hanya orang yang berwenang dapat mengakses sistem.
2. **US-002**: Sebagai petugas, saya ingin mencatat pembayaran zakat fitrah dari muzakki dengan cepat, agar tidak ada antrian panjang saat Ramadhan.
3. **US-003**: Sebagai petugas, saya ingin sistem otomatis menghitung total zakat berdasarkan jumlah jiwa, agar tidak terjadi kesalahan perhitungan.
4. **US-004**: Sebagai petugas, saya ingin mencetak bukti pembayaran dalam format PDF, agar muzakki memiliki bukti yang sah.
5. **US-005**: Sebagai petugas, saya ingin melihat daftar mustahik dari tahun lalu, agar saya bisa memperbarui data dengan cepat.
6. **US-006**: Sebagai petugas, saya ingin validasi otomatis sebelum mendistribusikan zakat, agar tidak terjadi kelebihan distribusi dari stok yang tersedia.
7. **US-007**: Sebagai petugas, saya ingin export laporan ke PDF dan Excel, agar mudah dibagikan ke pengurus masjid.

### As a Bendahara/Ketua DKM (Admin):
8. **US-008**: Sebagai bendahara, saya ingin melihat dashboard ringkasan pemasukan dan distribusi, agar saya bisa memantau kondisi zakat secara real-time.
9. **US-009**: Sebagai bendahara, saya ingin membandingkan data pemasukan antar tahun, agar bisa melihat tren dan membuat perencanaan.
10. **US-010**: Sebagai bendahara, saya ingin mengatur nilai zakat per tahun hijriah, agar sistem selalu menggunakan nilai yang sesuai.
11. **US-011**: Sebagai bendahara, saya ingin mengelola user dan role (admin/petugas/viewer), agar akses sistem terkontrol.

### As a Viewer (Ketua DKM/Takmir):
12. **US-012**: Sebagai ketua DKM, saya ingin melihat laporan tanpa bisa mengubah data, agar saya bisa monitor transparansi pengelolaan zakat.
13. **US-013**: Sebagai ketua DKM, saya ingin melihat sisa zakat yang belum terdistribusi, agar bisa memastikan semua zakat tersalurkan dengan baik.

---

## 5. Functional Requirements

### FR-1: Authentication & Authorization
1.1. Sistem harus menyediakan login dengan email dan password (Supabase Auth)
1.2. Sistem harus mendukung 3 role: Admin, Petugas, Viewer
1.3. Admin memiliki akses penuh (CRUD semua data, user management)
1.4. Petugas memiliki akses CRUD kecuali delete laporan final dan user management
1.5. Viewer hanya memiliki akses read-only (dashboard & laporan)
1.6. Sistem harus auto-redirect ke dashboard setelah login sukses
1.7. Sistem harus logout otomatis setelah 8 jam inaktif

### FR-2: Manajemen Muzakki & Pembayaran Zakat
2.1. Sistem harus menyimpan data muzakki: nama KK, alamat, no. telp
2.2. Sistem harus mencatat pembayaran: jumlah jiwa, jenis zakat (beras/uang), tanggal bayar
2.3. Sistem harus otomatis menghitung total zakat = jumlah jiwa × nilai per orang (sesuai tahun aktif)
2.4. Sistem harus mendukung pencarian muzakki berdasarkan nama dan alamat
2.5. Sistem harus mendukung filter pembayaran berdasarkan jenis zakat dan tahun
2.6. Sistem harus generate bukti pembayaran dalam format PDF
2.7. Bukti pembayaran harus mencakup: nama masjid, nama muzakki, detail zakat, total, tanggal, petugas
2.8. Sistem harus mencatat petugas yang menerima pembayaran

### FR-3: Pengaturan Nilai Zakat
3.1. Sistem harus menyimpan nilai zakat per tahun hijriah (beras dalam kg, uang dalam Rp)
3.2. Hanya boleh ada 1 tahun aktif dalam satu waktu
3.3. Sistem harus menyimpan riwayat nilai zakat tahun-tahun sebelumnya
3.4. Sistem harus mencegah edit/delete tahun zakat yang sudah memiliki transaksi
3.5. Sistem harus mencatat audit log setiap perubahan nilai zakat

### FR-4: Manajemen Mustahik (Penerima Zakat)
4.1. Sistem harus menyimpan data mustahik: nama, alamat, kategori (8 asnaf), jumlah anggota, status
4.2. Kategori mustahik: Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil
4.3. Sistem harus mendukung status aktif/non-aktif untuk setiap mustahik
4.4. Sistem harus menyediakan fitur import data mustahik dari tahun sebelumnya
4.5. Sistem harus menandai penerima baru vs penerima lama (badge)
4.6. Sistem harus mendukung bulk activate/deactivate mustahik
4.7. Sistem harus menyimpan riwayat penerimaan zakat per mustahik

### FR-5: Distribusi Zakat
5.1. Sistem harus mencatat distribusi zakat ke mustahik dengan detail: jenis (beras/uang), jumlah, tanggal
5.2. Sistem harus validasi stok sebelum distribusi (sisa zakat ≥ jumlah distribusi)
5.3. Sistem harus menampilkan alert jika stok tidak mencukupi
5.4. Sistem harus mendukung status distribusi: pending dan selesai
5.5. Sistem harus generate bukti terima dalam format PDF
5.6. Bukti terima harus mencakup: nama masjid, data mustahik, jumlah terima, tanggal, ttd petugas
5.7. Sistem harus mencatat audit trail setiap distribusi

### FR-6: Dashboard
6.1. Dashboard harus menampilkan total pemasukan beras (kg)
6.2. Dashboard harus menampilkan total pemasukan uang (Rp)
6.3. Dashboard harus menampilkan total muzakki (pemberi zakat)
6.4. Dashboard harus menampilkan total mustahik aktif dan non-aktif
6.5. Dashboard harus menampilkan total distribusi (beras & uang)
6.6. Dashboard harus menampilkan sisa zakat (pemasukan - distribusi)
6.7. Dashboard harus menampilkan progress bar distribusi
6.8. Dashboard harus menampilkan chart pemasukan per bulan (bar chart)
6.9. Dashboard harus mendukung filter berdasarkan tahun zakat
6.10. Dashboard harus auto-refresh data setiap 30 detik (optional)
6.11. Dashboard harus menampilkan alert jika sisa zakat < 10% dari total pemasukan

### FR-7: Laporan & Export
7.1. Sistem harus menyediakan laporan pemasukan dengan filter: periode, jenis zakat
7.2. Sistem harus menyediakan laporan distribusi dengan filter: periode, kategori mustahik
7.3. Sistem harus menyediakan daftar lengkap mustahik (aktif/non-aktif) per kategori
7.4. Sistem harus menyediakan perbandingan data antar tahun (max 3 tahun)
7.5. Sistem harus support export laporan ke format PDF
7.6. Sistem harus support export laporan ke format Excel (.xlsx)
7.7. PDF harus mencakup header (logo, nama masjid) dan footer (tanggal cetak, petugas)
7.8. Sistem harus format currency dalam Rupiah (Rp xxx.xxx) dan date dalam format Indonesia (dd/MM/yyyy)

### FR-8: Backup & Restore
8.1. Sistem harus menyediakan tombol backup manual (export database to SQL)
8.2. Sistem harus auto-backup harian via Supabase (built-in)
8.3. Sistem harus support point-in-time recovery (7 hari terakhir)
8.4. Sistem harus menyediakan fitur restore dari file backup SQL
8.5. Sistem harus menyediakan export data per laporan ke Excel (emergency backup)

### FR-9: User Management (Admin only)
9.1. Admin harus bisa create user baru dengan email invitation
9.2. Admin harus bisa update role user (admin/petugas/viewer)
9.3. Admin harus bisa activate/deactivate user
9.4. Sistem harus mencatat audit log untuk setiap perubahan user

---

## 6. Non-Goals (Out of Scope)

❌ **Tidak termasuk dalam scope:**
1. Mobile app native (iOS/Android) - hanya web responsive
2. Integrasi dengan sistem akuntansi/ERP eksternal
3. Payment gateway untuk pembayaran online
4. Notifikasi push/SMS kepada muzakki atau mustahik
5. Multi-masjid management (hanya untuk 1 masjid)
6. Multi-language support (hanya Bahasa Indonesia)
7. E-signature digital untuk bukti pembayaran/terima
8. Barcode/QR code scanning untuk identifikasi muzakki
9. Real-time collaboration (multiple users editing same data simultaneously)
10. Advanced analytics & AI-powered insights
11. Public portal untuk muzakki cek status pembayaran mereka sendiri
12. Donation campaign management

---

## 7. Scope Fitur Utama

### 4.1 Manajemen Muzakki (Pemberi Zakat)
- Nama kepala keluarga
- Alamat
- Jumlah jiwa
- Jenis zakat: beras / uang
- Besaran zakat per orang (mengikuti tahun aktif)
- Total zakat
- Tanggal pembayaran
- Petugas penerima

---

### 4.2 Pengaturan Nilai Zakat (Tahunan)
- Set nilai zakat per orang:
  - Beras (kg)
  - Uang (Rp)
- Berlaku per tahun hijriah
- Riwayat nilai tetap tersimpan

---

### 4.3 Manajemen Mustahik (Penerima Zakat)
- Nama
- Alamat
- Kategori (fakir, miskin, dll)
- Jumlah anggota keluarga
- Status aktif / non-aktif
- Catatan khusus

---

### 4.4 Perbandingan Antar Tahun
- Import data mustahik tahun lalu
- Tandai:
  - Penerima baru
  - Penerima tidak aktif
- Riwayat perubahan data

---

### 4.5 Distribusi Zakat
- Alokasi zakat ke mustahik
- Metode: beras / uang
- Jumlah diterima
- Tanggal distribusi
- Validasi stok zakat

---

### 4.6 Dashboard
- Total pemasukan (beras & uang)
- Total mustahik
- Total muzakki
- Status distribusi
- Sisa zakat

---

### 4.7 Laporan
- Laporan pemasukan
- Laporan distribusi
- Daftar mustahik
- Perbandingan tahun
- Export PDF / Excel

---

## 8. Non-Functional Requirements

### NFR-1: Usability
- Interface harus mudah digunakan oleh petugas masjid non-IT
- Maksimal 3 klik untuk mencapai fitur utama
- Form harus memiliki inline validation dan error messages yang jelas
- Tersedia user manual dan video tutorial dalam Bahasa Indonesia

### NFR-2: Performance
- Page load time < 3 detik pada koneksi 4G
- Response time untuk query database < 500ms
- Support minimal 50 concurrent users
- Bundle size production < 1 MB (gzipped)

### NFR-3: Security
- Semua data harus encrypted at rest dan in transit (HTTPS)
- Row Level Security (RLS) diaktifkan untuk semua tables
- Password harus minimal 8 karakter
- Session timeout setelah 8 jam inaktif
- Audit log untuk semua perubahan data kritikal

### NFR-4: Reliability
- Uptime target: 99.5% (downtime max ~3.6 jam/bulan)
- Daily automatic backup via Supabase
- Data redundancy via Supabase multi-region storage
- Graceful error handling (no blank error pages)

### NFR-5: Maintainability
- Code harus menggunakan TypeScript untuk type safety
- Dokumentasi lengkap: README, API docs, user manual
- Follow React best practices dan shadcn/ui patterns
- Quarterly dependency updates

### NFR-6: Scalability
- Sistem harus bisa menangani data 5+ tahun tanpa performance degradation
- Support minimal 1000 muzakki dan 500 mustahik per tahun
- Database schema harus flexible untuk future enhancements

---

## 9. Tech Stack & Architecture

### 6.1 Frontend (React + Vite)
- **Framework**: React 18+
- **Build Tool**: Vite (fast development & build)
- **UI Framework**: TailwindCSS + shadcn/ui
- **State Management**: React Context / Zustand
- **Form Handling**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router
- **Export**: jsPDF (PDF) + xlsx (Excel)

### 6.2 Backend (Supabase)
- **Database**: PostgreSQL (relational)
- **Authentication**: Supabase Auth (email/password)
- **Real-time**: Supabase Realtime (optional)
- **Storage**: Supabase Storage (backup files)
- **Row Level Security**: Proteksi data per user
- **API**: Auto-generated REST & GraphQL

### 6.3 Deployment (Shared Hosting)
- **Build**: Static files (HTML, CSS, JS)
- **Hosting**: cPanel shared hosting (Rp 30-50k/bulan)
  - Niagahoster, Hostinger, Rumahweb, dll
- **Domain**: Custom domain + SSL gratis (Let's Encrypt)
- **CDN**: Cloudflare (optional, gratis)

### 6.4 Keuntungan Stack Ini
✅ Biaya rendah (hosting + Supabase free tier cukup untuk masjid)
✅ Akses dari mana saja (browser)
✅ Auto-backup di Supabase
✅ Mudah maintenance (no server management)
✅ Scalable (bisa upgrade kapan saja)
✅ Modern & responsive (mobile-friendly)

---

## 9.7 Database Schema (Supabase PostgreSQL)

### Tables:

#### 1. tahun_zakat
```sql
- id (uuid, primary key)
- tahun_hijriah (varchar)
- tahun_masehi (integer)
- nilai_beras_kg (decimal)
- nilai_uang_rp (decimal)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. muzakki
```sql
- id (uuid, primary key)
- nama_kk (varchar)
- alamat (text)
- no_telp (varchar)
- created_at (timestamp)
```

#### 3. pembayaran_zakat
```sql
- id (uuid, primary key)
- muzakki_id (uuid, foreign key)
- tahun_zakat_id (uuid, foreign key)
- jumlah_jiwa (integer)
- jenis_zakat (enum: 'beras', 'uang')
- jumlah_zakat (decimal)
- total_zakat (decimal)
- tanggal_bayar (date)
- petugas_id (uuid, foreign key to users)
- created_at (timestamp)
```

#### 4. kategori_mustahik
```sql
- id (uuid, primary key)
- nama (varchar) -- fakir, miskin, amil, dll
- deskripsi (text)
```

#### 5. mustahik
```sql
- id (uuid, primary key)
- nama (varchar)
- alamat (text)
- kategori_id (uuid, foreign key)
- jumlah_anggota (integer)
- no_telp (varchar)
- is_active (boolean)
- catatan (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 6. distribusi_zakat
```sql
- id (uuid, primary key)
- mustahik_id (uuid, foreign key)
- tahun_zakat_id (uuid, foreign key)
- jenis_distribusi (enum: 'beras', 'uang')
- jumlah (decimal)
- tanggal_distribusi (date)
- petugas_id (uuid, foreign key to users)
- status (enum: 'pending', 'selesai')
- created_at (timestamp)
```

#### 7. users (extends Supabase auth.users)
```sql
- id (uuid, primary key, references auth.users)
- nama_lengkap (varchar)
- role (enum: 'admin', 'petugas', 'viewer')
- is_active (boolean)
- created_at (timestamp)
```

#### 8. audit_logs
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- action (varchar)
- table_name (varchar)
- record_id (uuid)
- old_value (jsonb)
- new_value (jsonb)
- created_at (timestamp)
```

### Row Level Security (RLS) Policies:
- Admin: Full access
- Petugas: CRUD kecuali delete laporan final
- Viewer: Read-only

---

## 9.8 Deployment & Operasional Requirements

### 7.1 Akses Aplikasi

**URL & Login:**
- Akses: https://zakat-alfaraj.com (contoh domain)
- SSL/HTTPS: Otomatis (Let's Encrypt)
- Login: Email + Password
- Role: Admin, Petugas, Viewer

**Multi-device:**
- Desktop browser (Chrome, Firefox, Edge)
- Tablet
- Mobile (responsive design)

---

### 7.2 Backup & Restore (WAJIB)

**Automatic (Supabase):**
- Daily automatic backup (built-in Supabase)
- Point-in-time recovery (7 hari terakhir)
- Redundant storage (99.9% uptime)

**Manual Export:**
- Export database to SQL (1 klik)
- Export to Excel (per laporan)
- Download ke local storage
- Upload backup ke Supabase Storage

**Restore:**
- Restore dari backup SQL
- Import data dari Excel (emergency)
- Migrasi antar project Supabase

---

### 7.3 SOP Petugas (1 halaman)

**Harian**
1. Buka aplikasi / website
2. Input data zakat
3. Simpan & logout

**Mingguan**
- Backup data

**Akhir Ramadhan**
- Export laporan
- Backup final
- Arsipkan

---

## 13. Implementation Phases (High-Level)

### Phase 1 – Foundation & Setup
- [ ] Setup Supabase project
- [ ] Database schema design (PostgreSQL)
  - Table: tahun_zakat
  - Table: users (extend Supabase auth)
  - Table: roles & permissions
  - Table: kategori_mustahik
  - Table: settings
- [ ] Enable Row Level Security (RLS)
- [ ] Setup Vite + React project
- [ ] Install dependencies (TailwindCSS, React Query, etc)
- [ ] Setup routing & layout

---

### Phase 2 – Authentication & Users
- [ ] Login page (Supabase Auth)
- [ ] Protected routes
- [ ] User management (CRUD)
- [ ] Role-based access control
- [ ] Profile & settings

### Phase 3 – Zakat Masuk (Muzakki)
- [ ] Database table: muzakki, pembayaran_zakat
- [ ] Form input muzakki (React Hook Form + Zod)
- [ ] Auto kalkulasi zakat (real-time)
- [ ] List pembayaran (Table dengan search & filter)
- [ ] Edit & delete pembayaran
- [ ] Print bukti pembayaran (PDF)

---

### Phase 4 – Nilai Zakat (Settings)
- [ ] Database table: nilai_zakat
- [ ] Form setting zakat per tahun
- [ ] Validasi tahun aktif
- [ ] Riwayat perubahan nilai (audit log)

---

### Phase 5 – Mustahik (Penerima)
- [ ] Database table: mustahik, riwayat_mustahik
- [ ] CRUD mustahik
- [ ] Import data tahun lalu (copy & compare)
- [ ] Status aktif/non-aktif
- [ ] Bulk edit (activate/deactivate)

---

### Phase 6 – Distribusi Zakat
- [ ] Database table: distribusi_zakat
- [ ] Form alokasi zakat ke mustahik
- [ ] Validasi stok (cek sisa zakat)
- [ ] Log distribusi (audit trail)
- [ ] Print bukti terima (PDF)
- [ ] Status distribusi (pending, selesai)

---

### Phase 7 – Dashboard
- [ ] Ringkasan pemasukan (beras & uang)
- [ ] Total muzakki & mustahik
- [ ] Status distribusi (progress bar)
- [ ] Sisa zakat (alert jika kurang)
- [ ] Charts (Chart.js / Recharts)
- [ ] Filter by tahun & periode

---

### Phase 8 – Laporan & Export
- [ ] Laporan pemasukan (filter, sort)
- [ ] Laporan distribusi (detail per mustahik)
- [ ] Daftar mustahik (aktif/non-aktif)
- [ ] Perbandingan antar tahun
- [ ] Export PDF (jsPDF)
- [ ] Export Excel (xlsx)
- [ ] Print-friendly layout

---

### Phase 9 – Deployment & Production
- [ ] Build production (npm run build)
- [ ] Optimize bundle size (code splitting)
- [ ] Setup environment variables (.env)
- [ ] Upload ke shared hosting (cPanel)
- [ ] Setup domain & SSL (Let's Encrypt)
- [ ] Configure Supabase production URL
- [ ] Test production environment
- [ ] Setup Cloudflare CDN (optional)
- [ ] Configure caching & compression
- [ ] Monitoring & error tracking (Sentry optional)

---

### Phase 10 – Testing & Training
- [ ] Unit testing (Vitest)
- [ ] Integration testing (Supabase functions)
- [ ] User acceptance testing (UAT)
- [ ] Test dengan petugas non-IT
- [ ] Simulasi akhir Ramadhan (end-to-end)
- [ ] Browser compatibility test
- [ ] Mobile responsive test
- [ ] Performance test (Lighthouse)
- [ ] Security audit (RLS policies)
- [ ] Create user manual & SOP
- [ ] Training session untuk petugas

---

## 10. Success Metrics

### Adoption Metrics:
1. **User Adoption**: Minimal 80% petugas masjid menggunakan sistem dalam 1 bulan pertama
2. **Data Entry**: 100% pembayaran zakat tercatat di sistem (zero manual records)
3. **Training Success**: Minimal 90% petugas bisa input data tanpa bantuan setelah 1x training

### Efficiency Metrics:
4. **Time Saving**: Reduce waktu pencatatan per muzakki dari ~5 menit (manual) menjadi ~2 menit
5. **Reporting Time**: Generate laporan akhir Ramadhan dari 2-3 hari menjadi < 1 jam
6. **Error Rate**: Reduce kesalahan perhitungan dari ~5% (manual) menjadi 0% (automated)

### Quality Metrics:
7. **Data Accuracy**: 100% accuracy dalam perhitungan total zakat dan distribusi
8. **Data Completeness**: Minimal 95% data muzakki memiliki alamat dan no. telp lengkap
9. **Backup Compliance**: 100% backup harian berhasil (zero missed backups)

### User Satisfaction:
10. **User Satisfaction Score**: Target minimal 4/5 stars dari petugas (survey setelah 1 bulan)
11. **Support Tickets**: < 5 support tickets per bulan setelah 3 bulan penggunaan
12. **System Downtime**: < 3 jam/bulan unplanned downtime

### Business Impact:
13. **Transparency**: Laporan dapat dipresentasikan ke jamaah dalam < 1 hari setelah Idul Fitri
14. **Data Retention**: 100% data historis tersimpan dan accessible untuk minimal 5 tahun
15. **Cost Efficiency**: Total cost of ownership < Rp 1 juta/tahun (hosting + domain)

---

## 11. Open Questions

1. **Logo & Branding**: Apakah masjid sudah memiliki logo digital untuk header bukti pembayaran/terima?
2. **Initial Data Migration**: Apakah ada data Excel/manual dari tahun-tahun sebelumnya yang perlu di-import?
3. **Training Schedule**: Kapan jadwal optimal untuk training petugas (sebelum Ramadhan)?
4. **Domain Name**: Apakah sudah ada preferensi nama domain? (e.g., zakat-alfaraj.com)
5. **Hosting Provider**: Apakah sudah ada preferensi hosting? (Niagahoster, Hostinger, Rumahweb)
6. **Backup Frequency**: Apakah daily backup cukup atau perlu hourly backup?
7. **Report Templates**: Apakah ada format laporan khusus yang sudah digunakan sebelumnya?
8. **Printer Setup**: Apakah masjid memiliki printer untuk print bukti pembayaran/terima?
9. **Internet Connection**: Apakah masjid memiliki koneksi internet stabil? Backup plan jika internet down?
10. **User Accounts**: Berapa jumlah user yang akan menggunakan sistem? (untuk planning account creation)

---

## 12. Definition of Done

Aplikasi dinyatakan siap jika:
- Bisa dipakai petugas non-IT
- Data aman & bisa dipindahkan
- Laporan cepat dibuat
- Bisa digunakan lintas tahun

---

## 14. Estimasi Biaya & Timeline

### Biaya Operasional (per tahun):
- **Hosting Shared**: Rp 360.000 - 600.000/tahun
- **Domain (.com)**: Rp 150.000/tahun
- **Supabase**: Gratis (Free tier cukup untuk masjid)
  - 500 MB database
  - 1 GB file storage
  - 50.000 monthly active users
- **Total**: ~Rp 500.000 - 750.000/tahun

### Biaya Development (sekali):
- Estimasi: Tergantung developer (internal/freelance/vendor)
- Alternatif: Open source / community project

### Timeline Development:
- **Phase 1-2**: 1-2 minggu (Setup & Auth)
- **Phase 3-6**: 3-4 minggu (Core features)
- **Phase 7-8**: 2 minggu (Dashboard & Laporan)
- **Phase 9-10**: 1-2 minggu (Deployment & Testing)
- **Total**: ~2-3 bulan

---

## 15. Maintenance & Support

### Maintenance Rutin:
- Update dependencies (quarterly)
- Backup verification (monthly)
- Performance monitoring (via Supabase dashboard)
- Security updates (as needed)

### Support:
- Email/WhatsApp support
- Video tutorial (YouTube)
- User manual (PDF)
- Remote assistance (TeamViewer/AnyDesk)

---

**Dokumen ini siap digunakan untuk:**
- Brief developer / vendor
- Presentasi ke DKM
- Dasar proposal pengembangan
- Tender / RFP development

