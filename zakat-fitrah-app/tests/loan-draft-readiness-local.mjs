import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from './local-supabase.mjs';

const f=await task3Fixture();
try {
  const admin=await f.authUser('admin'), staff=await f.authUser('petugas'), viewer=await f.authUser('viewer'), borrower=await f.authUser();
  const customer=await f.customer(borrower.id);
  const category=check(await f.service.from('loan_categories').select('id').eq('is_active',true).limit(1).single());
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const due=new Date(Date.parse(`${today}T00:00:00Z`)+86400000).toISOString().slice(0,10);
  const request=randomUUID();
  const args={p_customer_id:customer.id,p_category_id:category.id,p_purpose:'Uji kesiapan',p_principal:1000,p_schedule:[{dueDate:due,amount:1000}],p_request_id:request,p_planned:today,p_responsible:admin.id,p_notes:null};
  const loanId=check(await admin.api.rpc('loan_create_complete_draft',args)); f.loans.push(loanId);
  assert.equal(check(await admin.api.rpc('loan_create_complete_draft',args)),loanId);
  const first=check(await staff.api.rpc('loan_draft_readiness',{p_loan_id:loanId,p_date:today}));
  assert.equal(first.person_ok,true); assert.equal(first.schedule_ok,true); assert.equal(first.contract_ok,false); assert.equal(first.conflict_number,null);
  check(await f.service.from('loan_installments').update({amount:999}).eq('loan_id',loanId));
  assert.equal(check(await admin.api.rpc('loan_draft_readiness',{p_loan_id:loanId,p_date:today})).schedule_ok,false);
  check(await f.service.from('loan_installments').update({amount:1000}).eq('loan_id',loanId));
  const conflict=await f.loan(customer.id,admin.id);
  assert.equal(check(await admin.api.rpc('loan_draft_readiness',{p_loan_id:loanId,p_date:today})).conflict_number,conflict.number);
  for(const api of [viewer.api,borrower.api,f.client()]) assert.ok((await api.rpc('loan_draft_readiness',{p_loan_id:loanId,p_date:today})).error);
  assert.ok((await admin.api.rpc('loan_disburse',{p_loan_id:loanId,p_date:today,p_method:'tunai',p_reference:null,p_funding_label:'Uji',p_request_id:randomUUID()})).error);
  assert.equal(check(await f.service.from('loans').select('status').eq('id',loanId).single()).status,'draft');
  console.log('PASS: kesiapan draf, jadwal, kontrak, kewajiban, retry dan pembatasan role');
} finally {await f.cleanup();}
