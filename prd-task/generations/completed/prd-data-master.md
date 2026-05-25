# PRD: Data Master Application

## 1. Introduction / Overview

Data Master is a third application module added to the existing zakat-fitrah web app, alongside **UPZ Al-Fajar** (zakat management) and **Qurban** (sacrifice management). It is accessible via the existing app-switcher dropdown and provides a centralized place for administrators to manage the foundational data that all other modules depend on: household/warga records, mustahik eligibility, user accounts, and organization/UPZ settings.

**Problem it solves:** Currently, warga data, user management, and organization settings are scattered (or absent) across the app. Admins have no single place to manage master records that feed into zakat calculations, qurban peserta lists, and coupon recipients. Data Master fills this gap without requiring a separate deployment.

**Goal:** Give administrators a dedicated, well-organized module to manage the shared master data used across the entire app.

---

## 2. Goals

1. Add **Data Master** as a selectable app in the existing app-switcher dropdown, with its own sidebar navigation.
2. Provide full **Warga CRUD** with CSV/Excel bulk import and mustahik flag management.
3. Allow viewing per-warga **participation history** (zakat and qurban records).
4. Provide **full User/Petugas management**: invite by email, assign roles, deactivate/reactivate, and view last-login.
5. Centralize **UPZ Al-Fajar organization settings** (name, address, contact, logo) and the **UPZ unit/amil list**.
6. Ensure all master data changes are immediately reflected across UPZ Al-Fajar and Qurban modules.

---

## 3. User Stories

| # | As a… | I want to… | So that… |
|---|--------|-----------|----------|
| 1 | Admin | Switch to Data Master from the app switcher | I can manage master data without navigating to a separate URL |
| 2 | Admin | Add, edit, and delete warga (household) records | The warga list stays accurate for all modules |
| 3 | Admin | Import warga from a CSV or Excel file | I can bulk-load data without entering each record manually |
| 4 | Admin | Mark/unmark a warga as mustahik | The coupon and zakat distribution flows always have an up-to-date eligibility list |
| 5 | Admin | View a warga's zakat and qurban history | I can quickly audit a household's participation across years |
| 6 | Admin | Invite new users by email and assign them a role | New petugas or viewers can access the app without sharing credentials |
| 7 | Admin | Deactivate or reactivate a user account | I can revoke access for inactive petugas without deleting their records |
| 8 | Admin | See each user's last login time | I can identify inactive accounts for cleanup |
| 9 | Admin | Edit the mosque/UPZ organization info and logo | Receipts and reports always show current branding |
| 10 | Admin | Manage the list of UPZ collection units and amil officers | The UPZ module can reference up-to-date collection points |

---

## 4. Functional Requirements

### 4.1 App Switcher Entry

1. A new **"Data Master"** entry must appear in the existing app-switcher dropdown (the same `DropdownMenu` that currently shows UPZ Al-Fajar and Qurban).
2. The entry must have a distinct icon (e.g., `Database` from lucide-react) and subtitle *"Manajemen Data Induk"*.
3. Selecting Data Master must navigate the user to `/data-master` and switch the sidebar to the Data Master navigation.

### 4.2 Sidebar Navigation (Data Master)

4. The Data Master sidebar must contain the following items:
   - **Warga** (`/data-master/warga`)
   - **Mustahik** (`/data-master/mustahik`)
   - **Pengguna** (`/data-master/pengguna`)
   - **Pengaturan UPZ** (`/data-master/upz-settings`)
5. The sidebar must follow the same visual design as the existing UPZ Al-Fajar and Qurban sidebars.

### 4.3 Warga Management (`/data-master/warga`)

6. The page must display a paginated, searchable table of all warga records. Columns: Nama KK, No. Telp, RT/RW, Alamat, Mustahik (badge), Actions.
7. The system must allow **adding** a new warga with fields: Nama KK (required), No. Telp, Alamat, RT, RW, Keterangan.
8. The system must allow **editing** any warga record.
9. The system must allow **deleting** a warga record (with confirmation dialog). Deletion must be blocked if the warga has linked records (zakat, qurban shares, coupons) — show an error message instead.
10. The system must allow **toggling mustahik status** per warga directly from the table row (a toggle/badge button), without opening an edit form.
11. An **"Import CSV/Excel"** button must open a file picker accepting `.csv` and `.xlsx` files. The system must:
    - Show a preview of parsed rows before importing.
    - Map columns: `nama_kk`, `no_telp`, `alamat`, `rt`, `rw`, `keterangan`.
    - Report how many rows were successfully imported and how many failed (with reasons).
12. Clicking a warga's name must open a **detail / history panel** showing:
    - Their zakat fitrah records (year, type, amount) from the `pemasukan_zakat` or equivalent table.
    - Their qurban participation records (event, animal, share status).

### 4.4 Mustahik List (`/data-master/mustahik`)

13. The page must display only warga records where `is_mustahik = true`.
14. It must reuse the same table structure as the Warga page but with a **"Hapus dari Mustahik"** action (sets `is_mustahik = false`).
15. An **"Tambah Mustahik"** button must allow selecting an existing warga to mark as mustahik (does NOT create a new warga; only sets the flag).

### 4.5 User / Petugas Management (`/data-master/pengguna`)

