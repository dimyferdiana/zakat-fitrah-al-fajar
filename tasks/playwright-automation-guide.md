## Playwright Automation Guide (Phase 2.1)

### Why Playwright
Fast, cross-browser E2E suitable for form flows and dashboard assertions.

### Install & Setup
```bash
cd zakat-fitrah-app
npm install -D @playwright/test playwright
npx playwright install
```
Add script in `package.json` (if not present):
```json
"scripts": {
  "test:e2e": "playwright test"
}
```

### Test Targets
- Zakat uang flow: create payment, ensure saved nominal equals input.
- Zakat beras flow: min and below-min cases (warning dialog).
- Dashboard: cards show updated totals; Total Pemasukan Uang includes zakat uang + fidyah + infak/sedekah + maal + rekonsiliasi.

### Example Spec Skeletons
Create `tests/zakat-uang.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('zakat uang saves actual amount', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // TODO: login step if auth is enforced
  await page.getByRole('button', { name: /tambah/i }).click();
  await page.getByLabel(/jenis zakat/i).selectOption('uang');
  await page.getByLabel(/jumlah jiwa/i).fill('3');
  await page.getByLabel(/nominal diterima/i).fill('150000');
  await page.getByLabel(/akun uang/i).selectOption('kas');
  await page.getByRole('button', { name: /simpan/i }).click();
  await expect(page.getByText('Rp 150.000')).toBeVisible();
});
```

Create `tests/zakat-beras.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('beras minimum passes', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: /tambah/i }).click();
  await page.getByLabel(/jenis zakat/i).selectOption('beras');
  await page.getByLabel(/jumlah jiwa/i).fill('2');
  await page.getByLabel(/jumlah beras diterima/i).fill('3'); // assume min <= 3kg
  await page.getByRole('button', { name: /simpan/i }).click();
  await expect(page.getByText('3.00 kg')).toBeVisible();
});

test('beras below minimum warns', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: /tambah/i }).click();
  await page.getByLabel(/jenis zakat/i).selectOption('beras');
  await page.getByLabel(/jumlah jiwa/i).fill('2');
  await page.getByLabel(/jumlah beras diterima/i).fill('2'); // below min
  await page.getByRole('button', { name: /simpan/i }).click();
  await expect(page.getByText(/beras kurang/i)).toBeVisible();
});
```

Create `tests/dashboard.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('dashboard totals include zakat uang', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // assumes data already created via UI/API
  await expect(page.getByText(/total pemasukan uang/i)).toBeVisible();
  await expect(page.getByText(/zakat uang/i)).toBeVisible();
});
```

### Running Tests
```bash
npm run test:e2e
```
Headed mode for debugging:
```bash
npx playwright test --headed --debug
```

### Data Strategy
- Prefer creating test data via UI steps in each test for isolation.
- Alternatively, seed via Supabase REST or RPC before running tests.
- If using auth, add a helper to log in (or mock session/localStorage).

### CI Tip
- Cache `node_modules` and Playwright browsers.
- Run `npx supabase start` (or use a test DB URL) before tests; set `SUPABASE_URL`/keys in CI secrets.
