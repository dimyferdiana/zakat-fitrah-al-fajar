# PRD: Automatic Split of Excess Payment to Sedekah/Infak

## Introduction/Overview

Currently, when a muzakki makes a payment that exceeds the required Nilai Zakat (either in beras or uang), the entire amount is recorded as Zakat. This PRD addresses the need to automatically split overpayments into two categories:
1. **Zakat**: The exact required amount (based on Nilai Beras per Jiwa or Nilai Uang per Jiwa × jumlah_jiwa)
2. **Sedekah/Infak**: Any excess amount beyond the required zakat

**Problem Statement**: When muzakki pays more than the required zakat amount, the system should intelligently categorize the payment to ensure accurate financial reporting and proper allocation of funds.

**Goal**: Automatically detect and split overpayments in the Muzakki page's "Tambah Pembayaran" form, ensuring accurate categorization of Zakat vs. Sedekah/Infak contributions.

## Goals

1. Automatically calculate and split excess payments into Zakat and Sedekah/Infak
2. Provide real-time visual feedback showing the payment breakdown
3. Create separate database records for Zakat and Sedekah/Infak portions
4. Maintain data integrity and accurate financial reporting
5. Ensure seamless user experience with minimal user intervention

## User Stories

**As a** Petugas/Admin recording muzakki payments,  
**I want** the system to automatically identify when a payment exceeds the required zakat amount,  
**So that** I don't have to manually calculate and create separate records for the excess as sedekah/infak.

**As a** Petugas/Admin,  
**I want** to see a real-time breakdown of how the payment will be split (Zakat vs. Sedekah),  
**So that** I can verify the calculation before saving and inform the muzakki if needed.

**As a** Finance Manager reviewing reports,  
**I want** overpayments to be correctly categorized as Sedekah/Infak,  
**So that** financial reports accurately reflect the breakdown of income sources.

## Functional Requirements

### FR1: Calculation Logic

**FR1.1** When a payment amount is entered in the "Tambah Pembayaran" form, the system MUST calculate:
- **Required Amount** = `jumlah_jiwa` × `nilai_per_jiwa` (either nilai_beras_kg or nilai_uang_rp from active tahun_zakat)
- **Excess Amount** = `payment_amount` - `required_amount`

**FR1.2** The split logic MUST apply to both payment types:
- **Beras (kg)**: If `jumlah_beras_kg` > (`jumlah_jiwa` × `nilai_beras_kg`), split the excess
- **Uang (Rp)**: If `jumlah_uang_rp` > (`jumlah_jiwa` × `nilai_uang_rp`), split the excess

**FR1.3** If the payment amount is less than or equal to the required amount, no splitting occurs (record as Zakat only).

### FR2: Real-Time UI Feedback

**FR2.1** The form MUST display a real-time calculation breakdown when excess is detected, showing:
```
Pembayaran Zakat: [required_amount] [kg/Rp]
Sedekah/Infak: [excess_amount] [kg/Rp]
Total: [total_payment] [kg/Rp]
```

**FR2.2** The breakdown display MUST update instantly as the user types the amount.

**FR2.3** Use visual indicators (e.g., info color/icon, bordered box) to make the breakdown prominent but non-intrusive.

**FR2.4** If no excess exists, do NOT show the breakdown section.

### FR3: Data Storage - Uang (Cash) Payments

**FR3.1** When saving a Zakat Uang payment with excess:

**Record 1 - Zakat Payment** (table: `pembayaran_zakat`):
- `muzakki_id`: [selected muzakki]
- `tahun_zakat_id`: [active tahun zakat]
- `jumlah_jiwa`: [entered value]
- `jenis_zakat`: 'uang'
- `jumlah_uang_rp`: [required_amount] (NOT total payment)
- `akun_uang`: [selected account]
- `tanggal_bayar`: [entered date]
- `created_by`: [current user]

**Record 2 - Sedekah/Infak** (table: `pemasukan_uang`):
- `tahun_zakat_id`: [active tahun zakat]
- `muzakki_id`: [selected muzakki]
- `kategori`: 'infak_sedekah_uang'
- `akun`: [same akun_uang as Record 1]
- `jumlah_uang_rp`: [excess_amount]
- `tanggal`: [same as tanggal_bayar]
- `catatan`: "Kelebihan pembayaran dari [nama_muzakki]" (auto-generated)
- `created_by`: [current user]

**FR3.2** Both records MUST be created in a single database transaction to ensure data consistency.

### FR4: Data Storage - Beras Payments

**FR4.1** When saving a Zakat Beras payment with excess:

