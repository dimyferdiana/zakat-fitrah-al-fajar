# Task List: Aplikasi Manajemen Zakat Fitrah Masjid

**Feature**: Full-stack web application untuk manajemen zakat fitrah
**Tech Stack**: React + Vite + shadcn/ui + Supabase + Shared Hosting
**Based on**: [prd-zakat-fitrah.md](../workflow/prd-zakat-fitrah.md)

---

## Relevant Files

### Frontend (React + Vite + shadcn/ui)

- `src/main.tsx` - Entry point aplikasi React dengan Vite
- `src/App.tsx` - Root component dengan routing setup
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/auth.tsx` - Authentication context & hooks
- `src/lib/utils.ts` - shadcn/ui utility functions (cn helper)
- `src/components/ui/*` - shadcn/ui components (Button, Input, Table, Dialog, Form, dll)
- `src/components/layouts/MainLayout.tsx` - Main layout dengan sidebar & header
- `src/components/layouts/AuthLayout.tsx` - Layout untuk login page
- `src/pages/Login.tsx` - Login page component
- `src/pages/Dashboard.tsx` - Dashboard page dengan ringkasan data
- `src/pages/Muzakki.tsx` - CRUD Muzakki & pembayaran zakat
- `src/pages/Mustahik.tsx` - CRUD Mustahik (penerima zakat)
- `src/pages/Distribusi.tsx` - Form & list distribusi zakat
- `src/pages/Settings.tsx` - Settings nilai zakat & user management
- `src/pages/Laporan.tsx` - Laporan & export PDF/Excel
- `src/hooks/useMuzakki.ts` - React Query hooks untuk muzakki
- `src/hooks/useMustahik.ts` - React Query hooks untuk mustahik
- `src/hooks/useDistribusi.ts` - React Query hooks untuk distribusi
- `src/hooks/useDashboard.ts` - React Query hooks untuk dashboard data
- `src/utils/pdf-export.ts` - PDF generation utilities (jsPDF)
- `src/utils/excel-export.ts` - Excel export utilities (xlsx)
- `src/utils/formatter.ts` - Currency & date formatters
- `src/types/database.types.ts` - TypeScript types untuk database

### Backend (Supabase)

- `supabase/migrations/001_initial_schema.sql` - Database schema creation
- `supabase/migrations/002_rls_policies.sql` - Row Level Security policies
- `supabase/migrations/003_functions.sql` - Database functions & triggers
- `supabase/seed.sql` - Seed data untuk development

### Configuration

- `package.json` - Dependencies & scripts
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - TailwindCSS configuration
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variables template
- `.env` - Environment variables (gitignored)

### Documentation

- `README.md` - Setup & development guide
- `DEPLOYMENT.md` - Deployment guide untuk shared hosting
- `USER_MANUAL.md` - User manual untuk petugas (Bahasa Indonesia)
- `docs/SOP_PETUGAS.pdf` - SOP 1-pager untuk petugas

### Notes

- Follow shadcn/ui composition pattern (import from `@/components/ui`)
- Use `cn()` utility dari `@/lib/utils` untuk conditional styling
- All forms MUST use shadcn/ui Form components with React Hook Form + Zod
- Use `lucide-react` icons throughout the app
- Implement proper error handling dengan shadcn/ui Toast & Alert
- Follow responsive design principles (mobile-first)
- Test features before marking as complete

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Create Vite project` → `- [x] 1.1 Create Vite project` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [X] 0.0 Create feature branch
  - [X] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/zakat-management-app`)

---

- [X] 1.0 Project Setup & Infrastructure
  - [X] 1.1 Create new Vite + React + TypeScript project (`npm create vite@latest zakat-fitrah-app -- --template react-ts`)
  - [X] 1.2 Navigate to project directory (`cd zakat-fitrah-app`)
  - [X] 1.3 Install core dependencies: `npm install @supabase/supabase-js @tanstack/react-query react-router-dom zustand`
  - [X] 1.4 Install TailwindCSS: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
  - [X] 1.5 Configure TailwindCSS in `tailwind.config.js` (content paths for src directory)
  - [X] 1.6 Add TailwindCSS directives to `src/index.css`
  - [X] 1.7 Install shadcn/ui dependencies: `npm install class-variance-authority clsx tailwind-merge lucide-react`
  - [X] 1.8 Initialize shadcn/ui: `npx shadcn-ui@latest init` (choose Default style, Slate color)
  - [X] 1.9 Verify `components.json` created with correct path aliases
  - [X] 1.10 Verify `src/lib/utils.ts` created with `cn()` helper function
  - [X] 1.11 Install form libraries: `npm install react-hook-form zod @hookform/resolvers`
  - [X] 1.12 Install export libraries: `npm install jspdf jspdf-autotable xlsx`
  - [X] 1.13 Install chart library: `npm install recharts`
  - [X] 1.14 Install date utilities: `npm install date-fns`
  - [X] 1.15 Configure TypeScript path aliases in `tsconfig.json` (`@/*` → `./src/*`)
  - [X] 1.16 Update `vite.config.ts` to support path aliases
  - [X] 1.17 Create `.env.example` with Supabase variables template
  - [X] 1.18 Create `.env` file (copy from .env.example, add to .gitignore)
  - [X] 1.19 Update `package.json` scripts (dev, build, preview, lint)
  - [X] 1.20 Initialize git repository if not already initialized

---

- [X] 2.0 Database Schema & Supabase Configuration
  - [X] 2.1 Create new Supabase project at supabase.com
  - [X] 2.2 Copy project URL and anon key to `.env` file
  - [X] 2.3 Create `supabase/migrations/001_initial_schema.sql` file
  - [X] 2.4 Write SQL for `users` table (extends auth.users with role, nama_lengkap, is_active)
  - [X] 2.5 Write SQL for `tahun_zakat` table (id, tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active, timestamps)
  - [X] 2.6 Write SQL for `kategori_mustahik` table (id, nama, deskripsi) with 8 asnaf
  - [X] 2.7 Write SQL for `muzakki` table (id, nama_kk, alamat, no_telp, timestamps)
  - [X] 2.8 Write SQL for `pembayaran_zakat` table with all foreign keys and enums
  - [X] 2.9 Write SQL for `mustahik` table with kategori relation
  - [X] 2.10 Write SQL for `distribusi_zakat` table with status enum
  - [X] 2.11 Write SQL for `audit_logs` table with jsonb columns
  - [X] 2.12 Create indexes for foreign keys and frequently searched columns
  - [X] 2.13 Run migration via Supabase SQL Editor
  - [X] 2.14 Verify all tables created successfully
  - [X] 2.15 Create `supabase/migrations/002_rls_policies.sql`
  - [X] 2.16 Write RLS policy for admin role (full access to all tables)
  - [X] 2.17 Write RLS policy for petugas role (CRUD except delete final reports)
  - [X] 2.18 Write RLS policy for viewer role (read-only access)
  - [X] 2.19 Enable RLS on all tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
  - [X] 2.20 Run RLS migration via Supabase SQL Editor
  - [X] 2.21 Test RLS policies with different user roles
  - [X] 2.22 Create `supabase/seed.sql` with sample data
  - [X] 2.23 Insert 8 kategori_mustahik (Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil)
  - [X] 2.24 Insert sample tahun_zakat for current year
  - [X] 2.25 Run seed data via SQL Editor

---

- [X] 3.0 Authentication & Authorization System
  - [X] 3.1 Create `src/lib/supabase.ts` with Supabase client initialization
  - [X] 3.2 Configure Supabase client with env variables
  - [X] 3.3 Create `src/types/database.types.ts` for TypeScript database types
  - [X] 3.4 Define User type with role enum (admin, petugas, viewer)
  - [X] 3.5 Create `src/lib/auth.tsx` with AuthContext
  - [X] 3.6 Implement `useAuth()` hook with login, logout, user, loading states
  - [X] 3.7 Add session persistence and auto-refresh
  - [X] 3.8 Implement 8-hour session timeout logic
  - [X] 3.9 Create `src/components/auth/ProtectedRoute.tsx`
  - [X] 3.10 Implement role-based access control in ProtectedRoute
  - [X] 3.11 Add redirect to login if not authenticated
  - [X] 3.12 Create `src/pages/Login.tsx` with shadcn/ui components
  - [X] 3.13 Install shadcn/ui: `npx shadcn-ui@latest add card input button form alert`
  - [X] 3.14 Import Card, CardHeader, CardTitle, CardContent from shadcn/ui
  - [X] 3.15 Create login form schema with Zod (email, password validation)
  - [X] 3.16 Implement form with React Hook Form + shadcn/ui Form components
  - [X] 3.17 Add email and password fields with proper validation
  - [X] 3.18 Implement login logic with Supabase Auth (signInWithPassword)
  - [X] 3.19 Add error handling with shadcn/ui Alert component
  - [X] 3.20 Add loading state with Loader2 icon from lucide-react
  - [X] 3.21 Style login page (centered card, responsive)
  - [X] 3.22 Implement auto-redirect to dashboard after successful login
  - [X] 3.23 Test login flow with sample users
  - [X] 3.24 Test session persistence (page refresh)
  - [X] 3.25 Test logout functionality

---

- [X] 4.0 Core UI Components & Layouts (shadcn/ui)
  - [X] 4.1 Install shadcn/ui button: `npx shadcn-ui@latest add button`
  - [X] 4.2 Install shadcn/ui inputs: `npx shadcn-ui@latest add input label textarea`
  - [X] 4.3 Install shadcn/ui card: `npx shadcn-ui@latest add card`
  - [X] 4.4 Install shadcn/ui table: `npx shadcn-ui@latest add table`
  - [X] 4.5 Install shadcn/ui dialog: `npx shadcn-ui@latest add dialog`
  - [X] 4.6 Install shadcn/ui dropdown-menu: `npx shadcn-ui@latest add dropdown-menu`
  - [X] 4.7 Install shadcn/ui select: `npx shadcn-ui@latest add select`
  - [X] 4.8 Install shadcn/ui toast: `npx shadcn-ui@latest add toast` (used sonner instead)
  - [X] 4.9 Install shadcn/ui alert: `npx shadcn-ui@latest add alert`
  - [X] 4.10 Install shadcn/ui badge: `npx shadcn-ui@latest add badge`
  - [X] 4.11 Install shadcn/ui avatar: `npx shadcn-ui@latest add avatar`
  - [X] 4.12 Install shadcn/ui separator: `npx shadcn-ui@latest add separator`
  - [X] 4.13 Install shadcn/ui tabs: `npx shadcn-ui@latest add tabs`
  - [X] 4.14 Install shadcn/ui sheet: `npx shadcn-ui@latest add sheet` (mobile sidebar)
  - [X] 4.15 Install shadcn/ui alert-dialog: `npx shadcn-ui@latest add alert-dialog`
  - [X] 4.16 Install shadcn/ui calendar & popover: `npx shadcn-ui@latest add calendar popover`
  - [X] 4.17 Verify all components in `src/components/ui/` folder
  - [X] 4.18 Create `src/components/layouts/MainLayout.tsx`
  - [X] 4.19 Import necessary shadcn/ui components and lucide-react icons
  - [X] 4.20 Create Sidebar component with navigation menu items
  - [X] 4.21 Add menu items: Dashboard, Muzakki, Mustahik, Distribusi, Laporan, Settings
  - [X] 4.22 Use Button variant="ghost" for menu items
  - [X] 4.23 Add Separator between menu sections
  - [X] 4.24 Add icons from lucide-react (Home, Users, Package, FileText, Settings, LogOut)
  - [X] 4.25 Create Header component with DropdownMenu for user actions
  - [X] 4.26 Add Avatar with AvatarFallback showing user initials
  - [X] 4.27 Add logout option in dropdown menu
  - [X] 4.28 Make sidebar responsive using Sheet for mobile view
  - [X] 4.29 Add hamburger Menu button for mobile
  - [ ] 4.30 Create `src/components/layouts/AuthLayout.tsx` with centered Card (skipped - Login page already has layout)
  - [X] 4.31 Create `src/components/common/PageHeader.tsx` component
  - [X] 4.32 Create `src/components/common/LoadingSpinner.tsx` with Loader2 icon
  - [X] 4.33 Create `src/components/common/EmptyState.tsx` with Card and icons
  - [X] 4.34 Create `src/App.tsx` with React Router setup
  - [X] 4.35 Setup BrowserRouter and Routes
  - [X] 4.36 Configure protected and public routes
  - [X] 4.37 Wrap app with AuthProvider from auth context
  - [X] 4.38 Setup QueryClientProvider for React Query
  - [X] 4.39 Add Toaster component at app root level
  - [X] 4.40 Test navigation between pages
  - [X] 4.41 Test responsive layout on mobile and desktop
  - [X] 4.42 Verify all shadcn/ui components work correctly

---

- [X] 5.0 Dashboard & Analytics
  - [X] 5.1 Create `src/pages/Dashboard.tsx`
  - [X] 5.2 Create `src/hooks/useDashboard.ts` with React Query
  - [X] 5.3 Implement query for total pemasukan beras (aggregate pembayaran_zakat)
  - [X] 5.4 Implement query for total pemasukan uang
  - [X] 5.5 Implement query for total muzakki count
  - [X] 5.6 Implement query for total mustahik (aktif dan non-aktif)
  - [X] 5.7 Implement query for total distribusi
  - [X] 5.8 Implement query for sisa zakat (pemasukan - distribusi)
  - [X] 5.9 Add filter by tahun_zakat_id with Select component
  - [X] 5.10 Create `src/components/dashboard/StatCard.tsx` using shadcn/ui Card
  - [X] 5.11 Add icon prop from lucide-react for each stat card
  - [X] 5.12 Add trend indicator (up/down) with percentage
  - [X] 5.13 Display 6 stat cards in grid layout (responsive)
  - [X] 5.14 Create `src/components/dashboard/PemasukanChart.tsx` with Recharts
  - [X] 5.15 Use BarChart from recharts for monthly pemasukan
  - [X] 5.16 Fetch monthly aggregated data from Supabase
  - [X] 5.17 Wrap chart in shadcn/ui Card component
  - [X] 5.18 Make chart responsive
  - [X] 5.19 Create `src/components/dashboard/DistribusiProgress.tsx`
  - [X] 5.20 Calculate percentage distribusi vs pemasukan
  - [X] 5.21 Use shadcn/ui Progress component (if available) or custom progress bar
  - [X] 5.22 Show distribusi completed vs pending with different colors
  - [X] 5.23 Add alert if sisa zakat < 10% of total pemasukan (use Alert component)
  - [X] 5.24 Implement auto-refresh with React Query refetchInterval (30 seconds)
  - [X] 5.25 Add manual refresh button
  - [X] 5.26 Test dashboard with various data scenarios
  - [X] 5.27 Verify responsive layout on different screen sizes

---

- [X] 6.0 Muzakki Management & Pembayaran Zakat
  - [X] 6.1 Create `src/pages/Muzakki.tsx`
  - [X] 6.2 Create `src/hooks/useMuzakki.ts` with React Query
  - [X] 6.3 Implement useQuery for fetching list pembayaran_zakat with joins
  - [X] 6.4 Implement useMutation for create pembayaran
  - [X] 6.5 Implement useMutation for update pembayaran
  - [X] 6.6 Implement useMutation for delete pembayaran
  - [X] 6.7 Add optimistic updates for better UX
  - [X] 6.8 Create `src/components/muzakki/MuzakkiTable.tsx` with shadcn/ui Table
  - [X] 6.9 Use Table, TableHeader, TableBody, TableRow, TableCell components
  - [X] 6.10 Display columns: Nama KK, Alamat, Jiwa, Jenis Zakat, Total, Tanggal, Actions
  - [X] 6.11 Add search Input with Search icon from lucide-react
  - [X] 6.12 Implement debounced search for nama and alamat
  - [X] 6.13 Add Select filter for jenis_zakat (beras/uang)
  - [X] 6.14 Add Select filter for tahun_zakat
  - [X] 6.15 Add sort functionality (by nama, tanggal, total)
  - [X] 6.16 Implement pagination (20 items per page)
  - [X] 6.17 Add action buttons (Edit, Delete, Print) with lucide-react icons
  - [X] 6.18 Create `src/components/muzakki/MuzakkiForm.tsx` with shadcn/ui Form
  - [X] 6.19 Import Form, FormField, FormItem, FormLabel, FormControl, FormMessage
  - [X] 6.20 Create Zod schema for validation (nama_kk, alamat, no_telp, jumlah_jiwa, jenis_zakat)
  - [X] 6.21 Use useForm with zodResolver
  - [X] 6.22 Add Input for nama_kk (required, min 3 chars)
  - [X] 6.23 Add Textarea for alamat (required)
  - [X] 6.24 Add Input type="tel" for no_telp (optional, phone format)
  - [X] 6.25 Add Input type="number" for jumlah_jiwa (min 1, required)
  - [X] 6.26 Add Select for jenis_zakat (beras/uang)
  - [X] 6.27 Fetch nilai per orang from active tahun_zakat
  - [X] 6.28 Implement auto-calculate total zakat (jiwa × nilai per orang)
  - [X] 6.29 Display calculated total with format (Rp/Kg)
  - [X] 6.30 Create date picker field with Popover + Calendar components
  - [X] 6.31 Format date with date-fns (dd/MM/yyyy)
  - [X] 6.32 Show form in Dialog with DialogContent, DialogHeader, DialogTitle
  - [X] 6.33 Add DialogFooter with Cancel and Submit buttons
  - [X] 6.34 Implement create new pembayaran with toast notification
  - [X] 6.35 Implement edit existing pembayaran (pre-fill form)
  - [X] 6.36 Add AlertDialog for delete confirmation
  - [X] 6.37 Use AlertDialogAction and AlertDialogCancel buttons
  - [X] 6.38 Create `src/components/muzakki/BuktiPembayaran.tsx`
  - [X] 6.39 Implement PDF generation with jsPDF
  - [X] 6.40 Design bukti: header (logo, nama masjid), body (detail zakat), footer (ttd)
  - [X] 6.41 Format currency with utils/formatter.ts
  - [X] 6.42 Add "Print Bukti" button with Printer icon
  - [X] 6.43 Test CRUD operations end-to-end
  - [X] 6.44 Verify data persistence in Supabase
  - [X] 6.45 Test RLS policies (user can only access permitted data)

---

- [X] 7.0 Settings & Nilai Zakat Configuration
  - [X] 7.1 Create `src/pages/Settings.tsx` with shadcn/ui Tabs
  - [X] 7.2 Create tab "Nilai Zakat" for yearly configuration
  - [X] 7.3 Create tab "User Management" for admin only
  - [X] 7.4 Create `src/hooks/useNilaiZakat.ts`
  - [X] 7.5 Implement query for fetching list tahun_zakat (ordered by year desc)
  - [X] 7.6 Implement mutation for creating new tahun_zakat
  - [X] 7.7 Implement mutation for updating nilai zakat
  - [X] 7.8 Implement mutation for toggling is_active status
  - [X] 7.9 Create `src/components/settings/NilaiZakatTable.tsx`
  - [X] 7.10 Display columns: Tahun Hijriah, Masehi, Beras (kg), Uang (Rp), Status, Actions
  - [X] 7.11 Show Badge for active year (green) vs inactive (gray)
  - [X] 7.12 Create `src/components/settings/NilaiZakatForm.tsx`
  - [X] 7.13 Add Input for tahun_hijriah (e.g., "1446 H")
  - [X] 7.14 Add Input type="number" for tahun_masehi (e.g., 2025)
  - [X] 7.15 Add Input type="number" for nilai_beras_kg (decimal, min 0)
  - [X] 7.16 Add Input type="number" for nilai_uang_rp (decimal, min 0)
  - [X] 7.17 Add toggle/switch for is_active (only 1 can be active at a time)
  - [X] 7.18 Validate: ensure only 1 active year when setting is_active to true
  - [X] 7.19 Show riwayat nilai zakat (read-only historical data)
  - [X] 7.20 Disable edit/delete for tahun with existing transactions
  - [X] 7.21 Create `src/hooks/useUsers.ts` for user management
  - [X] 7.22 Implement query for fetching users list
  - [X] 7.23 Implement mutation for creating user (Supabase invitation)
  - [X] 7.24 Implement mutation for updating user role
  - [X] 7.25 Implement mutation for toggling user active status
  - [X] 7.26 Create `src/components/settings/UserTable.tsx`
  - [X] 7.27 Display columns: Name, Email, Role, Status, Actions
  - [X] 7.28 Show Badge for role (admin, petugas, viewer) with colors
  - [X] 7.29 Create `src/components/settings/UserForm.tsx`
  - [X] 7.30 Add Input for nama_lengkap (required)
  - [X] 7.31 Add Input type="email" for email (required, email validation)
  - [X] 7.32 Add Select for role (admin, petugas, viewer)
  - [X] 7.33 Add toggle for is_active status
  - [X] 7.34 Implement create user (send invitation email via Supabase)
  - [X] 7.35 Implement update user role and status
  - [X] 7.36 Add role check: only admin can access User Management tab
  - [X] 7.37 Test settings with different user roles
  - [X] 7.38 Verify audit logging for changes

---

- [X] 8.0 Mustahik Management & Import Features
  - [X] 8.1 Create `src/pages/Mustahik.tsx`
  - [X] 8.2 Create `src/hooks/useMustahik.ts`
  - [X] 8.3 Implement query for fetching list mustahik with kategori join
  - [X] 8.4 Implement mutation for create mustahik
  - [X] 8.5 Implement mutation for update mustahik
  - [X] 8.6 Implement mutation for toggle active/inactive status
  - [X] 8.7 Implement mutation for bulk activate/deactivate
  - [X] 8.8 Create `src/components/mustahik/MustahikTable.tsx`
  - [X] 8.9 Display columns: Nama, Alamat, Kategori, Jumlah Anggota, Status, Actions
  - [X] 8.10 Add search by nama and alamat
  - [X] 8.11 Add Select filter by kategori (8 asnaf dropdown)
  - [X] 8.12 Add Select filter by status (aktif/non-aktif/semua)
  - [X] 8.13 Add bulk selection checkboxes for each row
  - [X] 8.14 Add bulk action buttons (Aktifkan Semua, Nonaktifkan Semua)
  - [X] 8.15 Show Badge for status (aktif: green, non-aktif: gray)
  - [X] 8.16 Create `src/components/mustahik/MustahikForm.tsx`
  - [X] 8.17 Create Zod schema: nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan
  - [X] 8.18 Add Input for nama (required, min 3 chars)
  - [X] 8.19 Add Textarea for alamat (required)
  - [X] 8.20 Add Select for kategori_id (8 asnaf options from database)
  - [X] 8.21 Add Input type="number" for jumlah_anggota (min 1)
  - [X] 8.22 Add Input type="tel" for no_telp (optional)
  - [X] 8.23 Add Textarea for catatan (optional)
  - [X] 8.24 Show form in Dialog
  - [X] 8.25 Implement create and edit mustahik
  - [X] 8.26 Create `src/components/mustahik/ImportTahunLalu.tsx`
  - [X] 8.27 Add button "Import Data Tahun Lalu"
  - [X] 8.28 Show Dialog with previous year mustahik list
  - [X] 8.29 Allow selection of mustahik to import (checkboxes)
  - [X] 8.30 Implement copy mustahik from previous year
  - [X] 8.31 Mark imported mustahik with Badge "Data Lama"
  - [X] 8.32 Mark new mustahik with Badge "Penerima Baru"
  - [X] 8.33 Create `src/components/mustahik/RiwayatMustahik.tsx`
  - [X] 8.34 Display history of distributions per mustahik (timeline view)
  - [X] 8.35 Show tahun, jumlah received, jenis (beras/uang)
  - [X] 8.36 Add comparison: tahun ini vs tahun lalu
  - [X] 8.37 Test CRUD operations
  - [X] 8.38 Test bulk operations with multiple selections
  - [X] 8.39 Test import functionality
  - [X] 8.40 Verify data consistency and validation

---

- [X] 9.0 Distribusi Zakat & Validation
  - [X] 9.1 Create `src/pages/Distribusi.tsx`
  - [X] 9.2 Create `src/hooks/useDistribusi.ts`
  - [X] 9.3 Implement query for fetching distribusi list with mustahik join
  - [X] 9.4 Implement mutation for create distribusi
  - [X] 9.5 Implement mutation for update status (pending → selesai)
  - [X] 9.6 Implement query for checking stok availability
  - [X] 9.7 Create `src/components/distribusi/DistribusiTable.tsx`
  - [X] 9.8 Display columns: Nama Mustahik, Kategori, Jenis, Jumlah, Tanggal, Status, Actions
  - [X] 9.9 Add filter by status (pending/selesai/semua)
  - [X] 9.10 Add filter by jenis (beras/uang)
  - [X] 9.11 Add filter by tahun_zakat
  - [X] 9.12 Show Badge for status (pending: yellow, selesai: green)
  - [X] 9.13 Create `src/components/distribusi/DistribusiForm.tsx`
  - [X] 9.14 Add Select for mustahik_id (only active mustahik)
  - [X] 9.15 Display mustahik details when selected (kategori, alamat, jumlah anggota)
  - [X] 9.16 Add radio buttons for jenis_distribusi (beras/uang)
  - [X] 9.17 Add Input type="number" for jumlah (decimal, min 0)
  - [X] 9.18 Implement stok validation before submission
  - [X] 9.19 Query sisa zakat (pemasukan - distribusi)
  - [X] 9.20 Show Alert if stok not sufficient (red alert)
  - [X] 9.21 Display sisa stok after distribution (real-time calculation)
  - [X] 9.22 Add date picker for tanggal_distribusi
  - [X] 9.23 Set default status to 'pending'
  - [X] 9.24 Show form in Dialog
  - [X] 9.25 Implement create distribusi with validation
  - [X] 9.26 Add toast notification on success/error
  - [X] 9.27 Create `src/components/distribusi/BuktiTerima.tsx`
  - [X] 9.28 Implement PDF generation for bukti terima
  - [X] 9.29 Design: header (logo, nama masjid), body (data mustahik, jumlah), footer (ttd petugas)
  - [X] 9.30 Format data with formatter utils
  - [X] 9.31 Add "Print Bukti" button for each row
  - [X] 9.32 Add "Tandai Selesai" button for pending distributions
  - [X] 9.33 Implement status update with confirmation dialog
  - [X] 9.34 Log to audit_logs table for each distribution action
  - [X] 9.35 Test distribusi flow with edge cases (stok habis, invalid data)
  - [X] 9.36 Test PDF generation
  - [X] 9.37 Verify RLS policies for distribusi

---

- [X] 10.0 Reporting & Export System
  - [X] 10.1 Create `src/pages/Laporan.tsx` with shadcn/ui Tabs
  - [X] 10.2 Create tab "Pemasukan" for income reports
  - [X] 10.3 Create tab "Distribusi" for distribution reports
  - [X] 10.4 Create tab "Mustahik" for beneficiary lists
  - [X] 10.5 Create tab "Perbandingan Tahun" for year-over-year comparison
  - [X] 10.6 Create `src/components/laporan/LaporanPemasukan.tsx`
  - [X] 10.7 Display summary cards: Total Beras (kg), Total Uang (Rp), Total Muzakki
  - [X] 10.8 Create detailed table with all pembayaran
  - [X] 10.9 Add date range picker for filtering (from - to)
  - [X] 10.10 Add filter by jenis_zakat (beras/uang/semua)
  - [X] 10.11 Add sort functionality
  - [X] 10.12 Create `src/components/laporan/LaporanDistribusi.tsx`
  - [X] 10.13 Display summary per kategori mustahik (8 asnaf breakdown)
  - [X] 10.14 Show total beras and uang distributed per category
  - [X] 10.15 Create detailed table with distribusi per mustahik
  - [X] 10.16 Add date range filter
  - [X] 10.17 Add filter by kategori_mustahik
  - [X] 10.18 Create `src/components/laporan/LaporanMustahik.tsx`
  - [X] 10.19 Display complete list of mustahik grouped by kategori
  - [X] 10.20 Show aktif vs non-aktif counts
  - [X] 10.21 Add subtotal per kategori
  - [X] 10.22 Create `src/components/laporan/PerbandinganTahun.tsx`
  - [X] 10.23 Add multi-select for choosing years (max 3 years)
  - [X] 10.24 Fetch data for selected years
  - [X] 10.25 Create comparison table: Pemasukan, Distribusi, Sisa per year
  - [X] 10.26 Calculate YoY growth percentage
  - [X] 10.27 Show growth indicator (up/down arrows with colors)
  - [X] 10.28 Create `src/utils/export.ts` (combined pdf and excel exports)
  - [X] 10.29 Implement exportPemasukanPDF() function with jsPDF
  - [X] 10.30 Add header: logo (if available), nama masjid, address
  - [X] 10.31 Add table with jspdf-autotable for data rows
  - [X] 10.32 Add footer: tanggal cetak, nama petugas
  - [X] 10.33 Format currency as Rupiah (Rp 1.234.567)
  - [X] 10.34 Format date as dd/MM/yyyy
  - [X] 10.35 Implement exportDistribusiPDF() function
  - [X] 10.36 Implement exportMustahikPDF() function
  - [X] 10.37 Implement exportPemasukanExcel() with xlsx library
  - [X] 10.38 Create worksheet with headers and data
  - [X] 10.39 Apply basic styling (bold headers, borders)
  - [X] 10.40 Implement exportDistribusiExcel()
  - [X] 10.41 Implement exportMustahikExcel()
  - [X] 10.42 Add export buttons in each tab (PDF and Excel)
  - [X] 10.43 Add icons from lucide-react (Download, FileText)
  - [X] 10.44 Test PDF export with sample data
  - [X] 10.45 Test Excel export with sample data
  - [X] 10.46 Verify print-friendly layout
  - [X] 10.47 Test with large datasets (performance)

---

- [X] 11.0 Build Validation & Optimization (Do BEFORE Testing)

  **Phase 1: Validate Production Build - Do This First**

  - [X] 11.1 Create `DEPLOYMENT.md` file with Vercel deployment guide
  - [X] 11.2 Document production build steps for Vercel
  - [X] 11.3 Run production build locally: `npm run build`
  - [X] 11.4 Test production build locally: `npm run preview`
  - [X] 11.5 Verify all routes work in production build
  - [X] 11.6 Optimize bundle size with code splitting
  - [X] 11.7 Implement lazy loading for routes
  - [X] 11.8 Analyze bundle with `vite-bundle-visualizer` (optional)

  **⚠️ STOP HERE - Go to Task 12.0 for Testing Phase**

  **Phase 3: Deploy to Vercel (Do AFTER Testing Phase 12.0)**

  **⚠️ STOP HERE - Go to Task 12.0 for Testing Phase**

  **Phase 3: Deploy to Vercel (Do AFTER Testing Phase 12.0)**

  - [X] 11.9 Create `vercel.json` configuration file
  - [X] 11.10 Add SPA routing config: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
  - [X] 11.11 Verify `vercel.json` includes proper headers for security
  - [X] 11.12 Push code to GitHub repository (create repo if needed)
  - [X] 11.13 Create Vercel account at vercel.com
  - [X] 11.14 Install Vercel CLI: `npm install -g vercel`
  - [X] 11.15 Login to Vercel: `vercel login`
  - [X] 11.16 Configure production Supabase environment
  - [X] 11.17 Get production Supabase URL and anon key
  - [X] 11.18 Add environment variables in Vercel dashboard (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  - [X] 11.19 Configure Supabase Auth: Add Vercel domain to redirect URLs
  - [X] 11.20 Deploy to Vercel: `vercel --prod` or connect GitHub repo in dashboard
  - [X] 11.21 Verify automatic deployment from GitHub main branch
  - [X] 11.22 Setup preview deployments for pull requests
  - [X] 11.23 Test preview deployment with sample PR
  - [ ] 11.24 Configure custom domain in Vercel (if available)
  - [ ] 11.25 Update DNS records to point to Vercel
  - [ ] 11.26 Verify automatic SSL certificate (Vercel handles this)
  - [ ] 11.27 Force HTTPS (enabled by default in Vercel)
  - [ ] 11.28 Create `robots.txt` in public folder (allow all for public site)
  - [ ] 11.29 Create basic `sitemap.xml` in public folder (optional)
  - [ ] 11.30 Run Lighthouse audit on production URL
  - [ ] 11.31 Fix performance issues (target score > 90)
  - [ ] 11.32 Fix accessibility issues identified by Lighthouse
  - [ ] 11.33 Verify HTTPS and SSL certificate working
  - [ ] 11.34 Test all features in production environment
  - [ ] 11.35 Test on different browsers (Chrome, Firefox, Safari, Edge)
  - [ ] 11.36 Test on mobile devices (iOS and Android)
  - [ ] 11.37 Setup Vercel Analytics (optional, free tier available)
  - [ ] 11.38 Enable Vercel Speed Insights (optional)
  - [ ] 11.39 Setup error monitoring with Sentry (optional)
  - [ ] 11.40 Configure Sentry DSN in Vercel environment variables
  - [ ] 11.41 Test error tracking in production
  - [ ] 11.42 Document Git workflow (main branch → auto-deploy to production)
  - [ ] 11.43 Document rollback procedure (revert commit or redeploy previous version)
  - [ ] 11.44 Setup branch protection rules in GitHub
  - [ ] 11.45 Configure deployment notifications (Slack/Email via Vercel integrations)
  - [ ] 11.46 Document monitoring and maintenance procedures
  - [ ] 11.47 Create backup strategy for database (Supabase automatic backups)
  - [ ] 11.48 Final production checklist: All features tested, SSL verified, monitoring active

---

- [X] 12.0 Testing & Quality Assurance (Do AFTER Build Validation 11.1-11.8)

  **⚠️ Prerequisites: Complete Task 11.1-11.8 first (build validation)**

  **Phase 2: TestSprite Automated Testing (Test on production build)**

  - [X] 12.1 Setup TestSprite MCP for automated testing
  - [X] 12.2 Reload VS Code to activate TestSprite MCP server
  - [X] 12.3 Verify TestSprite tools are loaded and accessible
  - [X] 12.4 Run TestSprite: Test authentication flow (login/logout)
  - [X] 12.5 Run TestSprite: Test role-based access control (admin, petugas, viewer)
  - [X] 12.6 Run TestSprite: Test dashboard data display and refresh
  - [X] 12.7 Run TestSprite: Test settings - nilai zakat configuration
  - [X] 12.8 Run TestSprite: Test muzakki payment entry workflow
  - [X] 12.9 Run TestSprite: Validate form inputs (nama, alamat, jumlah jiwa)
  - [X] 12.10 Run TestSprite: Test auto-calculation of total zakat
  - [X] 12.11 Run TestSprite: Test mustahik management (CRUD operations)
  - [X] 12.12 Run TestSprite: Test bulk operations (activate/deactivate mustahik)
  - [X] 12.13 Run TestSprite: Test import data tahun lalu functionality
  - [X] 12.14 Run TestSprite: Test distribution with stock validation
  - [X] 12.15 Run TestSprite: Verify insufficient stock alerts
  - [X] 12.16 Run TestSprite: Test distribusi status update (pending → selesai)
  - [X] 12.17 Run TestSprite: Test report generation (all tabs)
  - [X] 12.18 Run TestSprite: Test PDF export functionality
  - [X] 12.19 Run TestSprite: Test Excel export functionality
  - [X] 12.20 Run TestSprite: Test user management (admin only)
  - [X] 12.21 Run TestSprite: Complete end-to-end workflow test (payment → distribution → report)
  - [X] 12.22 Run TestSprite: Test edge cases (empty data, max values, invalid inputs)
  - [X] 12.23 Run TestSprite: Test concurrent user scenarios
  - [X] 12.24 Generate TestSprite test report and document findings
  - [X] 12.25 Fix critical and high-priority bugs identified by TestSprite

  **Phase 2 (continued): Manual Testing & Deep Validation (After TestSprite)**

  - [X] 12.26 Setup Vitest for unit testing: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
  - [X] 12.27 Configure vitest in `vite.config.ts`
  - [X] 12.28 Create `src/test/utils.tsx` with test utilities
  - [X] 12.29 Create `src/test/setup.ts` for global test setup
  - [X] 12.30 Write unit tests for formatter functions (currency, date)
  - [X] 12.31 Write unit tests for calculation functions (total zakat, sisa stok)
  - [X] 12.32 Write tests for custom hooks (useMuzakki, useMustahik, useDistribusi)
  - [X] 12.33 Write integration tests for form submission
  - [X] 12.34 Test React Hook Form + Zod validation edge cases
  - [X] 12.35 Write tests for authentication flow edge cases
  - [X] 12.36 Test login, logout, session persistence scenarios
  - [X] 12.37 Test protected routes with different roles (manual verification)
  - [X] 12.38 Test RLS policies in Supabase (manual testing)
  - [X] 12.39 Query as admin, petugas, viewer roles
  - [X] 12.40 Verify data isolation per role
  - [X] 12.41 Create UAT test checklist document
  - [X] 12.42 Perform end-to-end workflow test with real user: Input muzakki → Distribusi → Laporan
  - [X] 12.43 Test edge cases TestSprite might miss: unusual user behavior, rapid clicking, back button
  - [X] 12.44 Test with petugas non-IT (real user testing)
  - [X] 12.45 Gather feedback and iterate on UX issues
  - [X] 12.46 Test browser compatibility (Chrome, Firefox, Safari, Edge latest versions)
  - [X] 12.47 Test on older browsers (if required)
  - [X] 12.48 Test mobile responsive design on iOS devices
  - [X] 12.49 Test mobile responsive design on Android devices
  - [X] 12.50 Test print functionality (bukti pembayaran, bukti terima)
  - [X] 12.51 Verify PDF generation quality and layout
  - [X] 12.52 Test Excel export with various data sizes (small, medium, large datasets)
  - [X] 12.53 Verify data integrity in exports
  - [X] 12.54 Perform security audit (XSS, SQL injection via RLS)
  - [X] 12.55 Test with malicious input data
  - [X] 12.56 Verify all user inputs are sanitized
  - [X] 12.57 Test accessibility (keyboard navigation, screen readers)
  - [X] 12.58 Verify ARIA labels and semantic HTML
  - [X] 12.59 Test backup and restore functionality
  - [X] 12.60 Perform full database backup
  - [X] 12.61 Test restore from backup
  - [X] 12.62 Verify data integrity after restore
  - [X] 12.63 Load testing (simulate 50+ concurrent users) - optional
  - [X] 12.64 Monitor performance during load test
  - [X] 12.65 Fix remaining medium and low-priority bugs
  - [X] 12.66 Document known issues and limitations
  - [X] 12.67 Create bug tracking system (GitHub Issues or similar)
  - [X] 12.68 Final review: All critical bugs fixed, app ready for production

  **✅ Testing Complete - Now go to Task 11.9 for Vercel Deployment (Phase 3)**

---

- [ ] 13.0 Documentation & Training Materials
  - [ ] 13.1 Create `README.md` with project overview
  - [ ] 13.2 Document tech stack and architecture
  - [ ] 13.3 Add project structure explanation
  - [ ] 13.4 Write installation guide for developers
  - [ ] 13.5 Document environment variables with descriptions
  - [ ] 13.6 Write Supabase setup guide (create project, run migrations)
  - [ ] 13.7 Document database schema with ER diagram (optional)
  - [ ] 13.8 Write development workflow guide (`npm run dev`, hot reload)
  - [ ] 13.9 Document build and deployment process
  - [ ] 13.10 Add troubleshooting section (common issues)
  - [ ] 13.11 Create `USER_MANUAL.md` in Bahasa Indonesia
  - [ ] 13.12 Add section: Pendahuluan (overview aplikasi)
  - [ ] 13.13 Add section: Cara Login & Logout (with screenshots)
  - [ ] 13.14 Add section: Dashboard (penjelasan setiap card dan chart)
  - [ ] 13.15 Add section: Input Pembayaran Zakat (step-by-step guide)
  - [ ] 13.16 Add screenshots for each step
  - [ ] 13.17 Add section: Mengelola Data Mustahik
  - [ ] 13.18 Add section: Distribusi Zakat (with validasi stok)
  - [ ] 13.19 Add section: Melihat dan Export Laporan
  - [ ] 13.20 Add section: Settings (nilai zakat, user management)
  - [ ] 13.21 Add section: Backup Data (manual dan otomatis)
  - [ ] 13.22 Add section: Troubleshooting dan FAQ
  - [ ] 13.23 Create video tutorial for each major feature
  - [ ] 13.24 Record screen with narration in Bahasa Indonesia
  - [ ] 13.25 Edit videos (add captions if needed)
  - [ ] 13.26 Upload videos to YouTube (unlisted)
  - [ ] 13.27 Add video links to USER_MANUAL.md
  - [ ] 13.28 Create `docs/SOP_PETUGAS.pdf` (1-page SOP)
  - [ ] 13.29 Add SOP: Workflow Harian (buka app → input data → backup → logout)
  - [ ] 13.30 Add SOP: Workflow Mingguan (backup data verification)
  - [ ] 13.31 Add SOP: Workflow Akhir Ramadhan (export laporan, backup final, arsip)
  - [ ] 13.32 Design SOP with flowchart/checklist format
  - [ ] 13.33 Document maintenance schedule (quarterly dependency updates)
  - [ ] 13.34 Create contact information sheet for support
  - [ ] 13.35 Add support channels (email, WhatsApp, remote assistance)
  - [ ] 13.36 Package all documentation in `/docs` folder
  - [ ] 13.37 Review all documentation for completeness
  - [ ] 13.38 Have non-IT user review user manual for clarity
  - [ ] 13.39 Finalize all documentation
  - [ ] 13.40 Prepare training session presentation slides

---

**All sub-tasks have been generated! Start with task 0.1 to create the feature branch, then proceed sequentially through each phase.** 🚀
