# Tasks: Automatic Split of Excess Payment to Sedekah/Infak

## Relevant Files

- `zakat-fitrah-app/supabase/migrations/[timestamp]_create_pemasukan_beras.sql` - Migration to create pemasukan_beras table
- `zakat-fitrah-app/src/types/database.types.ts` - Database type definitions including new pemasukan_beras table
- `zakat-fitrah-app/src/components/muzakki/TambahPembayaranForm.tsx` - Form component with real-time calculation UI
- `zakat-fitrah-app/src/hooks/useMuzakki.ts` - Hook for muzakki data operations including split payment logic
- `zakat-fitrah-app/src/utils/sedekahReceipt.ts` - Receipt generation utility for split payments
- `zakat-fitrah-app/src/pages/SedekahReceipt.tsx` - Receipt page component
- `zakat-fitrah-app/src/hooks/useDashboard.ts` - Dashboard data hook for financial reports
- `zakat-fitrah-app/src/components/dashboard/KeuanganCard.tsx` - Dashboard component showing financial categories

### Notes

- Database migration must be executed before testing frontend features
- Transaction handling is critical - both records (Zakat + Sedekah) must be saved together
- Real-time calculation should update as user types the amount
- Receipt logic needs to query related sedekah record based on muzakki_id and date

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/auto-split-zakat-sedekah`

- [x] 1.0 Create Database Migration for pemasukan_beras Table
  - [x] 1.1 Review existing pemasukan_uang table structure and migration files
  - [x] 1.2 Create new migration file in `supabase/migrations/` with timestamp format
  - [x] 1.3 Write SQL to create pemasukan_beras table with columns: id, tahun_zakat_id, muzakki_id, kategori, jumlah_beras_kg, tanggal, catatan, created_by, created_at, updated_at
  - [x] 1.4 Add foreign key constraints and indexes for performance (tahun_zakat_id, muzakki_id, created_by)
  - [x] 1.5 Add RLS (Row Level Security) policies similar to pemasukan_uang table
  - [ ] 1.6 Apply migration locally using `supabase db reset` or migration command (Note: Requires Docker Desktop running)
  - [ ] 1.7 Verify table created successfully by checking Supabase dashboard

- [x] 2.0 Update Database Type Definitions
  - [x] 2.1 Read `src/types/database.types.ts` to understand current structure
  - [x] 2.2 Add `PemasukanBerasKategori` type definition (e.g., `'infak_sedekah_beras'`)
  - [x] 2.3 Add `pemasukan_beras` table interface with Row, Insert, and Update types
  - [x] 2.4 Update main `Database` interface to include `pemasukan_beras` in Tables
  - [x] 2.5 Run TypeScript compiler to verify types are valid: `npm run type-check` or `tsc --noEmit`

- [x] 3.0 Implement Real-Time Calculation UI in Payment Form
  - [x] 3.1 Locate and read `TambahPembayaranForm` component (likely in `src/components/muzakki/`)
  - [x] 3.2 Add state to track: calculatedZakatAmount, calculatedSedekahAmount, showBreakdown
  - [x] 3.3 Create `calculateSplit` function that determines required amount vs excess
  - [x] 3.4 Add useEffect to recalculate split when amount, jumlah_jiwa, or nilaiZakat changes
  - [x] 3.5 Import and use Shadcn/ui Alert or Card component for breakdown display
  - [x] 3.6 Implement conditional rendering: only show breakdown if excess > 0
  - [x] 3.7 Format displayed amounts with proper decimal places and currency (kg/Rp)
  - [x] 3.8 Add Info icon (from lucide-react) to make breakdown visually clear

- [ ] 4.0 Implement Split Payment Logic with Transaction Handling
  - [ ] 4.1 Read current payment submission logic in `src/hooks/useMuzakki.ts`
  - [ ] 4.2 Create helper function `shouldSplitPayment()` to determine if splitting is needed
  - [ ] 4.3 Create helper function `calculatePaymentSplit()` to return zakat and sedekah amounts
  - [ ] 4.4 Implement Uang split logic: insert pembayaran_zakat + pemasukan_uang in transaction
  - [ ] 4.5 Implement Beras split logic: insert pembayaran_zakat + pemasukan_beras in transaction
  - [ ] 4.6 Generate auto-catatan: "Kelebihan pembayaran dari [nama_kk]"
  - [ ] 4.7 Add confirmation dialog before save: show breakdown and ask "Lanjutkan dengan pembagian ini?"
  - [ ] 4.8 Wrap both inserts in try-catch with proper error handling
  - [ ] 4.9 Update success message to indicate split payment was recorded
  - [ ] 4.10 Update error message to clearly indicate transaction failure

- [ ] 5.0 Update Receipt Display for Split Payments
  - [ ] 5.1 Read `src/utils/sedekahReceipt.ts` and `src/pages/SedekahReceipt.tsx`
  - [ ] 5.2 Modify receipt data query to check for related sedekah record (by muzakki_id and tanggal)
  - [ ] 5.3 Update receipt interface/type to include optional sedekah amount
  - [ ] 5.4 Update receipt template to conditionally show split line items
  - [ ] 5.5 Add line item: "Zakat Fitrah: [amount] [kg/Rp]"
  - [ ] 5.6 Add line item: "Sedekah/Infak: [amount] [kg/Rp]" (if split exists)
  - [ ] 5.7 Add separator line and "Total Pembayaran: [total] [kg/Rp]"
  - [ ] 5.8 Add thank-you message: "Terima kasih atas kontribusi sedekah Anda"
  - [ ] 5.9 Test receipt generation with mock split payment data

- [ ] 6.0 Integrate Sedekah Categories in Dashboard Keuangan
  - [ ] 6.1 Read `src/hooks/useDashboard.ts` to understand current query structure
  - [ ] 6.2 Add query for SUM of pemasukan_uang where kategori = 'infak_sedekah_uang'
  - [ ] 6.3 Add query for SUM of pemasukan_beras where kategori = 'infak_sedekah_beras'
  - [ ] 6.4 Update return type to include infakSedekahUang and infakSedekahBeras totals
  - [ ] 6.5 Locate and read KeuanganCard or similar dashboard display component
  - [ ] 6.6 Add display section for "Infak/Sedekah Uang" with formatted amount
  - [ ] 6.7 Add display section for "Infak/Sedekah Beras" with formatted amount
  - [ ] 6.8 Ensure proper number formatting with separators (e.g., Rp 1.000.000 or 100 kg)
  - [ ] 6.9 Test dashboard loads and displays correct totals

- [ ] 7.0 Update Payment History Display
  - [ ] 7.1 Locate muzakki detail/payment history component
  - [ ] 7.2 Modify payment history query to join/include sedekah records from pemasukan_uang and pemasukan_beras
  - [ ] 7.3 Add Badge component (Shadcn/ui) to label "Sedekah" vs "Zakat" payments
  - [ ] 7.4 Update display to show both records with visual connection (e.g., same date, indented)
  - [ ] 7.5 Ensure chronological sorting includes both zakat and sedekah records
  - [ ] 7.6 Add tooltip or helper text explaining split payments if needed

- [ ] 8.0 Testing and Validation
  - [ ] 8.1 Test exact payment (amount = required): verify single zakat record, no split
  - [ ] 8.2 Test Uang overpayment: verify pembayaran_zakat + pemasukan_uang created
  - [ ] 8.3 Test Beras overpayment: verify pembayaran_zakat + pemasukan_beras created
  - [ ] 8.4 Test real-time calculation UI updates as you type amount
  - [ ] 8.5 Test confirmation dialog shows correct breakdown before saving
  - [ ] 8.6 Test transaction rollback: simulate database error on second insert
  - [ ] 8.7 Test receipt generation displays both Zakat and Sedekah amounts correctly
  - [ ] 8.8 Test dashboard Keuangan shows Infak/Sedekah totals correctly
  - [ ] 8.9 Test payment history displays both records with proper badges/labels
  - [ ] 8.10 Test with various jumlah_jiwa values (1, 3, 5, 10) to verify calculations
  - [ ] 8.11 Test with edge cases: amount = 0, negative amount (should fail validation)
  - [ ] 8.12 Test canceling confirmation dialog doesn't save any records
  - [ ] 8.13 Verify existing validation rules still work (minimum amount, required fields)
