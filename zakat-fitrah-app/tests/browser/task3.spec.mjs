import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}

test('admin creates account; customer login, recovery, dual mode and viewer access work in the browser', async ({ browser }) => {
  const f = await task3Fixture();
  const contexts = [];
  try {
    const admin = await f.authUser('admin'), viewer = await f.authUser('viewer'), other = await f.authUser();
    const created = await f.customer(), otherCustomer = await f.customer(other.id);
    const otherLoan = await f.loan(otherCustomer.id, admin.id);
    await f.enable();
    const adminContext = await browser.newContext(), customerContext = await browser.newContext(), viewerContext = await browser.newContext();
    contexts.push(adminContext,customerContext,viewerContext);
    const adminPage = await adminContext.newPage(), customerPage = await customerContext.newPage(), viewerPage = await viewerContext.newPage();
    await login(adminPage,admin.email,admin.password); await expect(adminPage).toHaveURL(/\/dashboard$/);
    await adminPage.goto('/pinjaman'); await expect(adminPage.getByRole('heading',{name:'Pinjaman Jamaah',exact:true})).toBeVisible();
    const accountPanel = adminPage.getByTestId('loan-account-panel');
    await expect(accountPanel).toBeVisible();
    const email = `${randomUUID()}@example.test`, password = `B-${randomUUID()}-1z`, replacement = `C-${randomUUID()}-2z`;
    await accountPanel.getByRole('combobox',{name:'Nasabah',exact:true}).first().selectOption(created.id);
    await accountPanel.getByLabel('Email',{exact:true}).fill(email);
    await accountPanel.getByLabel('Password awal',{exact:true}).fill(password);
    await accountPanel.getByRole('button',{name:'Buat akun',exact:true}).click();
    await expect(adminPage.getByText('Akun nasabah berhasil dibuat.',{exact:true})).toBeVisible();
    const linked = check(await f.service.from('loan_customers').select('auth_user_id').eq('id',created.id).single());
    f.users.push(linked.auth_user_id);
    const ownLoan = await f.loan(created.id,admin.id);
    await login(customerPage,email,'password-salah');
    await expect(customerPage.getByText('Email atau password salah.',{exact:true})).toBeVisible();
    await customerPage.getByLabel('Password',{exact:true}).fill(password);
    await customerPage.getByRole('button',{name:'Login',exact:true}).click();
    await expect(customerPage.getByRole('heading',{name:'Pinjaman Saya',exact:true})).toBeVisible();
    await expect(customerPage.getByText(ownLoan.number,{exact:true})).toBeVisible();
    await expect(customerPage.getByText(otherLoan.number,{exact:true})).toHaveCount(0);
    await customerPage.goto('/data-master/warga'); await expect(customerPage).toHaveURL(/\/portal-pinjaman$/);

    const recovery = adminPage.getByRole('heading',{name:'Pemulihan akun nasabah',exact:true}).locator('..');
    await recovery.getByRole('combobox',{name:'Nasabah',exact:true}).selectOption(created.id);
    await recovery.getByLabel('Password baru',{exact:true}).fill(replacement);
    await recovery.getByRole('button',{name:'Simpan perubahan akses',exact:true}).click();
    await expect(adminPage.getByText('Akun diperbarui. Nasabah harus masuk kembali.',{exact:true})).toBeVisible();
    await customerPage.reload(); await expect(customerPage).toHaveURL(/\/login$/);
    await login(customerPage,email,password); await expect(customerPage.getByText('Email atau password salah.',{exact:true})).toBeVisible();
    await customerPage.getByLabel('Password',{exact:true}).fill(replacement); await customerPage.getByRole('button',{name:'Login',exact:true}).click();
    await expect(customerPage).toHaveURL(/\/portal-pinjaman$/);
    const nextEmail = `${randomUUID()}@example.test`;
    await recovery.getByRole('combobox',{name:'Tindakan',exact:true}).selectOption('recover_email');
    await recovery.getByLabel('Email baru',{exact:true}).fill(nextEmail);
    await recovery.getByRole('button',{name:'Simpan perubahan akses',exact:true}).click();
    await expect.poll(async () => (await f.service.auth.admin.getUserById(linked.auth_user_id)).data.user.email).toBe(nextEmail);
    await customerPage.reload(); await expect(customerPage).toHaveURL(/\/login$/);
    await login(customerPage,nextEmail,replacement); await expect(customerPage).toHaveURL(/\/portal-pinjaman$/);

    const dual = await f.customer(null,await f.person('Task3 Pengurus Nasabah'));
    const dualLoan = await f.loan(dual.id,admin.id);
    await adminPage.reload();
    const staffLink = adminPage.getByRole('heading',{name:'Pengurus yang juga nasabah',exact:true}).locator('..');
    await staffLink.getByRole('combobox',{name:'Identitas nasabah',exact:true}).selectOption(dual.id);
    await staffLink.getByRole('combobox',{name:'Akun pengurus',exact:true}).selectOption(admin.id);
    await staffLink.getByRole('button',{name:'Tautkan akun pengurus',exact:true}).click();
    await expect(adminPage.getByText(/Akun pengurus ditautkan/)).toBeVisible(); await adminPage.reload();
    await adminPage.getByRole('button',{name:'Mode nasabah',exact:true}).click();
    await expect(adminPage).toHaveURL(/\/portal-pinjaman$/);
    await expect(adminPage.getByText(dualLoan.number,{exact:true})).toBeVisible();
    await expect(adminPage.getByText(ownLoan.number,{exact:true})).toHaveCount(0);
    const access = await adminPage.evaluate(async () => {
      const { supabase } = await import('/src/lib/supabase.ts');
      const role = await supabase.rpc('loan_is_admin'); const people = await supabase.from('muzakki').select('id').limit(1);
      return { admin: role.data, people: people.data?.length ?? 0 };
    });
    expect(access).toEqual({admin:false,people:0});
    await adminPage.getByRole('button',{name:'Mode pengurus',exact:true}).click(); await expect(adminPage).toHaveURL(/\/dashboard$/);

    await login(viewerPage,viewer.email,viewer.password); await expect(viewerPage).toHaveURL(/\/dashboard$/);
    await viewerPage.goto('/pinjaman/ringkasan'); await expect(viewerPage.getByText(/Viewer memerlukan izin/)).toBeVisible();
    check(await admin.api.rpc('loan_set_viewer_access',{p_user_id:viewer.id,p_enabled:true})); await viewerPage.reload();
    await expect(viewerPage.getByText(ownLoan.number,{exact:true})).toBeVisible();
    check(await admin.api.rpc('loan_set_viewer_access',{p_user_id:viewer.id,p_enabled:false})); await viewerPage.reload();
    await expect(viewerPage.getByText(/Viewer memerlukan izin/)).toBeVisible();
    check(await f.service.from('loan_customers').update({is_active:false}).eq('id',created.id));
    await customerPage.reload(); await expect(customerPage).toHaveURL(/\/login$/);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await f.cleanup();
  }
});
