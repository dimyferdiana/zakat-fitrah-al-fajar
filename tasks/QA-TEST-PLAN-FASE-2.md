# QA Test Plan - Phase 2: Dashboard Keuangan

**Date:** January 11, 2026
**Branch:** `feature/fase-2-dashboard-keuangan`
**Tester:** [Your Name]

---

## Test Environment

- **URL:** http://localhost:5173
- **Database:** Local Supabase (Docker)
- **Test Users:**
  - Admin: seed-admin@example.com / password123
  - Petugas: petugas-test@example.com / password123
  - Viewer: viewer-test@example.com / password123

---

## 6.1 Role-Based Access Control

### 6.1.1 Admin Access (seed-admin@example.com)

**Test Case:** Admin can access all features

- [X] Login as admin
- [X] Navigate to Dashboard - should see all stats
- [X] Navigate to Pemasukan Uang - should have access
- [X] Navigate to Settings → Rekonsiliasi tab - should be visible
- [X] Navigate to Settings → Hak Amil tab - should be visible
- [X] Try adding rekonsiliasi - should work
- [X] Try updating hak amil - should work

**Expected:** ✅ All features accessible

---

### 6.1.2 Petugas Access (petugas-test@example.com)

**Test Case:** Petugas cannot access admin-only features

- [X] Login as petugas
- [X] Navigate to Dashboard - should see all stats (read-only)
- [X] Navigate to Pemasukan Uang - should have access
- [X] Navigate to Settings page
  - [ ] Rekonsiliasi tab - should NOT be visible
  - [ ] Hak Amil tab - should NOT be visible
  - [ ] User Management tab - should NOT be visible
- [ ] Try accessing `/settings` directly - tabs should not render

**Expected:** ✅ Admin-only features hidden/blocked

---

### 6.1.3 Viewer Access (viewer-test@example.com)

**Test Case:** Viewer has read-only access

- [X] Login as viewer
- [X] Navigate to Dashboard - should see stats (no edit buttons)
- [X] Navigate to Data Muzakki - should see "Anda tidak memiliki akses" message
- [X] Navigate to Pemasukan Uang - check if blocked or read-only
- [X] Navigate to Settings - should see access denied or limited view

**Expected:** ✅ All write operations blocked

---

## 6.2 Dashboard Calculations Accuracy

### 6.2.1 Manual Sum Verification

**Test Data Setup:**
Seed script already adds:

```
- Fidyah: Rp 100.000 (Kas)
- Fidyah: Rp 60.000 (Bank)
- Infak/Sedekah: Rp 310.000 (Kas)
- Maal/Penghasilan: Rp 400.000 (Bank)
- Rekonsiliasi Uang (Kas): +Rp 100.000
- Rekonsiliasi Beras: -2.5 kg
- Hak Amil: Rp 100.000
- Distribusi Uang: Rp 140.000
```

**Verification Steps:**

- [X] Check Fidyah card: Should show Rp 160.000
- [X] Check Infak/Sedekah card: Should show Rp 310.000
- [ ] Check Maal card (if shown elsewhere) or detail: Should show Rp 400.000
- [X] Check Total Pemasukan Uang card: Should show Rp 970.000 (Fidyah + Infak + Maal + Rekonsiliasi; zakat uang tampil terpisah)
- [X] Check Hak Amil deduction in progress bar
- [X] Calculate Sisa manually: Total Pemasukan - Hak Amil - Distribusi
- [X] Compare with dashboard display

**Expected Manual Calculation:**

```
Total Pemasukan Uang (card) = Fidyah + Infak + Maal + Rekonsiliasi
                            = 160.000 + 310.000 + 400.000 + 100.000
                            = 970.000
Hak Amil = 100.000
Distribusi Uang = 140.000
Sisa Uang (progress bar) = 970.000 - 100.000 - 140.000 = 730.000
Catatan: Zakat Uang Terkumpul ditampilkan di kartu terpisah (tidak dijumlahkan ke Total Pemasukan Uang).
```

**Results:**

- [X] Dashboard matches manual calculation
- [X] All currency formatted correctly (Rp xxx.xxx)

---

### 6.2.2 Warning & Alert Behavior

**Test Case 1: Low Stock Warning**

- [X] Set distribusi close to total pemasukan (> 90%)
- [X] Verify orange/warning color appears
- [X] Verify warning message displayed

**Test Case 2: Over-Distributed (Negative Sisa)**

- [X] Add more distribusi than available stock
- [X] Should show validation error OR
- [X] Dashboard should show negative sisa with red color
- [X] Alert should display

**Expected:** ✅ Warnings show at correct thresholds

---

## 6.3 Overpayment Flow

### 6.3.1 Overpayment Creates Infak Record

**Test Steps:**

1. [X] Go to Data Muzakki → Add Pembayaran
2. [X] Select jenis_zakat = "Uang"
3. [X] Set jumlah jiwa = 2 (Kewajiban = 2 × 50,000 = Rp 100,000)
4. [X] In "Akun Uang" select "Kas"
5. [X] In "Nominal Diterima" enter Rp 150,000 (overpayment Rp 50,000)
6. [X] Submit form
7. [X] Verify confirmation dialog appears showing:
    - Kewajiban: Rp 100,000
    - Diterima: Rp 150,000
    - Selisih: Rp 50,000
    - Message: "Mencatat sebagai Infak/Sedekah"
