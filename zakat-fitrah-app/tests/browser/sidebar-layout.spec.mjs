import { test, expect } from '@playwright/test';
import { task3Fixture } from '../local-supabase.mjs';

test('sidebar desktop menyusut menjadi ikon dan kembali terbuka', async ({ browser }) => {
  const f = await task3Fixture(); let context;
  try {
    const admin = await f.authUser('admin');
    context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email', { exact: true }).fill(admin.email);
    await page.getByLabel('Password', { exact: true }).fill(admin.password);
    await page.getByRole('button', { name: 'Login', exact: true }).click(); await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/pinjaman/dashboard');
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    const container = sidebar.locator('[data-slot="sidebar-container"]');
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await expect(page.getByRole('link', { name: 'Ringkasan Pinjaman', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ringkasan & izin pinjaman', exact: true })).toHaveAttribute('href', '/pinjaman/ringkasan');
    expect((await container.boundingBox()).width).toBeCloseTo(256, 0);
    await page.screenshot({ path: 'test-results/sidebar-expanded.png' });
    await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await expect.poll(async () => Math.round((await container.boundingBox()).width)).toBe(48);
    const link = page.getByRole('link', { name: 'Ringkasan Pinjaman', exact: true });
    await expect(link).toBeVisible();
    expect(Math.round((await link.boundingBox()).width)).toBe(32);
    await expect(page.getByText('Pencatatan Pinjaman')).not.toBeVisible();
    await page.getByRole('button', { name: 'Pilih aplikasi, Pinjaman Jamaah' }).click();
    await expect(page.getByRole('menuitem', { name: /Data Master/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Ringkasan & izin pinjaman' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Menu akun/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: 'test-results/sidebar-collapsed.png' });
    await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click();
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await expect.poll(async () => Math.round((await container.boundingBox()).width)).toBe(256);
  } finally { if (context) await context.close(); await f.cleanup(); }
});
