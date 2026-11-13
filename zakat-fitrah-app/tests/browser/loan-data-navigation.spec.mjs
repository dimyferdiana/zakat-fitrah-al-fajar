import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

test('pencarian seluruh pinjaman, halaman dan konteks detail', async ({ browser }) => {
  const f=await task3Fixture(); let context;
  try {
    const admin=await f.authUser('admin'), marker=`DATA-${randomUUID()}`;
    const person=await f.person(marker), customer=await f.customer(null,person);
    const loans=Array.from({length:57},(_,i)=>({id:randomUUID(),loan_number:`${marker}-${String(i).padStart(2,'0')}`,customer_id:customer.id,purpose:'Fixture paginasi',principal:1000,status:'draft',created_by:admin.id,created_at:new Date(Date.UTC(2024,0,1,0,0,i)).toISOString()}));
    f.loans.push(...loans.map(item=>item.id)); check(await f.service.from('loans').insert(loans));
    context=await browser.newContext(); const page=await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password); await page.getByRole('button',{name:'Login',exact:true}).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const calls=[]; page.on('request',request=>{if(request.url().includes('/rest/v1/rpc/')) calls.push(request.url());});
    await page.goto('/pinjaman/dashboard'); await expect(page.getByRole('heading',{name:'Ringkasan Pinjaman'})).toBeVisible();
    await expect(page.getByText('Sisa pokok',{exact:true})).toBeVisible();
    expect(calls.some(url=>url.includes('loan_dashboard_report_data'))).toBe(false);
    await page.goto('/pinjaman/daftar');
    await page.getByLabel('Cari nama atau nomor pinjaman').fill(marker);
    await expect(page.getByText('57 hasil',{exact:true})).toBeVisible();
    expect(page.url()).not.toContain(marker);
    await page.getByRole('button',{name:'Berikutnya'}).click(); await page.getByRole('button',{name:'Berikutnya'}).click();
    await expect(page).toHaveURL(/halaman=3/);
    await page.getByRole('link',{name:new RegExp(`${marker}-00`)}).click();
    await expect(page).toHaveURL(new RegExp(loans[0].id)); await page.reload();
    await page.getByRole('link',{name:/Kembali ke Pinjaman/}).click();
    await expect(page).toHaveURL(/halaman=3/); await expect(page.getByLabel('Cari nama atau nomor pinjaman')).toHaveValue(marker);
    await expect(page.getByRole('link',{name:new RegExp(`${marker}-00`)})).toBeVisible();
    await page.getByLabel('Cari nama atau nomor pinjaman').fill('tidak-ada-nama');
    await expect(page).not.toHaveURL(/halaman=3/); await expect(page.getByText('0 hasil',{exact:true})).toBeVisible();
    await page.goto('/pinjaman/daftar?halaman=999999999&ukuran=77&status=invalid');
    await expect(page.getByRole('heading',{name:'Pinjaman',level:1})).toBeVisible();
  } finally { if(context)await context.close(); await f.cleanup(); }
});
