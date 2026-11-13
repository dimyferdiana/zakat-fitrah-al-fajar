import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from './local-supabase.mjs';

const f=await task3Fixture();
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=n=>new Date(Date.parse(`${today}T00:00:00Z`)+n*86400000).toISOString().slice(0,10);
try {
  const admin=await f.authUser('admin'), viewer=await f.authUser('viewer'); const marker=`OV-${randomUUID()}`;
  const baseline=check(await admin.api.rpc('loan_navigation_overview'));
  const people=[]; const records=[];
  for(let i=0;i<8;i++) {
    const person=await f.person(`${marker}-${i}`), customer=await f.customer(null,person), id=randomUUID(); people.push(customer.id); f.loans.push(id);
    records.push({id,loan_number:`${marker}-${i}`,customer_id:customer.id,purpose:'Uji ringkasan',principal:1000,status:i===7?'draft':'active',created_by:admin.id,disbursement_date:i===7?null:day(-20),planned_disbursement_date:day(-20)});
  }
  check(await f.service.from('loans').insert(records));
  check(await f.service.from('loan_installments').insert(records.map((loan,i)=>({loan_id:loan.id,installment_number:1,due_date:day(i===0?-1:i===7?14:i),amount:1000}))));
  const overview=check(await admin.api.rpc('loan_navigation_overview'));
  assert.equal(Number(overview.remaining)-Number(baseline.remaining),7000); assert.equal(Number(overview.overdue)-Number(baseline.overdue),1000);
  assert.equal(Number(overview.active)-Number(baseline.active),7); assert.equal(Number(overview.due_count)-Number(baseline.due_count),6); assert.equal(Number(overview.overdue_count)-Number(baseline.overdue_count),1); assert.equal(Number(overview.draft_count)-Number(baseline.draft_count),1);
  assert.ok(overview.due.length<=5 && overview.overdue_items.length<=5 && overview.drafts.length<=5 && overview.pending.length<=5);
  for(const [attention,count] of [['due',6],['overdue',1],['incomplete_draft',1]]) {
    const result=check(await admin.api.rpc('loan_navigation_loans',{p_search:marker,p_attention:attention,p_page:1,p_size:25})); assert.equal(result.total,count,attention); assert.equal(new Set(result.items.map(item=>item.id)).size,count);
  }
  assert.ok((await admin.api.rpc('loan_navigation_loans',{p_attention:'invalid'})).error);
  assert.ok((await viewer.api.rpc('loan_navigation_loans',{p_attention:'due'})).error);
  console.log('PASS: ringkasan terverifikasi, batas lima entri dan filter perhatian yang konsisten');
} finally {await f.cleanup();}
