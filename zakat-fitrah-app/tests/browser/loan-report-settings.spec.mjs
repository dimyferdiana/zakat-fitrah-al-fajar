import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

async function bytes(download) { const chunks=[]; for await(const chunk of await download.createReadStream()) chunks.push(chunk); return Buffer.concat(chunks); }
async function login(page,user) { await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(user.email); await page.getByLabel('Password',{exact:true}).fill(user.password); await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/); }

test('ringkasan terfilter, ekspor seluruh halaman dan batas pengaturan',async ({browser})=>{
  const f=await task3Fixture(); const contexts=[];
  try {
    const admin=await f.authUser('admin'), staff=await f.authUser('petugas'), viewer=await f.authUser('viewer');
    const marker=`TASK7-${randomUUID()}`, loans=[];
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const day=n=>new Date(Date.parse(`${today}T00:00:00Z`)+n*86400000).toISOString().slice(0,10);
    for(let i=0;i<22;i++) {
      const person=await f.person(`${i===0?'=':''}${marker}-${String(i).padStart(2,'0')}`), customer=await f.customer(null,person), loan=await f.loan(customer.id,admin.id,`${marker}-${i}`); loans.push(loan);
      check(await f.service.from('loans').update({disbursement_date:day(-10)}).eq('id',loan.id));
      check(await f.service.from('loan_installments').update({due_date:day(i===0?-1:2)}).eq('loan_id',loan.id));
    }
    const context=await browser.newContext();contexts.push(context);const page=await context.newPage();await login(page,admin);
    await page.goto('/pinjaman/dashboard'); const due=page.getByText('Jatuh tempo tujuh hari',{exact:false}).locator('../..');
    await due.getByRole('link',{name:'Lihat semua'}).click(); await expect(page).toHaveURL(/perhatian=due/); await expect(page.getByText('Perhatian: Jatuh tempo tujuh hari')).toBeVisible();
    await page.goto('/pinjaman/laporan'); const report=page.getByText('Laporan pinjaman',{exact:true}).locator('../..');
    await report.getByLabel('Nama atau nomor pinjaman').fill(marker); await expect(report.getByText(`Filter aktif:`,{exact:false})).not.toContainText(marker);
    await report.getByRole('button',{name:'Filter lanjutan'}).click(); await report.getByRole('combobox',{name:'Status pada tanggal posisi'}).click(); await page.getByRole('option',{name:'Aktif',exact:true}).click();
    await report.getByRole('combobox',{name:'Wilayah saat pencairan'}).click(); await page.getByRole('option',{name:'Wilayah belum diisi'}).click();
    await report.getByRole('button',{name:'Terapkan filter'}).click(); await expect(report.getByText('Filter aktif:',{exact:false})).toContainText(marker); await expect(report.getByText('Filter aktif:',{exact:false})).toContainText('Wilayah belum diisi');
    const groups=report.getByRole('heading',{name:'Distribusi nasabah'}).locator('..'); await expect(groups.getByText(/22 kelompok/)).toBeVisible(); await groups.getByRole('button',{name:'Halaman berikutnya Distribusi nasabah'}).click();
    const csvPromise=page.waitForEvent('download');await report.getByRole('button',{name:'Unduh CSV'}).click();const csv=(await bytes(await csvPromise)).toString('utf8');
    for(const loan of loans)expect(csv).toContain(loan.number);expect(csv).toContain(`'=${marker}`);expect(csv).toContain('Tanggal posisi');
    const pdfPromise=page.waitForEvent('download');await report.getByRole('button',{name:'Unduh PDF'}).click();const pdf=(await bytes(await pdfPromise)).toString('latin1');
    for(const loan of loans)expect(pdf).toContain(loan.number);expect(pdf).toContain('Jumlah baris: 22');
    await report.getByLabel('Nama atau nomor pinjaman').fill(`tidak-ada-${marker}`); await report.getByRole('button',{name:'Terapkan filter'}).click(); await expect(report.getByText('Tidak ada data yang cocok.').first()).toBeVisible();
    await report.getByRole('button',{name:'Reset filter'}).click();await expect(report.getByLabel('Nama atau nomor pinjaman')).toHaveValue('');
    await page.goto('/pinjaman/pengaturan');const permissions=page.getByText('Izin baca viewer',{exact:true}).locator('../..');await expect(permissions).toBeVisible();
    const viewerRow=permissions.locator('div.border-t').filter({hasText:'Task3 viewer'});await viewerRow.getByRole('button',{name:'Berikan izin'}).click();await expect(viewerRow.getByRole('button',{name:'Cabut izin'})).toBeVisible();
    const staffContext=await browser.newContext();contexts.push(staffContext);const staffPage=await staffContext.newPage();await login(staffPage,staff);await staffPage.goto('/pinjaman/pengaturan');
    await expect(staffPage.getByText('Kebijakan pinjaman',{exact:true})).toBeVisible();await expect(staffPage.getByRole('button',{name:'Simpan versi kebijakan'})).toHaveCount(0);await expect(staffPage.getByText('Izin baca viewer',{exact:true})).toHaveCount(0);
    expect((await staff.api.rpc('loan_set_viewer_access',{p_user_id:viewer.id,p_enabled:false})).error).toBeTruthy();
  } finally {await Promise.all(contexts.map(context=>context.close()));await f.cleanup();}
});
