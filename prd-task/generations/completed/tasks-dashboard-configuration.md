# Tasks — Dashboard Configuration

## Document Control
- **Version:** V1.7.0
- **Created Date:** 2026-02-26
- **Last Updated:** 2026-02-26
- **Summary of Addition/Adjustment:** Menjabarkan implementasi dashboard dinamis berbasis konfigurasi, widget terpilih, rule agregasi, dan pengaturan visibilitas.

Based on: `prd-task/generations/completed/prd-dashboard-configuration.md`

## Relevant Files

### New Files
- `zakat-fitrah-app/supabase/migrations/027_dashboard_configs.sql` — Creates `dashboard_configs` and `dashboard_widgets` tables with RLS policies.
- `zakat-fitrah-app/src/hooks/useDashboardConfig.ts` — Hooks for fetching, creating, updating, deleting, and duplicating dashboards and widgets.
- `zakat-fitrah-app/src/types/dashboard.ts` — TypeScript types for `DashboardConfig`, `DashboardWidget`, `WidgetType`, `AggregationRule`, etc.
- `zakat-fitrah-app/src/lib/dashboardDefaults.ts` — Constant definition of the default "Dashboard Utama" (20 widgets) used for auto-create.
- `zakat-fitrah-app/src/lib/aggregationRules.ts` — Maps each `rule` ID string to its display label and the corresponding field in `DashboardStats`.
- `zakat-fitrah-app/src/components/dashboard/DashboardRenderer.tsx` — Renders a full dashboard from a list of `DashboardWidget` records.
- `zakat-fitrah-app/src/components/dashboard/widgets/StatCardWidget.tsx` — Renders a single configurable StatCard widget.
- `zakat-fitrah-app/src/components/dashboard/widgets/ChartWidget.tsx` — Renders a configurable monthly chart widget.
- `zakat-fitrah-app/src/components/dashboard/widgets/DistribusiProgressWidget.tsx` — Renders a configurable DistribusiProgress widget.
- `zakat-fitrah-app/src/components/dashboard/widgets/HakAmilWidget.tsx` — Wrapper for the existing `HakAmilCard` component.
- `zakat-fitrah-app/src/components/dashboard/widgets/TextNoteWidget.tsx` — Renders a markdown text/note widget.
- `zakat-fitrah-app/src/components/dashboard/DashboardTabSwitcher.tsx` — Tab switcher component displayed above the dashboard content.
- `zakat-fitrah-app/src/pages/DashboardSettings.tsx` — Admin-only page for managing all dashboards.
- `zakat-fitrah-app/src/pages/DashboardSettingsPage.tsx` — Page wrapper (layout) for DashboardSettings.
- `zakat-fitrah-app/src/components/dashboard/settings/DashboardList.tsx` — Lists all dashboards in the settings page with edit/delete/duplicate actions.
- `zakat-fitrah-app/src/components/dashboard/settings/DashboardFormDialog.tsx` — Dialog for creating/editing a dashboard (title, description, visibility, stat_card_columns).
- `zakat-fitrah-app/src/components/dashboard/settings/WidgetEditorSheet.tsx` — Side sheet for adding or editing a single widget within a dashboard.
- `zakat-fitrah-app/src/components/dashboard/settings/WidgetList.tsx` — Drag-and-drop list of widgets inside the settings editor for a specific dashboard.

### Modified Files
- `zakat-fitrah-app/src/pages/Dashboard.tsx` — Refactored to use `DashboardRenderer` and `DashboardTabSwitcher`, replace hardcoded widgets with dynamic config.
- `zakat-fitrah-app/src/hooks/useDashboard.ts` — Update `total_muzakki` aggregation to filter by `tahun_zakat_id`.
- `zakat-fitrah-app/src/App.tsx` — Add route for `/dashboard-settings`.
- `zakat-fitrah-app/src/components/layouts/` — Add "Dashboard Settings" link to sidebar (admin-only).

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Install `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop before starting task 4.
- The next available migration number is **027**.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [x] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/dashboard-configuration`

