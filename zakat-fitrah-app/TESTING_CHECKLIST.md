# Manual Testing Checklist - Zakat Fitrah App

**Testing Environment:** Production Build Preview  
**URL:** http://localhost:4173  
**Date:** December 24, 2025

---

## Prerequisites

- [x] Production build completed successfully
- [x] Preview server running at http://localhost:4173
- [ ] Test credentials ready (admin, petugas, viewer)
- [ ] Browser DevTools open for console error monitoring

---

## Phase 1: Critical Path Testing (Must Pass)

### 1. Authentication & Authorization ✅ Priority: CRITICAL

#### Test 1.1: Login Flow
- [x] Navigate to http://localhost:4173
- [x] Should redirect to /login
- [x] Enter valid admin credentials
- [x] Click "Login" button
- [ ] **Expected:** Redirect to /dashboard (NOT OK: did not redirect)
- [x] **Expected:** No console errors (see notes)
- [ ] **Status:** ❌ Fail (partial)
- **Notes:**
  - Login works, but after login not redirected to dashboard (unexpected)
  - After navigating to Distribusi Zakat page, found error in console: "Uncaught (in promise) Error: Duplicate script ID 'fido2-page-script-registration'"
  - WebAssembly and WASM SDK logs appear, but not blocking
  - Needs investigation for redirect and script error

#### Test 1.2: Session Persistence
- [x] Login successfully
- [x] Refresh page (F5)
- [x] **Expected:** Stay logged in, remain on current page
- [x] **Expected:** User data persists
- [x] **Status:** ✅ Pass
- **Notes:**
  - Pass, no problems found
  - Session persists even after empty cache and hard reload

#### Test 1.3: Logout
- [x] Click user avatar/dropdown
- [x] Click "Logout"
- [x] **Expected:** Redirect to /login
- [x] **Expected:** Cannot access protected routes without login
- [x] **Status:** ✅ Pass
- **Notes:**
  - Yes, redirect to login
  - Yes, cannot access protected routes without login
  - Pass

#### Test 1.4: Role-Based Access Control (RBAC)
- [x] Login as **viewer**
- [x] Navigate to /settings
- [x] **Expected:** Blocked or Settings tab hidden
  - Pass: Viewer only sees Dashboard and Laporan, Settings is hidden/blocked
- [x] Login as **petugas**
- [x] Verify access to Muzakki, Mustahik, Distribusi
- [x] **Expected:** No access to User Management in Settings
  - Pass: Petugas can access Dashboard, Muzakki, Mustahik, Distribusi Zakat, Laporan
  - User Management in Settings is not accessible
- [x] Login as **admin**
- [x] **Expected:** Full access to all routes
- [x] **Status:** ✅ Pass
- **Notes:**
  - Pass: Admin has full access to Dashboard, Muzakki, Mustahik, Distribusi Zakat, Laporan, Settings, and User Management
  - All features and routes are accessible as expected

---

### 2. Navigation & Routing ✅ Priority: HIGH

#### Test 2.1: All Routes Accessible
- [x] Click "Dashboard" - loads successfully
- [x] Click "Muzakki" - loads successfully
- [x] Click "Mustahik" - loads successfully
- [x] Click "Distribusi" - loads successfully
- [x] Click "Laporan" - loads successfully
- [x] Click "Settings" - loads successfully (admin only)
- [x] **Expected:** Each page loads without errors
- [x] **Expected:** URL updates correctly
- [x] **Status:** ✅ Pass
- **Notes:**
  - All routes loaded successfully as petugas and admin
  - No errors in console

#### Test 2.2: Browser Back/Forward
- [x] Navigate: Dashboard → Muzakki → Mustahik
- [x] Click browser Back button twice
- [x] **Expected:** Returns to Dashboard
- [x] Click browser Forward button
- [x] **Expected:** Navigates forward correctly
- [x] **Status:** ✅ Pass
- **Notes:**
  - Browser back/forward navigation worked correctly

---

### 3. Dashboard Display ✅ Priority: HIGH

#### Test 3.1: Data Display
- [ ] Navigate to Dashboard
- [ ] **Expected:** 6 stat cards display with data
  - Total Pemasukan Beras
  - Total Pemasukan Uang
  - Total Muzakki
  - Total Mustahik
  - Total Distribusi
  - Sisa Zakat
