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

- [ ] 1.0 Project Setup & Infrastructure
  - [ ] 1.1 Create new Vite + React + TypeScript project (`npm create vite@latest zakat-fitrah-app -- --template react-ts`)
  - [ ] 1.2 Navigate to project directory (`cd zakat-fitrah-app`)
  - [ ] 1.3 Install core dependencies: `npm install @supabase/supabase-js @tanstack/react-query react-router-dom zustand`
  - [ ] 1.4 Install TailwindCSS: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
  - [ ] 1.5 Configure TailwindCSS in `tailwind.config.js` (content paths for src directory)
  - [ ] 1.6 Add TailwindCSS directives to `src/index.css`
  - [ ] 1.7 Install shadcn/ui dependencies: `npm install class-variance-authority clsx tailwind-merge lucide-react`
  - [ ] 1.8 Initialize shadcn/ui: `npx shadcn-ui@latest init` (choose Default style, Slate color)
  - [ ] 1.9 Verify `components.json` created with correct path aliases
  - [ ] 1.10 Verify `src/lib/utils.ts` created with `cn()` helper function
  - [ ] 1.11 Install form libraries: `npm install react-hook-form zod @hookform/resolvers`
  - [ ] 1.12 Install export libraries: `npm install jspdf jspdf-autotable xlsx`
  - [ ] 1.13 Install chart library: `npm install recharts`
  - [ ] 1.14 Install date utilities: `npm install date-fns`
  - [ ] 1.15 Configure TypeScript path aliases in `tsconfig.json` (`@/*` → `./src/*`)
  - [ ] 1.16 Update `vite.config.ts` to support path aliases
  - [ ] 1.17 Create `.env.example` with Supabase variables template
  - [ ] 1.18 Create `.env` file (copy from .env.example, add to .gitignore)
  - [ ] 1.19 Update `package.json` scripts (dev, build, preview, lint)
  - [ ] 1.20 Initialize git repository if not already initialized

---

- [ ] 2.0 Database Schema & Supabase Configuration
  - [ ] 2.1 Create new Supabase project at supabase.com
  - [ ] 2.2 Copy project URL and anon key to `.env` file
  - [ ] 2.3 Create `supabase/migrations/001_initial_schema.sql` file
  - [ ] 2.4 Write SQL for `users` table (extends auth.users with role, nama_lengkap, is_active)
  - [ ] 2.5 Write SQL for `tahun_zakat` table (id, tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active, timestamps)
  - [ ] 2.6 Write SQL for `kategori_mustahik` table (id, nama, deskripsi) with 8 asnaf
  - [ ] 2.7 Write SQL for `muzakki` table (id, nama_kk, alamat, no_telp, timestamps)
  - [ ] 2.8 Write SQL for `pembayaran_zakat` table with all foreign keys and enums
  - [ ] 2.9 Write SQL for `mustahik` table with kategori relation
  - [ ] 2.10 Write SQL for `distribusi_zakat` table with status enum
  - [ ] 2.11 Write SQL for `audit_logs` table with jsonb columns
  - [ ] 2.12 Create indexes for foreign keys and frequently searched columns
  - [ ] 2.13 Run migration via Supabase SQL Editor
  - [ ] 2.14 Verify all tables created successfully
  - [ ] 2.15 Create `supabase/migrations/002_rls_policies.sql`
  - [ ] 2.16 Write RLS policy for admin role (full access to all tables)
  - [ ] 2.17 Write RLS policy for petugas role (CRUD except delete final reports)
  - [ ] 2.18 Write RLS policy for viewer role (read-only access)
  - [ ] 2.19 Enable RLS on all tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
  - [ ] 2.20 Run RLS migration via Supabase SQL Editor
  - [ ] 2.21 Test RLS policies with different user roles
  - [ ] 2.22 Create `supabase/seed.sql` with sample data
  - [ ] 2.23 Insert 8 kategori_mustahik (Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil)
  - [ ] 2.24 Insert sample tahun_zakat for current year
  - [ ] 2.25 Run seed data via SQL Editor

---

