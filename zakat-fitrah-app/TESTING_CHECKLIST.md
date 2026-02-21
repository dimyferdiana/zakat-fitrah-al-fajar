# Manual Testing Checklist - Zakat Fitrah App

**Testing Environment:** Production Build Preview
**URL:** http://localhost:4173
**Date:** December 24, 2025

---

## Prerequisites

- [X] Production build completed successfully
- [X] Preview server running at http://localhost:4173
- [X] Test credentials ready (admin, petugas, viewer)
- [X] Browser DevTools open for console error monitoring

### Quick Automated Regression (Task 10.13)

Run from `zakat-fitrah-app`:

```bash
python3 scripts/test_10_13_last_admin_protection.py
```

Expected pass indicators:
- `last_admin_deactivate_blocked: true`
- `status_last_admin_attempt: 400`
- output contains `Cannot deactivate or demote the last active admin` (`P0001`)

---

## Phase 1: Critical Path Testing (Must Pass)

### 1. Authentication & Authorization ✅ Priority: CRITICAL

#### Test 1.1: Login Flow

- [X] Navigate to http://localhost:4173
- [X] Should redirect to /login
- [X] Enter valid admin credentials
- [X] Click "Login" button
- [X] **Expected:** Redirect to /dashboard (NOT OK: did not redirect)
- [X] **Expected:** No console errors (see notes)
- [ ] **Status:** ❌ Fail (partial)

- **Notes:**
  - Login works, but after login not redirected to dashboard (unexpected)
  - After navigating to Distribusi Zakat page, found error in console: "Uncaught (in promise) Error: Duplicate script ID 'fido2-page-script-registration'"
  - WebAssembly and WASM SDK logs appear, but not blocking
  - Needs investigation for redirect and script error

#### Test 1.2: Session Persistence

- [X] Login successfully
- [X] Refresh page (F5)
- [X] **Expected:** Stay logged in, remain on current page
- [X] **Expected:** User data persists
- [X] **Status:** ✅ Pass

- **Notes:**
  - Pass, no problems found
  - Session persists even after empty cache and hard reload

#### Test 1.3: Logout

- [X] Click user avatar/dropdown
- [X] Click "Logout"
- [X] **Expected:** Redirect to /login
- [X] **Expected:** Cannot access protected routes without login
- [X] **Status:** ✅ Pass

- **Notes:**
  - Yes, redirect to login
  - Yes, cannot access protected routes without login
  - Pass

#### Test 1.4: Role-Based Access Control (RBAC)

- [X] Login as **viewer**
- [X] Navigate to /settings
- [X] **Expected:** Blocked or Settings tab hidden
  - Pass: Viewer only sees Dashboard and Laporan, Settings is hidden/blocked
- [X] Login as **petugas**
- [X] Verify access to Muzakki, Mustahik, Distribusi
- [X] **Expected:** No access to User Management in Settings
  - Pass: Petugas can access Dashboard, Muzakki, Mustahik, Distribusi Zakat, Laporan
  - User Management in Settings is not accessible
- [X] Login as **admin**
- [X] **Expected:** Full access to all routes
- [X] **Status:** ✅ Pass

- **Notes:**
  - Pass: Admin has full access to Dashboard, Muzakki, Mustahik, Distribusi Zakat, Laporan, Settings, and User Management
  - All features and routes are accessible as expected

---

### 2. Navigation & Routing ✅ Priority: HIGH

#### Test 2.1: All Routes Accessible

- [X] Click "Dashboard" - loads successfully
- [X] Click "Muzakki" - loads successfully
- [X] Click "Mustahik" - loads successfully
- [X] Click "Distribusi" - loads successfully
- [X] Click "Laporan" - loads successfully
- [X] Click "Settings" - loads successfully (admin only)
- [X] **Expected:** Each page loads without errors
- [X] **Expected:** URL updates correctly
- [X] **Status:** ✅ Pass

- **Notes:**
  - All routes loaded successfully as petugas and admin
  - No errors in console

#### Test 2.2: Browser Back/Forward