- [x] 1.0 Database: Migrations & RLS
  - [x] 1.1 Create migration file `027_dashboard_configs.sql` in `supabase/migrations/`.
  - [x] 1.2 Write `CREATE TABLE dashboard_configs` with columns: `id`, `title`, `description`, `visibility` (default `'public'`), `sort_order`, `stat_card_columns` (default `3`), `created_by`, `created_at`, `updated_at`.
  - [x] 1.3 Write `CREATE TABLE dashboard_widgets` with columns: `id`, `dashboard_id` (FK → `dashboard_configs` ON DELETE CASCADE), `widget_type`, `sort_order`, `width` (default `'full'`), `config` (jsonb, default `'{}'`), `created_at`, `updated_at`.
  - [x] 1.4 Add RLS policy on `dashboard_configs`: authenticated users can `SELECT` rows where `visibility = 'public'` OR the user is admin; only admin can `INSERT`, `UPDATE`, `DELETE`.
  - [x] 1.5 Add RLS policy on `dashboard_widgets`: authenticated users can `SELECT` widgets whose `dashboard_id` belongs to a visible dashboard; only admin can `INSERT`, `UPDATE`, `DELETE`.
  - [x] 1.6 Add `CHECK` constraint on `dashboard_configs.visibility` to only allow `'public'` or `'private'`.
  - [x] 1.7 Add `CHECK` constraint on `dashboard_configs.stat_card_columns` to only allow values `1`, `2`, or `3`.
  - [x] 1.8 Add `CHECK` constraint on `dashboard_widgets.widget_type` to only allow `'stat_card'`, `'chart'`, `'distribusi_progress'`, `'hak_amil'`, `'text_note'`.
  - [x] 1.9 Add `CHECK` constraint on `dashboard_widgets.width` to only allow `'full'` or `'half'`.
  - [x] 1.10 Apply the migration to the local/remote Supabase instance and verify tables are created correctly.

- [x]  Backend Hooks & Data Layer
  - [x]  Create `src/types/dashboard.ts` — define and export interfaces: `DashboardConfig`, `DashboardWidget`, `WidgetType` (union string literal), `WidgetConfig` (per widget type variants), `AggregationRuleId` (union string literal of all 17 rule IDs).
  - [x]  Create `src/lib/aggregationRules.ts` — export a `AGGREGATION_RULES` constant array, each entry with `id: AggregationRuleId`, `label: string`, `format: 'currency' | 'weight' | 'number'`, and `statsField: keyof DashboardStats`. This maps each rule to its display info and the corresponding field on the existing `DashboardStats` type.
  - [x]  Create `src/lib/dashboardDefaults.ts` — export a `DEFAULT_DASHBOARD_WIDGETS` constant array matching the 20-widget "Dashboard Utama" spec from PRD §4.6. Also export `DEFAULT_DASHBOARD_CONFIG` with title, visibility, and stat_card_columns.
  - [x]  Create `src/hooks/useDashboardConfig.ts` — implement `useDashboardConfigs()` hook: fetches all `dashboard_configs` accessible to the current user (RLS handles filtering), ordered by `sort_order`. Use `@tanstack/react-query`.
  - [x]  Implement `useDashboardWidgets(dashboardId: string)` in the same file — fetches `dashboard_widgets` for a given dashboard ID, ordered by `sort_order`.
  - [x]  Implement `useCreateDashboard()` mutation — inserts a new row in `dashboard_configs`, invalidates `['dashboard-configs']` query on success.
  - [x]  Implement `useUpdateDashboard()` mutation — updates `title`, `description`, `visibility`, `sort_order`, `stat_card_columns` for a given dashboard ID.
  - [x]  Implement `useDeleteDashboard()` mutation — deletes a dashboard by ID (widgets cascade). Invalidates configs query.
  - [x]  Implement `useDuplicateDashboard()` mutation — fetches existing dashboard + all its widgets, inserts a new `dashboard_configs` row (title + " — Salinan"), then bulk-inserts copies of all widgets with the new `dashboard_id`. Returns the new dashboard ID.
  - [x] 0 Implement `useCreateWidget()`, `useUpdateWidget()`, `useDeleteWidget()` mutations — each invalidates `['dashboard-widgets', dashboardId]` on success.
  - [x] 1 Implement `useReorderWidgets(dashboardId)` mutation — accepts a reordered array of widget IDs and updates each widget's `sort_order` in a batch (using `Promise.all` over individual updates).
  - [x] 2 Update `src/hooks/useDashboard.ts` — fix `total_muzakki` query to filter by `activeTahunId` (add `.eq('tahun_zakat_id', activeTahunId)` to the COUNT query, matching the PRD aggregation rule spec).