- [ ] 3.0 Authentication & Authorization System
  - [ ] 3.1 Create `src/lib/supabase.ts` with Supabase client initialization
  - [ ] 3.2 Configure Supabase client with env variables
  - [ ] 3.3 Create `src/types/database.types.ts` for TypeScript database types
  - [ ] 3.4 Define User type with role enum (admin, petugas, viewer)
  - [ ] 3.5 Create `src/lib/auth.tsx` with AuthContext
  - [ ] 3.6 Implement `useAuth()` hook with login, logout, user, loading states
  - [ ] 3.7 Add session persistence and auto-refresh
  - [ ] 3.8 Implement 8-hour session timeout logic
  - [ ] 3.9 Create `src/components/auth/ProtectedRoute.tsx`
  - [ ] 3.10 Implement role-based access control in ProtectedRoute
  - [ ] 3.11 Add redirect to login if not authenticated
  - [ ] 3.12 Create `src/pages/Login.tsx` with shadcn/ui components
  - [ ] 3.13 Install shadcn/ui: `npx shadcn-ui@latest add card input button form alert`
  - [ ] 3.14 Import Card, CardHeader, CardTitle, CardContent from shadcn/ui
  - [ ] 3.15 Create login form schema with Zod (email, password validation)
  - [ ] 3.16 Implement form with React Hook Form + shadcn/ui Form components
  - [ ] 3.17 Add email and password fields with proper validation
  - [ ] 3.18 Implement login logic with Supabase Auth (signInWithPassword)
  - [ ] 3.19 Add error handling with shadcn/ui Alert component
  - [ ] 3.20 Add loading state with Loader2 icon from lucide-react
  - [ ] 3.21 Style login page (centered card, responsive)
  - [ ] 3.22 Implement auto-redirect to dashboard after successful login
  - [ ] 3.23 Test login flow with sample users
  - [ ] 3.24 Test session persistence (page refresh)
  - [ ] 3.25 Test logout functionality

---

- [ ] 4.0 Core UI Components & Layouts (shadcn/ui)
  - [ ] 4.1 Install shadcn/ui button: `npx shadcn-ui@latest add button`
  - [ ] 4.2 Install shadcn/ui inputs: `npx shadcn-ui@latest add input label textarea`
  - [ ] 4.3 Install shadcn/ui card: `npx shadcn-ui@latest add card`
  - [ ] 4.4 Install shadcn/ui table: `npx shadcn-ui@latest add table`
  - [ ] 4.5 Install shadcn/ui dialog: `npx shadcn-ui@latest add dialog`
  - [ ] 4.6 Install shadcn/ui dropdown-menu: `npx shadcn-ui@latest add dropdown-menu`
  - [ ] 4.7 Install shadcn/ui select: `npx shadcn-ui@latest add select`
  - [ ] 4.8 Install shadcn/ui toast: `npx shadcn-ui@latest add toast`
  - [ ] 4.9 Install shadcn/ui alert: `npx shadcn-ui@latest add alert`
  - [ ] 4.10 Install shadcn/ui badge: `npx shadcn-ui@latest add badge`
  - [ ] 4.11 Install shadcn/ui avatar: `npx shadcn-ui@latest add avatar`
  - [ ] 4.12 Install shadcn/ui separator: `npx shadcn-ui@latest add separator`
  - [ ] 4.13 Install shadcn/ui tabs: `npx shadcn-ui@latest add tabs`
  - [ ] 4.14 Install shadcn/ui sheet: `npx shadcn-ui@latest add sheet` (mobile sidebar)
  - [ ] 4.15 Install shadcn/ui alert-dialog: `npx shadcn-ui@latest add alert-dialog`
  - [ ] 4.16 Install shadcn/ui calendar & popover: `npx shadcn-ui@latest add calendar popover`
  - [ ] 4.17 Verify all components in `src/components/ui/` folder
  - [ ] 4.18 Create `src/components/layouts/MainLayout.tsx`
  - [ ] 4.19 Import necessary shadcn/ui components and lucide-react icons
  - [ ] 4.20 Create Sidebar component with navigation menu items
  - [ ] 4.21 Add menu items: Dashboard, Muzakki, Mustahik, Distribusi, Laporan, Settings
  - [ ] 4.22 Use Button variant="ghost" for menu items
  - [ ] 4.23 Add Separator between menu sections
  - [ ] 4.24 Add icons from lucide-react (Home, Users, Package, FileText, Settings, LogOut)
  - [ ] 4.25 Create Header component with DropdownMenu for user actions
  - [ ] 4.26 Add Avatar with AvatarFallback showing user initials
  - [ ] 4.27 Add logout option in dropdown menu
  - [ ] 4.28 Make sidebar responsive using Sheet for mobile view
  - [ ] 4.29 Add hamburger Menu button for mobile
  - [ ] 4.30 Create `src/components/layouts/AuthLayout.tsx` with centered Card
  - [ ] 4.31 Create `src/components/common/PageHeader.tsx` component
  - [ ] 4.32 Create `src/components/common/LoadingSpinner.tsx` with Loader2 icon
  - [ ] 4.33 Create `src/components/common/EmptyState.tsx` with Card and icons
  - [ ] 4.34 Create `src/App.tsx` with React Router setup
  - [ ] 4.35 Setup BrowserRouter and Routes
  - [ ] 4.36 Configure protected and public routes
  - [ ] 4.37 Wrap app with AuthProvider from auth context
  - [ ] 4.38 Setup QueryClientProvider for React Query
  - [ ] 4.39 Add Toaster component at app root level
  - [ ] 4.40 Test navigation between pages
  - [ ] 4.41 Test responsive layout on mobile and desktop
  - [ ] 4.42 Verify all shadcn/ui components work correctly

