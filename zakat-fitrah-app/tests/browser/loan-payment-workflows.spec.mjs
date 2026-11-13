import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from '../local-supabase.mjs';

test('pemilihan pembayaran, bukti hilang, penolakan, dan konflik pemeriksaan', async ({ browser }) => {
  const f = await task3Fixture(); let context;
  try {
    const admin = await f.authUser('admin'), other = await f.authUser('petugas'), borrower = await f.authUser();
    const customer = await f.customer(borrower.id); const loan = await f.loan(customer.id, admin.id);
    const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jOfoAAAAASUVORK5CYII=','base64');
    const requests=[];
    for(let i=0;i<3;i++) {
      const requestId=randomUUID(), path=`${loan.id}/${requestId}.png`; f.objects.push(['pinjaman-jamaah-private',path]); requests.push({requestId,path});
      const form=new FormData(); form.set('loanId',loan.id); form.set('requestId',requestId); form.set('paymentDate',today); form.set('amount','100'); form.set('reference',`REF-${i}`); form.set('file',new Blob([png],{type:'image/png'}),'bukti.png');
      check(await borrower.api.functions.invoke('loan-payment-claim',{body:form}));
    }
    const payments=check(await f.service.from('loan_payments').select('id,idempotency_key').in('idempotency_key',requests.map(item=>item.requestId)));
    check(await f.service.storage.from('pinjaman-jamaah-private').remove([requests[0].path]));
    context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password); await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/pinjaman/pembayaran'); await page.getByRole('button',{name:'Catat Pembayaran'}).click();
    const picker=page.getByRole('dialog'); await picker.getByLabel('Cari pinjaman untuk pembayaran').fill(loan.number); await expect(picker.getByText(loan.number)).toBeVisible();
    await picker.getByRole('button',{name:'Pilih',exact:true}).click(); await expect(page).toHaveURL(/tab=pembayaran/); await expect(page.getByRole('heading',{name:'Catat pembayaran'})).toBeVisible();
    await page.goto('/pinjaman/pembayaran');
    const rows=page.locator('div.rounded-md.border.p-3').filter({hasText:loan.number}); await expect(rows).toHaveCount(3);
    await expect(rows.first().getByText(/Kemungkinan duplikat/)).toBeVisible();
    const missing=rows.filter({hasText:'REF-0'}); await missing.getByRole('button',{name:'Periksa klaim'}).click();
    let dialog=page.getByRole('dialog'); await expect(dialog.getByText(/Berkas bukti tidak tersedia/)).toBeVisible(); await expect(dialog.getByRole('button',{name:'Konfirmasi',exact:true})).toBeDisabled();
    await dialog.getByRole('button',{name:'Tolak',exact:true}).click(); let rejection=page.getByRole('dialog').last(); await expect(rejection.getByRole('button',{name:'Tolak pembayaran'})).toBeDisabled();
    await rejection.getByLabel('Alasan penolakan').fill('Bukti tidak tersedia'); await rejection.getByRole('button',{name:'Tolak pembayaran'}).click(); await expect(page.getByText('Pemeriksaan pembayaran tersimpan.')).toBeVisible();
    const rejected=payments.find(item=>item.idempotency_key===requests[0].requestId); expect(check(await f.service.from('loan_payments').select('status,reason').eq('id',rejected.id).single())).toMatchObject({status:'rejected',reason:'Bukti tidak tersedia'});
    const concurrent=rows.filter({hasText:'REF-1'}); await concurrent.getByRole('button',{name:'Periksa klaim'}).click(); dialog=page.getByRole('dialog'); await expect(dialog.getByRole('button',{name:'Konfirmasi',exact:true})).toBeEnabled();
    const processed=payments.find(item=>item.idempotency_key===requests[1].requestId); check(await other.api.rpc('loan_review_payment_claim',{p_payment_id:processed.id,p_accept:false,p_reason:'Ditangani petugas lain'}));
    await dialog.getByRole('button',{name:'Konfirmasi',exact:true}).click(); await page.getByRole('alertdialog').getByRole('button',{name:'Konfirmasi pembayaran'}).click();
    await expect(page.getByText(/Status terbaru: Ditolak/).first()).toBeVisible(); await expect(concurrent).toHaveCount(0);
    await page.getByRole('tab',{name:'Riwayat Pembayaran'}).click(); await page.getByLabel('Cari pembayaran').fill(loan.number); await expect(page.getByText('3 hasil',{exact:true})).toBeVisible();
    await expect(page.getByText('Alasan: Bukti tidak tersedia')).toBeVisible(); await expect(page.getByText('Alasan: Ditangani petugas lain')).toBeVisible();
  } finally { if(context) await context.close(); await f.cleanup(); }
});