- [x] 3.0 Dashboard Renderer & Widget Components
  - [x] 3.1 Create `src/components/dashboard/widgets/StatCardWidget.tsx` — accepts `config: StatCardConfig` (label, icon, rule, format) and `stats: DashboardStats`. Looks up the value from `stats` using `AGGREGATION_RULES` map, formats it as currency/weight/number, renders using existing `StatCard` component.
  - [x] 3.2 Create `src/components/dashboard/widgets/ChartWidget.tsx` — accepts `config: ChartConfig` (data_type, categories) and `monthlyData`. Renders existing `PemasukanChart`, filtered by config.
  - [x] 3.3 Create `src/components/dashboard/widgets/DistribusiProgressWidget.tsx` — accepts `config: { jenis: 'beras' | 'uang' }` and `stats`. Renders existing `DistribusiProgress` with correct props derived from stats.
  - [x] 3.4 Create `src/components/dashboard/widgets/HakAmilWidget.tsx` — thin wrapper around existing `HakAmilCard` component, accepts `tahunZakatId` prop.
  - [x] 3.5 Create `src/components/dashboard/widgets/TextNoteWidget.tsx` — renders `config.content` as simple markdown (use a lightweight parser or render with `whitespace-pre-wrap` + basic bold/italic if no markdown library is installed).
  - [x] 3.6 Create `src/components/dashboard/DashboardRenderer.tsx` — accepts `widgets: DashboardWidget[]`, `stats: DashboardStats`, `monthlyData`, `tahunZakatId`, and `statCardColumns: 1 | 2 | 3`. Groups consecutive `stat_card` widgets into a CSS grid with `statCardColumns` columns; renders each widget using the appropriate widget component based on `widget_type`.
  - [x] 3.7 Ensure `DashboardRenderer` handles an empty `widgets` array gracefully (renders an empty state message).

