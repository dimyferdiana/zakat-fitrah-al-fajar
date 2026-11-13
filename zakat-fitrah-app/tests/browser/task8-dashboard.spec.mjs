import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check, localSql } from '../local-supabase.mjs';

const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=(delta)=>new Date(Date.parse(`${today}T00:00:00Z`)+delta*86400000).toISOString().slice(0,10);
async function bytes(download) { const chunks=[]; for await (const chunk of await download.createReadStream()) chunks.push(chunk); return Buffer.concat(chunks); }
const ledgerFingerprint=()=>localSql(`SELECT jsonb_build_object(
 'accounts',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.accounts t),
 'ledger',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.account_ledger_entries t),
 'uang',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_uang t),
 'beras',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_beras t),
 'sedekah',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.bukti_sedekah t),
 'zakat',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pembayaran_zakat t)) AS fingerprint;`)[0].fingerprint;

test('dashboard mobile, filters, reminders and safe exports match the loan',async ({browser})=>{
  const f=await task3Fixture(); const contexts=[];
  try {
    const admin=await f.authUser('admin'), borrower=await f.authUser();
    const person=await f.person(`=Nasabah ${randomUUID()}`), customer=await f.customer(borrower.id,person), loan=await f.loan(customer.id,admin.id);
    check(await f.service.from('loans').update({disbursement_date:day(-3),region_snapshot:{rt:'002',rw:'003',alamat:'Alamat lama sintetis'}}).eq('id',loan.id));
    check(await f.service.from('loan_installments').update({due_date:day(-2)}).eq('loan_id',loan.id));
    check(await f.service.from('loan_disbursements').insert({loan_id:loan.id,disbursement_date:day(-3),amount:1000,method:'tunai',created_by:admin.id,request_id:randomUUID()}));
    check(await admin.api.rpc('loan_record_payment',{p_loan_id:loan.id,p_payment_date:day(-1),p_amount:250,p_method:'tunai',p_reference:null,p_request_id:randomUUID()}));
    const context=await browser.newContext({viewport:{width:390,height:844}}); contexts.push(context); const page=await context.newPage();
    await page.goto('/login'); await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password);
    await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/pinjaman/laporan');
    const dashboard=page.getByText('Laporan pinjaman',{exact:true}).locator('../..');
    await expect(dashboard).toBeVisible();
    await dashboard.getByLabel('Transaksi dari').fill(day(-4));
    await dashboard.getByLabel('Transaksi sampai').fill(today);
    await dashboard.getByLabel('Tanggal posisi',{exact:true}).fill(today);
    await dashboard.getByLabel('Nama atau nomor pinjaman').fill(loan.number);
    await dashboard.getByRole('button',{name:'Terapkan filter'}).click();
    await expect(dashboard.getByText(/Nasabah aktif terverifikasi/)).toContainText('1');
    await expect(dashboard.getByText(/Pinjaman aktif terverifikasi/)).toContainText('1');
    await expect(dashboard.getByText(/^Pencairan \(/)).toContainText('1.000');
    await expect(dashboard.getByText(/^Pembayaran \(/)).toContainText('250');
    await expect(dashboard.getByText(/^Sisa pokok \(/)).toContainText('750');
    await expect(dashboard.getByText(/^Tunggakan \(/)).toContainText('750');
    await expect(dashboard.getByText(/Rasio tunggakan \/ sisa/)).toContainText('100.0%');
    const arrears=dashboard.getByRole('heading',{name:'Tunggakan berdasarkan hari keterlambatan'}).locator('..');
    await arrears.getByRole('button',{name:'Siapkan pengingat'}).click();
    await expect(dashboard.getByLabel('Teks pengingat untuk dikirim manual')).toHaveValue(new RegExp(loan.number));
    await expect(dashboard.getByLabel('Teks pengingat untuk dikirim manual')).toHaveValue(/Kontak:/);
    const report=page.getByText('Laporan pinjaman',{exact:true}).locator('../..');
    await report.getByLabel('Transaksi dari').fill(day(-4));
    await report.getByLabel('Transaksi sampai').fill(today);
    await report.getByLabel('Tanggal posisi',{exact:true}).fill(today);
    await report.getByLabel('Nama atau nomor pinjaman').fill(loan.number);
    await report.getByRole('button',{name:'Terapkan filter'}).click();
    const profile=report.getByRole('heading',{name:'Profil nasabah',exact:true}).locator('..');
    await profile.getByLabel('Cari profil nasabah').fill(customer.id);
    await profile.getByRole('combobox',{name:'Pilih nasabah'}).click(); await page.getByRole('option',{name:new RegExp(customer.id)}).click();
    await expect(profile.getByText(/Sisa pokok terverifikasi/)).toContainText('750');
    const financialBefore=ledgerFingerprint();
    const csvWait=page.waitForEvent('download'); await report.getByRole('button',{name:'Unduh CSV'}).click();
    const csv=(await bytes(await csvWait)).toString('utf8');
    expect(csv).toContain(loan.number); expect(csv).toMatch(/'=Nasabah/); expect(csv).toContain('750');
    const pdfWait=page.waitForEvent('download'); await report.getByRole('button',{name:'Unduh PDF'}).click();
    const pdf=await bytes(await pdfWait); expect(pdf.subarray(0,5).toString()).toBe('%PDF-'); expect(pdf.toString('latin1')).toContain(loan.number);
    expect(ledgerFingerprint()).toEqual(financialBefore);
    // A correction changes the previously exported historical position and flow.
    await report.getByLabel('Transaksi dari').fill(day(-2));
    await report.getByLabel('Transaksi sampai').fill(day(-1));
    await report.getByLabel('Tanggal posisi',{exact:true}).fill(day(-1));
    await report.getByRole('button',{name:'Terapkan filter'}).click();
    await expect(report.getByText(/^Pembayaran \(/)).toContainText('250');
    await expect(report.getByText(/^Sisa pokok \(/)).toContainText('750');
    const historicalCsvWait=page.waitForEvent('download');
    await report.getByRole('button',{name:'Unduh CSV'}).click();
    const historicalCsv=(await bytes(await historicalCsvWait)).toString('utf8');
    expect(historicalCsv.split('\n').find(line=>line.startsWith(`"${loan.number}"`))).toContain('"1000","0","250","750"');
    const payment=check(await f.service.from('loan_payments').select('id').eq('loan_id',loan.id).eq('status','confirmed').single());
    check(await admin.api.rpc('loan_cancel_payment',{p_payment_id:payment.id,p_reason:'Koreksi pengujian laporan historis'}));
    await page.reload();
    await report.getByLabel('Transaksi dari').fill(day(-2));
    await report.getByLabel('Transaksi sampai').fill(day(-1));
    await report.getByLabel('Tanggal posisi',{exact:true}).fill(day(-1));
    await report.getByLabel('Nama atau nomor pinjaman').fill(loan.number);
    await report.getByRole('button',{name:'Terapkan filter'}).click();
    await expect(report.getByText(/^Pembayaran \(/)).toContainText(/Rp\s*0/);
    await expect(report.getByText(/^Sisa pokok \(/)).toContainText('1.000');
    const correctedCsvWait=page.waitForEvent('download');
    await report.getByRole('button',{name:'Unduh CSV'}).click();
    const correctedCsv=(await bytes(await correctedCsvWait)).toString('utf8');
    expect(correctedCsv.split('\n').find(line=>line.startsWith(`"${loan.number}"`))).toContain('"1000","0","0","1000"');
    expect(ledgerFingerprint()).toEqual(financialBefore);
    await arrears.getByRole('button',{name:new RegExp(loan.number)}).click();
    await expect(page.getByText('Rincian pinjaman',{exact:true})).toBeVisible();
    console.log('PASS: mobile dashboard filter, amounts, reminder, safe CSV, PDF and navigation');
  } finally { await Promise.all(contexts.map(context=>context.close())); await f.cleanup(); }
});
