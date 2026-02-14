# Testing Checklist: Auto-Split Zakat-Sedekah Feature

## Prerequisites

- [ ] **Migration Applied**: Database migration `012_pemasukan_beras.sql` must be applied
  - Requires Docker Desktop running
  - Run: `npm run apply-migration` (or similar command)
  - Verify: Query `pemasukan_beras` table exists in Supabase

## Test Scenarios

### 1. Exact Payment (No Split)

**Scenario**: Muzakki pays exact zakat amount (no overpayment)

**Test Steps**:
1. Navigate to Muzakki page
2. Click "+ Tambah Pembayaran"
3. Fill form:
   - Nama KK: "Test Exact Payment"
   - Alamat: "Test Address"
   - Jumlah Jiwa: 4
   - Jenis Zakat: Uang
   - Jumlah: 200000 (assuming 50000/jiwa)
4. Check real-time UI: Should NOT show breakdown alert
5. Click "Simpan"

**Expected Result**:
- ✅ No confirmation dialog appears
- ✅ Single `pembayaran_zakat` record created
- ✅ NO `pemasukan_uang` record created
- ✅ Receipt shows only zakat amount
- ✅ Dashboard shows NO change in Infak/Sedekah totals
- ✅ Payment history shows "Zakat" badge only (no "+ Sedekah")

---

### 2. Uang Overpayment (Split Payment)

**Scenario**: Muzakki pays MORE than required zakat amount (Uang)

**Test Steps**:
1. Navigate to Muzakki page
2. Click "+ Tambah Pembayaran"
3. Fill form:
   - Nama KK: "Test Uang Overpayment"
   - Alamat: "Test Address"
   - Jumlah Jiwa: 4
   - Jenis Zakat: Uang
   - Jumlah: 250000 (50000 over required 200000)
4. Check real-time UI: Should show Alert with breakdown:
   - Zakat Fitrah: Rp 200.000
   - Sedekah/Infak: Rp 50.000
5. Click "Simpan"
6. Verify confirmation dialog shows correct breakdown
7. Click "Ya, Lanjutkan"

**Expected Result**:
- ✅ Confirmation dialog appears with correct amounts
- ✅ `pembayaran_zakat` record created with `jumlah_uang_rp = 200000`
- ✅ `pemasukan_uang` record created with:
  - `jumlah_uang_rp = 50000`
  - `kategori = 'infak_sedekah_uang'`
  - `catatan = "Kelebihan pembayaran dari Test Uang Overpayment"`
  - `muzakki_id` = same as pembayaran
  - `tanggal` = same as tanggal_bayar
- ✅ Receipt shows THREE lines:
  - Zakat Fitrah: Rp 200.000
  - Sedekah/Infak: Rp 50.000
  - Total Pembayaran: Rp 250.000
- ✅ Receipt includes thank-you message
- ✅ Dashboard "Infak/Sedekah Uang" increases by Rp 50.000
- ✅ Payment history shows:
  - "Uang" badge
  - "Zakat" badge
  - "+ Sedekah" badge (green)
  - Amount shows Rp 200.000 with "+ Rp 50.000" in green below

---

### 3. Beras Overpayment (Split Payment)

**Scenario**: Muzakki pays MORE than required zakat amount (Beras)

**Test Steps**:
1. Navigate to Muzakki page
2. Click "+ Tambah Pembayaran"
3. Fill form:
   - Nama KK: "Test Beras Overpayment"
   - Alamat: "Test Address"
   - Jumlah Jiwa: 3
   - Jenis Zakat: Beras
   - Jumlah: 12 kg (assuming 3 kg required = 9 kg, so 3 kg extra)
4. Check real-time UI: Should show Alert with breakdown:
   - Zakat Fitrah: 9 kg
   - Sedekah/Infak: 3 kg
5. Click "Simpan"
6. Verify confirmation dialog shows correct breakdown
7. Click "Ya, Lanjutkan"

**Expected Result**:
- ✅ Confirmation dialog appears with correct amounts
- ✅ `pembayaran_zakat` record created with `jumlah_beras_kg = 9`
- ✅ `pemasukan_beras` record created with:
  - `jumlah_beras_kg = 3`
  - `kategori = 'infak_sedekah_beras'`
  - `catatan = "Kelebihan pembayaran dari Test Beras Overpayment"`
  - `muzakki_id` = same as pembayaran
  - `tanggal` = same as tanggal_bayar
- ✅ Receipt shows THREE lines:
  - Zakat Fitrah: 9 kg
  - Sedekah/Infak: 3 kg
  - Total Pembayaran: 12 kg
- ✅ Receipt includes thank-you message
- ✅ Dashboard "Infak/Sedekah Beras" increases by 3 kg
- ✅ Payment history shows:
  - "Beras" badge
  - "Zakat" badge
  - "+ Sedekah" badge (green)
  - Amount shows 9 kg with "+ 3 kg" in green below

---

### 4. Real-Time Calculation UI

**Scenario**: Verify form updates as user types

**Test Steps**:
1. Navigate to Muzakki page
2. Click "+ Tambah Pembayaran"
3. Fill form incrementally:
   - Set Jumlah Jiwa: 5
   - Set Jenis Zakat: Uang
   - Type in Jumlah field: 250 (no alert yet)
   - Continue typing: 2500 (no alert yet)
   - Continue typing: 25000 (no alert yet)
   - Continue typing: 250000 (alert appears IF value_per_jiwa < 50000)