---

- [ ] 5.0 Dashboard & Analytics
  - [ ] 5.1 Create `src/pages/Dashboard.tsx`
  - [ ] 5.2 Create `src/hooks/useDashboard.ts` with React Query
  - [ ] 5.3 Implement query for total pemasukan beras (aggregate pembayaran_zakat)
  - [ ] 5.4 Implement query for total pemasukan uang
  - [ ] 5.5 Implement query for total muzakki count
  - [ ] 5.6 Implement query for total mustahik (aktif dan non-aktif)
  - [ ] 5.7 Implement query for total distribusi
  - [ ] 5.8 Implement query for sisa zakat (pemasukan - distribusi)
  - [ ] 5.9 Add filter by tahun_zakat_id with Select component
  - [ ] 5.10 Create `src/components/dashboard/StatCard.tsx` using shadcn/ui Card
  - [ ] 5.11 Add icon prop from lucide-react for each stat card
  - [ ] 5.12 Add trend indicator (up/down) with percentage
  - [ ] 5.13 Display 6 stat cards in grid layout (responsive)
  - [ ] 5.14 Create `src/components/dashboard/PemasukanChart.tsx` with Recharts
  - [ ] 5.15 Use BarChart from recharts for monthly pemasukan
  - [ ] 5.16 Fetch monthly aggregated data from Supabase
  - [ ] 5.17 Wrap chart in shadcn/ui Card component
  - [ ] 5.18 Make chart responsive
  - [ ] 5.19 Create `src/components/dashboard/DistribusiProgress.tsx`
  - [ ] 5.20 Calculate percentage distribusi vs pemasukan
  - [ ] 5.21 Use shadcn/ui Progress component (if available) or custom progress bar
  - [ ] 5.22 Show distribusi completed vs pending with different colors
  - [ ] 5.23 Add alert if sisa zakat < 10% of total pemasukan (use Alert component)
  - [ ] 5.24 Implement auto-refresh with React Query refetchInterval (30 seconds)
  - [ ] 5.25 Add manual refresh button
  - [ ] 5.26 Test dashboard with various data scenarios
  - [ ] 5.27 Verify responsive layout on different screen sizes

---

