import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

async function login(page, user) {
  await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(user.email); await page.getByLabel('Password',{exact:true}).fill(user.password); await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
}

test('pendaftaran individu, nama sama, rumah tangga, profil dan batas petugas',async ({browser})=>{
  const f=await task3Fixture(); const contexts=[]; let registeredPerson; let newName;
  try {
    const admin=await f.authUser('admin'),staff=await f.authUser('petugas');
    const marker=`Profil ${randomUUID()}`, person1=await f.person(marker), person2=await f.person(marker), household=await f.person(`Rumah ${marker}`);
    registeredPerson=person1;
    check(await f.service.from('muzakki').update({alamat:'Alamat sintetis task3',jenis_identitas:'rumah_tangga',identitas_terverifikasi:false,nama_lengkap:null}).eq('id',household));
    const existing=await f.customer(null,person2), loan=await f.loan(existing.id,admin.id);
    const adminContext=await browser.newContext({viewport:{width:390,height:844}}), staffContext=await browser.newContext(); contexts.push(adminContext,staffContext);
    const page=await adminContext.newPage(), staffPage=await staffContext.newPage(); await login(page,admin);
    await page.goto('/pinjaman/nasabah'); await expect(page.getByRole('heading',{name:'Nasabah',level:1})).toBeVisible();
    await expect(page.getByTestId('loan-account-panel')).toHaveCount(0);
    await page.getByRole('link',{name:'Daftarkan Nasabah'}).click();
    await expect(page.getByRole('button',{name:'Tambah data orang baru'})).toHaveCount(0);
    await page.getByLabel('Cari orang di Data Master').fill(marker); await page.getByRole('button',{name:'Cari',exact:true}).click();
    await expect(page.getByRole('button',{name:new RegExp(person1)})).toBeVisible(); await expect(page.getByRole('button',{name:new RegExp(person2)})).toBeVisible();
    await page.getByRole('button',{name:new RegExp(person2)}).click(); await expect(page.getByText('Individu ini sudah menjadi nasabah.')).toBeVisible();
    await page.getByRole('button',{name:new RegExp(household)}).click(); await expect(page.getByRole('alert')).toContainText('rumah tangga');
    await page.getByRole('button',{name:new RegExp(person1)}).click();
    await page.getByRole('button',{name:'Konfirmasi individu dan daftarkan'}).click();
    await expect(page).toHaveURL(/\/pinjaman\/nasabah\/[0-9a-f-]+$/);
    const registered=check(await f.service.from('loan_customers').select('id').eq('person_id',person1).single()); f.customers.push(registered.id);
    expect((await check(await f.service.from('loan_customers').select('id').eq('person_id',person1))).length).toBe(1);
    await expect(page.getByText(marker,{exact:true}).first()).toBeVisible();
    await expect(page.getByRole('tab',{name:'Akses Akun'})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path:'test-results/customer-profile-mobile.png'});
    newName=`Baru ${randomUUID()}`;
    await page.goto('/pinjaman/nasabah/baru');
    await page.getByLabel('Cari orang di Data Master').fill(newName); await page.getByRole('button',{name:'Cari',exact:true}).click();
    await expect(page.getByText('Tidak ada orang yang cocok.')).toBeVisible();
    await page.getByRole('button',{name:'Tambah data orang baru'}).click();
    const dialog=page.getByRole('dialog',{name:'Tambah Data Orang'});
    await dialog.getByLabel(/Nama pada data awal/).fill(newName); await dialog.getByLabel(/^Alamat/).fill('Alamat sintetis task3');
    await dialog.getByRole('button',{name:'Simpan',exact:true}).click(); await expect(dialog).not.toBeVisible();
    const newPerson=check(await f.service.from('muzakki').select('id').eq('nama_kk',newName).single()); f.people.push(newPerson.id);
    await page.getByRole('button',{name:new RegExp(newPerson.id)}).click();
    await page.getByRole('button',{name:'Konfirmasi individu dan daftarkan'}).click();
    await expect(page).toHaveURL(/\/pinjaman\/nasabah\/[0-9a-f-]+$/);
    const newCustomer=check(await f.service.from('loan_customers').select('id').eq('person_id',newPerson.id).single()); f.customers.push(newCustomer.id);
    await page.goto(`/pinjaman/nasabah/${existing.id}`); await page.getByRole('tab',{name:'Pinjaman',exact:true}).click();
    await expect(page.getByRole('link',{name:loan.number})).toBeVisible();
    await page.getByRole('link',{name:'Buat Pinjaman'}).click();
    await expect(page).toHaveURL(/\/pinjaman\/baru$/);
    await expect(page.getByRole('combobox',{name:'Nasabah',exact:true})).toContainText(marker);
    await expect(page.getByText(/Pencairan diblokir selama kewajiban/)).toBeVisible();
    await login(staffPage,staff); await staffPage.goto(`/pinjaman/nasabah/${existing.id}`);
    await expect(staffPage.getByRole('heading',{name:'Profil Nasabah'})).toBeVisible();
    await expect(staffPage.getByRole('tab',{name:'Akses Akun'})).toHaveCount(0);
    expect((await staff.api.rpc('loan_list_staff_accounts')).error).toBeTruthy();
    expect((await staff.api.rpc('loan_customer_account_status',{p_customer_id:existing.id})).error).toBeTruthy();
    expect((await admin.api.rpc('loan_customer_account_status',{p_customer_id:existing.id})).data[0].has_account).toBe(false);
    const denied=await staff.api.functions.invoke('loan-customer-account',{body:{customerId:existing.id,email:'test@example.test',password:'test-password-123'}});
    expect(denied.error).toBeTruthy();
    const customerResult=check(await admin.api.rpc('loan_navigation_customers',{p_search:marker,p_page:1,p_size:25}));
    expect(customerResult.total).toBe(2); expect(customerResult.items.find(x=>x.id===existing.id).obligations).toBe(1);
  } finally {
    if(newName){const found=await f.service.from('muzakki').select('id').eq('nama_kk',newName).maybeSingle();if(found.data){if(!f.people.includes(found.data.id))f.people.push(found.data.id);const customer=await f.service.from('loan_customers').select('id').eq('person_id',found.data.id).maybeSingle();if(customer.data && !f.customers.includes(customer.data.id))f.customers.push(customer.data.id);}}
    if(registeredPerson){const found=await f.service.from('loan_customers').select('id').eq('person_id',registeredPerson).maybeSingle();if(found.data && !f.customers.includes(found.data.id))f.customers.push(found.data.id);}
    await Promise.all(contexts.map(context=>context.close())); await f.cleanup();
  }
});