- [X] Navigate: Dashboard → Muzakki → Mustahik
- [X] Click browser Back button twice
- [X] **Expected:** Returns to Dashboard
- [X] Click browser Forward button
- [X] **Expected:** Navigates forward correctly
- [X] **Status:** ✅ Pass

- **Notes:**
  - Browser back/forward navigation worked correctly

---

### 3. Dashboard Display ✅ Priority: HIGH

#### Test 3.1: Data Display

- [X] Navigate to Dashboard
- [X] **Expected:** 6 stat cards display with data
  - Total Pemasukan Beras
  - Total Pemasukan Uang
  - Total Muzakki
  - Total Mustahik
  - Total Distribusi
  - Sisa Zakat
- [X] **Expected:** Chart displays monthly data
- [X] **Expected:** Progress bars show distribusi vs pemasukan
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 3.2: Tahun Filter

- [X] Select different year from dropdown
- [X] **Expected:** All data updates to show selected year
- [X] **Expected:** No console errors
- [X] **Status:** ✅ Pass

- **Notes:**

---

### 4. Muzakki Management (CRUD) ✅ Priority: CRITICAL

#### Test 4.1: Create New Pembayaran

- [X] Navigate to Muzakki page
- [X] Click "Tambah Pembayaran" button
- [X] Fill form:
  - Nama KK: "Test Muzakki 1"
  - Alamat: "Jl. Test No. 123"
  - No. Telp: "081234567890"
  - Jumlah Jiwa: 4
  - Jenis Zakat: Beras
- [X] **Expected:** Auto-calculate total (4 × nilai per orang)
- [X] **Expected:** Total displays correctly formatted
- [X] Click "Simpan"
- [X] **Expected:** Success toast notification
- [X] **Expected:** New entry appears in table
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 4.2: Edit Pembayaran

- [X] Click "Edit" on existing pembayaran
- [X] **Expected:** Form pre-fills with existing data
- [X] Change Jumlah Jiwa to different number
- [X] **Expected:** Total recalculates automatically
- [X] Click "Update"
- [X] **Expected:** Success toast
- [X] **Expected:** Table updates with new data
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 4.3: Delete Pembayaran

- [X] Click "Delete" on a test pembayaran
- [X] **Expected:** Confirmation dialog appears
- [X] Click "Cancel"
- [X] **Expected:** Dialog closes, no deletion
- [X] Click "Delete" again, confirm
- [X] **Expected:** Success toast
- [X] **Expected:** Entry removed from table
- [X] **Status:** ✅ Pass / ❌ Fail

- **Notes:**

#### Test 4.4: Search & Filter

- [ ] Enter search term in search box
- [ ] **Expected:** Table filters results (debounced)
- [X] Select "Beras" from Jenis Zakat filter
- [X] **Expected:** Only beras entries shown
- [X] Clear filters
- [X] **Expected:** All entries return
- [ ] **Status:** ❌ Fail

- **Notes: failed to search**

#### Test 4.5: Print Bukti Pembayaran

- [ ] Click "Print" button on any pembayaran
- [ ] **Expected:** PDF generates and downloads
- [ ] Open PDF
- [ ] **Expected:** Contains correct data, formatted properly
- [ ] **Expected:** Has header, body, footer with signature area
- [ ] **Status:** ❌ Fail

- **Notes: failed to generate print, the page hasn't load completely like pdf version**

---

### 5. Mustahik Management ✅ Priority: HIGH

#### Test 5.1: Create Mustahik

- [X] Navigate to Mustahik page
- [X] Click "Tambah Mustahik"
- [X] Fill form:
  - Nama: "Test Mustahik 1"
  - Alamat: "Jl. Mustahik No. 456"
  - Kategori: Fakir
  - Jumlah Anggota: 3
  - No. Telp: "082345678901"
  - Catatan: "Test catatan"
- [X] Click "Simpan"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Appears in table with status "Aktif"
- [ ] **Status:** ❌ Fail

- **Notes: console error**

#### Test 5.2: Bulk Operations

- [X] Select multiple mustahik checkboxes
- [X] Click "Nonaktifkan Semua"
- [X] **Expected:** Confirmation dialog
- [X] Confirm
- [X] **Expected:** Selected mustahik status → Non-aktif
- [X] Click "Aktifkan Semua"
- [X] **Expected:** Selected mustahik status → Aktif
- [X] **Status:** ✅ Pass