- [ ] 6.0 Muzakki Management & Pembayaran Zakat
  - [ ] 6.1 Create `src/pages/Muzakki.tsx`
  - [ ] 6.2 Create `src/hooks/useMuzakki.ts` with React Query
  - [ ] 6.3 Implement useQuery for fetching list pembayaran_zakat with joins
  - [ ] 6.4 Implement useMutation for create pembayaran
  - [ ] 6.5 Implement useMutation for update pembayaran
  - [ ] 6.6 Implement useMutation for delete pembayaran
  - [ ] 6.7 Add optimistic updates for better UX
  - [ ] 6.8 Create `src/components/muzakki/MuzakkiTable.tsx` with shadcn/ui Table
  - [ ] 6.9 Use Table, TableHeader, TableBody, TableRow, TableCell components
  - [ ] 6.10 Display columns: Nama KK, Alamat, Jiwa, Jenis Zakat, Total, Tanggal, Actions
  - [ ] 6.11 Add search Input with Search icon from lucide-react
  - [ ] 6.12 Implement debounced search for nama and alamat
  - [ ] 6.13 Add Select filter for jenis_zakat (beras/uang)
  - [ ] 6.14 Add Select filter for tahun_zakat
  - [ ] 6.15 Add sort functionality (by nama, tanggal, total)
  - [ ] 6.16 Implement pagination (20 items per page)
  - [ ] 6.17 Add action buttons (Edit, Delete, Print) with lucide-react icons
  - [ ] 6.18 Create `src/components/muzakki/MuzakkiForm.tsx` with shadcn/ui Form
  - [ ] 6.19 Import Form, FormField, FormItem, FormLabel, FormControl, FormMessage
  - [ ] 6.20 Create Zod schema for validation (nama_kk, alamat, no_telp, jumlah_jiwa, jenis_zakat)
  - [ ] 6.21 Use useForm with zodResolver
  - [ ] 6.22 Add Input for nama_kk (required, min 3 chars)
  - [ ] 6.23 Add Textarea for alamat (required)
  - [ ] 6.24 Add Input type="tel" for no_telp (optional, phone format)
  - [ ] 6.25 Add Input type="number" for jumlah_jiwa (min 1, required)
  - [ ] 6.26 Add Select for jenis_zakat (beras/uang)
  - [ ] 6.27 Fetch nilai per orang from active tahun_zakat
  - [ ] 6.28 Implement auto-calculate total zakat (jiwa × nilai per orang)
  - [ ] 6.29 Display calculated total with format (Rp/Kg)
  - [ ] 6.30 Create date picker field with Popover + Calendar components
  - [ ] 6.31 Format date with date-fns (dd/MM/yyyy)
  - [ ] 6.32 Show form in Dialog with DialogContent, DialogHeader, DialogTitle
  - [ ] 6.33 Add DialogFooter with Cancel and Submit buttons
  - [ ] 6.34 Implement create new pembayaran with toast notification
  - [ ] 6.35 Implement edit existing pembayaran (pre-fill form)
  - [ ] 6.36 Add AlertDialog for delete confirmation
  - [ ] 6.37 Use AlertDialogAction and AlertDialogCancel buttons
  - [ ] 6.38 Create `src/components/muzakki/BuktiPembayaran.tsx`
  - [ ] 6.39 Implement PDF generation with jsPDF
  - [ ] 6.40 Design bukti: header (logo, nama masjid), body (detail zakat), footer (ttd)
  - [ ] 6.41 Format currency with utils/formatter.ts
  - [ ] 6.42 Add "Print Bukti" button with Printer icon
  - [ ] 6.43 Test CRUD operations end-to-end
  - [ ] 6.44 Verify data persistence in Supabase
  - [ ] 6.45 Test RLS policies (user can only access permitted data)

---

