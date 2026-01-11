## Relevant Files

- zakat-fitrah-app/src/pages/Dashboard.tsx - Menambah kartu/metrik baru dan komponen progress uang.
- zakat-fitrah-app/src/hooks/useDashboard.ts - Menambah query agregasi untuk fidyah/infak/maal uang dan komponen Hak Amil.
- zakat-fitrah-app/src/components/dashboard/DistribusiProgress.tsx - Memperluas agar mendukung komponen Hak Amil (atau buat komponen baru).
- zakat-fitrah-app/src/pages/Muzakki.tsx - (Opsional) Entry transaksi uang yang terkait muzakki.
- zakat-fitrah-app/src/components/muzakki/MuzakkiForm.tsx - Tambah field akun uang & nominal diterima untuk deteksi overpayment.
- zakat-fitrah-app/src/hooks/useMuzakki.ts - Update create/update pembayaran agar menyimpan akun uang & nominal diterima.
- zakat-fitrah-app/src/pages/Settings.tsx - (Opsional) Admin input Hak Amil manual per tahun zakat.
- zakat-fitrah-app/src/lib/auth.tsx - Role gating untuk admin-only pages/controls.
- zakat-fitrah-app/src/types/database.types.ts - Update type definitions untuk tabel/kolom baru.
- zakat-fitrah-app/supabase/migrations/*.sql - Migrasi skema DB: tabel pemasukan uang, hak amil manual, rekonsiliasi.

- zakat-fitrah-app/src/pages/* (baru) - Halaman input pemasukan uang (Fidyah/Maal/Infak) bila dipisah dari Muzakki.
- zakat-fitrah-app/src/hooks/* (baru) - Hook untuk CRUD pemasukan uang, hak amil, dan rekonsiliasi.
- zakat-fitrah-app/src/components/* (baru) - Form shadcn untuk pemasukan uang + rekonsiliasi.
- zakat-fitrah-app/supabase/migrations/*_rls_*.sql (mungkin) - Penyesuaian RLS agar petugas bisa insert pemasukan, admin bisa rekonsiliasi.

### Notes

- Dokumen ini mengikuti workflow di tasks/generate-tasks.md.
- Parent tasks sudah disetujui ("Go"); dokumen ini berisi sub-tasks rinci.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`.

## Tasks

- [x] 0.0 Create feature branch
	- [x] 0.1 Create and checkout a new branch (e.g., `feature/fase-2-dashboard-keuangan`)

- [x] 1.0 Finalize data model & scope (Phase 2)
	- [x] 1.1 Review PRD: scope in-scope vs out-of-scope (confirm no auto hak amil, akun fixed Kas/Bank)
	- [x] 1.2 Decide schema approach: reuse `pembayaran_zakat` vs new tables for non-fitrah (recommended: new table)
	- [x] 1.3 Define enums/values:
		- kategori pemasukan uang: `zakat_fitrah_uang`, `fidyah_uang`, `maal_penghasilan_uang`, `infak_sedekah_uang`
		- akun uang: `kas`, `bank`
	- [x] 1.4 Define dashboard formulas:
		- Total Pemasukan Uang
		- Hak Amil Uang (manual)
		- Tersalurkan Uang (existing)
		- Sisa Uang
	- [x] 1.5 Define overpayment flow for Zakat Fitrah (uang): confirm dialog + pencatatan selisih ke infak
	- [x] 1.6 Confirm rekonsiliasi rules (admin-only): penyesuaian ikut masuk total pemasukan + tampil sebagai info

- [x] 2.0 Database migrations (pemasukan uang + hak amil manual + rekonsiliasi)
	- [x] 2.0.1 Create migration: update `pembayaran_zakat` (fitrah uang)
		- [x] 2.0.1.1 Add `akun_uang` (kas/bank) (required when jenis_zakat=uang)
		- [x] 2.0.1.2 Add `jumlah_uang_dibayar_rp` (nullable, for overpayment detection)
	- [x] 2.1 Create migration: `pemasukan_uang` table
		- [x] 2.1.1 Columns (suggested): id, tahun_zakat_id, muzakki_id (nullable), kategori, akun, jumlah_uang_rp, tanggal, catatan, created_by, created_at, updated_at
		- [x] 2.1.2 Indexes: tahun_zakat_id, kategori, tanggal, akun
	- [x] 2.2 Create migration: `hak_amil` (manual per tahun)
		- [x] 2.2.1 Columns (suggested): tahun_zakat_id (unique), jumlah_uang_rp, updated_by, updated_at
	- [x] 2.3 Create migration: `rekonsiliasi` (admin-only)
		- [x] 2.3.1 Columns (suggested): id, tahun_zakat_id, jenis (`uang`/`beras`), akun (nullable), jumlah_uang_rp (nullable), jumlah_beras_kg (nullable), tanggal, catatan, created_by, created_at
	- [x] 2.4 RLS policies
		- [x] 2.4.1 Petugas/admin can insert & read `pemasukan_uang`
		- [x] 2.4.2 Only admin can insert/update `hak_amil` and `rekonsiliasi`
		- [x] 2.4.3 Ensure selects for dashboard work with RLS (use views or policies as needed)
	- [x] 2.5 Update generated types
		- [x] 2.5.1 Update `zakat-fitrah-app/src/types/database.types.ts` to include new tables/types
	- [x] 2.6 (Optional) Seed minimal records for active tahun (hak_amil default 0)

- [x] 3.0 UI: Input pemasukan uang (Fidyah uang, Maal penghasilan uang, Infak/Sedekah)
	- [x] 3.1 Decide UI placement
		- [x] 3.1.1 Add a new menu page (recommended) vs reuse Muzakki page
	- [x] 3.2 Build form: Pemasukan Uang (generic)
		- [x] 3.2.1 Fields: kategori, akun (Kas/Bank), nominal, tanggal, catatan, (optional) muzakki
		- [x] 3.2.2 Validation (zod): nominal > 0, tanggal required
	- [x] 3.3 Implement specific entry flows
		- [x] 3.3.1 Fidyah uang: create record kategori `fidyah_uang`
		- [x] 3.3.2 Maal penghasilan uang: create record kategori `maal_penghasilan_uang`
		- [x] 3.3.3 Infak/Sedekah uang: create record kategori `infak_sedekah_uang`
	- [x] 3.4 Implement hooks (TanStack Query)
		- [x] 3.4.1 `usePemasukanUangList` (filter by tahun, kategori, akun, date)
		- [x] 3.4.2 `useCreatePemasukanUang` (mutation)
	- [x] 3.5 Table/list view
		- [x] 3.5.1 Show last N records + filter by kategori + akun
		- [x] 3.5.2 Role-based actions (edit/delete optional; can be Phase 3)
	- [x] 3.6 Overpayment integration for Zakat Fitrah (uang)
		- [x] 3.6.1 Update form di `MuzakkiForm.tsx`: tambah input akun uang (Kas/Bank) untuk jenis_zakat=uang
		- [x] 3.6.2 Update form di `MuzakkiForm.tsx`: tambah input "Nominal Diterima" (default = kewajiban)
		- [x] 3.6.3 If diterima > wajib: confirmation modal to create `infak_sedekah_uang` for selisih
		- [x] 3.6.4 Persist: simpan `akun_uang` + `jumlah_uang_dibayar_rp` ke `pembayaran_zakat`
		- [x] 3.6.5 Store reference info (catatan pemasukan_uang: "Overpayment dari pembayaran_zakat {id}")

- [x] 4.0 UI: Dashboard update (Infak/Fidyah/Uang terkumpul + Hak Amil + rumus progress)
	- [x] 4.1 Update `useDashboardStats` to include:
		- [x] 4.1.1 Sum fidyah uang (from `pemasukan_uang`)
		- [x] 4.1.2 Sum infak/sedekah uang (from `pemasukan_uang`)
		- [x] 4.1.3 Sum maal penghasilan uang (from `pemasukan_uang`)
		- [x] 4.1.4 Hak Amil uang (manual, from `hak_amil`)
		- [x] 4.1.5 Total pemasukan uang (aggregate) and sisa uang formula
	- [x] 4.2 Update Dashboard cards
		- [x] 4.2.1 Add StatCard: Infak/Sedekah Uang Terkumpul
		- [x] 4.2.2 Add StatCard: Fidyah Uang Terkumpul
		- [x] 4.2.3 Decide where to show Maal (own card vs included in total)
	- [x] 4.3 Update progress component
		- [x] 4.3.1 Create new component `DistribusiProgressWithAmil` (recommended) OR extend existing component safely
		- [x] 4.3.2 Display: Total Pemasukan, Hak Amil (manual), Tersalurkan, Sisa
		- [x] 4.3.3 Add warning when sisa < 0
	- [x] 4.4 Update monthly chart (optional Phase 2)
		- [x] 4.4.1 Keep monthly chart for zakat fitrah only (Phase 2 decision)

- [ ] 5.0 Admin-only: Rekonsiliasi manual (Kas/Bank + Beras)
	- [ ] 5.1 Add admin-only route/page
		- [ ] 5.1.1 Add menu entry visible only for admin
	- [ ] 5.2 Build Rekonsiliasi form
		- [ ] 5.2.1 Choose jenis: Uang / Beras
		- [ ] 5.2.2 If Uang: pilih akun Kas/Bank + nominal penyesuaian (+/-)
		- [ ] 5.2.3 If Beras: input kg penyesuaian (+/-)
		- [ ] 5.2.4 Catatan wajib (untuk audit)
	- [ ] 5.3 Build Rekonsiliasi history table
		- [ ] 5.3.1 Filter by tahun + jenis + akun
	- [ ] 5.4 Implement hooks
		- [ ] 5.4.1 `useRekonsiliasiList`
		- [ ] 5.4.2 `useCreateRekonsiliasi`
	- [ ] 5.5 Wire rekonsiliasi into dashboard totals
		- [ ] 5.5.1 Implement: adjustment included in totals (per PRD)
		- [ ] 5.5.2 Also display adjustment totals for transparency
	- [ ] 5.6 Admin-only: Hak Amil manual input
		- [ ] 5.6.1 Add admin-only input (Settings or Dashboard)
		- [ ] 5.6.2 Persist to `hak_amil` and reflect in dashboard calculations

- [ ] 6.0 QA & regression checks (dashboard, input, permissions)
	- [ ] 6.1 Verify role restrictions
		- [ ] 6.1.1 Petugas cannot access rekonsiliasi/hak amil input
		- [ ] 6.1.2 Viewer is read-only
	- [ ] 6.2 Verify dashboard totals
		- [ ] 6.2.1 Totals match manual sums for a sample tahun
		- [ ] 6.2.2 Sisa formula works and warnings appear when invalid
	- [ ] 6.3 Verify overpayment flow
		- [ ] 6.3.1 Confirming overpayment creates infak record
		- [ ] 6.3.2 Cancelling overpayment does not create record
	- [ ] 6.4 Regression: existing fitrah pembayaran/distribusi still work
	- [ ] 6.5 Update documentation (optional)
		- [ ] 6.5.1 Note new flows in `zakat-fitrah-app/README.md` or a Phase 2 notes doc
