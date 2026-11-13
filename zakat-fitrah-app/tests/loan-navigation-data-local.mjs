import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from './local-supabase.mjs';

const f = await task3Fixture();
try {
  const admin = await f.authUser('admin'), staff = await f.authUser('petugas'), viewer = await f.authUser('viewer'), borrower = await f.authUser();
  const marker = `NAV-${randomUUID()}`;
  const person = await f.person(marker), customer = await f.customer(borrower.id, person);
  const samePerson = await f.person(marker), sameCustomer = await f.customer(null, samePerson);
  const categories = check(await f.service.from('loan_categories').select('id').eq('is_active',true).limit(1));
  assert.ok(categories.length);
  const rows = Array.from({length: 57}, (_,i) => ({ id:randomUUID(), loan_number:`${marker}-${String(i).padStart(2,'0')}`, customer_id:customer.id, category_id:categories[0].id, purpose:'Fixture navigasi',principal:1000,status:i===0?'active':'draft',created_by:admin.id,created_at:new Date(Date.UTC(2024,0,1,0,0,i)).toISOString(), ...(i===0 ? {disbursement_date:'2024-01-01'} : {}) }));
  f.loans.push(...rows.map(row=>row.id)); check(await f.service.from('loans').insert(rows));
  check(await f.service.from('loan_installments').insert({loan_id:rows[0].id,installment_number:1,due_date:'2024-02-01',amount:1000}));
  const paymentRows = ['confirmed','pending','rejected','cancelled'].map((status,i)=>({id:randomUUID(),loan_id:rows[0].id,payment_date:'2024-01-02',amount:100,status,method:'tunai',created_by:admin.id,idempotency_key:randomUUID(),reason:status==='cancelled'?'Koreksi sintetis':null,created_at:new Date(Date.UTC(2024,0,2,0,0,i)).toISOString()}));
  check(await f.service.from('loan_payments').insert(paymentRows));
  check(await f.service.from('loan_payments').insert({id:randomUUID(),loan_id:rows[0].id,payment_date:'2100-01-01',amount:1000,status:'confirmed',method:'tunai',created_by:admin.id,idempotency_key:randomUUID()}));
  const query = async (api, args) => check(await api.rpc('loan_navigation_loans',args));
  const first=await query(admin.api,{p_search:marker,p_page:1,p_size:25});
  const last=await query(staff.api,{p_search:marker,p_page:3,p_size:25});
  assert.equal(first.total,57); assert.equal(first.items.length,25); assert.equal(last.items.length,7);
  assert.equal((await query(admin.api,{p_search:marker,p_page:4,p_size:25})).total,57);
  assert.equal((await query(admin.api,{p_search:marker,p_page:1,p_size:50})).items.length,50);
  assert.equal(new Set([...first.items,...last.items].map(item=>item.id)).size,32);
  assert.ok(last.items.some(item=>item.id===rows[0].id));
  const active=await query(admin.api,{p_search:marker,p_status:'active',p_category:categories[0].id,p_page:1,p_size:25});
  assert.equal(active.total,1); assert.equal(Number(active.items[0].remaining),900); assert.equal(Number(active.items[0].overdue),900);
  const empty=await query(admin.api,{p_search:`missing-${marker}`,p_page:3,p_size:25}); assert.deepEqual(empty,{total:0,items:[]});
  const customers=check(await admin.api.rpc('loan_navigation_customers',{p_search:marker,p_page:1,p_size:25}));
  assert.equal(customers.total,2); assert.deepEqual(new Set(customers.items.map(item=>item.id)),new Set([customer.id,sameCustomer.id]));
  assert.equal(customers.items.find(item=>item.id===customer.id).obligations,1);
  assert.equal(Number(customers.items.find(item=>item.id===customer.id).remaining),900);
  const payments=check(await admin.api.rpc('loan_navigation_payments',{p_search:marker,p_status:'confirmed',p_from:'2024-01-02',p_to:'2024-01-02',p_page:1,p_size:25}));
  assert.equal(payments.total,1); assert.equal(payments.items[0].id,paymentRows[0].id);
  assert.equal(check(await admin.api.rpc('loan_navigation_payments',{p_search:marker,p_from:'2024-01-03',p_to:'2024-12-31',p_page:1,p_size:25})).total,0);
  const summary=check(await admin.api.rpc('loan_navigation_overview')); assert.ok(Number(summary.remaining)>=900); assert.ok(Number(summary.overdue)>=900);
  check(await f.service.from('loan_installments').update({amount:999}).eq('loan_id',rows[0].id));
  const incomplete=await query(admin.api,{p_search:marker,p_status:'active',p_page:1,p_size:25});
  assert.equal(incomplete.items[0].remaining,null); assert.equal(incomplete.items[0].overdue,null); assert.equal(incomplete.items[0].incomplete,true);
  const incompleteCustomer=check(await admin.api.rpc('loan_navigation_customers',{p_search:marker,p_page:1,p_size:25})).items.find(item=>item.id===customer.id);
  assert.equal(incompleteCustomer.remaining,null); assert.equal(incompleteCustomer.incomplete,1);
  check(await admin.api.rpc('loan_set_viewer_access',{p_user_id:viewer.id,p_enabled:true}));
  for (const api of [viewer.api,borrower.api,f.client()]) {
    for (const name of ['loan_navigation_loans','loan_navigation_customers','loan_navigation_payments','loan_navigation_overview']) assert.ok((await api.rpc(name)).error,`${name} harus menolak akses`);
    assert.ok((await api.rpc('loan_navigation_position',{p_loan:rows[0].id,p_asof:'2024-02-02'})).error);
    assert.ok((await api.rpc('loan_customer_account_status',{p_customer_id:customer.id})).error);
  }
  assert.deepEqual(Object.keys(check(await admin.api.rpc('loan_customer_account_status',{p_customer_id:customer.id}))[0]).sort(),['access_paused','has_account','is_active']);
  assert.ok((await admin.api.rpc('loan_navigation_loans',{p_page:0})).error);
  check(await f.service.from('users').update({is_active:false}).eq('id',staff.id));
  assert.ok((await staff.api.rpc('loan_navigation_loans')).error);
  console.log('PASS: paginasi 57 pinjaman, pencarian, filter, periode, saldo terverifikasi, data tidak lengkap dan isolasi role');
} finally { await f.cleanup(); }