- [ ] 7.0 Settings & Nilai Zakat Configuration
  - [ ] 7.1 Create `src/pages/Settings.tsx` with shadcn/ui Tabs
  - [ ] 7.2 Create tab "Nilai Zakat" for yearly configuration
  - [ ] 7.3 Create tab "User Management" for admin only
  - [ ] 7.4 Create `src/hooks/useNilaiZakat.ts`
  - [ ] 7.5 Implement query for fetching list tahun_zakat (ordered by year desc)
  - [ ] 7.6 Implement mutation for creating new tahun_zakat
  - [ ] 7.7 Implement mutation for updating nilai zakat
  - [ ] 7.8 Implement mutation for toggling is_active status
  - [ ] 7.9 Create `src/components/settings/NilaiZakatTable.tsx`
  - [ ] 7.10 Display columns: Tahun Hijriah, Masehi, Beras (kg), Uang (Rp), Status, Actions
  - [ ] 7.11 Show Badge for active year (green) vs inactive (gray)
  - [ ] 7.12 Create `src/components/settings/NilaiZakatForm.tsx`
  - [ ] 7.13 Add Input for tahun_hijriah (e.g., "1446 H")
  - [ ] 7.14 Add Input type="number" for tahun_masehi (e.g., 2025)
  - [ ] 7.15 Add Input type="number" for nilai_beras_kg (decimal, min 0)
  - [ ] 7.16 Add Input type="number" for nilai_uang_rp (decimal, min 0)
  - [ ] 7.17 Add toggle/switch for is_active (only 1 can be active at a time)
  - [ ] 7.18 Validate: ensure only 1 active year when setting is_active to true
  - [ ] 7.19 Show riwayat nilai zakat (read-only historical data)
  - [ ] 7.20 Disable edit/delete for tahun with existing transactions
  - [ ] 7.21 Create `src/hooks/useUsers.ts` for user management
  - [ ] 7.22 Implement query for fetching users list
  - [ ] 7.23 Implement mutation for creating user (Supabase invitation)
  - [ ] 7.24 Implement mutation for updating user role
  - [ ] 7.25 Implement mutation for toggling user active status
  - [ ] 7.26 Create `src/components/settings/UserTable.tsx`
  - [ ] 7.27 Display columns: Name, Email, Role, Status, Actions
  - [ ] 7.28 Show Badge for role (admin, petugas, viewer) with colors
  - [ ] 7.29 Create `src/components/settings/UserForm.tsx`
  - [ ] 7.30 Add Input for nama_lengkap (required)
  - [ ] 7.31 Add Input type="email" for email (required, email validation)
  - [ ] 7.32 Add Select for role (admin, petugas, viewer)
  - [ ] 7.33 Add toggle for is_active status
  - [ ] 7.34 Implement create user (send invitation email via Supabase)
  - [ ] 7.35 Implement update user role and status
  - [ ] 7.36 Add role check: only admin can access User Management tab
  - [ ] 7.37 Test settings with different user roles
  - [ ] 7.38 Verify audit logging for changes

---

- [ ] 8.0 Mustahik Management & Import Features
  - [ ] 8.1 Create `src/pages/Mustahik.tsx`
  - [ ] 8.2 Create `src/hooks/useMustahik.ts`
  - [ ] 8.3 Implement query for fetching list mustahik with kategori join
  - [ ] 8.4 Implement mutation for create mustahik
  - [ ] 8.5 Implement mutation for update mustahik
  - [ ] 8.6 Implement mutation for toggle active/inactive status
  - [ ] 8.7 Implement mutation for bulk activate/deactivate
  - [ ] 8.8 Create `src/components/mustahik/MustahikTable.tsx`
  - [ ] 8.9 Display columns: Nama, Alamat, Kategori, Jumlah Anggota, Status, Actions
  - [ ] 8.10 Add search by nama and alamat
  - [ ] 8.11 Add Select filter by kategori (8 asnaf dropdown)
  - [ ] 8.12 Add Select filter by status (aktif/non-aktif/semua)
  - [ ] 8.13 Add bulk selection checkboxes for each row
  - [ ] 8.14 Add bulk action buttons (Aktifkan Semua, Nonaktifkan Semua)
  - [ ] 8.15 Show Badge for status (aktif: green, non-aktif: gray)
  - [ ] 8.16 Create `src/components/mustahik/MustahikForm.tsx`
  - [ ] 8.17 Create Zod schema: nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan
  - [ ] 8.18 Add Input for nama (required, min 3 chars)
  - [ ] 8.19 Add Textarea for alamat (required)
  - [ ] 8.20 Add Select for kategori_id (8 asnaf options from database)
  - [ ] 8.21 Add Input type="number" for jumlah_anggota (min 1)
  - [ ] 8.22 Add Input type="tel" for no_telp (optional)
  - [ ] 8.23 Add Textarea for catatan (optional)
  - [ ] 8.24 Show form in Dialog
  - [ ] 8.25 Implement create and edit mustahik
  - [ ] 8.26 Create `src/components/mustahik/ImportTahunLalu.tsx`
  - [ ] 8.27 Add button "Import Data Tahun Lalu"
  - [ ] 8.28 Show Dialog with previous year mustahik list
  - [ ] 8.29 Allow selection of mustahik to import (checkboxes)
  - [ ] 8.30 Implement copy mustahik from previous year
  - [ ] 8.31 Mark imported mustahik with Badge "Data Lama"
  - [ ] 8.32 Mark new mustahik with Badge "Penerima Baru"
  - [ ] 8.33 Create `src/components/mustahik/RiwayatMustahik.tsx`
  - [ ] 8.34 Display history of distributions per mustahik (timeline view)
  - [ ] 8.35 Show tahun, jumlah received, jenis (beras/uang)
  - [ ] 8.36 Add comparison: tahun ini vs tahun lalu
  - [ ] 8.37 Test CRUD operations
  - [ ] 8.38 Test bulk operations with multiple selections
  - [ ] 8.39 Test import functionality
  - [ ] 8.40 Verify data consistency and validation