- **Notes: succeed to bulk action**

#### Test 5.3: Import Data Tahun Lalu

- [X] Click "Import Data Tahun Lalu" button
- [X] **Expected:** Dialog shows previous year mustahik list
- [X] Select some mustahik to import
- [X] Click "Import"
- [ ] **Expected:** Selected mustahik copied to current year
- [ ] **Expected:** Badge "Data Lama" appears on imported entries
- [ ] **Status:** ❌ Fail

- **Notes:**

#### Test 5.4: Filter by Kategori & Status

- [X] Select kategori filter (e.g., "Fakir")
- [X] **Expected:** Only Fakir mustahik shown
- [X] Select status filter "Non-aktif"
- [X] **Expected:** Only non-aktif mustahik shown
- [X] **Status:** ✅ Pass

- **Notes:**

---

### 6. Distribusi Zakat ✅ Priority: CRITICAL

#### Test 6.1: Create Distribusi with Sufficient Stock

- [X] Navigate to Distribusi page
- [X] Click "Tambah Distribusi"
- [X] Select Mustahik from dropdown
- [X] **Expected:** Mustahik details display (kategori, alamat, anggota)
- [X] Select Jenis: Beras
- [X] Enter Jumlah: 2.5
- [X] **Expected:** Sisa stok displays updated value
- [X] **Expected:** No warning alert
- [X] Click "Simpan"
- [X] **Expected:** Success toast
- [X] **Expected:** New distribusi appears with status "Pending"
- [X] **Status:** ✅ Pass

- **Notes: no issue**

#### Test 6.2: Stock Validation (Insufficient Stock)

- [X] Click "Tambah Distribusi"
- [X] Select Jenis: Beras
- [X] Enter Jumlah: 99999 (more than available stock)
- [X] **Expected:** Red alert appears: "Stok tidak mencukupi!"
- [X] **Expected:** Cannot submit form
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 6.3: Update Status to Selesai

- [X] Find distribusi with status "Pending"
- [X] Click "Tandai Selesai"
- [X] **Expected:** Confirmation dialog
- [X] Confirm
- [X] **Expected:** Status updates to "Selesai" (green badge)
- [X] **Expected:** Success toast
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 6.4: Print Bukti Terima

- [X] Click "Print Bukti" on any distribusi
- [ ] **Expected:** PDF generates and downloads
- [ ] Open PDF
- [ ] **Expected:** Contains mustahik data, jumlah, date, signature area
- [ ] **Status:** ❌ Fail

- **Notes:failed to print, only download pdf works**

---

### 7. Laporan & Export ✅ Priority: HIGH

#### Test 7.1: Laporan Pemasukan

- [X] Navigate to Laporan page
- [X] Click "Pemasukan" tab
- [X] **Expected:** Summary cards show totals (Beras, Uang, Muzakki count)
- [X] **Expected:** Detailed table shows all pembayaran
- [X] Click "Export PDF"
- [ ] **Expected:** PDF downloads with formatted report
- [ ] Open PDF, verify data accuracy
- [X] Click "Export Excel"
- [ ] **Expected:** Excel file downloads
- [ ] Open Excel, verify data and formatting
- [ ] **Status:** ❌ Fail

- **Notes:failed to export pdf and excel**

#### Test 7.2: Laporan Distribusi

- [X] Click "Distribusi" tab
- [X] **Expected:** Summary per kategori (8 asnaf breakdown)
- [X] **Expected:** Detailed table with all distribusi
- [X] Test PDF export
- [X] Test Excel export
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 7.3: Laporan Mustahik

- [X] Click "Mustahik" tab
- [X] **Expected:** List grouped by kategori
- [X] **Expected:** Shows aktif vs non-aktif counts
- [X] Test PDF export
- [X] Test Excel export
- [X] **Status:** ✅ Pass

- **Notes: all success**

#### Test 7.4: Perbandingan Tahun

