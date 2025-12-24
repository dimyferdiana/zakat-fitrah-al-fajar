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

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/zakat-management-app`)

---

- [x] 1.0 Project Setup & Infrastructure
  - [x] 1.1 Create new Vite + React + TypeScript project (`npm create vite@latest zakat-fitrah-app -- --template react-ts`)
  - [x] 1.2 Navigate to project directory (`cd zakat-fitrah-app`)
  - [x] 1.3 Install core dependencies: `npm install @supabase/supabase-js @tanstack/react-query react-router-dom zustand`
  - [x] 1.4 Install TailwindCSS: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
  - [x] 1.5 Configure TailwindCSS in `tailwind.config.js` (content paths for src directory)
  - [x] 1.6 Add TailwindCSS directives to `src/index.css`
  - [x] 1.7 Install shadcn/ui dependencies: `npm install class-variance-authority clsx tailwind-merge lucide-react`
  - [x] 1.8 Initialize shadcn/ui: `npx shadcn-ui@latest init` (choose Default style, Slate color)
  - [x] 1.9 Verify `components.json` created with correct path aliases
  - [x] 1.10 Verify `src/lib/utils.ts` created with `cn()` helper function
  - [x] 1.11 Install form libraries: `npm install react-hook-form zod @hookform/resolvers`
  - [x] 1.12 Install export libraries: `npm install jspdf jspdf-autotable xlsx`
  - [x] 1.13 Install chart library: `npm install recharts`
  - [x] 1.14 Install date utilities: `npm install date-fns`
  - [x] 1.15 Configure TypeScript path aliases in `tsconfig.json` (`@/*` → `./src/*`)
  - [x] 1.16 Update `vite.config.ts` to support path aliases
  - [x] 1.17 Create `.env.example` with Supabase variables template
  - [x] 1.18 Create `.env` file (copy from .env.example, add to .gitignore)
  - [x] 1.19 Update `package.json` scripts (dev, build, preview, lint)
  - [x] 1.20 Initialize git repository if not already initialized

---

- [x] 2.0 Database Schema & Supabase Configuration
  - [x] 2.1 Create new Supabase project at supabase.com
  - [x] 2.2 Copy project URL and anon key to `.env` file
  - [x] 2.3 Create `supabase/migrations/001_initial_schema.sql` file
  - [x] 2.4 Write SQL for `users` table (extends auth.users with role, nama_lengkap, is_active)
  - [x] 2.5 Write SQL for `tahun_zakat` table (id, tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active, timestamps)
  - [x] 2.6 Write SQL for `kategori_mustahik` table (id, nama, deskripsi) with 8 asnaf
  - [x] 2.7 Write SQL for `muzakki` table (id, nama_kk, alamat, no_telp, timestamps)
  - [x] 2.8 Write SQL for `pembayaran_zakat` table with all foreign keys and enums
  - [x] 2.9 Write SQL for `mustahik` table with kategori relation
  - [x] 2.10 Write SQL for `distribusi_zakat` table with status enum
  - [x] 2.11 Write SQL for `audit_logs` table with jsonb columns
  - [x] 2.12 Create indexes for foreign keys and frequently searched columns
  - [x] 2.13 Run migration via Supabase SQL Editor
  - [x] 2.14 Verify all tables created successfully
  - [x] 2.15 Create `supabase/migrations/002_rls_policies.sql`
  - [x] 2.16 Write RLS policy for admin role (full access to all tables)
  - [x] 2.17 Write RLS policy for petugas role (CRUD except delete final reports)
  - [x] 2.18 Write RLS policy for viewer role (read-only access)
  - [x] 2.19 Enable RLS on all tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
  - [x] 2.20 Run RLS migration via Supabase SQL Editor
  - [x] 2.21 Test RLS policies with different user roles
  - [x] 2.22 Create `supabase/seed.sql` with sample data
  - [x] 2.23 Insert 8 kategori_mustahik (Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil)
  - [x] 2.24 Insert sample tahun_zakat for current year
  - [x] 2.25 Run seed data via SQL Editor

---

- [x] 3.0 Authentication & Authorization System
  - [x] 3.1 Create `src/lib/supabase.ts` with Supabase client initialization
  - [x] 3.2 Configure Supabase client with env variables
  - [x] 3.3 Create `src/types/database.types.ts` for TypeScript database types
  - [x] 3.4 Define User type with role enum (admin, petugas, viewer)
  - [x] 3.5 Create `src/lib/auth.tsx` with AuthContext
  - [x] 3.6 Implement `useAuth()` hook with login, logout, user, loading states
  - [x] 3.7 Add session persistence and auto-refresh
  - [x] 3.8 Implement 8-hour session timeout logic
  - [x] 3.9 Create `src/components/auth/ProtectedRoute.tsx`
  - [x] 3.10 Implement role-based access control in ProtectedRoute
  - [x] 3.11 Add redirect to login if not authenticated
  - [x] 3.12 Create `src/pages/Login.tsx` with shadcn/ui components
  - [x] 3.13 Install shadcn/ui: `npx shadcn-ui@latest add card input button form alert`
  - [x] 3.14 Import Card, CardHeader, CardTitle, CardContent from shadcn/ui
  - [x] 3.15 Create login form schema with Zod (email, password validation)
  - [x] 3.16 Implement form with React Hook Form + shadcn/ui Form components
  - [x] 3.17 Add email and password fields with proper validation
  - [x] 3.18 Implement login logic with Supabase Auth (signInWithPassword)
  - [x] 3.19 Add error handling with shadcn/ui Alert component
  - [x] 3.20 Add loading state with Loader2 icon from lucide-react
  - [x] 3.21 Style login page (centered card, responsive)
  - [x] 3.22 Implement auto-redirect to dashboard after successful login
  - [x] 3.23 Test login flow with sample users
  - [x] 3.24 Test session persistence (page refresh)
  - [x] 3.25 Test logout functionality

---

- [x] 4.0 Core UI Components & Layouts (shadcn/ui)
  - [x] 4.1 Install shadcn/ui button: `npx shadcn-ui@latest add button`
  - [x] 4.2 Install shadcn/ui inputs: `npx shadcn-ui@latest add input label textarea`
  - [x] 4.3 Install shadcn/ui card: `npx shadcn-ui@latest add card`
  - [x] 4.4 Install shadcn/ui table: `npx shadcn-ui@latest add table`
  - [x] 4.5 Install shadcn/ui dialog: `npx shadcn-ui@latest add dialog`
  - [x] 4.6 Install shadcn/ui dropdown-menu: `npx shadcn-ui@latest add dropdown-menu`
  - [x] 4.7 Install shadcn/ui select: `npx shadcn-ui@latest add select`
  - [x] 4.8 Install shadcn/ui toast: `npx shadcn-ui@latest add toast` (used sonner instead)
  - [x] 4.9 Install shadcn/ui alert: `npx shadcn-ui@latest add alert`
  - [x] 4.10 Install shadcn/ui badge: `npx shadcn-ui@latest add badge`
  - [x] 4.11 Install shadcn/ui avatar: `npx shadcn-ui@latest add avatar`
  - [x] 4.12 Install shadcn/ui separator: `npx shadcn-ui@latest add separator`
  - [x] 4.13 Install shadcn/ui tabs: `npx shadcn-ui@latest add tabs`
  - [x] 4.14 Install shadcn/ui sheet: `npx shadcn-ui@latest add sheet` (mobile sidebar)
  - [x] 4.15 Install shadcn/ui alert-dialog: `npx shadcn-ui@latest add alert-dialog`
  - [x] 4.16 Install shadcn/ui calendar & popover: `npx shadcn-ui@latest add calendar popover`
  - [x] 4.17 Verify all components in `src/components/ui/` folder
  - [x] 4.18 Create `src/components/layouts/MainLayout.tsx`
  - [x] 4.19 Import necessary shadcn/ui components and lucide-react icons
  - [x] 4.20 Create Sidebar component with navigation menu items
  - [x] 4.21 Add menu items: Dashboard, Muzakki, Mustahik, Distribusi, Laporan, Settings
  - [x] 4.22 Use Button variant="ghost" for menu items
  - [x] 4.23 Add Separator between menu sections
  - [x] 4.24 Add icons from lucide-react (Home, Users, Package, FileText, Settings, LogOut)
  - [x] 4.25 Create Header component with DropdownMenu for user actions
  - [x] 4.26 Add Avatar with AvatarFallback showing user initials
  - [x] 4.27 Add logout option in dropdown menu
  - [x] 4.28 Make sidebar responsive using Sheet for mobile view
  - [x] 4.29 Add hamburger Menu button for mobile
  - [ ] 4.30 Create `src/components/layouts/AuthLayout.tsx` with centered Card (skipped - Login page already has layout)
  - [x] 4.31 Create `src/components/common/PageHeader.tsx` component
  - [x] 4.32 Create `src/components/common/LoadingSpinner.tsx` with Loader2 icon
  - [x] 4.33 Create `src/components/common/EmptyState.tsx` with Card and icons
  - [x] 4.34 Create `src/App.tsx` with React Router setup
  - [x] 4.35 Setup BrowserRouter and Routes
  - [x] 4.36 Configure protected and public routes
  - [x] 4.37 Wrap app with AuthProvider from auth context
  - [x] 4.38 Setup QueryClientProvider for React Query
  - [x] 4.39 Add Toaster component at app root level
  - [x] 4.40 Test navigation between pages
  - [x] 4.41 Test responsive layout on mobile and desktop
  - [x] 4.42 Verify all shadcn/ui components work correctly

---

- [x] 5.0 Dashboard & Analytics
  - [x] 5.1 Create `src/pages/Dashboard.tsx`
  - [x] 5.2 Create `src/hooks/useDashboard.ts` with React Query
  - [x] 5.3 Implement query for total pemasukan beras (aggregate pembayaran_zakat)
  - [x] 5.4 Implement query for total pemasukan uang
  - [x] 5.5 Implement query for total muzakki count
  - [x] 5.6 Implement query for total mustahik (aktif dan non-aktif)
  - [x] 5.7 Implement query for total distribusi
  - [x] 5.8 Implement query for sisa zakat (pemasukan - distribusi)
  - [x] 5.9 Add filter by tahun_zakat_id with Select component
  - [x] 5.10 Create `src/components/dashboard/StatCard.tsx` using shadcn/ui Card
  - [x] 5.11 Add icon prop from lucide-react for each stat card
  - [x] 5.12 Add trend indicator (up/down) with percentage
  - [x] 5.13 Display 6 stat cards in grid layout (responsive)
  - [x] 5.14 Create `src/components/dashboard/PemasukanChart.tsx` with Recharts
  - [x] 5.15 Use BarChart from recharts for monthly pemasukan
  - [x] 5.16 Fetch monthly aggregated data from Supabase
  - [x] 5.17 Wrap chart in shadcn/ui Card component
  - [x] 5.18 Make chart responsive
  - [x] 5.19 Create `src/components/dashboard/DistribusiProgress.tsx`
  - [x] 5.20 Calculate percentage distribusi vs pemasukan
  - [x] 5.21 Use shadcn/ui Progress component (if available) or custom progress bar
  - [x] 5.22 Show distribusi completed vs pending with different colors
  - [x] 5.23 Add alert if sisa zakat < 10% of total pemasukan (use Alert component)
  - [x] 5.24 Implement auto-refresh with React Query refetchInterval (30 seconds)
  - [x] 5.25 Add manual refresh button
  - [x] 5.26 Test dashboard with various data scenarios
  - [x] 5.27 Verify responsive layout on different screen sizes

---

- [x] 6.0 Muzakki Management & Pembayaran Zakat
  - [x] 6.1 Create `src/pages/Muzakki.tsx`
  - [x] 6.2 Create `src/hooks/useMuzakki.ts` with React Query
  - [x] 6.3 Implement useQuery for fetching list pembayaran_zakat with joins
  - [x] 6.4 Implement useMutation for create pembayaran
  - [x] 6.5 Implement useMutation for update pembayaran
  - [x] 6.6 Implement useMutation for delete pembayaran
  - [x] 6.7 Add optimistic updates for better UX
  - [x] 6.8 Create `src/components/muzakki/MuzakkiTable.tsx` with shadcn/ui Table
  - [x] 6.9 Use Table, TableHeader, TableBody, TableRow, TableCell components
  - [x] 6.10 Display columns: Nama KK, Alamat, Jiwa, Jenis Zakat, Total, Tanggal, Actions
  - [x] 6.11 Add search Input with Search icon from lucide-react
  - [x] 6.12 Implement debounced search for nama and alamat
  - [x] 6.13 Add Select filter for jenis_zakat (beras/uang)
  - [x] 6.14 Add Select filter for tahun_zakat
  - [x] 6.15 Add sort functionality (by nama, tanggal, total)
  - [x] 6.16 Implement pagination (20 items per page)
  - [x] 6.17 Add action buttons (Edit, Delete, Print) with lucide-react icons
  - [x] 6.18 Create `src/components/muzakki/MuzakkiForm.tsx` with shadcn/ui Form
  - [x] 6.19 Import Form, FormField, FormItem, FormLabel, FormControl, FormMessage
  - [x] 6.20 Create Zod schema for validation (nama_kk, alamat, no_telp, jumlah_jiwa, jenis_zakat)
  - [x] 6.21 Use useForm with zodResolver
  - [x] 6.22 Add Input for nama_kk (required, min 3 chars)
  - [x] 6.23 Add Textarea for alamat (required)
  - [x] 6.24 Add Input type="tel" for no_telp (optional, phone format)
  - [x] 6.25 Add Input type="number" for jumlah_jiwa (min 1, required)
  - [x] 6.26 Add Select for jenis_zakat (beras/uang)
  - [x] 6.27 Fetch nilai per orang from active tahun_zakat
  - [x] 6.28 Implement auto-calculate total zakat (jiwa × nilai per orang)
  - [x] 6.29 Display calculated total with format (Rp/Kg)
  - [x] 6.30 Create date picker field with Popover + Calendar components
  - [x] 6.31 Format date with date-fns (dd/MM/yyyy)
  - [x] 6.32 Show form in Dialog with DialogContent, DialogHeader, DialogTitle
  - [x] 6.33 Add DialogFooter with Cancel and Submit buttons
  - [x] 6.34 Implement create new pembayaran with toast notification
  - [x] 6.35 Implement edit existing pembayaran (pre-fill form)
  - [x] 6.36 Add AlertDialog for delete confirmation
  - [x] 6.37 Use AlertDialogAction and AlertDialogCancel buttons
  - [x] 6.38 Create `src/components/muzakki/BuktiPembayaran.tsx`
  - [x] 6.39 Implement PDF generation with jsPDF
  - [x] 6.40 Design bukti: header (logo, nama masjid), body (detail zakat), footer (ttd)
  - [x] 6.41 Format currency with utils/formatter.ts
  - [x] 6.42 Add "Print Bukti" button with Printer icon
  - [x] 6.43 Test CRUD operations end-to-end
  - [x] 6.44 Verify data persistence in Supabase
  - [x] 6.45 Test RLS policies (user can only access permitted data)

---

- [x] 7.0 Settings & Nilai Zakat Configuration
  - [x] 7.1 Create `src/pages/Settings.tsx` with shadcn/ui Tabs
  - [x] 7.2 Create tab "Nilai Zakat" for yearly configuration
  - [x] 7.3 Create tab "User Management" for admin only
  - [x] 7.4 Create `src/hooks/useNilaiZakat.ts`
  - [x] 7.5 Implement query for fetching list tahun_zakat (ordered by year desc)
  - [x] 7.6 Implement mutation for creating new tahun_zakat
  - [x] 7.7 Implement mutation for updating nilai zakat
  - [x] 7.8 Implement mutation for toggling is_active status
  - [x] 7.9 Create `src/components/settings/NilaiZakatTable.tsx`
  - [x] 7.10 Display columns: Tahun Hijriah, Masehi, Beras (kg), Uang (Rp), Status, Actions
  - [x] 7.11 Show Badge for active year (green) vs inactive (gray)
  - [x] 7.12 Create `src/components/settings/NilaiZakatForm.tsx`
  - [x] 7.13 Add Input for tahun_hijriah (e.g., "1446 H")
  - [x] 7.14 Add Input type="number" for tahun_masehi (e.g., 2025)
  - [x] 7.15 Add Input type="number" for nilai_beras_kg (decimal, min 0)
  - [x] 7.16 Add Input type="number" for nilai_uang_rp (decimal, min 0)
  - [x] 7.17 Add toggle/switch for is_active (only 1 can be active at a time)
  - [x] 7.18 Validate: ensure only 1 active year when setting is_active to true
  - [x] 7.19 Show riwayat nilai zakat (read-only historical data)
  - [x] 7.20 Disable edit/delete for tahun with existing transactions
  - [x] 7.21 Create `src/hooks/useUsers.ts` for user management
  - [x] 7.22 Implement query for fetching users list
  - [x] 7.23 Implement mutation for creating user (Supabase invitation)
  - [x] 7.24 Implement mutation for updating user role
  - [x] 7.25 Implement mutation for toggling user active status
  - [x] 7.26 Create `src/components/settings/UserTable.tsx`
  - [x] 7.27 Display columns: Name, Email, Role, Status, Actions
  - [x] 7.28 Show Badge for role (admin, petugas, viewer) with colors
  - [x] 7.29 Create `src/components/settings/UserForm.tsx`
  - [x] 7.30 Add Input for nama_lengkap (required)
  - [x] 7.31 Add Input type="email" for email (required, email validation)
  - [x] 7.32 Add Select for role (admin, petugas, viewer)
  - [x] 7.33 Add toggle for is_active status
  - [x] 7.34 Implement create user (send invitation email via Supabase)
  - [x] 7.35 Implement update user role and status
  - [x] 7.36 Add role check: only admin can access User Management tab
  - [x] 7.37 Test settings with different user roles
  - [x] 7.38 Verify audit logging for changes

---

- [x] 8.0 Mustahik Management & Import Features
  - [x] 8.1 Create `src/pages/Mustahik.tsx`
  - [x] 8.2 Create `src/hooks/useMustahik.ts`
  - [x] 8.3 Implement query for fetching list mustahik with kategori join
  - [x] 8.4 Implement mutation for create mustahik
  - [x] 8.5 Implement mutation for update mustahik
  - [x] 8.6 Implement mutation for toggle active/inactive status
  - [x] 8.7 Implement mutation for bulk activate/deactivate
  - [x] 8.8 Create `src/components/mustahik/MustahikTable.tsx`
  - [x] 8.9 Display columns: Nama, Alamat, Kategori, Jumlah Anggota, Status, Actions
  - [x] 8.10 Add search by nama and alamat
  - [x] 8.11 Add Select filter by kategori (8 asnaf dropdown)
  - [x] 8.12 Add Select filter by status (aktif/non-aktif/semua)
  - [x] 8.13 Add bulk selection checkboxes for each row
  - [x] 8.14 Add bulk action buttons (Aktifkan Semua, Nonaktifkan Semua)
  - [x] 8.15 Show Badge for status (aktif: green, non-aktif: gray)
  - [x] 8.16 Create `src/components/mustahik/MustahikForm.tsx`
  - [x] 8.17 Create Zod schema: nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan
  - [x] 8.18 Add Input for nama (required, min 3 chars)
  - [x] 8.19 Add Textarea for alamat (required)
  - [x] 8.20 Add Select for kategori_id (8 asnaf options from database)
  - [x] 8.21 Add Input type="number" for jumlah_anggota (min 1)
  - [x] 8.22 Add Input type="tel" for no_telp (optional)
  - [x] 8.23 Add Textarea for catatan (optional)
  - [x] 8.24 Show form in Dialog
  - [x] 8.25 Implement create and edit mustahik
  - [x] 8.26 Create `src/components/mustahik/ImportTahunLalu.tsx`
  - [x] 8.27 Add button "Import Data Tahun Lalu"
  - [x] 8.28 Show Dialog with previous year mustahik list
  - [x] 8.29 Allow selection of mustahik to import (checkboxes)
  - [x] 8.30 Implement copy mustahik from previous year
  - [x] 8.31 Mark imported mustahik with Badge "Data Lama"
  - [x] 8.32 Mark new mustahik with Badge "Penerima Baru"
  - [x] 8.33 Create `src/components/mustahik/RiwayatMustahik.tsx`
  - [x] 8.34 Display history of distributions per mustahik (timeline view)
  - [x] 8.35 Show tahun, jumlah received, jenis (beras/uang)
  - [x] 8.36 Add comparison: tahun ini vs tahun lalu
  - [x] 8.37 Test CRUD operations
  - [x] 8.38 Test bulk operations with multiple selections
  - [x] 8.39 Test import functionality
  - [x] 8.40 Verify data consistency and validation

---

- [x] 9.0 Distribusi Zakat & Validation
  - [x] 9.1 Create `src/pages/Distribusi.tsx`
  - [x] 9.2 Create `src/hooks/useDistribusi.ts`
  - [x] 9.3 Implement query for fetching distribusi list with mustahik join
  - [x] 9.4 Implement mutation for create distribusi
  - [x] 9.5 Implement mutation for update status (pending → selesai)
  - [x] 9.6 Implement query for checking stok availability
  - [x] 9.7 Create `src/components/distribusi/DistribusiTable.tsx`
  - [x] 9.8 Display columns: Nama Mustahik, Kategori, Jenis, Jumlah, Tanggal, Status, Actions
  - [x] 9.9 Add filter by status (pending/selesai/semua)
  - [x] 9.10 Add filter by jenis (beras/uang)
  - [x] 9.11 Add filter by tahun_zakat
  - [x] 9.12 Show Badge for status (pending: yellow, selesai: green)
  - [x] 9.13 Create `src/components/distribusi/DistribusiForm.tsx`
  - [x] 9.14 Add Select for mustahik_id (only active mustahik)
  - [x] 9.15 Display mustahik details when selected (kategori, alamat, jumlah anggota)
  - [x] 9.16 Add radio buttons for jenis_distribusi (beras/uang)
  - [x] 9.17 Add Input type="number" for jumlah (decimal, min 0)
  - [x] 9.18 Implement stok validation before submission
  - [x] 9.19 Query sisa zakat (pemasukan - distribusi)
  - [x] 9.20 Show Alert if stok not sufficient (red alert)
  - [x] 9.21 Display sisa stok after distribution (real-time calculation)
  - [x] 9.22 Add date picker for tanggal_distribusi
  - [x] 9.23 Set default status to 'pending'
  - [x] 9.24 Show form in Dialog
  - [x] 9.25 Implement create distribusi with validation
  - [x] 9.26 Add toast notification on success/error
  - [x] 9.27 Create `src/components/distribusi/BuktiTerima.tsx`
  - [x] 9.28 Implement PDF generation for bukti terima
  - [x] 9.29 Design: header (logo, nama masjid), body (data mustahik, jumlah), footer (ttd petugas)
  - [x] 9.30 Format data with formatter utils
  - [x] 9.31 Add "Print Bukti" button for each row
  - [x] 9.32 Add "Tandai Selesai" button for pending distributions
  - [x] 9.33 Implement status update with confirmation dialog
  - [x] 9.34 Log to audit_logs table for each distribution action
  - [x] 9.35 Test distribusi flow with edge cases (stok habis, invalid data)
  - [x] 9.36 Test PDF generation
  - [x] 9.37 Verify RLS policies for distribusi

---

- [ ] 10.0 Reporting & Export System
  - [ ] 10.1 Create `src/pages/Laporan.tsx` with shadcn/ui Tabs
  - [ ] 10.2 Create tab "Pemasukan" for income reports
  - [ ] 10.3 Create tab "Distribusi" for distribution reports
  - [ ] 10.4 Create tab "Mustahik" for beneficiary lists
  - [ ] 10.5 Create tab "Perbandingan Tahun" for year-over-year comparison
  - [ ] 10.6 Create `src/components/laporan/LaporanPemasukan.tsx`
  - [ ] 10.7 Display summary cards: Total Beras (kg), Total Uang (Rp), Total Muzakki
  - [ ] 10.8 Create detailed table with all pembayaran
  - [ ] 10.9 Add date range picker for filtering (from - to)
  - [ ] 10.10 Add filter by jenis_zakat (beras/uang/semua)
  - [ ] 10.11 Add sort functionality
  - [ ] 10.12 Create `src/components/laporan/LaporanDistribusi.tsx`
  - [ ] 10.13 Display summary per kategori mustahik (8 asnaf breakdown)
  - [ ] 10.14 Show total beras and uang distributed per category
  - [ ] 10.15 Create detailed table with distribusi per mustahik
  - [ ] 10.16 Add date range filter
  - [ ] 10.17 Add filter by kategori_mustahik
  - [ ] 10.18 Create `src/components/laporan/LaporanMustahik.tsx`
  - [ ] 10.19 Display complete list of mustahik grouped by kategori
  - [ ] 10.20 Show aktif vs non-aktif counts
  - [ ] 10.21 Add subtotal per kategori
  - [ ] 10.22 Create `src/components/laporan/PerbandinganTahun.tsx`
  - [ ] 10.23 Add multi-select for choosing years (max 3 years)
  - [ ] 10.24 Fetch data for selected years
  - [ ] 10.25 Create comparison table: Pemasukan, Distribusi, Sisa per year
  - [ ] 10.26 Calculate YoY growth percentage
  - [ ] 10.27 Show growth indicator (up/down arrows with colors)
  - [ ] 10.28 Create `src/utils/pdf-export.ts`
  - [ ] 10.29 Implement exportPemasukanPDF() function with jsPDF
  - [ ] 10.30 Add header: logo (if available), nama masjid, address
  - [ ] 10.31 Add table with jspdf-autotable for data rows
  - [ ] 10.32 Add footer: tanggal cetak, nama petugas
  - [ ] 10.33 Format currency as Rupiah (Rp 1.234.567)
  - [ ] 10.34 Format date as dd/MM/yyyy
  - [ ] 10.35 Implement exportDistribusiPDF() function
  - [ ] 10.36 Implement exportMustahikPDF() function
  - [ ] 10.37 Create `src/utils/excel-export.ts`
  - [ ] 10.38 Implement exportPemasukanExcel() with xlsx library
  - [ ] 10.39 Create worksheet with headers and data
  - [ ] 10.40 Apply basic styling (bold headers, borders)
  - [ ] 10.41 Implement exportDistribusiExcel()
  - [ ] 10.42 Implement exportMustahikExcel()
  - [ ] 10.43 Add export buttons in each tab (PDF and Excel)
  - [ ] 10.44 Add icons from lucide-react (Download, FileText)
  - [ ] 10.45 Test PDF export with sample data
  - [ ] 10.46 Test Excel export with sample data
  - [ ] 10.47 Verify print-friendly layout
  - [ ] 10.48 Test with large datasets (performance)

---

- [ ] 11.0 Deployment & Production Setup
  - [ ] 11.1 Create `DEPLOYMENT.md` file with detailed instructions
  - [ ] 11.2 Document production build steps
  - [ ] 11.3 Run production build: `npm run build`
  - [ ] 11.4 Test production build locally: `npm run preview`
  - [ ] 11.5 Verify all routes work in production build
  - [ ] 11.6 Optimize bundle size with code splitting
  - [ ] 11.7 Implement lazy loading for routes
  - [ ] 11.8 Analyze bundle with `vite-bundle-visualizer` (optional)
  - [ ] 11.9 Create `.env.production` file
  - [ ] 11.10 Add production Supabase URL and keys
  - [ ] 11.11 Configure Supabase project for production
  - [ ] 11.12 Add production domain to Supabase Auth redirect URLs
  - [ ] 11.13 Create `_redirects` file for SPA routing: `/* /index.html 200`
  - [ ] 11.14 Document cPanel upload process
  - [ ] 11.15 Upload `dist/` folder contents to public_html via FTP/File Manager
  - [ ] 11.16 Upload `_redirects` file to root
  - [ ] 11.17 Document SSL setup with Let's Encrypt in cPanel
  - [ ] 11.18 Generate and install SSL certificate
  - [ ] 11.19 Force HTTPS redirect in .htaccess
  - [ ] 11.20 Create `robots.txt` (allow all for public site)
  - [ ] 11.21 Create basic `sitemap.xml` (optional)
  - [ ] 11.22 Setup Cloudflare CDN (optional)
  - [ ] 11.23 Add domain to Cloudflare
  - [ ] 11.24 Configure DNS settings
  - [ ] 11.25 Enable caching rules for static assets
  - [ ] 11.26 Enable compression (Brotli/Gzip)
  - [ ] 11.27 Deploy to staging domain first for testing
  - [ ] 11.28 Run Lighthouse audit on staging
  - [ ] 11.29 Fix performance issues (target score > 90)
  - [ ] 11.30 Fix accessibility issues
  - [ ] 11.31 Verify HTTPS and SSL certificate
  - [ ] 11.32 Test all features in production environment
  - [ ] 11.33 Test on different browsers (Chrome, Firefox, Safari, Edge)
  - [ ] 11.34 Test on mobile devices (iOS and Android)
  - [ ] 11.35 Setup error monitoring with Sentry (optional)
  - [ ] 11.36 Configure Sentry DSN in production env
  - [ ] 11.37 Test error tracking
  - [ ] 11.38 Document monitoring and maintenance procedures

---

- [ ] 12.0 Testing & Quality Assurance
  - [ ] 12.1 Setup Vitest for unit testing: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
  - [ ] 12.2 Configure vitest in `vite.config.ts`
  - [ ] 12.3 Create `src/test/utils.tsx` with test utilities
  - [ ] 12.4 Create `src/test/setup.ts` for global test setup
  - [ ] 12.5 Write unit tests for formatter functions (currency, date)
  - [ ] 12.6 Write unit tests for calculation functions (total zakat, sisa stok)
  - [ ] 12.7 Write tests for custom hooks (useMuzakki, useMustahik, useDistribusi)
  - [ ] 12.8 Write integration tests for form submission
  - [ ] 12.9 Test React Hook Form + Zod validation
  - [ ] 12.10 Write tests for authentication flow
  - [ ] 12.11 Test login, logout, session persistence
  - [ ] 12.12 Test protected routes with different roles
  - [ ] 12.13 Test RLS policies in Supabase (manual testing)
  - [ ] 12.14 Query as admin, petugas, viewer roles
  - [ ] 12.15 Verify data isolation per role
  - [ ] 12.16 Create UAT test checklist document
  - [ ] 12.17 Perform end-to-end workflow test: Input muzakki → Distribusi → Laporan
  - [ ] 12.18 Test edge cases: stok habis, invalid data, concurrent users
  - [ ] 12.19 Test with petugas non-IT (real user testing)
  - [ ] 12.20 Gather feedback and iterate
  - [ ] 12.21 Test browser compatibility (Chrome, Firefox, Safari, Edge latest versions)
  - [ ] 12.22 Test on older browsers (if required)
  - [ ] 12.23 Test mobile responsive design on iOS devices
  - [ ] 12.24 Test mobile responsive design on Android devices
  - [ ] 12.25 Test print functionality (bukti pembayaran, bukti terima)
  - [ ] 12.26 Verify PDF generation quality and layout
  - [ ] 12.27 Test Excel export with various data sizes
  - [ ] 12.28 Verify data integrity in exports
  - [ ] 12.29 Perform security audit (XSS, SQL injection via RLS)
  - [ ] 12.30 Test with malicious input data
  - [ ] 12.31 Verify all user inputs are sanitized
  - [ ] 12.32 Test backup and restore functionality
  - [ ] 12.33 Perform full database backup
  - [ ] 12.34 Test restore from backup
  - [ ] 12.35 Verify data integrity after restore
  - [ ] 12.36 Load testing (simulate 50+ concurrent users) - optional
  - [ ] 12.37 Monitor performance during load test
  - [ ] 12.38 Fix critical and high-priority bugs
  - [ ] 12.39 Document known issues and limitations
  - [ ] 12.40 Create bug tracking system (GitHub Issues or similar)

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