- [ ] **Expected:** Chart displays monthly data
- [ ] **Expected:** Progress bars show distribusi vs pemasukan
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 3.2: Tahun Filter
- [ ] Select different year from dropdown
- [ ] **Expected:** All data updates to show selected year
- [ ] **Expected:** No console errors
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 4. Muzakki Management (CRUD) ✅ Priority: CRITICAL

#### Test 4.1: Create New Pembayaran
- [ ] Navigate to Muzakki page
- [ ] Click "Tambah Pembayaran" button
- [ ] Fill form:
  - Nama KK: "Test Muzakki 1"
  - Alamat: "Jl. Test No. 123"
  - No. Telp: "081234567890"
  - Jumlah Jiwa: 4
  - Jenis Zakat: Beras
- [ ] **Expected:** Auto-calculate total (4 × nilai per orang)
- [ ] **Expected:** Total displays correctly formatted
- [ ] Click "Simpan"
- [ ] **Expected:** Success toast notification
- [ ] **Expected:** New entry appears in table
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 4.2: Edit Pembayaran
- [ ] Click "Edit" on existing pembayaran
- [ ] **Expected:** Form pre-fills with existing data
- [ ] Change Jumlah Jiwa to different number
- [ ] **Expected:** Total recalculates automatically
- [ ] Click "Update"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Table updates with new data
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 4.3: Delete Pembayaran
- [ ] Click "Delete" on a test pembayaran
- [ ] **Expected:** Confirmation dialog appears
- [ ] Click "Cancel"
- [ ] **Expected:** Dialog closes, no deletion
- [ ] Click "Delete" again, confirm
- [ ] **Expected:** Success toast
- [ ] **Expected:** Entry removed from table
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 4.4: Search & Filter
- [ ] Enter search term in search box
- [ ] **Expected:** Table filters results (debounced)
- [ ] Select "Beras" from Jenis Zakat filter
- [ ] **Expected:** Only beras entries shown
- [ ] Clear filters
- [ ] **Expected:** All entries return
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 4.5: Print Bukti Pembayaran
- [ ] Click "Print" button on any pembayaran
- [ ] **Expected:** PDF generates and downloads
- [ ] Open PDF
- [ ] **Expected:** Contains correct data, formatted properly
- [ ] **Expected:** Has header, body, footer with signature area
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 5. Mustahik Management ✅ Priority: HIGH

#### Test 5.1: Create Mustahik
- [ ] Navigate to Mustahik page
- [ ] Click "Tambah Mustahik"
- [ ] Fill form:
  - Nama: "Test Mustahik 1"
  - Alamat: "Jl. Mustahik No. 456"
  - Kategori: Fakir
  - Jumlah Anggota: 3
  - No. Telp: "082345678901"
  - Catatan: "Test catatan"
- [ ] Click "Simpan"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Appears in table with status "Aktif"
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 5.2: Bulk Operations
- [ ] Select multiple mustahik checkboxes
- [ ] Click "Nonaktifkan Semua"
- [ ] **Expected:** Confirmation dialog
- [ ] Confirm
- [ ] **Expected:** Selected mustahik status → Non-aktif
- [ ] Click "Aktifkan Semua"
- [ ] **Expected:** Selected mustahik status → Aktif
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 5.3: Import Data Tahun Lalu
- [ ] Click "Import Data Tahun Lalu" button
- [ ] **Expected:** Dialog shows previous year mustahik list
- [ ] Select some mustahik to import
- [ ] Click "Import"
- [ ] **Expected:** Selected mustahik copied to current year
- [ ] **Expected:** Badge "Data Lama" appears on imported entries
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 5.4: Filter by Kategori & Status
- [ ] Select kategori filter (e.g., "Fakir")
- [ ] **Expected:** Only Fakir mustahik shown
- [ ] Select status filter "Non-aktif"
- [ ] **Expected:** Only non-aktif mustahik shown
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 6. Distribusi Zakat ✅ Priority: CRITICAL

