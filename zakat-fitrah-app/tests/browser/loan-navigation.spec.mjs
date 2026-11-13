import { test, expect } from '@playwright/test';
import { task3Fixture, check } from '../local-supabase.mjs';

async function login(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('rute, tautan lama, riwayat dan batas akses modul pinjaman', async ({ browser }) => {
  const f = await task3Fixture();
  const contexts = [];
  try {
    const admin = await f.authUser('admin'), staff = await f.authUser('petugas');
    const viewer = await f.authUser('viewer'), borrower = await f.authUser();
    const customer = await f.customer(borrower.id), loan = await f.loan(customer.id, admin.id);
    const context = await browser.newContext(); contexts.push(context);
    const page = await context.newPage(); await login(page, admin);
    const paths = [
      ['/pinjaman/dashboard', 'Ringkasan Pinjaman'], ['/pinjaman/nasabah', 'Nasabah'],
      ['/pinjaman/daftar', 'Pinjaman'], ['/pinjaman/pembayaran', 'Pembayaran'],
      ['/pinjaman/laporan', 'Laporan Pinjaman'], ['/pinjaman/pengaturan', 'Pengaturan Pinjaman'],
    ];
    for (const [path, title] of paths) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: title, exact: true })).toHaveAttribute('aria-current', 'page');
    }
    for (const [hash, destination] of [
      ['', '/pinjaman/dashboard'], ['#loan-dashboard', '/pinjaman/dashboard'],
      ['#loan-customers', '/pinjaman/nasabah'], ['#loan-drafts', '/pinjaman/baru'],
      ['#loan-claims', '/pinjaman/pembayaran?tab=verifikasi'], ['#loan-settings', '/pinjaman/pengaturan'],
      ['#rincian-pinjaman', '/pinjaman/daftar'],
    ]) {
      await page.goto(`/pinjaman${hash}`);
      await expect(page).toHaveURL(`http://127.0.0.1:5174${destination}`);
    }
    await page.goto('/pinjaman/daftar?ukuran=50');
    await page.getByRole('link', { name: new RegExp(loan.number) }).click();
    await expect(page).toHaveURL(new RegExp(`/pinjaman/daftar/${loan.id}\\?ukuran=50`));
    await expect(page.getByText('Rincian pinjaman', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByText('Rincian pinjaman', { exact: true })).toBeVisible();
    await page.goBack(); await expect(page).toHaveURL(/\/pinjaman\/daftar\?ukuran=50$/);
    await page.goForward(); await expect(page).toHaveURL(new RegExp(loan.id));
    await page.goto(`/pinjaman/nasabah/${customer.id}`); await expect(page.getByRole('heading', { name: 'Profil Nasabah' })).toBeVisible();
    await page.reload(); await expect(page.getByText('Task3 Nasabah', { exact: true })).toBeVisible();
    for (const url of ['/pinjaman/daftar/bukan-id', '/pinjaman/nasabah/bukan-id', '/pinjaman/daftar/00000000-0000-4000-8000-000000000000']) {
      await page.goto(url); await expect(page.getByRole('alert')).toContainText('tidak tersedia atau tidak dapat diakses');
    }
    const staffContext = await browser.newContext(), viewerContext = await browser.newContext(), borrowerContext = await browser.newContext();
    contexts.push(staffContext, viewerContext, borrowerContext);
    const staffPage = await staffContext.newPage(), viewerPage = await viewerContext.newPage(), borrowerPage = await borrowerContext.newPage();
    await login(staffPage, staff); await staffPage.goto('/pinjaman/pengaturan');
    await expect(staffPage.getByRole('heading', { name: 'Pengaturan Pinjaman' })).toBeVisible();
    expect((await staff.api.rpc('loan_set_viewer_access', { p_user_id: viewer.id, p_enabled: true })).error).toBeTruthy();
    await login(viewerPage, viewer); await viewerPage.goto('/pinjaman/daftar'); await expect(viewerPage.getByText('Akses Ditolak')).toBeVisible();
    await viewerPage.goto('/pinjaman/ringkasan'); await expect(viewerPage.getByText(/Viewer memerlukan izin/)).toBeVisible();
    check(await admin.api.rpc('loan_set_viewer_access', { p_user_id: viewer.id, p_enabled: true }));
    await viewerPage.reload(); await expect(viewerPage.getByText(loan.number, { exact: true })).toBeVisible();
    await viewerPage.goto('/pinjaman/dashboard'); await expect(viewerPage.getByText('Akses Ditolak')).toBeVisible();
    await borrowerPage.goto('/login'); await borrowerPage.getByLabel('Email', { exact: true }).fill(borrower.email); await borrowerPage.getByLabel('Password', { exact: true }).fill(borrower.password); await borrowerPage.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(borrowerPage).toHaveURL(/\/portal-pinjaman$/); await borrowerPage.goto('/pinjaman/daftar'); await expect(borrowerPage).toHaveURL(/\/portal-pinjaman$/);
    expect((await borrower.api.rpc('loan_dashboard_report_data')).error).toBeTruthy();
    check(await f.service.from('users').update({ is_active: false }).eq('id', staff.id));
    await staffPage.reload(); await expect(staffPage).toHaveURL(/\/login$/);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await f.cleanup();
  }
});

test('menu ponsel menyediakan enam tujuan dan menutup setelah memilih', async ({ browser }) => {
  const f = await task3Fixture(); let context;
  try {
    const admin = await f.authUser('admin');
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); await login(page, admin); await page.goto('/pinjaman/dashboard');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    const menu = page.getByRole('dialog');
    for (const label of ['Ringkasan Pinjaman', 'Nasabah', 'Pinjaman', 'Pembayaran', 'Laporan Pinjaman', 'Pengaturan Pinjaman']) await expect(menu.getByRole('link', { name: label, exact: true })).toBeVisible();
    await menu.getByRole('link', { name: 'Pembayaran', exact: true }).click();
    await expect(page).toHaveURL(/\/pinjaman\/pembayaran$/); await expect(menu).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pembayaran', level: 1 })).toBeVisible();
  } finally { if (context) await context.close(); await f.cleanup(); }
});