**Record 1 - Zakat Payment** (table: `pembayaran_zakat`):
- `muzakki_id`: [selected muzakki]
- `tahun_zakat_id`: [active tahun zakat]
- `jumlah_jiwa`: [entered value]
- `jenis_zakat`: 'beras'
- `jumlah_beras_kg`: [required_amount] (NOT total payment)
- `tanggal_bayar`: [entered date]
- `created_by`: [current user]

**Record 2 - Sedekah Beras** (table: `pemasukan_beras`):
- `tahun_zakat_id`: [active tahun zakat]
- `muzakki_id`: [selected muzakki]
- `kategori`: 'infak_sedekah_beras'
- `jumlah_beras_kg`: [excess_amount]
- `tanggal`: [same as tanggal_bayar]
- `catatan`: "Kelebihan pembayaran dari [nama_muzakki]" (auto-generated)
- `created_by`: [current user]

**FR4.2** Both records MUST be created in a single database transaction.

### FR5: User Confirmation

**FR5.1** Before saving, the system MUST show a confirmation message/dialog displaying:
- Payment breakdown (Zakat + Sedekah amounts)
- Notification that two separate records will be created
- Confirmation prompt: "Lanjutkan dengan pembagian ini?"

**FR5.2** If user cancels, no records should be saved.

### FR6: No Manual Override

**FR6.1** Once the payment amount is entered, the split is automatically calculated and final.

**FR6.2** Users CANNOT manually adjust the split ratio or amounts.

**FR6.3** If the muzakki wants to avoid the split (e.g., they only want to pay exact zakat), they must enter exactly the required amount.

### FR7: Display in History/Lists

**FR7.1** In the Muzakki detail view, both records (Zakat and Sedekah) should be visible in the payment history.

**FR7.2** Sedekah/Infak records should be clearly labeled/badged to distinguish them from Zakat payments.

**FR7.3** For reporting purposes, Sedekah/Infak should appear in relevant income reports (Pemasukan Uang for uang, and appropriately for beras).

## Non-Goals (Out of Scope):
- Uang excess → "Infak/Sedekah Uang" category in Dashboard Keuangan
- Beras excess → "Infak/Sedekah Beras" category in Dashboard Keuangan

### FR8: Receipt Display

**FR8.1** When a split payment occurs, the generated receipt MUST display both amounts clearly:
- "Zakat Fitrah: [required_amount] [kg/Rp]"
- "Sedekah/Infak: [excess_amount] [kg/Rp]"
- "Total Pembayaran: [total] [kg/Rp]"

**FR8.2** The receipt should include a thank-you message acknowledging the Sedekah contribution.