#### Test 6.1: Create Distribusi with Sufficient Stock
- [ ] Navigate to Distribusi page
- [ ] Click "Tambah Distribusi"
- [ ] Select Mustahik from dropdown
- [ ] **Expected:** Mustahik details display (kategori, alamat, anggota)
- [ ] Select Jenis: Beras
- [ ] Enter Jumlah: 2.5
- [ ] **Expected:** Sisa stok displays updated value
- [ ] **Expected:** No warning alert
- [ ] Click "Simpan"
- [ ] **Expected:** Success toast
- [ ] **Expected:** New distribusi appears with status "Pending"
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 6.2: Stock Validation (Insufficient Stock)
- [ ] Click "Tambah Distribusi"
- [ ] Select Jenis: Beras
- [ ] Enter Jumlah: 99999 (more than available stock)
- [ ] **Expected:** Red alert appears: "Stok tidak mencukupi!"
- [ ] **Expected:** Cannot submit form
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 6.3: Update Status to Selesai
- [ ] Find distribusi with status "Pending"
- [ ] Click "Tandai Selesai"
- [ ] **Expected:** Confirmation dialog
- [ ] Confirm
- [ ] **Expected:** Status updates to "Selesai" (green badge)
- [ ] **Expected:** Success toast
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 6.4: Print Bukti Terima
- [ ] Click "Print Bukti" on any distribusi
- [ ] **Expected:** PDF generates and downloads
- [ ] Open PDF
- [ ] **Expected:** Contains mustahik data, jumlah, date, signature area
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 7. Laporan & Export ✅ Priority: HIGH

#### Test 7.1: Laporan Pemasukan
- [ ] Navigate to Laporan page
- [ ] Click "Pemasukan" tab
- [ ] **Expected:** Summary cards show totals (Beras, Uang, Muzakki count)
- [ ] **Expected:** Detailed table shows all pembayaran
- [ ] Click "Export PDF"
- [ ] **Expected:** PDF downloads with formatted report
- [ ] Open PDF, verify data accuracy
- [ ] Click "Export Excel"
- [ ] **Expected:** Excel file downloads
- [ ] Open Excel, verify data and formatting
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 7.2: Laporan Distribusi
- [ ] Click "Distribusi" tab
- [ ] **Expected:** Summary per kategori (8 asnaf breakdown)
- [ ] **Expected:** Detailed table with all distribusi
- [ ] Test PDF export
- [ ] Test Excel export
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 7.3: Laporan Mustahik
- [ ] Click "Mustahik" tab
- [ ] **Expected:** List grouped by kategori
- [ ] **Expected:** Shows aktif vs non-aktif counts
- [ ] Test PDF export
- [ ] Test Excel export
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 7.4: Perbandingan Tahun
- [ ] Click "Perbandingan Tahun" tab
- [ ] Select 2 or 3 years to compare
- [ ] **Expected:** Comparison table shows Pemasukan, Distribusi, Sisa per year
- [ ] **Expected:** YoY growth percentage with up/down indicators
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 8. Settings ✅ Priority: MEDIUM (Admin Only)

#### Test 8.1: Nilai Zakat Configuration
- [ ] Navigate to Settings
- [ ] Click "Nilai Zakat" tab
- [ ] Click "Tambah Tahun Zakat"
- [ ] Fill form:
  - Tahun Hijriah: "1447 H"
  - Tahun Masehi: 2026
  - Nilai Beras: 3.5
  - Nilai Uang: 50000
  - Is Active: true
- [ ] **Expected:** Validation ensures only 1 active year
- [ ] Click "Simpan"
- [ ] **Expected:** New year appears in table
- [ ] **Expected:** Previous active year auto-deactivated
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 8.2: User Management
- [ ] Click "User Management" tab
- [ ] **Expected:** Only visible to admin
- [ ] Click "Tambah User"
- [ ] Fill form:
  - Nama: "Test User"
  - Email: "testuser@example.com"
  - Role: Petugas
  - Is Active: true
- [ ] Click "Simpan"
- [ ] **Expected:** User created, invitation email sent (Supabase)
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

## Phase 2: Edge Cases & Error Handling

### 9. Form Validation ✅ Priority: MEDIUM

