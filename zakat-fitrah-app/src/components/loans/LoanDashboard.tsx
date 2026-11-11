import { memo, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { groupReport, regionLabel, reportCsv, reportRows, type ReportFilters, type ReportGroup, type ReportLoan, type ReportRow } from '@/lib/loanReport';
import { classifyCollectibility, type CollectibilityConfig } from '@/lib/loanCollectibility';
import { LoanCollectibilityStatus } from '@/components/loans/LoanCollectibilityControls';

const client = supabase as unknown as SupabaseClient;
const currencyFormatter = new Intl.NumberFormat('id-ID', { style:'currency',currency:'IDR',maximumFractionDigits:0 });
const money = (value: number) => currencyFormatter.format(value);
const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const later = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`)+days*86400000).toISOString().slice(0,10);
const statusLabel: Record<string,string> = { draft:'Draft',cancelled:'Dibatalkan',active:'Aktif',paid:'Lunas',perlu_rekonsiliasi:'Perlu rekonsiliasi',belum_dicairkan:'Belum dicairkan' };
const inPeriod = (date: string, filter: ReportFilters) => date >= filter.from && date <= filter.to;

function GroupTable({ title, groups }: { title: string; groups: ReportGroup[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const lastPage = Math.max(0, Math.ceil(groups.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visibleGroups = groups.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  return <div className="space-y-2"><h3 className="font-semibold">{title}</h3><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b"><th>Kelompok</th><th>Pinjaman / nasabah</th><th>Cair periode</th><th>Bayar periode</th><th>Sisa posisi</th><th>Tunggakan</th></tr></thead><tbody>{visibleGroups.map(g => <tr className="border-b" key={g.key}><td>{g.key}{g.incomplete > 0 && ` (${g.incomplete} belum lengkap)`}</td><td>{g.loans} / {g.customers}</td><td>{money(g.disbursed)}</td><td>{money(g.paid)}</td><td>{money(g.remaining)}</td><td>{money(g.overdue)}</td></tr>)}</tbody></table></div>{groups.length === 0 ? <p>Tidak ada data yang cocok.</p> : <div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" aria-label={`Halaman sebelumnya ${title}`} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Sebelumnya</Button><span>Halaman {currentPage + 1} dari {lastPage + 1} · {groups.length} kelompok</span><Button variant="outline" size="sm" aria-label={`Halaman berikutnya ${title}`} disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Berikutnya</Button></div>}</div>;
}

function PagedList<T>({ title, items, empty, renderItem }: { title: string; items: T[]; empty: string; renderItem: (item: T) => ReactNode }) {
  const [page, setPage] = useState(0);
  const size = 20;
  const last = Math.max(0, Math.ceil(items.length / size) - 1);
  const current = Math.min(page, last);
  return <div><h3 className="font-semibold">{title}</h3>
    {items.slice(current * size, (current + 1) * size).map(renderItem)}
    {items.length === 0 ? <p>{empty}</p> : items.length > size && <div className="flex flex-wrap items-center gap-2 py-2">
      <Button size="sm" variant="outline" aria-label={`Halaman sebelumnya ${title}`} disabled={current === 0} onClick={() => setPage(current - 1)}>Sebelumnya</Button>
      <span>Halaman {current + 1} dari {last + 1} ? {items.length} hasil</span>
      <Button size="sm" variant="outline" aria-label={`Halaman berikutnya ${title}`} disabled={current === last} onClick={() => setPage(current + 1)}>Berikutnya</Button>
    </div>}
  </div>;
}

export const LoanDashboard = memo(function LoanDashboard({ onSelectLoan }: { onSelectLoan?: (id: string) => void }) {
  const [filter,setFilter] = useState<ReportFilters>(() => { const date=today(); return {from:`${date.slice(0,7)}-01`,to:date,asOf:date,category:'',customer:'',region:'',status:''}; });
  const [kind,setKind] = useState('pinjaman');
  const [collectibility,setCollectibility] = useState('');
  const [profileId,setProfileId] = useState('');
  const [profileSearch,setProfileSearch] = useState('');
  const [reminder,setReminder] = useState('');
  const query = useQuery({ queryKey:['loan-dashboard-current','report'], queryFn:async () => { const {data,error}=await client.rpc('loan_dashboard_report_data'); if(error) throw error; return data as ReportLoan[]; } });
  const rules = useQuery({ queryKey:['loan-collectibility-config'], queryFn:async () => { const {data,error}=await client.rpc('loan_collectibility_config'); if(error) throw error; return data as CollectibilityConfig; } });
  const contact = useQuery({ queryKey:['loan-organization-contact'], queryFn:async () => { const {data,error}=await client.from('org_settings').select('nama_lembaga,no_telp,email').eq('id','org').maybeSingle(); if(error) throw error; return data as {nama_lembaga:string;no_telp:string|null;email:string|null}|null; } });
  const loans = useMemo(() => query.data ?? [],[query.data]);
  const valid = !!filter.from && !!filter.to && !!filter.asOf && filter.from <= filter.to && filter.asOf <= today();
  const rows = useMemo(() => (valid ? reportRows(loans,filter) : []).filter(row => !rules.data?.enabled || !collectibility || (row.position && row.position.remaining > 0 && classifyCollectibility(row.position.daysPastDue,rules.data) === collectibility)),[loans,filter,valid,collectibility,rules.data]);
  const started = rows.filter(r => r.positionStatus === 'active' || r.positionStatus === 'paid' || r.positionStatus === 'perlu_rekonsiliasi' || r.disbursed > 0 || r.paid > 0);
  const active = started.filter(r => r.position && r.position.remaining > 0);
  const overdue = active.filter(r => r.position!.overdue > 0);
  const pending = rows.reduce((sum,r) => sum+r.loan.payments.filter(p => p.status==='pending').length,0);
  const total = (f: (r: ReportRow) => number) => rows.reduce((sum,r)=>sum+f(r),0);
  const remaining = total(r=>r.position?.remaining ?? 0), overdueAmount = total(r=>r.position?.overdue ?? 0);
  const distinct = (data: ReportRow[]) => new Set(data.map(r=>r.loan.customer_id)).size;
  const categories = [...new Map(loans.filter(l=>l.category_id).map(l=>[l.category_id!,l.category])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  const regions = [...new Set(loans.map(l=>regionLabel(l.region)))].sort();
  const due = active.flatMap(row => row.position!.installments.filter(item => item.remaining>0 && item.dueDate >= filter.asOf && item.dueDate <= later(filter.asOf,7)).map(item=>({row,item})));
  const promises = rows.flatMap(row => { const item=row.loan.followups[0]; return item && (item.promise_date || item.next_followup_date) ? [{row,item}] : []; });
  const missingContracts = rows.filter(row=>row.loan.status==='draft'&&!row.loan.has_contract);
  const months = new Map<string,{disbursed:number;paid:number}>();
  for (const row of rows) {
    const add = (date: string, value: number, field: 'paid'|'disbursed') => { const month=date.slice(0,7); const item=months.get(month) ?? {disbursed:0,paid:0}; item[field]+=value; months.set(month,item); };
    if (row.loan.disbursement && inPeriod(row.loan.disbursement.date,filter)) add(row.loan.disbursement.date,Number(row.loan.disbursement.amount),'disbursed');
    row.loan.payments.filter(p=>p.status==='confirmed' && inPeriod(p.date,filter)).forEach(p=>add(p.date,Number(p.amount),'paid'));
  }
  const categoryGroups = groupReport(started,r=>r.loan.category), personGroups = groupReport(started,r=>`${r.loan.name} (${r.loan.customer_id})`), regionGroups = groupReport(started,r=>r.region);
  const profileChoices = [...new Map(loans.map(loan=>[loan.customer_id,loan.name])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  const profileMatches = profileChoices.filter(([id,name])=>`${name} ${id}`.toLocaleLowerCase('id-ID').includes(profileSearch.trim().toLocaleLowerCase('id-ID')));
  const selectedProfile = profileChoices.find(([id])=>id===profileId);
  const matchingProfiles = profileMatches.slice(0,20);
  const visibleProfiles = selectedProfile && !matchingProfiles.some(([id])=>id===profileId) ? [selectedProfile,...matchingProfiles].slice(0,20) : matchingProfiles;
  const profileRows = profileId ? reportRows(loans,{...filter,category:'',customer:'',region:'',status:''}).filter(row=>row.loan.customer_id===profileId) : [];
  function set<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) { setFilter(previous=>({...previous,[key]:value})); }
  function exportData() {
    const meta: (string|number|null)[][] = [['Laporan',kind],['Dibuat',new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB'],['Periode transaksi',`${filter.from} s.d. ${filter.to}`],['Tanggal posisi',filter.asOf],['Filter kategori',categories.find(([id])=>id===filter.category)?.[1] || 'Semua'],['Filter nasabah/nomor',filter.customer || 'Semua'],['Filter wilayah',filter.region || 'Semua'],['Filter status',statusLabel[filter.status] || 'Semua'],['Kolektabilitas',rules.data?.enabled ? `Versi ${rules.data.version}; ${collectibility || 'semua'}` : 'Nonaktif'],['Basis','Status transaksi terkonfirmasi terkini dan tanggal efektif; riwayat sebelum cut-off dapat tidak lengkap']];
    let headers:string[], data:(string|number|null)[][];
    if(kind==='jadwal') { headers=['Nomor','Nasabah','Jatuh tempo','Nominal','Sisa pada tanggal posisi']; data=rows.flatMap(r=>r.loan.installments.map((i,n)=>[r.loan.number,r.loan.name,i.dueDate,Number(i.amount),r.position?.installments[n]?.remaining ?? null])); }
    else if(kind==='pembayaran') { headers=['Nomor','Nasabah','Tanggal','Nominal','Status']; data=rows.flatMap(r=>r.loan.payments.filter(p=>inPeriod(p.date,filter)).map(p=>[r.loan.number,r.loan.name,p.date,Number(p.amount),p.status])); }
    else if(kind==='distribusi') { headers=['Kategori','Pinjaman','Nasabah','Pencairan periode','Pembayaran periode','Sisa posisi','Tunggakan','Belum lengkap']; data=categoryGroups.map(g=>[g.key,g.loans,g.customers,g.disbursed,g.paid,g.remaining,g.overdue,g.incomplete]); }
    else { headers=['Nomor','Nasabah','Kategori','Wilayah saat pencairan','Status posisi','Pokok','Cair periode','Bayar periode','Sisa posisi','Tunggakan','DPD','Kolektabilitas','Cakupan']; const chosen=kind==='tunggakan' ? overdue : rows; data=chosen.map(r=>[r.loan.number,r.loan.name,r.loan.category,r.region,statusLabel[r.positionStatus],Number(r.loan.principal),r.disbursed,r.paid,r.position?.remaining ?? null,r.position?.overdue ?? null,r.position?.daysPastDue ?? null,r.position?.remaining ? classifyCollectibility(r.position.daysPastDue,rules.data) : null,r.incomplete || r.loan.historical_incomplete ? 'Tidak lengkap' : 'Terverifikasi']); }
    const csv = reportCsv(['Keterangan','Nilai'],meta)+'\r\n\r\n'+reportCsv(headers,data).replace(/^\uFEFF/,'');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url; a.download=`laporan-${kind}-${filter.asOf}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportPdf() {
    const {default:jsPDF}=await import('jspdf'); const pdf=new jsPDF(); let y=18;
    const write=(text:string)=>{ for(const line of pdf.splitTextToSize(text,180) as string[]){ if(y>280){pdf.addPage();y=18;} pdf.text(line,15,y);y+=6;} };
    pdf.setFontSize(13);write('RINGKASAN LAPORAN PINJAMAN JAMAAH');pdf.setFontSize(10);
    write(`Periode transaksi: ${filter.from} s.d. ${filter.to}; posisi: ${filter.asOf}`);write(`Dicetak ${new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB`);
    write(`Filter: ${categories.find(([id])=>id===filter.category)?.[1] || 'semua kategori'}; ${filter.customer || 'semua nasabah'}; ${filter.region || 'semua wilayah'}; ${statusLabel[filter.status] || 'semua status'}.`);
    write(rules.data?.enabled ? `Kolektabilitas internal versi ${rules.data.version}: ${collectibility || 'semua'}.` : 'Kolektabilitas nonaktif.');
    write('Basis: transaksi terkonfirmasi terkini menurut tanggal efektif; periode lama dapat berubah akibat koreksi.');
    write(`Nasabah aktif: ${distinct(active)}; pinjaman aktif: ${active.length}`);write(`Pencairan periode: ${money(total(r=>r.disbursed))}; pembayaran periode: ${money(total(r=>r.paid))}`);
    write(`Sisa pokok: ${money(remaining)}; tunggakan: ${money(overdueAmount)}; belum lengkap: ${rows.filter(r=>r.incomplete).length}`);
    write('Distribusi kategori:');categoryGroups.forEach(g=>write(`${g.key}: ${g.loans} pinjaman, sisa ${money(g.remaining)}, tunggakan ${money(g.overdue)}`));
    pdf.save(`ringkasan-pinjaman-${filter.asOf}.pdf`);
  }
  function makeReminder(row: ReportRow, dueDate: string, amount: number) { const organization=contact.data; const details=[organization?.nama_lembaga,organization?.no_telp,organization?.email].filter(Boolean).join(' · ') || 'pengurus masjid (kontak belum tersedia)'; setReminder(`Assalamu’alaikum ${row.loan.name}, pengingat pinjaman ${row.loan.number}: jatuh tempo ${dueDate}, nominal ${money(amount)}. Kontak: ${details}. Terima kasih.`); }
  return <Card><CardHeader><CardTitle>Dashboard dan laporan pinjaman</CardTitle></CardHeader><CardContent className="space-y-5 text-sm">
    <p className="text-muted-foreground">Arus memakai tanggal transaksi, saldo memakai tanggal posisi. Koreksi dapat mengubah laporan periode lalu. Ini bukan saldo kas.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label>Transaksi dari<Input type="date" value={filter.from} onChange={e=>set('from',e.target.value)} /></label><label>Transaksi sampai<Input type="date" value={filter.to} onChange={e=>set('to',e.target.value)} /></label><label>Tanggal posisi<Input type="date" max={today()} value={filter.asOf} onChange={e=>set('asOf',e.target.value)} /></label>
      <label>Kategori<select className="h-10 w-full rounded border bg-background px-2" value={filter.category} onChange={e=>set('category',e.target.value)}><option value="">Semua kategori</option>{categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Nama atau nomor pinjaman<Input value={filter.customer} onChange={e=>set('customer',e.target.value)} /></label><label>Wilayah saat pencairan<select className="h-10 w-full rounded border bg-background px-2" value={filter.region} onChange={e=>set('region',e.target.value)}><option value="">Semua wilayah</option>{regions.map(r=><option key={r}>{r}</option>)}</select></label>
      <label>Status pada tanggal posisi<select className="h-10 w-full rounded border bg-background px-2" value={filter.status} onChange={e=>set('status',e.target.value)}><option value="">Semua status</option>{Object.entries(statusLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      {rules.data?.enabled && <label>Kolektabilitas (aturan v{rules.data.version})<select className="h-10 w-full rounded border bg-background px-2" value={collectibility} onChange={e=>setCollectibility(e.target.value)}><option value="">Semua kolektabilitas</option>{rules.data.ranges?.map(range=><option key={range.label} value={range.label}>{range.label}</option>)}</select></label>}
    </div>
    {!valid && <p role="alert" className="text-destructive">Isi tanggal dengan benar; posisi tidak boleh melewati hari ini.</p>}{query.isLoading && <p>Memuat dashboard...</p>}{query.error && <p role="alert" className="text-destructive">Dashboard tidak dapat dimuat.</p>}
    {query.data && valid && <>
      {rows.some(r=>r.incomplete||r.loan.historical_incomplete) && <p role="alert" className="rounded border border-amber-500 p-3">Sebagian riwayat migrasi tidak lengkap; saldo yang tidak dapat diverifikasi tidak disertakan. Agregat tanpa tanggal tidak dimasukkan ke arus.</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><p>Nasabah aktif terverifikasi ({filter.asOf}): <strong>{distinct(active)}</strong></p><p>Pinjaman aktif terverifikasi ({filter.asOf}): <strong>{active.length}</strong></p><p>Pencairan ({filter.from}–{filter.to}): <strong>{money(total(r=>r.disbursed))}</strong></p><p>Pembayaran ({filter.from}–{filter.to}): <strong>{money(total(r=>r.paid))}</strong></p><p>Sisa pokok ({filter.asOf}): <strong>{money(remaining)}</strong></p><p>Tunggakan ({filter.asOf}): <strong>{money(overdueAmount)}</strong></p><p>Nasabah menunggak ({filter.asOf}): <strong>{distinct(overdue)}</strong></p><p>Klaim menunggu saat ini: <strong>{pending}</strong></p><p>Rasio tunggakan / sisa: <strong>{remaining ? `${(100*overdueAmount/remaining).toFixed(1)}%` : 'Tidak berlaku'}</strong></p><p>Nasabah menunggak / aktif: <strong>{distinct(active) ? `${(100*distinct(overdue)/distinct(active)).toFixed(1)}%` : 'Tidak berlaku'}</strong></p></div>
      <GroupTable key={`kategori-${JSON.stringify(filter)}-${collectibility}`} title="Distribusi kategori" groups={categoryGroups}/><GroupTable key={`nasabah-${JSON.stringify(filter)}-${collectibility}`} title="Distribusi nasabah" groups={personGroups}/><GroupTable key={`wilayah-${JSON.stringify(filter)}-${collectibility}`} title="Distribusi RT/RW saat pencairan" groups={regionGroups}/>
      <section className="space-y-2 rounded border p-3"><h3 className="font-semibold">Profil nasabah</h3><label className="block">Cari profil nasabah<Input value={profileSearch} onChange={e=>setProfileSearch(e.target.value)} placeholder="Cari nama atau ID nasabah" /></label><p className="text-muted-foreground">Menampilkan maksimal 20 pilihan dari {profileMatches.length} hasil, termasuk profil yang dipilih; ketik nama atau ID untuk mencari.</p><label>Pilih nasabah<select className="ml-2 h-10 max-w-full rounded border bg-background px-2" value={profileId} onChange={e=>setProfileId(e.target.value)}><option value="">Pilih nasabah</option>{visibleProfiles.map(([id,name])=><option key={id} value={id}>{name} ({id})</option>)}</select></label>
        {profileId && <><p>Pencairan tercatat sampai {filter.asOf}: {money(profileRows.reduce((sum,r)=>sum+(r.loan.disbursement && r.loan.disbursement.date<=filter.asOf ? Number(r.loan.disbursement.amount) : 0),0))}</p><p>Pembayaran terkonfirmasi yang diketahui: {money(profileRows.reduce((sum,r)=>sum+r.loan.payments.filter(p=>p.status==='confirmed' && p.date<=filter.asOf).reduce((a,p)=>a+Number(p.amount),0),0))}</p><p>Sisa pokok terverifikasi: {money(profileRows.reduce((sum,r)=>sum+(r.position?.remaining ?? 0),0))} · tunggakan: {money(profileRows.reduce((sum,r)=>sum+(r.position?.overdue ?? 0),0))}</p><p>Transaksi terkonfirmasi yang diketahui: {profileRows.reduce((sum,r)=>sum+r.loan.payments.filter(p=>p.status==='confirmed' && p.date<=filter.asOf).length,0)} · angsuran lunas: {profileRows.reduce((sum,r)=>sum+(r.position?.settledInstallments ?? 0),0)}</p>{profileRows.some(r=>r.incomplete||r.loan.historical_incomplete) && <p>Riwayat atau saldo sebagian pinjaman belum lengkap; angka hanya mencakup data yang dapat diverifikasi.</p>}<LoanCollectibilityStatus customerId={profileId} asOf={filter.asOf}/>{profileRows.map(r=><p key={r.loan.id}><button className="underline" onClick={()=>onSelectLoan?.(r.loan.id)}>{r.loan.number}</button> · {statusLabel[r.positionStatus]} · sisa {r.position ? money(r.position.remaining) : 'belum tersedia'} · tunggakan {r.position ? money(r.position.overdue) : 'belum tersedia'}</p>)}</>}
      </section>
      <div><h3 className="font-semibold">Tren transaksi bulanan ({filter.from}–{filter.to})</h3>{[...months.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([month,v])=><p key={month}>{month}: pencairan {money(v.disbursed)} · pembayaran {money(v.paid)}</p>)}{months.size===0 && <p>Tidak ada transaksi terkonfirmasi.</p>}</div>
      <PagedList key={`due-${JSON.stringify(filter)}-${collectibility}`} title={`Jatuh tempo tujuh hari ke depan per ${filter.asOf}`} items={due} empty="Tidak ada jatuh tempo pada rentang ini." renderItem={({row,item})=><div key={`${row.loan.id}-${item.dueDate}`} className="flex flex-wrap gap-2 border-t py-2"><button className="underline" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} ? {row.loan.name}</button><span>{item.dueDate} ? {money(item.remaining)}</span><Button size="sm" variant="outline" onClick={()=>makeReminder(row,item.dueDate,item.remaining)}>Siapkan pengingat</Button></div>}/>
      <PagedList key={`overdue-${JSON.stringify(filter)}-${collectibility}`} title="Tunggakan berdasarkan hari keterlambatan" items={[...overdue].sort((a,b)=>b.position!.daysPastDue-a.position!.daysPastDue)} empty="Tidak ada tunggakan terverifikasi." renderItem={row=><div key={row.loan.id} className="flex flex-wrap gap-2 border-t py-2"><button className="underline" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} ? {row.loan.name}</button><span>{row.position!.daysPastDue} hari ? {money(row.position!.overdue)}</span><Button size="sm" variant="outline" onClick={()=>makeReminder(row,row.position!.installments.find(i=>i.dueDate<filter.asOf && i.remaining>0)?.dueDate || filter.asOf,row.position!.overdue)}>Siapkan pengingat</Button></div>}/>
      <PagedList key={`promises-${JSON.stringify(filter)}-${collectibility}`} title="Janji dan tindak lanjut terakhir" items={promises} empty="Belum ada janji atau tindak lanjut." renderItem={({row,item})=><p key={row.loan.id}><button className="underline" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} ? {row.loan.name}</button> ? janji {item.promise_date || '-'} {item.promise_amount ? money(Number(item.promise_amount)) : ''} ? tindak lanjut {item.next_followup_date || '-'}</p>}/>
      <PagedList key={`contracts-${JSON.stringify(filter)}-${collectibility}`} title="Kontrak draft belum lengkap" items={missingContracts} empty="Tidak ada kontrak draft yang belum lengkap." renderItem={row=><p key={row.loan.id}><button className="underline" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} ? {row.loan.name}</button></p>}/>
      {reminder && <label className="block">Teks pengingat untuk dikirim manual<textarea className="min-h-24 w-full rounded border bg-background p-2" value={reminder} onChange={e=>setReminder(e.target.value)} /></label>}
      <div className="flex flex-wrap items-end gap-2"><label>Jenis laporan<select className="ml-2 h-10 rounded border bg-background px-2" value={kind} onChange={e=>setKind(e.target.value)}><option value="pinjaman">Pinjaman/nasabah</option><option value="jadwal">Jadwal</option><option value="pembayaran">Pembayaran</option><option value="tunggakan">Tunggakan</option><option value="distribusi">Distribusi</option></select></label><Button variant="outline" onClick={exportData}>Unduh CSV</Button><Button variant="outline" onClick={()=>void exportPdf()}>Unduh ringkasan PDF</Button></div>
    </>}
  </CardContent></Card>;
});