**FR8.3** Both amounts should be printed on a single receipt (not two separate receipt

1. **Manual split editing**: Users cannot change the automatic split ratio; it's always based on required vs. excess.
2. **Retroactive splitting**: This feature does NOT automatically re-process existing overpayment records; it only applies to new payments going forward.
3. **Partial zakat payments**: This feature does NOT handle cases where payment is less than required (underpayment) - that remains the existing behavior.
4. **Custom sedekah categories**: The excess is always categorized as 'infak_sedekah_uang' or sedekah beras; no custom subcategories.
5. **Receipt modifications**: Existing receipt generation logic remains unchanged (this feature only affects data recording).
6. **Beras conversion to Uang**: No automatic conversion between beras and uang; each payment type is handled independently.

## Design Considerations

### UI Components

- **Component**: `TambahPembayaranForm` (in Muzakki page)
- **New UI Element**: Calculation breakdown display (conditional rendering)
  - Use Shadcn/ui `Alert` or `Card` component with info variant
  - Position below the amount input field
  - Include icon indicator (Info or Calculator icon)
  
### Visual Mockup Example

```
┌─────────────────────────────────────┐
│ Jumlah [Beras/Uang]: [150] [kg/Rp] │
└─────────────────────────────────────┘

┌─── ℹ️ Rincian Pembayaran ───────────┐
│ Zakat Fitrah:    100 kg             │
│ Sedekah/Infak:   50 kg              │
│ ─────────────────────────────       │
│ Total:           150 kg             │
└─────────────────────────────────────┘
```

### Form Validation

- Existing validation rules remain (minimum amount, required fields)
**New Table Required**: `pemasukan_beras`

Create a new table `pemasukan_beras` that mirrors the structure of `pemasukan_uang`:
Database Migration**: Create migration for new `pemasukan_beras` table
2. **Database Types**: Update `database.types.ts` to include `pemasukan_beras` table and types
3. **Form Component**: `zakat-fitrah-app/src/components/muzakki/` - Add real-time calculation UI
4. **Submit Handler**: Modify payment submission logic to create two records when excess detected
5. **Hooks**: `useMuzakki.ts` - Update mutation logic for split payments
6. **Receipt Component**: Update `SedekahReceipt.tsx` or related receipt components to show split amounts
7. **Dashboard**: Update Dashboard Keuangan to include "Infak/Sedekah Beras" and "Infak/Sedekah Uang" categorie
  tahun_zakat_id UUID REFERENCES tahun_zakat(id) NOT NULL,
  muzakki_id UUID REFERENCES muzakki(id),
  kategori TEXT NOT NULL, -- e.g., 'infak_sedekah_beras'
  jumlah_beras_kg DECIMAL(10,2) NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  catatan TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Type Updates Required**:
- Add to `database.types.ts`: `PemasukanBerasKategori` type similar to `PemasukanUangKategori`
- Include 'infak_sedekah_beras' as a valid kategori value
## Technical Considerations

### Transaction Management

- Use Supabase transactions (`.transaction()` or multiple inserts with proper error handling) to ensure both records are created or none at all.
- If Record 2 (Sedekah) fails, rollback Record 1 (Zakat).

### Database Requirements

- **For Beras Sedekah**: Consider adding a `catatan` or `keterangan` field to `pembayaran_zakat` table to store notes like "Sedekah - kelebihan pembayaran"
- **Alternative solution**: Add a `is_sedekah: boolean` flag to `pembayaran_zakat` to explicitly mark sedekah beras records
in dedicated categories:
   - "Infak/Sedekah Uang" shows all uang excess payments
   - "Infak/Sedekah Beras" shows all beras excess payments
5. **Receipt Clarity**: 100% of split payment receipts clearly show both Zakat and Sedekah amounts
6. **Adoption**: Within 1 month, 100% of new overpayments are processed using automatic split (no manual workarounds)

## Implementation Notes

### Database Migration Priority
The `pemasukan_beras` table MUST be created before implementing the frontend logic. This is a prerequisite for the feature.

### Dashboard Integration
Update the Dashboard Keuangan queries to include:
- SUM of `pemasukan_uang` where `kategori = 'infak_sedekah_uang'` → Display as "Infak/Sedekah Uang"
- SUM of `pemasukan_beras` where `kategori = 'infak_sedekah_beras'` → Display as "Infak/Sedekah Beras"

### Receipt Template Updates
Modify the receipt generation logic to:
1. Check if the payment was split (query both tables by muzakki_id and tanggal)
2. If split detected, display both line items
3. Include total at bottom
4. Add thank-you message for sedekah contribution

## Future Enhancements (Out of Scope)

1. **Historical Data Migration**: One-time script to identify and re-categorize existing overpayments
2. **Notification System**: Automatic thank-you messages or SMS notifications for sedekah contributions
3. **Sedekah Subcategories**: Allow categorizing sedekah into specific causes or programs
4. **Annual Sedekah Reports**: Generate year-end sedekah contribution statements for muzakki

1. **Accuracy**: 100% of overpayments are correctly split and recorded in separate records
2. **Data Integrity**: Zero instances of transaction failures leaving orphaned records
3. **User Feedback**: Petugas/Admin report improved efficiency in recording mixed payments (no manual entry of two separate records)
4. **Report Accuracy**: Financial reports (Dashboard Keuangan) correctly reflect Sedekah/Infak income separate from Zakat
5. **Adoption**: Within 1 month, 100% of new overpayments are processed using automatic split (no manual workarounds)

## Open Questions

1. **Database Schema for Beras Sedekah**: Should we add a dedicated `pemasukan_beras` table similar to `pemasukan_uang`, or continue using `pembayaran_zakat` with `jumlah_jiwa = 0`?
   - **Recommendation**: Add `is_sedekah: boolean` flag to `pembayaran_zakat` for clarity and easier querying.

2. **Historical Data**: Should there be a one-time script to identify and flag existing overpayments in the database for reporting purposes?
   - **Recommendation**: Out of scope for initial release; can be a follow-up enhancement.

3. **Receipt Generation**: When a split payment is made, should the receipt show both Zakat and Sedekah amounts, or only the Zakat portion?
   - **Recommendation**: Show both amounts on a single receipt for transparency.

4. **Dashboard Impact**: Should the Dashboard Keuangan automatically include this new Sedekah income in existing charts/reports, or should it be a separate metric?
   - **Recommendation**: Include in overall Pemasukan but provide breakdown by category.

5. **Notification to Muzakki**: Should the system generate an automatic thank-you message or notification acknowledging the Sedekah contribution?
   - **Recommendation**: Out of scope for MVP; can be a future enhancement.

---

**Version**: 1.0  
**Created**: February 12, 2026  
**Status**: Draft - Ready for Review  
**Target Audience**: Junior Developer
