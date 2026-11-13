import { test, expect } from '@playwright/test';
import { task3Fixture, check } from '../local-supabase.mjs';

async function checkLabels(page, area) {
  const unlabeled=await page.evaluate(()=>Array.from(document.querySelectorAll('input:not([type=hidden]), textarea, [role=combobox]')).filter(element=>{
    if(!(element instanceof HTMLElement) || !element.getClientRects().length)return false;
    const control=element;return !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby') && !(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLButtonElement ? control.labels?.length : 0);
  }).map(element=>element.outerHTML.slice(0,240)));
  expect(unlabeled,`Kontrol tanpa label di ${area}`).toEqual([]);
}

for (const viewport of [{width:1366,height:768},{width:390,height:844}]) {
  test(`modul pinjaman: tata letak dan keyboard ${viewport.width}`,async({browser})=>{
    const f=await task3Fixture(); let context;
    try {
      const admin=await f.authUser('admin'), customer=await f.customer(), loan=await f.loan(customer.id,admin.id);
      const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      check(await f.service.from('loans').update({disbursement_date:today}).eq('id',loan.id));
      context=await browser.newContext({viewport}); const page=await context.newPage();
      await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(admin.email);await page.getByLabel('Password',{exact:true}).fill(admin.password);await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);
      const paths=['/pinjaman/dashboard','/pinjaman/nasabah','/pinjaman/daftar','/pinjaman/pembayaran','/pinjaman/laporan','/pinjaman/pengaturan','/pinjaman/baru','/pinjaman/nasabah/baru',`/pinjaman/nasabah/${customer.id}`,`/pinjaman/daftar/${loan.id}?tab=pembayaran`];
      for(const [index,path] of paths.entries()) {
        await page.goto(path);await expect(page.locator('h1').last()).toBeVisible();
        await expect.poll(()=>page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}))).toEqual({body:viewport.width,viewport:viewport.width});
        await checkLabels(page,path);
        if(index===2 && viewport.width<640) {const card=page.getByTestId('loan-mobile-card').first();await expect(card).toBeVisible();await expect(card.getByRole('link',{name:/Lihat rincian/})).toBeVisible();}
        if(index===2 && viewport.width>=640) {const rows=page.locator('tbody tr');await expect(rows.first()).toBeVisible();const heights=await rows.evaluateAll(elements=>elements.map(element=>element.getBoundingClientRect().height));expect(Math.max(...heights)).toBeLessThan(140);}
        if(index===8) {await page.getByRole('tab',{name:'Akses Akun'}).click();await checkLabels(page,'akses akun');}
        await page.screenshot({path:`test-results/loan-page-${index}-${viewport.width}.png`});
      }
      for(const name of ['Ringkasan','Jadwal','Dokumen','Tindak Lanjut','Pembayaran']) {
        await page.getByRole('tab',{name,exact:true}).click();await checkLabels(page,`rincian ${name}`);
        await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);
      }
      const payment=page.getByRole('heading',{name:'Catat pembayaran'}).locator('..');
      const action=payment.getByRole('button',{name:'Konfirmasi pembayaran'}); const box=await action.boundingBox(); expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      await action.click(); await expect(payment.getByLabel('Tanggal',{exact:true})).toBeFocused(); await expect(payment.getByText(/Isi tanggal pembayaran/)).toBeVisible(); await expect(payment.getByText(/nominal positif/)).toBeVisible();
      await page.goto('/pinjaman/pembayaran'); const trigger=page.getByRole('button',{name:'Catat Pembayaran'}); await trigger.focus(); await page.keyboard.press('Enter');
      const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('heading',{name:'Pilih pinjaman'})).toBeVisible();
      const rect=await dialog.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(viewport.width);expect(rect.height).toBeLessThanOrEqual(viewport.height);
      await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
      await page.screenshot({path:`test-results/loan-ui-${viewport.width}.png`,fullPage:true});
      await page.evaluate(()=>document.documentElement.classList.add('dark')); await trigger.click(); await expect(dialog).toBeVisible();
      const colors=await dialog.evaluate(element=>({background:getComputedStyle(element).backgroundColor,color:getComputedStyle(element).color,dark:document.documentElement.classList.contains('dark')}));expect(colors.dark).toBe(true);expect(colors.background).not.toBe(colors.color);expect(colors.background).not.toBe('rgb(255, 255, 255)');
      await page.screenshot({path:`test-results/loan-dark-dialog-${viewport.width}.png`});
      await page.keyboard.press('Escape');await page.goto('/pinjaman/baru');await page.getByLabel('Cari nasabah').fill('perubahan');const back=page.getByRole('link',{name:/Kembali ke Pinjaman/});await back.focus();await page.keyboard.press('Enter');
      const unsaved=page.getByRole('alertdialog');await expect(unsaved).toBeVisible();await page.keyboard.press('Escape');await expect(unsaved).toHaveCount(0);await expect(page.getByLabel('Cari nasabah')).toHaveValue('perubahan');await expect(back).toBeFocused();
    } finally {if(context)await context.close();await f.cleanup();}
  });
}
