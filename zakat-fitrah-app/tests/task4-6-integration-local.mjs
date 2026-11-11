// Real local API/Storage integration and concurrency; all identities are synthetic.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loanPosition } from '../src/lib/loanCalculations.ts';
import { task3Fixture, check, localSql } from './local-supabase.mjs';

const f = await task3Fixture();
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const day = (date, delta) => new Date(Date.parse(`${date}T00:00:00Z`) + delta * 86400000).toISOString().slice(0, 10);
const errorContains = (result, pattern) => { assert.ok(result.error, 'Permintaan harus ditolak'); assert.match(result.error.message, pattern); };
const financialCounts = async () => {
  // Aggregate entire rows, not only row counts, so a balance update is detected.
  // Results contain no individual account or transaction data.
  const tables = ['accounts','account_ledger_entries','pemasukan_uang','pemasukan_beras','bukti_sedekah','pembayaran_zakat'];
  const columns = tables.map(table => `(SELECT count(*)::text || ':' || coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)::text FROM public.${table} t) AS ${table}`).join(',');
  const row = localSql(`SELECT ${columns};`)[0];
  return tables.map(table => row[table]);
};
async function seedLoan(customerId, actor, principal, schedule, status = 'active') {
  const id = randomUUID(), number = `TASK46-${id}`; f.loans.push(id);
  const category = check(await f.service.from('loan_categories').select('id').eq('is_active',true).limit(1).single());
  check(await f.service.from('loans').insert({ id, loan_number: number, customer_id: customerId, category_id: category.id, principal, purpose: 'Uji pinjaman sintetis', status, created_by: actor, responsible_id: actor,
    planned_disbursement_date: day(today,-10), disbursement_date: status === 'active' ? day(today,-10) : null }));
  check(await f.service.from('loan_installments').insert(schedule.map((item,i) => ({ loan_id: id, installment_number: i + 1, due_date: item.dueDate, amount: item.amount }))));
  return { id, number, schedule };
}
async function position(loan, asOf = today) {
  const result = check(await f.service.from('loan_payments').select('id,payment_date,amount,status').eq('loan_id',loan.id));
  return loanPosition(loan.schedule, result.map(row => ({ id: row.id, date: row.payment_date, amount: Number(row.amount), status: row.status })), asOf);
}
const recordArgs = (loanId, amount, date = today, request = randomUUID()) => ({ p_loan_id: loanId, p_payment_date: date, p_amount: amount, p_method: 'tunai', p_reference: null, p_request_id: request });

