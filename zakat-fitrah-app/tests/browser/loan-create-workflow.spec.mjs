import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

test('tiga pola jadwal, perlindungan isian, kegagalan simpan dan retry draf', async ({browser})=>{
  const f=await task3Fixture(); let context; let customer;
  try {
    const admin=await f.authUser('admin'); customer=await f.customer();
    const category=check(await f.service.from('loan_categories').select('id,name').eq('is_active',true).limit(1).single());
    const purpose=`Alur ${randomUUID()}`;
    context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password); await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/pinjaman/daftar'); await page.getByRole('link',{name:'Buat Pinjaman'}).click(); await expect(page.getByText('Tahap 1 dari 3: Nasabah')).toBeVisible();
    await page.getByRole('combobox',{name:'Nasabah',exact:true}).click(); await page.getByRole('option',{name:new RegExp(customer.id)}).click();
    await page.getByRole('button',{name:'Lanjut ke Detail & Jadwal'}).click(); await expect(page.getByText('Tahap 2 dari 3: Detail & Jadwal')).toBeVisible();
    await page.getByRole('button',{name:'Tinjau & Simpan'}).click(); await expect(page.getByRole('combobox',{name:'Kategori',exact:true})).toBeFocused(); await expect(page.getByLabel('Nominal pokok (Rp)')).toHaveAttribute('aria-invalid','true');
    await page.getByRole('combobox',{name:'Kategori',exact:true}).click(); await page.getByRole('option',{name:category.name,exact:true}).click();
    await page.getByLabel('Nominal pokok (Rp)').fill('1000'); await page.getByLabel('Rencana tanggal pencairan').fill('2027-01-01');
    await page.getByLabel('Digunakan untuk').fill(purpose);
    await page.getByRole('combobox',{name:'Petugas penanggung jawab'}).click(); await page.getByRole('option',{name:'Task3 admin',exact:true}).first().click();
    await page.getByLabel('Jatuh tempo pertama').fill('2027-01-31'); await page.getByLabel('Jumlah angsuran').fill('3');
    await page.getByRole('button',{name:'Tinjau & Simpan'}).click(); await expect(page.getByText('28 Feb 2027',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Kembali',exact:true}).click(); await expect(page.getByLabel('Nominal pokok (Rp)')).toHaveValue('1000');
    await page.getByRole('combobox',{name:'Pola pembayaran'}).click(); await page.getByRole('option',{name:'Mingguan'}).click();
    await page.getByRole('button',{name:'Tinjau & Simpan'}).click(); await expect(page.getByText('7 Feb 2027',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Kembali',exact:true}).click();
    await page.getByRole('combobox',{name:'Pola pembayaran'}).click(); await page.getByRole('option',{name:'Tanggal khusus'}).click();
    await page.getByLabel('Tanggal 1').fill('2027-02-01'); await page.getByLabel('Nominal 1').fill('500'); await page.getByRole('button',{name:'Tambah baris'}).click();
    await page.getByLabel('Tanggal 2').fill('2027-02-01'); await page.getByLabel('Nominal 2').fill('500');
    await page.getByRole('button',{name:'Tinjau & Simpan'}).click(); await expect(page.getByRole('alert')).toContainText('unik');
    await page.getByLabel('Tanggal 2').fill('2027-03-01'); await page.getByRole('button',{name:'Tinjau & Simpan'}).click();
    await expect(page.getByText('1 Mar 2027',{exact:true})).toBeVisible(); await expect(page.getByText(/Total.*1.000/)).toBeVisible();
    await page.getByRole('button',{name:'Kembali',exact:true}).click();
    await page.getByRole('link',{name:/Kembali ke Pinjaman/}).click(); await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button',{name:'Tetap mengisi'}).click(); await expect(page.getByLabel('Nominal 2')).toHaveValue('500');
    await page.evaluate(()=>history.back()); await expect(page.getByRole('alertdialog')).toBeVisible(); await page.getByRole('button',{name:'Tetap mengisi'}).click();
    const reloadDialog=page.waitForEvent('dialog'); await page.evaluate(()=>setTimeout(()=>window.location.reload(),0)); const dialog=await reloadDialog; expect(dialog.type()).toBe('beforeunload'); await dialog.dismiss(); await expect(page.getByLabel('Nominal 2')).toHaveValue('500');
    await page.getByRole('button',{name:'Tinjau & Simpan'}).click();
    const requests=[];
    await page.route('**/rest/v1/rpc/loan_create_complete_draft',async route=>{requests.push(route.request().postDataJSON());await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Sementara gagal'})});});
    await page.getByRole('button',{name:'Simpan draf'}).click(); await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByText(purpose,{exact:false})).toBeVisible();
    await page.unroute('**/rest/v1/rpc/loan_create_complete_draft');
    const captured=page.waitForRequest(request=>request.url().includes('/rpc/loan_create_complete_draft') && request.method()==='POST');
    await page.getByRole('button',{name:'Simpan draf'}).click(); const retried=await captured; expect(retried.postDataJSON().p_request_id).toBe(requests[0].p_request_id);
    await expect(page).toHaveURL(/\/pinjaman\/daftar\/[0-9a-f-]+$/); const loan=check(await f.service.from('loans').select('id').eq('customer_id',customer.id).single()); f.loans.push(loan.id);
    await expect(page.getByText('Draf pinjaman tersimpan.')).toBeVisible();
    await expect(page.getByText(/Pilih tanggal dan siapkan kontrak/)).toBeVisible();
    await page.getByRole('tab',{name:'Jadwal',exact:true}).click(); await expect(page).toHaveURL(/tab=jadwal/); await page.reload();
    await expect(page.getByRole('tab',{name:'Jadwal'})).toHaveAttribute('data-state','active');
    await page.getByRole('tab',{name:'Ringkasan',exact:true}).click(); await page.getByRole('button',{name:'Muat rincian tersimpan'}).click(); await expect(page.getByRole('button',{name:'Simpan rincian draf'})).toBeEnabled();
  } finally {
    if(customer){const result=await f.service.from('loans').select('id').eq('customer_id',customer.id);for(const loan of result.data??[])if(!f.loans.includes(loan.id))f.loans.push(loan.id);}
    if(context)await context.close();await f.cleanup();
  }
});
