# Dashboard Progress Sections Assessment

## Overview
The Dashboard currently displays two "Progress Distribusi" sections (for Beras and Uang) that are **STILL RELEVANT** but require understanding of how Hak Amil integrates into the calculations.

---

## 1. Current State Analysis

### Progress Distribusi Beras Section
- **Status**: ✅ RELEVANT
- **Calculation**: 
  - Shows: Total Pemasukan → Tersalurkan → Sisa
  - `sisa = totalPemasukan - totalDistribusi`
  - **No Hak Amil involvement** (Beras has 0% hak amil by default)

### Progress Distribusi Uang Section
- **Status**: ✅ RELEVANT (with awareness of Hak Amil)
- **Calculation**:
  - Shows: Total Pemasukan (Uang) → Hak Amil (if > 0) → Tersalurkan → Sisa
  - `sisa = totalPemasukanUangRp - hakAmilUangRp - totalDistribusiUangRp`
  - **Hak Amil IS involved** - it reduces the amount available for distribution
  - Formula: `sisaUangAfterAmilRp` = Amount left after setting aside hak amil

### Hak Amil Dashboard Card
- **Status**: ✅ Present and Functional
- **Display**: Shows monthly summary of Hak Amil breakdown by category
- **Data**: Shows Bruto → Rekonsiliasi → Neto → Percentage → Nominal Hak Amil
- **Categories**: Zakat Fitrah, Zakat Maal, Infak, Fidyah, Beras

---

## 2. How to Adjust Hak Amil Values

### Step 1: Navigate to Settings
- Go to **Settings** page (src/pages/Settings.tsx)

### Step 2: Find "Hak Amil Configuration" Tab
The Settings page has multiple tabs including:
- Profile
- Nilai Zakat
- User Management
- Rekonsiliasi
- **Hak Amil Configuration** ← This is where you adjust percentages

### Step 3: Configure Per Tahun Zakat
In the Hak Amil Configuration section:
1. Select a **Tahun Zakat** (Islamic Year)
2. Choose **Basis Mode**: determines how hak amil percentages are calculated
3. Set percentages for each category:
   - `persen_zakat_fitrah` - Zakat Fitrah percentage
   - `persen_zakat_maal` - Zakat Maal percentage
   - `persen_infak` - Infak/Sedekah percentage
   - `persen_fidyah` - Fidyah percentage
   - `persen_beras` - Beras percentage (usually 0)

### Step 4: Save Configuration
The form saves the configuration to `hak_amil_configs` table with:
- `tahun_zakat_id` - Which Islamic year this applies to
- All the percentages
- `updated_by` - Who made the change
- `updated_at` - When it was updated

---

## 3. Data Flow: How Hak Amil Affects Progress Display

```
Dashboard.tsx
    ↓
useDashboardStats()
    ↓
Returns: {
  hakAmilUangRp: 0,           // Calculated from latest config
  sisaUangAfterAmilRp: 0,     // = totalPemasukanUangRp - hakAmilUangRp - totalDistribusi
  totalDistribusiUangRp: 0
}
    ↓
DistribusiProgress (Uang)
    ↓
Show: Pemasukan → Hak Amil → Tersalurkan → Sisa
```

---

## 4. Important Notes

### Beras Progress Section
- ✅ Always shows 3 values: Pemasukan, Tersalurkan, Sisa
- ❌ Hak Amil for Beras is typically 0% (not taken from beras)
- No configuration needed for beras usually

### Uang Progress Section  
- ✅ Shows 4 values if Hak Amil > 0: Pemasukan, Hak Amil, Tersalurkan, Sisa
- 🔧 **Depends on Settings → Hak Amil Configuration**
- The `sisa` value already accounts for hak amil deduction

### Hak Amil Dashboard Card
- 📊 Shows detailed breakdown by category for current month
- 💰 Grand total shows total hak amil for the month
- 📈 Categories show: Bruto, Rekonsiliasi, Neto, %, Nominal
- Only shows if there's hak amil data (else shows "Belum ada data")

---

## 5. Files Involved

```
📂 Components
  └─ dashboard/
     ├─ DistribusiProgress.tsx       ← Shows the progress bars
     ├─ HakAmilCard.tsx             ← Monthly hak amil summary
     └─ StatCard.tsx                ← Individual stat cards

📂 Pages
  ├─ Dashboard.tsx                  ← Main dashboard page
  └─ Settings.tsx                   ← Where you adjust hak amil %

📂 Hooks
  ├─ useDashboard.ts               ← Fetches stats & monthly data
  └─ useHakAmil.ts                 ← Hak amil calculations

📂 Components/Settings
  ├─ HakAmilConfigForm.tsx          ← Form to edit percentages
  └─ HakAmilConfigTable.tsx         ← Table showing all configs
```

---

## 6. Recommended Actions

### Current Status: ✅ Production Ready
The Progress Distribusi sections are:
1. ✅ Correctly showing distribution progress
2. ✅ Properly accounting for Hak Amil deductions
3. ✅ Displaying relevant information

### Future Considerations
- Consider adding a "Help" tooltip explaining the Hak Amil deduction
- Maybe show a link from Dashboard → Settings for quick access to Hak Amil Config
- Consider showing which Hak Amil config is active in the dashboard

---

## Summary

| Feature | Status | Relevance | How to Adjust |
|---------|--------|-----------|---------------|
| Progress Distribusi Beras | ✅ Working | ✅ Relevant | No adjustment needed (0%) |
| Progress Distribusi Uang | ✅ Working | ✅ Relevant | Settings → Hak Amil Configuration |
| Hak Amil Dashboard Card | ✅ Working | ✅ Relevant | Settings → Hak Amil Configuration |
| Hak Amil Values | ✅ Functioning | ✅ Relevant | **Settings → Hak Amil Configuration Tab** |