#### Test 9.1: Required Field Validation
- [ ] Try submitting Muzakki form with empty Nama KK
- [ ] **Expected:** Validation error: "Nama KK wajib diisi"
- [ ] **Expected:** Form doesn't submit
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 9.2: Invalid Input
- [ ] Enter negative number in Jumlah Jiwa
- [ ] **Expected:** Validation error: "Minimal 1 jiwa"
- [ ] Enter invalid email format in User Management
- [ ] **Expected:** Validation error
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 9.3: Max Length Validation
- [ ] Enter very long text (500+ chars) in Alamat
- [ ] **Expected:** Handles gracefully (truncate or textarea scroll)
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 10. Responsive Design ✅ Priority: HIGH

#### Test 10.1: Mobile View (375px width)
- [ ] Open DevTools (F12)
- [ ] Set device toolbar to iPhone SE (375×667)
- [ ] Navigate all pages
- [ ] **Expected:** Sidebar collapses to hamburger menu
- [ ] **Expected:** Tables are scrollable horizontally
- [ ] **Expected:** Forms stack vertically
- [ ] **Expected:** All buttons clickable (not too small)
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 10.2: Tablet View (768px width)
- [ ] Set viewport to iPad (768×1024)
- [ ] Navigate all pages
- [ ] **Expected:** Layout adjusts appropriately
- [ ] **Expected:** No horizontal scroll
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 10.3: Desktop View (1920px width)
- [ ] Set viewport to 1920×1080
- [ ] **Expected:** Content doesn't stretch too wide
- [ ] **Expected:** Proper spacing and alignment
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 11. Performance & Loading States ✅ Priority: MEDIUM

#### Test 11.1: Initial Load
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Navigate to http://localhost:4173
- [ ] **Expected:** Page loads within 3 seconds
- [ ] **Expected:** Loading spinners show during data fetch
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 11.2: Lazy Loading Routes
- [ ] Monitor Network tab (DevTools)
- [ ] Navigate Dashboard → Muzakki → Mustahik
- [ ] **Expected:** Each route loads separate JS chunk
- [ ] **Expected:** No unnecessary downloads
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 11.3: Large Dataset Performance
- [ ] Add 50+ muzakki payments
- [ ] Navigate to Muzakki page
- [ ] **Expected:** Pagination works (20 items per page)
- [ ] **Expected:** Search remains responsive
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

### 12. Error Scenarios ✅ Priority: MEDIUM

#### Test 12.1: Network Error Handling
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Try to load Dashboard
- [ ] **Expected:** Error message displays
- [ ] **Expected:** Graceful fallback (not white screen)
- [ ] Re-enable network
- [ ] **Expected:** Data loads when connection restored
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 12.2: Console Errors
- [ ] Open DevTools Console
- [ ] Navigate all pages and perform all major actions
- [ ] **Expected:** No React errors
- [ ] **Expected:** No unhandled promise rejections
- [ ] **Expected:** No CORS errors
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

## Phase 3: Browser Compatibility

### 13. Cross-Browser Testing ✅ Priority: MEDIUM

#### Test 13.1: Chrome (Latest)
- [ ] Test all critical paths in Chrome
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 13.2: Firefox (Latest)
- [ ] Test all critical paths in Firefox
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 13.3: Edge (Latest)
- [ ] Test all critical paths in Edge
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

#### Test 13.4: Safari (if available)
- [ ] Test all critical paths in Safari
- [ ] **Status:** ✅ Pass / ❌ Fail
- **Notes:**

---

## Test Summary

**Total Tests:** 60+  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___

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

3. 

### High Priority Bugs Found
1. 
2. 
3. 

### Medium Priority Issues
1. 
2. 
3. 

### Low Priority / Enhancements
1. 
2. 
3. 

---

## Next Steps

- [ ] Fix all critical and high-priority bugs
- [ ] Re-test fixed issues
- [ ] Document known limitations
- [ ] Update DEPLOYMENT.md with any findings
- [ ] Mark Task 12.0 as complete
- [ ] Proceed to Task 11.9 (Vercel Deployment - Phase 3)

---

**Tester:** _________________  
**Date Completed:** _________________  
**Sign-off:** _________________