- [X] Click "Perbandingan Tahun" tab
- [X] Select 2 or 3 years to compare
- [X] **Expected:** Comparison table shows Pemasukan, Distribusi, Sisa per year
- [X] **Expected:** YoY growth percentage with up/down indicators
- [X] **Status:** ✅ Pass

- **Notes: all success**

---

### 8. Settings ✅ Priority: MEDIUM (Admin Only)

#### Test 8.1: Nilai Zakat Configuration

- [X] Navigate to Settings
- [X] Click "Nilai Zakat" tab
- [X] Click "Tambah Tahun Zakat"
- [X] Fill form:
  - Tahun Hijriah: "1447 H"
  - Tahun Masehi: 2026
  - Nilai Beras: 3.5
  - Nilai Uang: 50000
  - Is Active: true
- [X] **Expected:** Validation ensures only 1 active year
- [X] Click "Simpan"
- [X] **Expected:** New year appears in table
- [X] **Expected:** Previous active year auto-deactivated
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 8.2: User Management

- [X] Click "User Management" tab
- [X] **Expected:** Only visible to admin
- [X] Click "Tambah User"
- [X] Fill form:
  - Nama: "Test User"
  - Email: "testuser@example.com"
  - Role: Petugas
  - Is Active: true
- [X] Click "Simpan"
- [ ] **Expected:** User created, invitation email sent (Supabase)
- [ ] **Status:** ❌ Fail

- **Notes:**

---

## Phase 2: Edge Cases & Error Handling

### 9. Form Validation ✅ Priority: MEDIUM

#### Test 9.1: Required Field Validation

- [X] Try submitting Muzakki form with empty Nama KK
- [X] **Expected:** Validation error: "Nama KK wajib diisi"
- [X] **Expected:** Form doesn't submit
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 9.2: Invalid Input

- [X] Enter negative number in Jumlah Jiwa
- [X] **Expected:** Validation error: "Minimal 1 jiwa"
- [X] Enter invalid email format in User Management
- [X] **Expected:** Validation error
- [X] **Status:** ✅ Pass

- **Notes: i tried to add 123, it appeared error (this would be new rule addition, since in the reality, the distribution might collective 1x distribution to more than 1 KK)**

#### Test 9.3: Max Length Validation

- [X] Enter very long text (500+ chars) in Alamat
- [X] **Expected:** Handles gracefully (truncate or textarea scroll)
- [ ] **Status:** ❌ Fail

- **Notes: has no validation, failed to prevent more than 500+ char input for Alamat**

---

### 10. Responsive Design ✅ Priority: HIGH

#### Test 10.1: Mobile View (375px width)

- [X] Open DevTools (F12)
- [X] Set device toolbar to iPhone SE (375×667)
- [X] Navigate all pages
- [X] **Expected:** Sidebar collapses to hamburger menu
- [X] **Expected:** Tables are scrollable horizontally
- [X] **Expected:** Forms stack vertically
- [X] **Expected:** All buttons clickable (not too small)
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 10.2: Tablet View (768px width)

- [X] Set viewport to iPad (768×1024)
- [X] Navigate all pages
- [X] **Expected:** Layout adjusts appropriately
- [X] **Expected:** No horizontal scroll
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 10.3: Desktop View (1920px width)

- [X] Set viewport to 1920×1080
- [X] **Expected:** Content doesn't stretch too wide
- [X] **Expected:** Proper spacing and alignment
- [X] **Status:** ✅ Pass

- **Notes:**

---

### 11. Performance & Loading States ✅ Priority: MEDIUM

#### Test 11.1: Initial Load

- [X] Clear browser cache (Ctrl+Shift+Delete)
- [X] Navigate to http://localhost:4173
- [X] **Expected:** Page loads within 3 seconds
- [X] **Expected:** Loading spinners show during data fetch
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 11.2: Lazy Loading Routes

- [X] Monitor Network tab (DevTools)
- [X] Navigate Dashboard → Muzakki → Mustahik
- [X] **Expected:** Each route loads separate JS chunk
- [X] **Expected:** No unnecessary downloads
- [X] **Status:** ✅ Pass

- **Notes:**

#### Test 11.3: Large Dataset Performance