---

- [ ] 9.0 Distribusi Zakat & Validation
  - [ ] 9.1 Create `src/pages/Distribusi.tsx`
  - [ ] 9.2 Create `src/hooks/useDistribusi.ts`
  - [ ] 9.3 Implement query for fetching distribusi list with mustahik join
  - [ ] 9.4 Implement mutation for create distribusi
  - [ ] 9.5 Implement mutation for update status (pending → selesai)
  - [ ] 9.6 Implement query for checking stok availability
  - [ ] 9.7 Create `src/components/distribusi/DistribusiTable.tsx`
  - [ ] 9.8 Display columns: Nama Mustahik, Kategori, Jenis, Jumlah, Tanggal, Status, Actions
  - [ ] 9.9 Add filter by status (pending/selesai/semua)
  - [ ] 9.10 Add filter by jenis (beras/uang)
  - [ ] 9.11 Add filter by tahun_zakat
  - [ ] 9.12 Show Badge for status (pending: yellow, selesai: green)
  - [ ] 9.13 Create `src/components/distribusi/DistribusiForm.tsx`
  - [ ] 9.14 Add Select for mustahik_id (only active mustahik)
  - [ ] 9.15 Display mustahik details when selected (kategori, alamat, jumlah anggota)
  - [ ] 9.16 Add radio buttons for jenis_distribusi (beras/uang)
  - [ ] 9.17 Add Input type="number" for jumlah (decimal, min 0)
  - [ ] 9.18 Implement stok validation before submission
  - [ ] 9.19 Query sisa zakat (pemasukan - distribusi)
  - [ ] 9.20 Show Alert if stok not sufficient (red alert)
  - [ ] 9.21 Display sisa stok after distribution (real-time calculation)
  - [ ] 9.22 Add date picker for tanggal_distribusi
  - [ ] 9.23 Set default status to 'pending'
  - [ ] 9.24 Show form in Dialog
  - [ ] 9.25 Implement create distribusi with validation
  - [ ] 9.26 Add toast notification on success/error
  - [ ] 9.27 Create `src/components/distribusi/BuktiTerima.tsx`
  - [ ] 9.28 Implement PDF generation for bukti terima
  - [ ] 9.29 Design: header (logo, nama masjid), body (data mustahik, jumlah), footer (ttd petugas)
  - [ ] 9.30 Format data with formatter utils
  - [ ] 9.31 Add "Print Bukti" button for each row
  - [ ] 9.32 Add "Tandai Selesai" button for pending distributions
  - [ ] 9.33 Implement status update with confirmation dialog
  - [ ] 9.34 Log to audit_logs table for each distribution action
  - [ ] 9.35 Test distribusi flow with edge cases (stok habis, invalid data)
  - [ ] 9.36 Test PDF generation
  - [ ] 9.37 Verify RLS policies for distribusi

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