16. The page must display a table of all app users with columns: Nama, Email, Role (badge), Status (Aktif/Nonaktif), Last Login, Actions.
17. An **"Undang Pengguna"** (Invite User) button must open a form with fields: Email (required), Nama, Role (admin / petugas / viewer). On submit, send a Supabase invitation email to the address.
18. Each user row must have an **"Edit Role"** action to change the user's role.
19. Each user row must have a **"Nonaktifkan"** / **"Aktifkan"** toggle to deactivate or reactivate the account (sets `is_active` flag in the users/profiles table).
20. Last login time must be read from Supabase Auth `last_sign_in_at` and displayed as a human-readable relative time (e.g., "3 hari lalu").
21. Admin users must **not** be able to deactivate themselves.

### 4.6 UPZ Organization Settings (`/data-master/upz-settings`)

22. The page must display a form with the following organization fields:
    - **Nama Masjid / Lembaga** (required)
    - **Alamat** (required)
    - **No. Telp / WhatsApp**
    - **Email**
    - **Logo** (image upload, used on receipts/reports)
23. Changes must be saved to a `settings` or `organization` table in Supabase and reflected immediately on any PDF receipts generated.
24. A **UPZ Units / Amil** section on the same page must list the collection units with columns: Nama Unit, Petugas Amil, Lokasi, Actions (edit/delete).
25. An **"Tambah Unit"** button must allow adding a new UPZ unit with the fields above.

---

## 5. Non-Goals (Out of Scope)

- Creating a separate deployment or Vite project for Data Master — it lives inside the existing app.
- Audit log / change history per field (who changed what).
- Password reset for users (Supabase handles this via email).
- Multi-mosque / multi-organization support.
- Data Master having its own dashboard or analytics page.

---

## 6. Design Considerations

- **App switcher:** Add a third `menuitem` in the existing `DropdownMenu` in the app-switcher component. Use the `Database` lucide icon. Active state (checkmark) should switch based on current route prefix.
- **Sidebar:** Create a `DataMasterSidebar` component mirroring the pattern of `QurbanSidebar` and the UPZ sidebar. Each nav item uses the same `SidebarMenuItem` + `SidebarMenuButton` pattern.
- **Warga table:** Reuse the existing `Table`, `TableHead`, `TableRow`, `TableCell` from `@/components/ui/table`. Add a `Badge` for mustahik status and an inline toggle `Switch` or `Button` for toggling it.
- **Import flow:** Use a `Dialog` for the import preview. Parse CSV with `papaparse` (already used in the project or add it). Parse Excel with `xlsx` (SheetJS).
- **History panel:** Use a `Sheet` (slide-over) or a `Dialog` to show history without navigating away from the list.
- **Settings page:** Single-column form using `Card` sections — one for org info, one for UPZ units list. Use the existing `PhotoUpload` component pattern for logo upload.

---

## 7. Technical Considerations

- **Routing:** Add `/data-master/*` routes to the React Router config. Use lazy imports for page components.
- **Warga table:** The `warga` table (or `muzakki_master`) already exists and is used by UPZ and Qurban modules. Verify its schema before building the form — do not create a duplicate table.
- **Mustahik flag:** Check whether `is_mustahik` already exists on the warga table or if there is a separate `mustahik` table. Adapt accordingly (may require a migration if the flag does not exist).
- **User management:** Use Supabase Admin API (`supabase.auth.admin.*`) for inviting users and reading `last_sign_in_at`. These calls must be routed through a **Supabase Edge Function** (not the client-side SDK) to keep the service role key server-side.
- **Organization settings:** If a `settings` table does not exist, create a new migration with a single-row table (`id = 'org'`) for upsert-based saves.
- **UPZ units:** Create a `upz_units` table if it does not exist. Include RLS policies: admin/petugas for write, all active users for read.
- **CSV/Excel import:** Use `papaparse` for CSV, `xlsx` (SheetJS) for Excel. Both are lightweight and can run client-side. Validate each row before insert; batch insert valid rows.
- **Logo upload:** Store in a Supabase Storage bucket (e.g., `org-assets`). Reference the public URL in the settings record.

---

## 8. Success Metrics

1. Admin can switch to Data Master from the app switcher with one click.
2. A warga record can be added, edited, and deleted without errors.
3. A 100-row CSV import completes in under 5 seconds with a success/failure report.
4. Toggling mustahik status on a warga is immediately reflected in the Qurban coupon picker.
5. A new petugas user receives an invite email and can log in within 2 minutes of being invited.
6. Deactivating a user prevents them from logging in (Supabase `is_active` check).
7. Organization logo saved in Data Master appears on the next generated Bukti Qurban PDF.

---

## 9. Open Questions

1. **Warga table name:** Is the primary warga table called `warga`, `muzakki_master`, or something else? Need to verify before building forms.
2. **Mustahik storage:** Is `is_mustahik` a column on the warga table, or is there a separate `mustahik` table with foreign keys? This determines whether the Mustahik page is a filtered view or a join.
3. **Existing settings:** Is there already an organization settings table used for receipt headers? If so, Data Master should update it rather than create a duplicate.
4. **Edge Function for user management:** Does the project already have an Edge Function for admin operations, or does one need to be created?
