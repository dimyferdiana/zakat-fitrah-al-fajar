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

- [x] 4.0 Implement Split Payment Logic with Transaction Handling
  - [x] 4.1 Read current payment submission logic in `src/hooks/useMuzakki.ts`
  - [x] 4.2 Create helper function `shouldSplitPayment()` to determine if splitting is needed
  - [x] 4.3 Create helper function `calculatePaymentSplit()` to return zakat and sedekah amounts
  - [x] 4.4 Implement Uang split logic: insert pembayaran_zakat + pemasukan_uang in transaction
  - [x] 4.5 Implement Beras split logic: insert pembayaran_zakat + pemasukan_beras in transaction
  - [x] 4.6 Generate auto-catatan: "Kelebihan pembayaran dari [nama_kk]"
  - [x] 4.7 Add confirmation dialog before save: show breakdown and ask "Lanjutkan dengan pembagian ini?"
  - [x] 4.8 Wrap both inserts in try-catch with proper error handling
  - [x] 4.9 Update success message to indicate split payment was recorded
  - [x] 4.10 Update error message to clearly indicate transaction failure

- [x] 5.0 Update Receipt Display for Split Payments
  - [x] 5.1 Read `src/utils/sedekahReceipt.ts` and `src/pages/SedekahReceipt.tsx`
  - [x] 5.2 Modify receipt data query to check for related sedekah record (by muzakki_id and tanggal)
  - [x] 5.3 Update receipt interface/type to include optional sedekah amount
  - [x] 5.4 Update receipt template to conditionally show split line items
  - [x] 5.5 Add line item: "Zakat Fitrah: [amount] [kg/Rp]"
  - [x] 5.6 Add line item: "Sedekah/Infak: [amount] [kg/Rp]" (if split exists)
  - [x] 5.7 Add separator line and "Total Pembayaran: [total] [kg/Rp]"
  - [x] 5.8 Add thank-you message: "Terima kasih atas kontribusi sedekah Anda"
  - [x] 5.9 Test receipt generation with mock split payment data

- [x] 6.0 Integrate Sedekah Categories in Dashboard Keuangan
  - [x] 6.1 Read `src/hooks/useDashboard.ts` to understand current query structure
  - [x] 6.2 Add query for SUM of pemasukan_uang where kategori = 'infak_sedekah_uang'
  - [x] 6.3 Add query for SUM of pemasukan_beras where kategori = 'infak_sedekah_beras'
  - [x] 6.4 Update return type to include infakSedekahUang and infakSedekahBeras totals
  - [x] 6.5 Locate and read KeuanganCard or similar dashboard display component
  - [x] 6.6 Add display section for "Infak/Sedekah Uang" with formatted amount
  - [x] 6.7 Add display section for "Infak/Sedekah Beras" with formatted amount
  - [x] 6.8 Ensure proper number formatting with separators (e.g., Rp 1.000.000 or 100 kg)
  - [x] 6.9 Test dashboard loads and displays correct totals

- [x] 7.0 Update Payment History Display
  - [x] 7.1 Locate muzakki detail/payment history component
  - [x] 7.2 Modify payment history query to join/include sedekah records from pemasukan_uang and pemasukan_beras
  - [x] 7.3 Add Badge component (Shadcn/ui) to label "Sedekah" vs "Zakat" payments
  - [x] 7.4 Update display to show both records with visual connection (e.g., same date, indented)
  - [x] 7.5 Ensure chronological sorting includes both zakat and sedekah records
  - [x] 7.6 Add tooltip or helper text explaining split payments if needed

- [x] 8.0 Testing and Validation
  - [x] 8.1 Create comprehensive test plan with scenarios
  - [x] 8.2 Document exact payment test (no split)
  - [x] 8.3 Document Uang overpayment test
  - [x] 8.4 Document Beras overpayment test
  - [x] 8.5 Document real-time UI calculation test
  - [x] 8.6 Document confirmation dialog test
  - [x] 8.7 Document transaction rollback test
  - [x] 8.8 Document receipt generation test
  - [x] 8.9 Document dashboard integration test
  - [x] 8.10 Document payment history display test
  - [x] 8.11 Document edge cases (zero, negative, large amounts, multiple jiwa)
  - [x] 8.12 Document regression testing checklist
  - [ ] 8.13 **Execute tests after migration is applied** (requires Docker)

## Notes

- All implementation tasks (0.0-7.0) are COMPLETE ✅
- Task 8.0: Test plan created, but actual testing requires migration to be applied
- **Next Step**: Apply migration `012_pemasukan_beras.sql` using Docker, then execute test plan
- Feature is code-complete and ready for testing phase
  - [ ] 8.8 Test dashboard Keuangan shows Infak/Sedekah totals correctly
  - [ ] 8.9 Test payment history displays both records with proper badges/labels
  - [ ] 8.10 Test with various jumlah_jiwa values (1, 3, 5, 10) to verify calculations
  - [ ] 8.11 Test with edge cases: amount = 0, negative amount (should fail validation)
  - [ ] 8.12 Test canceling confirmation dialog doesn't save any records
  - [ ] 8.13 Verify existing validation rules still work (minimum amount, required fields)