**Expected Result**:
- ✅ Alert appears ONLY when jumlah > (jumlah_jiwa * nilai_per_jiwa)
- ✅ Alert shows real-time calculated breakdown
- ✅ Alert disappears if user reduces amount below threshold
- ✅ All numbers formatted correctly with thousand separators

---

### 5. Confirmation Dialog

**Scenario**: Verify dialog before saving split payment

**Test Steps**:
1. Create overpayment scenario (Uang: 4 jiwa, 250000)
2. Click "Simpan"
3. Verify dialog content

**Expected Result**:
- ✅ Dialog appears with title "Konfirmasi Pembagian Pembayaran"
- ✅ Shows "Pembayaran ini akan dibagi menjadi:" text
- ✅ Shows Zakat Fitrah amount with proper formatting
- ✅ Shows Sedekah/Infak amount with proper formatting
- ✅ Shows "Lanjutkan dengan pembagian ini?" question
- ✅ "Batal" button cancels operation
- ✅ "Ya, Lanjutkan" button proceeds with save

---

### 6. Transaction Rollback (Error Handling)

**Scenario**: Simulate database error during split payment

**Test Steps** (Developer Test):
1. Temporarily modify `useMuzakki.ts` to force error on second insert:
   ```typescript
   // After pembayaran_zakat insert, add:
   throw new Error('Simulated database error');
   ```
2. Attempt overpayment submission
3. Check database state

**Expected Result**:
- ✅ Error toast appears
- ✅ NO `pembayaran_zakat` record created (transaction rolled back)
- ✅ NO `pemasukan_uang/beras` record created
- ✅ User can retry submission
- ✅ Error message is clear: mentions transaction failure

---

### 7. Receipt Generation

**Scenario**: Verify receipt displays split correctly

**Test Steps**:
1. Create overpayment: Uang 4 jiwa, 250000
2. Save successfully
3. Click "Print Bukti" button
4. Verify receipt content

**Expected Result**:
- ✅ Receipt header shows correct muzakki info
- ✅ Shows "Zakat Fitrah: Rp 200.000" line
- ✅ Shows separator line "---"
- ✅ Shows "Sedekah/Infak: Rp 50.000" line
- ✅ Shows separator line "---"
- ✅ Shows "Total Pembayaran: Rp 250.000" line
- ✅ Shows thank-you message: "Terima kasih atas kontribusi sedekah Anda"
- ✅ Receipt can be downloaded/printed

---

### 8. Dashboard Integration

**Scenario**: Verify dashboard shows sedekah totals

**Test Steps**:
1. Note current dashboard Infak/Sedekah Uang and Beras amounts
2. Create Uang overpayment: 50000 extra
3. Create Beras overpayment: 3 kg extra
4. Refresh/navigate to Dashboard
5. Verify updated totals

**Expected Result**:
- ✅ "Infak/Sedekah Uang" card exists
- ✅ "Infak/Sedekah Beras" card exists
- ✅ Uang total increased by 50000
- ✅ Beras total increased by 3 kg
- ✅ Numbers formatted with "Rp" and "kg" suffixes
- ✅ Numbers have thousand separators

---

### 9. Payment History

**Scenario**: Verify payment list shows split payments correctly

**Test Steps**:
1. Navigate to Muzakki page
2. View payment table
3. Locate split payment records

**Expected Result**:
- ✅ Payment row shows "Zakat" badge
- ✅ Payment row shows "Beras" or "Uang" badge
- ✅ Payment row shows "+ Sedekah" badge (green background)
- ✅ Amount column shows zakat amount
- ✅ Amount column shows "+ [sedekah amount]" in green below
- ✅ Chronological order maintained
- ✅ Search/filter works correctly with split payments

---

### 10. Edge Cases

#### 10.1 Zero Amount
**Test**: Set jumlah = 0
**Expected**: Form validation prevents submission

#### 10.2 Negative Amount (if possible)
**Test**: Set jumlah = -100
**Expected**: Form validation prevents submission

#### 10.3 Very Large Overpayment
**Test**: Set jumlah = 10x required (e.g., 2000000 for 4 jiwa @ 50000)
**Expected**: 
- Split calculation correct: 200000 zakat, 1800000 sedekah
- All UI components handle large numbers
- Receipt displays correctly

#### 10.4 Multiple Jiwa Scenarios
**Test**: Test with 1, 2, 5, 10, 20 jiwa
**Expected**: All calculations correct for each jiwa count

#### 10.5 Different Nilai Per Jiwa Settings
**Test**: Change tahun_zakat nilai_beras_kg and nilai_uang_rp
**Expected**: Calculations adapt to new rates

---

## Regression Testing

Ensure existing functionality still works:

- [ ] Normal zakat payment (no overpayment) works as before
- [ ] Edit existing pembayaran works
- [ ] Delete pembayaran works
- [ ] Print receipt for normal payment works
- [ ] Search muzakki works
- [ ] Filter by jenis_zakat works
- [ ] Pagination works
- [ ] Dashboard other cards unaffected
- [ ] Settings page unaffected
- [ ] Other pages (Mustahik, Distribusi, Laporan) unaffected

---

## Code Quality Checks

- [x] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] ESLint passes (if configured)
- [ ] No console errors in browser
- [ ] No React warnings in console
- [ ] Responsive design works (mobile, tablet, desktop)

---

## Final Review

- [ ] All test scenarios passed
- [ ] Edge cases handled
- [ ] Regression tests passed
- [ ] Code committed with clear messages
- [ ] PRD requirements met
- [ ] Ready for QA/UAT