8. [X] Confirm dialog
9. [X] Check Pemasukan Uang page
    - [X] Should have 1 fitrah record (Rp 100,000)
    - [X] Should have 1 infak record (Rp 50,000)
    - [X] Infak catatan should reference pembayaran_zakat ID
1. [X] Check Dashboard
     - [X] Infak/Sedekah card should increase by Rp 50,000

**Expected:** ✅ Overpayment auto-creates infak record

---

### 6.3.2 Cancel Overpayment Dialog

**Test Steps:**

1. [X] Go to Data Muzakki → Add Pembayaran
2. [X] Enter overpayment scenario (same as above)
3. [X] When confirmation dialog appears, click "Batal"
4. [X] Verify pembayaran NOT saved
5. [X] Check Pemasukan Uang - no new records
6. [X] Verify can edit nominal and resubmit

**Expected:** ✅ Cancel prevents record creation

---

## 6.4 Regression Testing

### 6.4.1 Existing Fitrah Pembayaran (Beras)

**Test Steps:**

- [X] Go to Data Muzakki
- [X] Add pembayaran with jenis_zakat = "Beras"
- [X] Set jumlah jiwa = 3
- [X] Verify auto-calculation: 3 × 2.5 = 7.5 kg
- [X] Save successfully
- [X] Check dashboard - beras stock should increase

**Expected:** ✅ Beras payment flow unchanged

---

### 6.4.2 Mustahik CRUD

**Test Steps:**

- [X] Go to Data Mustahik
- [X] Add new mustahik
- [X] Select kategori from 8 Asnaf dropdown
- [X] Save successfully
- [X] Edit mustahik - should work
- [X] Set status to non-aktif - should work

**Expected:** ✅ Mustahik management works

---

### 6.4.3 Distribusi Zakat

**Test Steps:**

- [X] Go to Distribusi Zakat
- [X] Add distribusi beras to mustahik
- [X] Verify stock validation works
- [X] Add distribusi uang to mustahik
- [X] Check dashboard sisa updates
- [X] Generate bukti terima PDF - should work

**Expected:** ✅ Distribution flow intact

---

## 6.5 Rekonsiliasi Integration

### 6.5.1 Positive Adjustment

**Test Steps:**

1. [X] Note current dashboard sisa uang
2. [X] Go to Settings → Rekonsiliasi
3. [X] Add rekonsiliasi:
    - Jenis: Uang
    - Akun: Kas
    - Jumlah: +100000 (positive)
    - Catatan: "Test adjustment penambahan"
4. [X] Submit
5. [X] Go to Dashboard
6. [X] Verify sisa uang increased by Rp 100,000
7. [X] Check history table - shows green up arrow

**Expected:** ✅ Positive adjustment increases balance

---

### 6.5.2 Negative Adjustment

**Test Steps:**

1. [X] Note current dashboard sisa beras
2. [X] Go to Settings → Rekonsiliasi
3. [X] Add rekonsiliasi:
    - Jenis: Beras
    - Jumlah: -5 (negative)
    - Catatan: "Test adjustment pengurangan"
4. [X] Submit
5. [X] Go to Dashboard
6. [X] Verify sisa beras decreased by 5 kg
7. [X] Check history table - shows red down arrow

**Expected:** ✅ Negative adjustment decreases balance

---

## 6.6 Hak Amil Flow

### Test Steps:

1. [X] Note dashboard Total Pemasukan Uang and Sisa Uang
2. [X] Go to Settings → Hak Amil
3. [X] Select active tahun zakat
4. [X] Current hak amil should display (if exists)
5. [X] Enter new value: Rp 250,000
6. [X] Click "Simpan Hak Amil"
7. [X] Verify success toast
8. [X] Go to Dashboard
9. [X] Progress bar should show:
    - Total Pemasukan: [amount]
    - Hak Amil: Rp 250,000 (deducted)
    - Tersalurkan: [amount]
    - Sisa: Total - Hak Amil - Tersalurkan
1. [X] Verify Sisa calculation correct

**Expected:** ✅ Hak Amil deducted from balance

---

## Summary Checklist

### Critical Path Tests

- [X] Admin can access all features
- [X] Petugas blocked from admin features
- [X] Dashboard calculations accurate
- [X] Overpayment flow works
- [X] Rekonsiliasi adjustments reflect in dashboard
- [X] Hak Amil deduction works
- [X] Existing features (Muzakki, Mustahik, Distribusi) still work

### Bug Tracker

| # | Issue | Severity | Status | Notes |
| - | ----- | -------- | ------ | ----- |
| 1 |       |          |        |       |
| 2 |       |          |        |       |

### Sign-Off

- [X] All critical tests passed
- [X] No blocking bugs found
- [X] Phase 2 features ready for merge
- [X] Documentation updated

**Tested by:** Dimy Ferdiana
**Date:** Jan 11, 2026
**Status:** ⬜ PASS / ~~⬜ FAIL / ⬜ CONDITIONAL PASS~~
