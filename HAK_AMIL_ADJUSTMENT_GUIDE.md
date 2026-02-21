# Quick Start: How to Adjust Hak Amil Values

## The Answer: Settings → Hak Amil Configuration

### Navigation Path
```
Dashboard (or any page)
    ↓
Click "Settings" (usually in sidebar or menu)
    ↓
Look for tabs at the top
    ↓
Click "Hak Amil Configuration" tab
    ↓
You can now view and edit hak amil percentages
```

---

## What You'll See

### Hak Amil Configuration Tab
1. **Configuration Table** (Read-Only Display)
   - Shows all existing Hak Amil configs by Tahun Zakat
   - Displays all percentages currently set
   - Shows who updated it and when

2. **Add New/Edit Form** (At top or bottom)
   - **Select Tahun Zakat**: Choose which Islamic year
   - **Basis Mode**: How hak amil is calculated
   - **Percentage Fields**:
     - Zakat Fitrah: % to take from zakat fitrah
     - Zakat Maal: % to take from zakat maal
     - Infak: % to take from infak/sedekah
     - Fidyah: % to take from fidyah
     - Beras: % to take from beras (usually 0%)
   - **Save Button**: Saves the configuration

---

## Example: Setting Hak Amil to 15%

**Scenario**: You want to take 15% hak amil from Zakat Fitrah

### Steps:
1. Go to **Settings** → **Hak Amil Configuration**
2. Click **"Edit"** or **"Add New"** (or fill the form at top)
3. Select **Tahun Zakat**: e.g., "1445 H (2024 M)"
4. Set **persen_zakat_fitrah**: `15`
5. Keep other percentages as needed
6. Click **"Save"** or **"Simpan"**
7. ✅ Configuration saved!

---

## How Dashboard Reflects Your Changes

After you set Hak Amil percentages in Settings:

### Automatic Updates:
1. **Hak Amil Dashboard Card**
   - Shows the hak amil amount in the table
   - Shows breakdown by category
   - Shows total hak amil for current month

2. **Progress Distribusi Uang Section**
   - Shows deduction: `Pemasukan - Hak Amil - Tersalurkan = Sisa`
   - The "Sisa" value is automatically reduced

### Data Source:
- Reads from `hak_amil_configs` table
- Applies the percentages to transactions
- Stores snapshots of calculations at transaction time

---

## Technical Details (For Reference)

### Database Table: `hak_amil_configs`
```sql
- id: unique identifier
- tahun_zakat_id: which Islamic year
- basis_mode: calculation method
- persen_zakat_fitrah: 0-100
- persen_zakat_maal: 0-100
- persen_infak: 0-100
- persen_fidyah: 0-100
- persen_beras: 0-100 (usually 0)
- updated_by: who made the change
- updated_at: when it was changed
```

### Code Reference
- **Form**: `src/components/settings/HakAmilConfigForm.tsx`
- **Table**: `src/components/settings/HakAmilConfigTable.tsx`
- **Settings Page**: `src/pages/Settings.tsx`
- **Dashboard**: `src/pages/Dashboard.tsx`

---

## Common Questions

**Q: Why is Hak Amil 0?**
A: No configuration has been set yet, or the percentage is set to 0%. Go to Settings → Hak Amil Configuration and set the percentages.

**Q: Does changing Hak Amil update past data?**
A: No, percentages are stored at transaction time. Changes only apply to new transactions going forward.

**Q: Can I have different Hak Amil for different years?**
A: Yes! Each Tahun Zakat (Islamic Year) can have its own Hak Amil configuration.

**Q: What's "Basis Mode"?**
A: It determines how the system calculates hak amil. Different modes may calculate differently (e.g., on gross vs. net).

---

## Summary Table

| What | Where | How |
|------|-------|-----|
| **View Hak Amil** | Dashboard → Hak Amil Card | Automatic |
| **View Progress** | Dashboard → Progress Distribusi | Automatic |
| **Adjust Hak Amil %** | Settings → Hak Amil Configuration | Edit form + Save |
| **See Config History** | Settings → Hak Amil Configuration | Table displays all |

