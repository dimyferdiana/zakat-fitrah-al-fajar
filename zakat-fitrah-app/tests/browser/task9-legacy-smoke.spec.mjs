// Read-only navigation smoke tests; only the person and account below are synthetic.
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

test('staff can open legacy modules and find a synthetic person',async ({browser})=>{
  const f=await task3Fixture(); let context;
  try {
    const admin=await f.authUser('admin'), name=`Regresi ${randomUUID()}`;
    await f.person(name);
    context=await browser.newContext(); const page=await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password);
    await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/data-master/warga'); await expect(page.getByRole('heading',{name:'Jamaah / Data Orang'})).toBeVisible();
    await page.getByPlaceholder('Cari nama, alamat, atau telepon...').fill(name);
    await expect(page.getByRole('cell',{name:new RegExp(name)}).first()).toBeVisible();
    await page.goto('/accounts');
    await page.getByRole('button',{name:'Tambah Rekening'}).first().click();
    const accountDialog=page.getByRole('dialog');
    await accountDialog.getByPlaceholder('Contoh: Kas Utama').fill('Draf rekening sintetis');
    await page.keyboard.press('Escape');
    await expect(accountDialog).toBeHidden();
    await page.getByRole('button',{name:'Tambah Rekening'}).first().click();
    await expect(accountDialog.getByPlaceholder('Contoh: Kas Utama')).toHaveValue('');
    await page.keyboard.press('Escape');
    for(const [route,heading] of [
      ['/data-master/mustahik','Mustahik'],['/muzakki','Master Data Muzakki'],['/penerimaan-uang','Penerimaan Uang'],
      ['/penerimaan-beras','Penerimaan Beras'],['/mustahik','Manajemen Mustahik'],['/distribusi','Distribusi Zakat'],
      ['/qurban','Data Qurban'],['/sedekah-receipt','Bukti Sedekah'],
    ]) {
      await page.goto(route); await expect(page.getByRole('heading',{name:heading,exact:true}).first()).toBeVisible();
    }
  } finally { if(context) await context.close(); await f.cleanup(); }
});

test('legacy receipt downloads its original donor snapshot after the linked name changes',async ({browser})=>{
  const f=await task3Fixture(); let context; let created=false;
  const receiptId=randomUUID(), receiptNumber=`REG-${receiptId}`;
  try {
    const admin=await f.authUser('admin'), person=await f.person('Donor Lama Sintetis');
    check(await f.service.from('bukti_sedekah').insert({id:receiptId,receipt_number:receiptNumber,category:'Infak',category_key:'infak',donor_id:person,donor_name:'Donor Lama Sintetis',donor_address:'Alamat Lama Sintetis',amount:250000,tanggal:'2026-01-15',created_by:admin.id}));
    created=true;
    check(await admin.api.rpc('person_update_name',{p_person_id:person,p_name:'Donor Baru Sintetis'}));
    context=await browser.newContext(); const page=await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password);
    await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/sedekah-receipt');
    const row=page.getByRole('row').filter({hasText:receiptNumber});
    await expect(row).toContainText('Donor Lama Sintetis');
    const pending=page.waitForEvent('download'); await row.getByTitle('Unduh ulang PDF').click();
    const download=await pending; const chunks=[];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    const content=Buffer.concat(chunks).toString('latin1');
    expect(content.startsWith('%PDF-')).toBe(true);
    expect(content).toContain('Donor Lama Sintetis'); expect(content).toContain('Alamat Lama Sintetis');
    expect(content).not.toContain('Donor Baru Sintetis');
  } finally {
    if(context) await context.close();
    if(created) check(await f.service.from('bukti_sedekah').delete().eq('id',receiptId));
    await f.cleanup();
  }
});
