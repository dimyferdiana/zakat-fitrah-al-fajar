import { test, expect } from '@playwright/test';
import { task3Fixture } from '../local-supabase.mjs';

async function login(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill(user.password);
  await page.getByRole('button',{name:'Login',exact:true}).click();
}

test('admin and customer loan pages remain usable on a narrow screen', async ({ browser }) => {
  const f = await task3Fixture();
  const contexts=[];
  try {
    const admin=await f.authUser('admin'), borrower=await f.authUser();
    const customer=await f.customer(borrower.id), loan=await f.loan(customer.id,admin.id);
    const adminContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const borrowerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    contexts.push(adminContext,borrowerContext);
    const adminPage=await adminContext.newPage(), borrowerPage=await borrowerContext.newPage();
    await login(adminPage,admin); await expect(adminPage).toHaveURL(/\/dashboard$/);
    await adminPage.goto('/pinjaman');
    await expect(adminPage.getByRole('heading',{name:'Ringkasan Pinjaman',exact:true})).toBeVisible();
    await adminPage.goto('/pinjaman/baru');
    await expect(adminPage.getByText('Buat draf pinjaman',{exact:true})).toBeVisible();
    await expect.poll(() => adminPage.evaluate(() => document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    await login(borrowerPage,borrower);
    await expect(borrowerPage.getByRole('heading',{name:'Pinjaman Saya',exact:true})).toBeVisible();
    await expect(borrowerPage.getByText(loan.number,{exact:true})).toBeVisible();
    await expect(borrowerPage.getByRole('button',{name:'Kirim untuk diperiksa',exact:true})).toBeVisible();
    await expect.poll(() => borrowerPage.evaluate(() => document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
  } finally {
    await Promise.all(contexts.map(context=>context.close()));
    await f.cleanup();
  }
});