- [x] 4.0 Dashboard Settings UI (Admin — CRUD, Duplicate, Drag-and-Drop)
  - [x] 4.1 Install drag-and-drop dependencies: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` inside `zakat-fitrah-app/`.
  - [x] 4.2 Create `src/components/dashboard/settings/DashboardFormDialog.tsx` — `Dialog` (shadcn/ui) with a form containing: Title (Input, required), Description (Textarea, optional), Visibility (Select: Publik/Privat), StatCard Columns (Select: 1/2/3). Uses `react-hook-form` + `zod` for validation. Handles both create and edit mode via props.
  - [x] 4.3 Create `src/components/dashboard/settings/WidgetEditorSheet.tsx` — `Sheet` (shadcn/ui) slide-in panel for adding/editing a single widget. Contains: Widget Type selector (Select), then dynamic fields based on type:
    - `stat_card`: Label (Input), Icon (Select from preset list), Aggregation Rule (Select from `AGGREGATION_RULES`), Format (auto-filled from rule, display-only).
    - `chart`: Data Type (Select: uang/beras), Categories (MultiSelect or checkboxes).
    - `distribusi_progress`: Jenis (Select: beras/uang).
    - `hak_amil`: No config fields.
    - `text_note`: Content (Textarea with markdown hint).
    - Width selector (Select: Full/Half) for non-StatCard widgets.
  - [x] 4.4 Create `src/components/dashboard/settings/WidgetList.tsx` — renders a vertical list of existing widgets for a dashboard. Each row shows widget type, label/description, and action buttons (Edit, Delete). Wraps list with `@dnd-kit/sortable` `SortableContext` so rows can be dragged to reorder. On drag-end, calls `useReorderWidgets` mutation.
  - [x] 4.5 Create `src/components/dashboard/settings/DashboardList.tsx` — lists all dashboards in a table/card layout. Each row shows: title, visibility badge, stat_card_columns, action buttons (Edit, Duplicate, Delete — with confirmation dialog for delete). "Add Dashboard" button opens `DashboardFormDialog` in create mode. Clicking a dashboard name expands/navigates to show its `WidgetList` plus "Add Widget" button.
  - [x] 4.6 Create `src/pages/DashboardSettings.tsx` — main content component for the settings page. Uses `useDashboardConfigs()` to list dashboards. Renders `DashboardList`. Add a page header with title "Konfigurasi Dashboard" and description text.
  - [x] 4.7 Create `src/pages/DashboardSettingsPage.tsx` — page-level wrapper (mirrors pattern of `SettingsPage.tsx`) that wraps `DashboardSettings` inside the app layout.

- [x] 5.0 Tab Switcher & Auto-Create Default Dashboard
  - [x] 5.1 Create `src/components/dashboard/DashboardTabSwitcher.tsx` — accepts `dashboards: DashboardConfig[]`, `activeDashboardId: string`, `onSelect: (id: string) => void`. Renders a `Tabs` (shadcn/ui) or custom tab row. If only one dashboard is accessible, renders nothing (returns `null`).
  - [x] 5.2 Implement `createDefaultDashboard()` utility function in `src/lib/dashboardDefaults.ts` — uses Supabase client directly (not a hook) to insert `DEFAULT_DASHBOARD_CONFIG` into `dashboard_configs`, then bulk-inserts all 20 entries from `DEFAULT_DASHBOARD_WIDGETS` into `dashboard_widgets`. Returns the new dashboard `id`.
  - [x] 5.3 Refactor `src/pages/Dashboard.tsx`:
    - Replace hardcoded widget grid with `DashboardRenderer`.
    - Read `?id=<dashboardId>` from URL query params using `useSearchParams` (React Router DOM).
    - Call `useDashboardConfigs()` to get accessible dashboards.
    - If `useDashboardConfigs()` returns an empty array AND the current user is admin, automatically call `createDefaultDashboard()`, then refetch. Show a loading spinner during this process.
    - If no accessible dashboard after create attempt (non-admin with no public dashboards), show an empty state: "Belum ada dashboard yang tersedia."
    - Render `DashboardTabSwitcher` above the content area.
    - On tab switch, update URL query param (`?id=`) without full page reload.
    - Pass `selectedTahun` down to `DashboardRenderer` and all widget hooks, keeping the existing tahun selector.
  - [x] 5.4 Ensure the existing "Refresh" button and tahun selector in the Dashboard header remain functional after refactoring.

- [x] 6.0 Routing, Navigation & Access Control
  - [x] 6.1 Add route `/dashboard-settings` in `src/App.tsx`, rendering `DashboardSettingsPage`. Wrap it with the same admin-only guard used for other admin pages (check existing pattern in `App.tsx`).
  - [x] 6.2 Add "Konfigurasi Dashboard" link to the sidebar navigation, visible only to admin users. Follow the existing pattern in the layout component (`src/components/layouts/`).
  - [x] 6.3 Add a shortcut button "⚙ Konfigurasi" in the Dashboard page header (visible only to admin), linking to `/dashboard-settings`.
  - [x] 6.4 Verify that navigating to `/dashboard-settings` as a non-admin user redirects to `/dashboard` or shows a 403 page, matching the existing auth guard behavior.

- [x] 7.0 Testing & QA
  - [x] 7.1 Manually test: Create a new dashboard with all 5 widget types, verify each widget renders correct data.
  - [x] 7.2 Manually test: Edit a StatCard widget — change the aggregation rule, verify the displayed value updates accordingly.
  - [x] 7.3 Manually test: Drag-and-drop reorder widgets, reload page, verify order is persisted.
  - [x] 7.4 Manually test: Duplicate a dashboard — verify new dashboard appears with " — Salinan" suffix and all widgets copied.
  - [x] 7.5 Manually test: Delete all dashboards as admin — verify "Dashboard Utama" with 20 widgets is auto-created on next Dashboard page load.
  - [x] 7.6 Manually test: Set a dashboard to `private`, log in as non-admin — verify the private dashboard tab does not appear.
  - [x] 7.7 Manually test: Tab switcher — switch between dashboards, verify `?id=` URL param updates and correct dashboard renders.
  - [x] 7.8 Manually test: Verify `total_muzakki` StatCard changes value when switching tahun zakat.
  - [x] 7.9 Run `npm run build` inside `zakat-fitrah-app/` and confirm the build passes with zero TypeScript errors.
  - [x] 7.10 Run existing tests: `npx jest` — confirm no regressions in existing test files.