- [X] Add 50+ muzakki payments
- [X] Navigate to Muzakki page
- [X] **Expected:** Pagination works (20 items per page)
- [X] **Expected:** Search remains responsive
- [X] **Status:** ✅ Pass

- **Notes:**

---

### 12. Error Scenarios ✅ Priority: MEDIUM

#### Test 12.1: Network Error Handling

- [X] Open DevTools → Network tab
- [X] Set throttling to "Offline"
- [X] Try to load Dashboard
- [ ] **Expected:** Error message displays
- [ ] **Expected:** Graceful fallback (not white screen)
- [ ] Re-enable network
- [ ] **Expected:** Data loads when connection restored
- [ ] **Status:** ❌ Fail

- **Notes: no message, blank page**

#### Test 12.2: Console Errors

- [X] Open DevTools Console
- [X] Navigate all pages and perform all major actions
- [ ] **Expected:** No React errors
- [ ] **Expected:** No unhandled promise rejections
- [ ] **Expected:** No CORS errors
- [ ] **Status:** ❌ Fail

- **Notes: still found some error console, i don't understand about cors errors**

---

## Phase 3: Browser Compatibility

### 13. Cross-Browser Testing ✅ Priority: MEDIUM

#### Test 13.1: Chrome (Latest)

- [X] Test all critical paths in Chrome
- [X] **Status:** ✅ Pass

- **Notes: no issue while performing the UI, except some function who wrote in qa-testing-findings.md**

#### Test 13.2: Firefox (Latest)

- [ ] Test all critical paths in Firefox
- [ ] **Status:** ✅ Pass / ❌ Fail

- **Notes:**

#### Test 13.3: Edge (Latest)

- [ ] Test all critical paths in Edge
- [ ] **Status:** ✅ Pass / ❌ Fail

- **Notes:**

#### Test 13.4: Safari (if available)

- [X] Test all critical paths in Safari
- [X] **Status:** ✅ Pass

- **Notes: no issue while performing the UI, except some function who wrote in qa-testing-findings.md**

---

## Test Summary

**Total Tests:** 60+
**Passed:** 45+ ✅
**Failed:** 10 ❌
**Blocked:** 0

**Overall Status:** 🟡 MAJOR BUGS FOUND - Cannot deploy to production until critical issues resolved

**Detailed Findings:** See [tasks/qa-testing-findings.md](../tasks/qa-testing-findings.md) for complete bug reports

---

### Critical Bugs Found - FIXED ✅

1. ✅ **FIXED** - Laporan page crash: `Cannot read properties of null (reading 'toFixed')`

   - **Error Location:** LaporanPemasukan.tsx, LaporanDistribusi.tsx, PerbandinganTahun.tsx
   - **Root Cause:** `formatNumber()` and `calculateGrowth()` functions calling `.toFixed()` on null/undefined values
   - **Fix Applied:** Added null/undefined checks: `if (value == null || isNaN(value)) return '0.00'`
   - **Status:** Fixed in build, ready for testing
   - **Files Modified:**
     - src/components/laporan/LaporanPemasukan.tsx
     - src/components/laporan/LaporanDistribusi.tsx
     - src/components/laporan/PerbandinganTahun.tsx
2. ✅ **FIXED** - Perbandingan Tahun shows misleading 0% growth

   - **Error Location:** PerbandinganTahun.tsx - Growth indicator showing 0% when comparing from 0 to positive values
   - **Root Cause:** `calculateGrowth()` returns 0 when previous year is 0, can't calculate percentage from zero
   - **User Report:** "I'm not sure is it correct or no? Shows 0% growth from 2024 (no data) to 2025 (has data)"
   - **Fix Applied:**
     - Return special value (999999) when previous=0 and current>0
     - Display **"Data Baru"** badge (blue color) instead of misleading "0%"
     - Properly handles: no data → data, data → data, no change
   - **Status:** Fixed in build v2, ready for re-testing
   - **Files Modified:** src/components/laporan/PerbandinganTahun.tsx

---

### Critical Bugs Found - NEW ISSUES ⚠️

**🔥 BUG #3: CRITICAL BLOCKER - Cannot Create Mustahik (Database Schema Error)**