try {
  const admin = await f.authUser('admin'), staff = await f.authUser('petugas'), viewer = await f.authUser('viewer'), borrower = await f.authUser();
  const templateId = check(await admin.api.rpc('loan_create_contract_template',{p_title:'Template sintetis',p_body:'Perjanjian {{nama}} untuk {{pokok}}'}));
  const customer = await f.customer(borrower.id);
  const financialBefore = await financialCounts();
  const schedule = [day(today,-1),day(today,30),day(today,60)].map(dueDate => ({ dueDate, amount: 400000 }));
  const first = await seedLoan(customer.id,admin.id,1200000,schedule);
  const firstArgs = { ...recordArgs(first.id,250000), p_notes:'Catatan internal sintetis' };
  const firstPayment = check(await staff.api.rpc('loan_record_staff_payment',firstArgs));
  assert.equal(check(await staff.api.rpc('loan_record_staff_payment',firstArgs)),firstPayment);
  assert.ok((await staff.api.rpc('loan_record_staff_payment',{...firstArgs,p_notes:'Catatan berbeda'})).error);
  const staffProofId = randomUUID(), staffProofPath = `${first.id}/${staffProofId}.pdf`;
  f.objects.push(['pinjaman-jamaah-private',staffProofPath]);
  const staffProof = () => { const data = new FormData(); data.set('paymentId',firstPayment); data.set('requestId',staffProofId); data.set('file',new Blob(['%PDF-1.4\n%synthetic proof\n%%EOF'],{type:'application/pdf'}),'bukti.pdf'); return data; };
  check(await staff.api.functions.invoke('loan-staff-payment-evidence',{body:staffProof()}));
  check(await staff.api.functions.invoke('loan-staff-payment-evidence',{body:staffProof()}));
  const evidence = check(await f.service.from('loan_documents').select('id,shared_with_customer').eq('request_id',staffProofId));
  assert.equal(evidence.length,1); assert.equal(evidence[0].shared_with_customer,false);
  const customerHistory = check(await borrower.api.rpc('loan_customer_payment_history'));
  assert.ok(customerHistory.some(row => row.id === firstPayment));
  assert.ok(customerHistory.every(row => !Object.hasOwn(row,'notes')),'Catatan internal tidak boleh terlihat oleh nasabah');
  let p = await position(first);
  assert.equal(p.remaining,950000); assert.equal(p.paymentsCount,1); assert.equal(p.settledInstallments,0); assert.equal(p.overdue,150000); assert.equal(p.daysPastDue,1);
  check(await staff.api.rpc('loan_record_payment',recordArgs(first.id,550000,day(today,-1))));
  p = await position(first); assert.equal(p.remaining,400000); assert.equal(p.paymentsCount,2); assert.equal(p.settledInstallments,2);
  const historical = await position(first,day(today,-1)); assert.equal(historical.remaining,650000); assert.equal(historical.paymentsCount,1); assert.equal(historical.settledInstallments,1);
  errorContains(await staff.api.rpc('loan_record_payment',recordArgs(first.id,400001)),/lebih|sisa|saldo/i);
  errorContains(await staff.api.rpc('loan_record_payment',recordArgs(first.id,1,day(today,1))),/tanggal/i);
  errorContains(await staff.api.rpc('loan_record_payment',recordArgs(first.id,1,day(today,-11))),/tanggal/i);
  assert.ok((await viewer.api.rpc('loan_record_payment',recordArgs(first.id,1))).error);
  assert.ok((await borrower.api.rpc('loan_record_payment',recordArgs(first.id,1))).error);
  const lastPayment = check(await admin.api.rpc('loan_record_payment',recordArgs(first.id,400000)));
  assert.equal(check(await f.service.from('loans').select('status').eq('id',first.id).single()).status,'paid');
  const receipt = check(await admin.api.rpc('loan_receipt',{ p_payment_id:lastPayment, p_issue:true }));
  assert.equal(Number(receipt.remaining),0);
  console.log('PASS: pembayaran 250.000/550.000, tanggal mundur, kelebihan, hak role dan pelunasan');

  const second = await seedLoan(customer.id,admin.id,1000,[{ dueDate: day(today,7), amount: 1000 }]);
  const third = await seedLoan(customer.id,admin.id,1500,[{ dueDate: day(today,14), amount: 1500 }],'draft');
  check(await staff.api.rpc('loan_cancel_payment',{ p_payment_id:lastPayment, p_reason:'Koreksi sintetis' }));
  assert.equal(check(await f.service.from('loans').select('status').eq('id',first.id).single()).status,'needs_reconciliation');
  assert.equal((await position(first)).remaining,400000);
  const revertedReceipt = check(await borrower.api.rpc('loan_receipt',{ p_payment_id:lastPayment, p_issue:false }));
  assert.equal(revertedReceipt.receipt_number,receipt.receipt_number); assert.equal(revertedReceipt.status,'cancelled'); assert.equal(Number(revertedReceipt.remaining),0);
  const borrowerLoans = check(await borrower.api.rpc('loan_customer_loans')).map(row => row.id);
  assert.ok(borrowerLoans.includes(first.id) && borrowerLoans.includes(second.id),'Kedua kewajiban harus terlihat oleh nasabah');
  let blocked = await admin.api.rpc('loan_disburse',{ p_loan_id:third.id,p_date:today,p_method:'tunai',p_reference:null,p_funding_label:'Dana sintetis',p_request_id:randomUUID() });
  errorContains(blocked,/aktif|kewajiban|hutang|pinjaman/i);
  assert.ok(blocked.error.message.includes(first.number) || blocked.error.message.includes(second.number),'Pesan blokir harus mencantumkan referensi kewajiban');
  assert.match(blocked.error.message,/saldo|sisa/i,'Pesan blokir harus menyebut sisa kewajiban');

  const claimId = randomUUID(); const proofPath = `${first.id}/${claimId}.png`; f.objects.push(['pinjaman-jamaah-private',proofPath]);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jOfoAAAAASUVORK5CYII=', 'base64');
  const invalidClaim = (files) => { const data=new FormData(); data.set('loanId',first.id); data.set('requestId',randomUUID()); data.set('paymentDate',today); data.set('amount','1'); data.set('reference',''); files.forEach(file => data.append('files',file,'uji.png')); return data; };
  assert.ok((await borrower.api.functions.invoke('loan-payment-claim',{body:invalidClaim(Array.from({length:4},()=>new Blob([png],{type:'image/png'})))})).error);
  assert.ok((await borrower.api.functions.invoke('loan-payment-claim',{body:invalidClaim([new Blob(['bukan png'],{type:'image/png'})])})).error);
  assert.ok((await borrower.api.functions.invoke('loan-payment-claim',{body:invalidClaim([new Blob([new Uint8Array(5242881)],{type:'image/png'})])})).error);
  const failedId = randomUUID(), failedPath = `${first.id}/${failedId}.png`;
  const failedForm = new FormData(); failedForm.set('loanId',first.id); failedForm.set('requestId',failedId); failedForm.set('paymentDate',day(today,-11)); failedForm.set('amount','1'); failedForm.set('reference',''); failedForm.set('file',new Blob([png],{type:'image/png'}),'bukti.png');
  f.objects.push(['pinjaman-jamaah-private',failedPath]);
  assert.ok((await borrower.api.functions.invoke('loan-payment-claim',{body:failedForm})).error);
  assert.equal(check(await f.service.from('loan_upload_staging').select('state').eq('storage_path',failedPath).single()).state,'pending');
  check(await f.service.from('loan_upload_staging').update({created_at:'2000-01-01T00:00:00Z'}).eq('storage_path',failedPath));
  check(await f.service.from('loan_upload_staging').update({created_at:'2000-01-01T00:00:00Z'}).eq('storage_path',staffProofPath));
  const form = new FormData(); form.set('loanId',first.id); form.set('requestId',claimId); form.set('paymentDate',today); form.set('amount','100000'); form.set('reference','Uji koreksi'); form.set('note','Catatan nasabah sintetis');
  for (let i=0;i<3;i++) { form.append('files',new Blob([png],{ type:'image/png' }),`bukti${i}.png`); if (i) f.objects.push(['pinjaman-jamaah-private',`${first.id}/${claimId}-${i}.png`]); }
  check(await borrower.api.functions.invoke('loan-payment-claim',{ body:form }));
  assert.equal(check(await f.service.from('loan_upload_staging').select('state').eq('storage_path',failedPath).single()).state,'cleaned');
  assert.ok((await f.service.storage.from('pinjaman-jamaah-private').download(failedPath)).error);
  assert.equal(check(await f.service.from('loan_upload_staging').select('state').eq('storage_path',staffProofPath).single()).state,'attached');
  assert.ok(check(await f.service.storage.from('pinjaman-jamaah-private').download(staffProofPath)));
  assert.equal(check(await f.service.from('loan_upload_staging').select('state').eq('storage_path',proofPath).single()).state,'attached');
  assert.equal((await position(first)).remaining,400000,'Klaim belum dikonfirmasi tidak mengurangi utang');
  const pending = check(await f.service.from('loan_payments').select('id').eq('idempotency_key',claimId).single());
  assert.equal(check(await f.service.from('loan_documents').select('id').eq('payment_id',pending.id).eq('kind','payment_evidence')).length,3);
  assert.ok(check(await borrower.api.rpc('loan_customer_payment_history')).some(row => row.id===pending.id && row.customer_note==='Catatan nasabah sintetis'));
  check(await staff.api.rpc('loan_review_payment_claim',{ p_payment_id:pending.id,p_accept:true,p_reason:null }));
  check(await staff.api.rpc('loan_record_payment',recordArgs(first.id,300000)));
  assert.equal(check(await f.service.from('loans').select('status').eq('id',first.id).single()).status,'paid');
  blocked = await admin.api.rpc('loan_disburse',{ p_loan_id:third.id,p_date:today,p_method:'tunai',p_reference:null,p_funding_label:'Dana sintetis',p_request_id:randomUUID() });
  errorContains(blocked,/aktif|kewajiban|hutang|pinjaman/i); assert.ok(blocked.error.message.includes(second.number));
  check(await staff.api.rpc('loan_record_payment',recordArgs(second.id,1000)));
  console.log('PASS: kewajiban lama pulih, terlihat, dapat dibayar, dan pencairan lain tetap diblokir');

  const attempt = randomUUID();
  const disburseArgs = { p_loan_id:third.id,p_date:today,p_method:'tunai',p_reference:null,p_funding_label:'Dana sintetis',p_request_id:attempt };
  errorContains(await admin.api.rpc('loan_disburse',disburseArgs),/kontrak/i);
  const contractId = randomUUID(), contractPath = `${third.id}/${contractId}.pdf`; f.objects.push(['pinjaman-jamaah-private',contractPath]);
  const contract = new FormData(); contract.set('loanId',third.id); contract.set('requestId',contractId); contract.set('disbursementDate',today); contract.set('templateId',templateId);
  contract.set('file',new Blob(['%PDF-1.4\n%synthetic contract\n%%EOF'],{ type:'application/pdf' }),'kontrak.pdf');
  assert.ok((await staff.api.functions.invoke('loan-contract-upload',{ body:contract })).error,'Konfirmasi pemeriksaan harus diwajibkan');
  contract.set('verified','true');
  check(await staff.api.functions.invoke('loan-contract-upload',{ body:contract }));
  const contractDoc = check(await f.service.from('loan_documents').select('id,snapshot,verified_by,verified_at').eq('request_id',contractId).single());
  assert.equal(contractDoc.snapshot.template_id,templateId); assert.equal(contractDoc.snapshot.template_body,'Perjanjian {{nama}} untuk {{pokok}}');
  assert.equal(contractDoc.verified_by,staff.id); assert.ok(contractDoc.verified_at);
  const disbursement = check(await staff.api.rpc('loan_disburse',disburseArgs));
  const retried = check(await staff.api.rpc('loan_disburse',disburseArgs)); assert.equal(disbursement,retried);
  const disbEvidenceId=randomUUID(), disbEvidencePath=`${third.id}/${disbEvidenceId}.pdf`;
  f.objects.push(['pinjaman-jamaah-private',disbEvidencePath]);
  const disbEvidence=()=>{ const data=new FormData(); data.set('disbursementId',disbursement); data.set('requestId',disbEvidenceId); data.set('file',new Blob(['%PDF-1.4\n%synthetic\n%%EOF'],{type:'application/pdf'}),'bukti.pdf'); return data; };
  assert.ok((await borrower.api.functions.invoke('loan-disbursement-evidence',{body:disbEvidence()})).error);
  assert.ok((await viewer.api.functions.invoke('loan-disbursement-evidence',{body:disbEvidence()})).error);
  check(await staff.api.functions.invoke('loan-disbursement-evidence',{body:disbEvidence()}));
  check(await staff.api.functions.invoke('loan-disbursement-evidence',{body:disbEvidence()}));
  assert.equal(check(await f.service.from('loan_documents').select('id').eq('request_id',disbEvidenceId)).length,1);
  assert.ok((await borrower.api.storage.from('pinjaman-jamaah-private').download(disbEvidencePath)).error);
  assert.equal(check(await f.service.from('loans').select('status').eq('id',third.id).single()).status,'active');
  check(await admin.api.rpc('loan_create_contract_template',{p_title:'Template versi berikutnya',p_body:'Redaksi sintetis yang berbeda'}));
  check(await f.service.from('muzakki').update({nama_lengkap:'Nama sintetis diperbarui'}).eq('id',customer.personId));
  const archived = check(await f.service.from('loan_documents').select('snapshot').eq('id',contractDoc.id).single());
  assert.deepEqual(archived.snapshot,contractDoc.snapshot,'Perubahan profil dan versi template tidak boleh mengubah snapshot kontrak');
  assert.ok((await borrower.api.storage.from('pinjaman-jamaah-private').download(contractPath)).error,'Kontrak belum dibagikan tidak dapat diunduh nasabah');
  assert.ok((await borrower.api.rpc('loan_set_contract_sharing',{p_document_id:contractDoc.id,p_shared:true})).error);
  check(await staff.api.rpc('loan_set_contract_sharing',{p_document_id:contractDoc.id,p_shared:true}));
  assert.ok(check(await borrower.api.storage.from('pinjaman-jamaah-private').download(contractPath)));
  const stranger = await f.authUser(), strangerCustomer = await f.customer(stranger.id);
  assert.ok(strangerCustomer.id);
  assert.ok((await stranger.api.storage.from('pinjaman-jamaah-private').download(contractPath)).error);
  assert.ok((await stranger.api.rpc('loan_print_document_data',{p_loan_id:third.id})).error);
  assert.ok((await stranger.api.rpc('loan_historical_contract_missing',{p_loan_id:third.id})).error);
  assert.ok((await viewer.api.rpc('loan_print_document_data',{p_loan_id:third.id})).error);
  const printData = check(await borrower.api.rpc('loan_print_document_data',{p_loan_id:third.id}));
  assert.equal(printData.loan_number,third.number); assert.equal(printData.disbursement.date,today);
  assert.ok(!JSON.stringify(printData).includes('Catatan internal sintetis'));
  check(await staff.api.rpc('loan_set_contract_sharing',{p_document_id:contractDoc.id,p_shared:false}));
  assert.ok((await borrower.api.storage.from('pinjaman-jamaah-private').download(contractPath)).error);
  const historicalLoan = await f.loan(strangerCustomer.id,admin.id);
  check(await f.service.from('loans').update({migration_cutoff:day(today,-1),opening_balance:1000,historical_incomplete:true}).eq('id',historicalLoan.id));
  assert.equal(check(await stranger.api.rpc('loan_historical_contract_missing',{p_loan_id:historicalLoan.id})),true);
  assert.equal(check(await borrower.api.rpc('loan_historical_contract_missing',{p_loan_id:third.id})),false);
  assert.ok((await financialCounts()).every((value,i) => value === financialBefore[i]),'Pinjaman tidak boleh mengubah ledger atau penerimaan');
  console.log('PASS: kontrak wajib, pencairan atomik/idempoten, dan isolasi ledger');

  const raceCustomer = await f.customer(), race = await seedLoan(raceCustomer.id,admin.id,1200000,[{ dueDate:day(today,10),amount:1200000 }]);
  const raceResults = await Promise.all([staff.api.rpc('loan_record_payment',recordArgs(race.id,700000)),admin.api.rpc('loan_record_payment',recordArgs(race.id,700000))]);
  assert.equal(raceResults.filter(result => !result.error).length,1,'Dua konfirmasi tidak boleh melebihi saldo');
  assert.equal((await position(race)).remaining,500000);
  const retryArgs = recordArgs(race.id,100000);
  const retries = await Promise.all([staff.api.rpc('loan_record_payment',retryArgs),staff.api.rpc('loan_record_payment',retryArgs)]);
  assert.ifError(retries[0].error); assert.ifError(retries[1].error); assert.equal(retries[0].data,retries[1].data);
  assert.equal((await position(race)).remaining,400000);
  assert.ok((await financialCounts()).every((value,i) => value === financialBefore[i]),'Pinjaman tidak boleh mengubah ledger atau penerimaan');
  console.log('PASS: dua petugas bersamaan, retry bersamaan, dan saldo tidak negatif');

  const claimUser = await f.authUser(), claimCustomer = await f.customer(claimUser.id);
  const claimLoan = await seedLoan(claimCustomer.id,admin.id,1000,[{ dueDate:today,amount:1000 }]);
  const submitClaim = async () => {
    const id = randomUUID(), path = `${claimLoan.id}/${id}.png`; f.objects.push(['pinjaman-jamaah-private',path]);
    const item = new FormData(); item.set('loanId',claimLoan.id); item.set('requestId',id); item.set('paymentDate',today); item.set('amount','700'); item.set('reference','Duplikat sintetis'); item.set('file',new Blob([png],{ type:'image/png' }),'bukti.png');
    check(await claimUser.api.functions.invoke('loan-payment-claim',{body:item}));
    return check(await f.service.from('loan_payments').select('id').eq('idempotency_key',id).single()).id;
  };
  const claimA = await submitClaim(), claimB = await submitClaim();
  assert.equal((await position(claimLoan)).remaining,1000);
  const queue = check(await staff.api.rpc('loan_claim_review_queue',{p_offset:0,p_limit:25}));
  assert.ok(queue.some(item => item.payment_id === claimA && item.possible_duplicate));
  assert.ok(queue.some(item => item.payment_id === claimB && item.possible_duplicate));
  const reviewA = {p_payment_id:claimA,p_accept:true,p_reason:null}, reviewB = {p_payment_id:claimB,p_accept:true,p_reason:null};
  const confirmations = await Promise.all([staff.api.rpc('loan_review_payment_claim',reviewA),admin.api.rpc('loan_review_payment_claim',reviewB)]);
  assert.equal(confirmations.filter(result=>!result.error).length,1,'Klaim bersamaan tidak boleh melebihi saldo');
  assert.equal((await position(claimLoan)).remaining,300);
  const winning = confirmations[0].error ? [admin.api,reviewB] : [staff.api,reviewA];
  assert.ifError((await winning[0].rpc('loan_review_payment_claim',winning[1])).error);
  assert.equal((await position(claimLoan)).remaining,300);
  const winningId = winning[1].p_payment_id;
  const cancellation = {p_payment_id:winningId,p_reason:'Koreksi uji klaim'};
  const cancelled = await Promise.all([staff.api.rpc('loan_cancel_payment',cancellation),staff.api.rpc('loan_cancel_payment',cancellation)]);
  assert.ifError(cancelled[0].error); assert.ifError(cancelled[1].error);
  assert.equal((await position(claimLoan)).remaining,1000);
  const audit = check(await f.service.from('loan_audit').select('action,details').eq('loan_id',claimLoan.id));
  assert.equal(audit.filter(item=>item.action==='payment_cancelled' && item.details?.payment_id === winningId).length,1);
  assert.ok((await financialCounts()).every((value,i) => value === financialBefore[i]));
  console.log('PASS: klaim duplikat terindikasi, konfirmasi bersamaan dan pembatalan idempoten');
} finally { await f.cleanup(); }
