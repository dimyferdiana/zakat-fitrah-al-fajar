## Plan: Revise Zakat Fitrah Payment Logic Per Ustadz Consultation

Based on Ustadz Imron's guidance, remove automatic reconciliation for zakat fitrah money payments. All money payments should be counted as zakat regardless of amount (no splitting into infaq). For rice, implement validation requiring at least the minimum amount or offer to categorize as infaq after muzakki confirmation.

### Setup & Preparation

1. **Create a new GitHub branch**
   ```bash
   git checkout -b feature/fase-2.1-revise-zakat-payment-logic
   git push -u origin feature/fase-2.1-revise-zakat-payment-logic
   ```

2. **Set up local database testing with Docker** (for novices)
   
   a. **Install Docker Desktop** (if not already installed)
      - Download from: https://www.docker.com/products/docker-desktop/
      - Install and start Docker Desktop application
      - Verify installation: `docker --version`
   
   b. **Start Supabase local instance**
      ```bash
      cd zakat-fitrah-app
      npx supabase start
      ```
      This will:
      - Download Supabase Docker images (first time only, may take a few minutes)
      - Start PostgreSQL database on `localhost:54322`
      - Start Supabase Studio on `http://localhost:54323`
      - Display connection details including API URL and anon key
   
   c. **Access your local database**
      - **Database Studio (GUI)**: Open `http://localhost:54323` in browser
      - **Direct PostgreSQL connection**: `localhost:54322` (credentials shown in terminal)
      - **API endpoint**: `http://localhost:54321`
   
   d. **Apply existing migrations**
      ```bash
      npx supabase db reset
      ```
      This applies all migrations from `supabase/migrations/` folder
   
   e. **Stop Supabase when done**
      ```bash
      npx supabase stop
      ```

3. **Run the app locally**
   ```bash
   cd zakat-fitrah-app
   npm install
   npm run dev
   ```
   App will be available at: `http://localhost:5173`

### Implementation Steps

1. **Remove overpayment reconciliation for money (uang) payments** in [useMuzakki.ts](zakat-fitrah-app/src/hooks/useMuzakki.ts) and [Muzakki.tsx](zakat-fitrah-app/src/pages/Muzakki.tsx) by deleting automatic `pemasukan_uang` creation and confirmation dialog for uang type
2. **Change money payment storage logic** in [useMuzakki.ts](zakat-fitrah-app/src/hooks/useMuzakki.ts) to store actual received amount in `jumlah_uang_rp` field instead of calculated kewajiban, making the nilai_uang_rp a reference/suggestion only
3. **Add validation for rice (beras) payments** in [MuzakkiForm.tsx](zakat-fitrah-app/src/components/muzakki/MuzakkiForm.tsx) schema to ensure `jumlah_beras_kg` meets minimum requirement (jumlah_jiwa × nilai_beras_kg), showing error if insufficient
4. **Implement infaq option for insufficient rice** in [Muzakki.tsx](zakat-fitrah-app/src/pages/Muzakki.tsx) with confirmation dialog when beras is below minimum, offering to record as infaq_sedekah instead after muzakki agreement
5. **Update UI displays** in [MuzakkiForm.tsx](zakat-fitrah-app/src/components/muzakki/MuzakkiForm.tsx) and [MuzakkiTable.tsx](zakat-fitrah-app/src/components/muzakki/MuzakkiTable.tsx) to show actual paid amounts and change "Kewajiban" label to "Nilai Acuan" or "Disarankan" for money type
6. **Remove obsolete fields from database schema** by creating migration to deprecate `jumlah_uang_dibayar_rp` field (since `jumlah_uang_rp` will now store actual amount) and update TypeScript types in [database.types.ts](zakat-fitrah-app/src/types/database.types.ts)

### Further Considerations

1. **Dashboard statistics recalculation** - Since overpayments no longer go to infaq, should the dashboard totals be recalculated differently? Should money zakat now include all amounts given (not just standard amounts)?
2. **Historical data migration** - Should existing overpayment records in `pemasukan_uang` be merged back into their original `pembayaran_zakat` records, or left as-is for historical accuracy?
3. **Receipt printing** - Should [BuktiPembayaran.tsx](zakat-fitrah-app/src/components/muzakki/BuktiPembayaran.tsx) be updated to clarify that for money it shows actual received amount, and for rice it shows either valid zakat or infaq categorization?