- **Tests Failed:** Test 5.1, Test 5.3
- **Priority:** CRITICAL - BLOCKS PRODUCTION DEPLOYMENT
- **Root Cause:** Missing `is_data_lama` column in `mustahik` table
- **Impact:**
  - Cannot create new mustahik recipients
  - Cannot import data from previous years
  - Blocks all distribusi functionality (depends on mustahik data)
- **Fix Required:** Database migration to add missing column
- **Details:** See [Bug #3 in qa-testing-findings.md](../tasks/qa-testing-findings.md#bug-3-create-mustahik-fails---missing-database-column)

---

### High Priority Bugs Found 🔴

**BUG #1: Search Filter in Muzakki Page Fails**

- **Test Failed:** Test 4.4
- **Status:** ✅ Code Fixed (Pending Rebuild)
- **Root Cause:** Invalid Supabase query syntax for joined table filtering
- **Impact:** Users cannot search pembayaran by name or address
- **Details:** See [Bug #1 in qa-testing-findings.md](../tasks/qa-testing-findings.md#bug-1-search-filter-in-muzakki-page-fails)

**BUG #2: Print PDF Functions Incomplete/Broken**

- **Tests Failed:** Test 4.5 (Print Bukti Pembayaran), Test 6.4 (Print Bukti Terima), Test 7.1 (Export PDF)
- **Status:** ⏳ Needs Investigation
- **Root Cause:** PDF generation incomplete or malformed
- **Impact:** Cannot print official receipts and reports
- **Details:** See [Bug #2 in qa-testing-findings.md](../tasks/qa-testing-findings.md#bug-2-print-bukti-pembayaran-function-incomplete)

**BUG #4: User Management - Cannot Add New Users**

- **Test Failed:** Test 8.2
- **Status:** ⏳ Needs Investigation
- **Root Cause:** Form NaN error + Supabase email validation issue
- **Impact:** Cannot onboard new users through UI (workaround: Supabase Dashboard)
- **Details:** See [Bug #4 in qa-testing-findings.md](../tasks/qa-testing-findings.md#bug-4-user-management---cannot-add-new-users)

---

### Medium Priority Issues 🟡

1. **Test 9.3: No Max Length Validation for Alamat Field**

   - **Issue:** Text fields (Alamat) accept 500+ characters without validation
   - **Impact:** Potential database overflow, UI layout issues
   - **Recommendation:** Add maxLength validation (e.g., 255 chars) to address fields
2. **Test 12.1: Network Error Handling - Blank Page**

   - **Issue:** When offline, app shows blank page instead of error message
   - **Impact:** Poor user experience, unclear why app isn't loading
   - **Recommendation:** Add offline detection and graceful error message
3. **Test 12.2: Console Errors Still Present**

   - **Issue:** Various console errors during navigation and actions
   - **Impact:** Potential hidden bugs, not user-facing but needs cleanup
   - **Recommendation:** Review and fix all console errors before production

---

### Low Priority / Enhancements 💡

1. **Test 9.2: Jumlah Jiwa Validation Enhancement**

   - **Note:** "123" input shows error - good validation
   - **Enhancement Idea:** Consider allowing collective distribution (1 distribution to multiple KK)
   - **Business Discussion:** Confirm if real-world use case exists
2. **Test 1.1: Post-Login Redirect Issue**

   - **Issue:** Login works but doesn't auto-redirect to dashboard
   - **Impact:** Minor UX issue, user can manually navigate
   - **Status:** Non-blocking, but should be fixed for polish
3. **Test 7.1: Export PDF/Excel Not Fully Tested**

   - **Note:** Related to Bug #2, need comprehensive testing after fix
   - **Recommendation:** Create test data and verify all export formats

---

## Next Steps

- [ ] Fix all critical and high-priority bugs
- [ ] Re-test fixed issues
- [ ] Document known limitations
- [ ] Update DEPLOYMENT.md with any findings
- [ ] Mark Task 12.0 as complete
- [ ] Proceed to Task 11.9 (Vercel Deployment - Phase 3)

---

**Tester:** Dimy Ferdiana
**Date Completed:** Jan 10, 2026
**Sign-off:** Signed by Dimy
