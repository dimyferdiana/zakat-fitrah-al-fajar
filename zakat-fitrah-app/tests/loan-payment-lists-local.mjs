import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from './local-supabase.mjs';

const f=await task3Fixture();
try {
  const admin=await f.authUser('admin'), staff=await f.authUser('petugas'), viewer=await f.authUser('viewer'), borrower=await f.authUser();
  const marker=`PAY-${randomUUID()}`, person=await f.person(marker), customer=await f.customer(borrower.id,person), loan=await f.loan(customer.id,admin.id,marker);
  const rows=Array.from({length:56},(_,i)=>({id:randomUUID(),loan_id:loan.id,payment_date:'2025-01-01',amount:10,status:'pending',method:'transfer',reference:`${marker}-${i}`,created_by:borrower.id,idempotency_key:randomUUID(),created_at:new Date(Date.UTC(2025,0,1,0,0,i)).toISOString()}));
  check(await f.service.from('loan_payments').insert(rows));
  const pages=[]; let total=0;
  for(let offset=0;offset<1000;offset+=25) {
    const batch=check(await staff.api.rpc('loan_claim_review_queue',{p_offset:offset,p_limit:25})); if(!batch.length) break;
    total=Number(batch[0].total_pending); assert.ok(batch.length<=25); pages.push(...batch);
    if(pages.length>=total) break;
  }
  assert.ok(total>=56); const fixture=pages.filter(item=>item.loan_id===loan.id);
  assert.equal(fixture.length,56); assert.equal(new Set(fixture.map(item=>item.payment_id)).size,56); assert.ok(fixture.every(item=>item.possible_duplicate));
  const history=async page=>check(await admin.api.rpc('loan_navigation_payments',{p_search:marker,p_status:'pending',p_from:'2025-01-01',p_to:'2025-01-01',p_page:page,p_size:25}));
  const first=await history(1), second=await history(2), third=await history(3);
  assert.equal(first.total,56); assert.equal(first.items.length,25); assert.equal(second.items.length,25); assert.equal(third.items.length,6);
  assert.equal(new Set([...first.items,...second.items,...third.items].map(item=>item.id)).size,56);
  assert.equal(check(await admin.api.rpc('loan_navigation_payments',{p_search:marker,p_status:'confirmed'})).total,0);
  assert.equal(check(await admin.api.rpc('loan_navigation_payments',{p_search:marker,p_from:'2025-01-02'})).total,0);
  for(const api of [viewer.api,borrower.api,f.client()]) { assert.ok((await api.rpc('loan_claim_review_queue')).error); assert.ok((await api.rpc('loan_navigation_payments')).error); }
  console.log('PASS: 56 klaim, paginasi antrean dan riwayat, duplikat, filter, urutan dan isolasi role');
} finally {await f.cleanup();}
