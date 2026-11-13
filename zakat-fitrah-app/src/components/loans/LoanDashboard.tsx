import { memo, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { groupReport, regionLabel, reportCsv, reportRows, type ReportFilters, type ReportGroup, type ReportLoan, type ReportRow } from '@/lib/loanReport';
import { classifyCollectibility, type CollectibilityConfig } from '@/lib/loanCollectibility';
import { loanDate, loanStatus } from '@/lib/loanDisplay';
import { LoanCollectibilityStatus } from '@/components/loans/LoanCollectibilityControls';

const client = supabase as unknown as SupabaseClient;
const currencyFormatter = new Intl.NumberFormat('id-ID', { style:'currency',currency:'IDR',maximumFractionDigits:0 });
const money = (value: number) => currencyFormatter.format(value);
const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const later = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`)+days*86400000).toISOString().slice(0,10);
const statusLabel: Record<string,string> = { draft:'Draf',cancelled:'Dibatalkan',active:'Aktif',paid:'Lunas',perlu_rekonsiliasi:'Perlu Rekonsiliasi',belum_dicairkan:'Belum dicairkan' };
const inPeriod = (date: string, filter: ReportFilters) => date >= filter.from && date <= filter.to;
const defaultFilters = (): ReportFilters => { const date=today(); return {from:`${date.slice(0,7)}-01`,to:date,asOf:date,category:'',customer:'',region:'',status:''}; };

function GroupTable({ title, groups }: { title: string; groups: ReportGroup[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const lastPage = Math.max(0, Math.ceil(groups.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visibleGroups = groups.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  return <div className="space-y-2"><h3 className="font-semibold">{title}</h3><p className="text-xs text-muted-foreground sm:hidden">Geser tabel ke samping untuk melihat seluruh kolom.</p><div className="overflow-x-auto"><Table className="min-w-[720px]"><TableHeader><TableRow><TableHead>Kelompok</TableHead><TableHead>Pinjaman / nasabah</TableHead><TableHead>Cair periode</TableHead><TableHead>Bayar periode</TableHead><TableHead>Sisa posisi</TableHead><TableHead>Tunggakan</TableHead></TableRow></TableHeader><TableBody>{visibleGroups.map(g => <TableRow key={g.key}><TableCell>{g.key}{g.incomplete > 0 && ` (${g.incomplete} belum lengkap)`}</TableCell><TableCell>{g.loans} / {g.customers}</TableCell><TableCell>{money(g.disbursed)}</TableCell><TableCell>{money(g.paid)}</TableCell><TableCell>{money(g.remaining)}</TableCell><TableCell>{money(g.overdue)}</TableCell></TableRow>)}</TableBody></Table></div>{groups.length === 0 ? <p>Tidak ada data yang cocok.</p> : <div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" aria-label={`Halaman sebelumnya ${title}`} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Sebelumnya</Button><span>Halaman {currentPage + 1} dari {lastPage + 1} · {groups.length} kelompok</span><Button variant="outline" size="sm" aria-label={`Halaman berikutnya ${title}`} disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Berikutnya</Button></div>}</div>;
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
      <span>Halaman {current + 1} dari {last + 1} · {items.length} hasil</span>
      <Button size="sm" variant="outline" aria-label={`Halaman berikutnya ${title}`} disabled={current === last} onClick={() => setPage(current + 1)}>Berikutnya</Button>
    </div>}
  </div>;
}

export const LoanDashboard = memo(function LoanDashboard({ onSelectLoan, view = 'report' }: { onSelectLoan?: (id: string) => void; view?: 'overview' | 'report' }) {
  const [filter,setFilter] = useState<ReportFilters>(defaultFilters);
  const [draftFilter,setDraftFilter] = useState<ReportFilters>(defaultFilters);
  const [kind,setKind] = useState('pinjaman');
  const [collectibility,setCollectibility] = useState('');
  const [draftCollectibility,setDraftCollectibility] = useState('');
  const [advanced,setAdvanced] = useState(false);
  const [profileId,setProfileId] = useState('');
  const [profileSearch,setProfileSearch] = useState('');
  const [reminder,setReminder] = useState('');
  const query = useQuery({ queryKey:['loan-dashboard-current','report'], queryFn:async ({signal}) => { const {data,error}=await client.rpc('loan_dashboard_report_data').abortSignal(signal); if(error) throw error; return data as ReportLoan[]; } });
  const rules = useQuery({ queryKey:['loan-collectibility-config'], queryFn:async () => { const {data,error}=await client.rpc('loan_collectibility_config'); if(error) throw error; return data as CollectibilityConfig; } });
  const contact = useQuery({ queryKey:['loan-organization-contact'], queryFn:async () => { const {data,error}=await client.from('org_settings').select('nama_lembaga,no_telp,email').eq('id','org').maybeSingle(); if(error) throw error; return data as {nama_lembaga:string;no_telp:string|null;email:string|null}|null; } });
  const loans = useMemo(() => query.data ?? [],[query.data]);
  const valid = !!filter.from && !!filter.to && !!filter.asOf && filter.from <= filter.to && filter.asOf <= today();
  const validDraft = !!draftFilter.from && !!draftFilter.to && !!draftFilter.asOf && draftFilter.from <= draftFilter.to && draftFilter.asOf <= today();
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
  function set<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) { setDraftFilter(previous=>({...previous,[key]:value})); }
  function exportRows() {
    const meta: (string|number|null)[][] = [['Laporan',kind],['Dibuat',new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB'],['Periode transaksi',`${filter.from} s.d. ${filter.to}`],['Tanggal posisi',filter.asOf],['Filter kategori',categories.find(([id])=>id===filter.category)?.[1] || 'Semua'],['Filter nasabah/nomor',filter.customer || 'Semua'],['Filter wilayah',filter.region || 'Semua'],['Filter status',statusLabel[filter.status] || 'Semua'],['Kolektabilitas',rules.data?.enabled ? `Versi ${rules.data.version}; ${collectibility || 'semua'}` : 'Nonaktif'],['Basis','Status transaksi terkonfirmasi terkini dan tanggal efektif; riwayat sebelum cut-off dapat tidak lengkap']];
    let headers:string[], data:(string|number|null)[][];
    if(kind==='jadwal') { headers=['Nomor','Nasabah','Jatuh tempo','Nominal','Sisa pada tanggal posisi']; data=rows.flatMap(r=>r.loan.installments.map((i,n)=>[r.loan.number,r.loan.name,i.dueDate,Number(i.amount),r.position?.installments[n]?.remaining ?? null])); }
    else if(kind==='pembayaran') { headers=['Nomor','Nasabah','Tanggal','Nominal','Status']; data=rows.flatMap(r=>r.loan.payments.filter(p=>inPeriod(p.date,filter)).map(p=>[r.loan.number,r.loan.name,p.date,Number(p.amount),loanStatus(p.status)])); }
    else if(kind==='distribusi') { headers=['Kategori','Pinjaman','Nasabah','Pencairan periode','Pembayaran periode','Sisa posisi','Tunggakan','Belum lengkap']; data=categoryGroups.map(g=>[g.key,g.loans,g.customers,g.disbursed,g.paid,g.remaining,g.overdue,g.incomplete]); }
    else { headers=['Nomor','Nasabah','Kategori','Wilayah saat pencairan','Status posisi','Pokok','Cair periode','Bayar periode','Sisa posisi','Tunggakan','DPD','Kolektabilitas','Cakupan']; const chosen=kind==='tunggakan' ? overdue : rows; data=chosen.map(r=>[r.loan.number,r.loan.name,r.loan.category,r.region,statusLabel[r.positionStatus],Number(r.loan.principal),r.disbursed,r.paid,r.position?.remaining ?? null,r.position?.overdue ?? null,r.position?.daysPastDue ?? null,r.position?.remaining ? classifyCollectibility(r.position.daysPastDue,rules.data) : null,r.incomplete || r.loan.historical_incomplete ? 'Tidak lengkap' : 'Terverifikasi']); }
    return {meta,headers,data};
  }
  function exportData() {
    const {meta,headers,data}=exportRows();
    const csv = reportCsv(['Keterangan','Nilai'],meta)+'\r\n\r\n'+reportCsv(headers,data).replace(/^\uFEFF/,'');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url; a.download=`laporan-${kind}-${filter.asOf}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportPdf() {
    const {default:jsPDF}=await import('jspdf'); const pdf=new jsPDF(); let y=18;
    const write=(text:string)=>{ for(const line of pdf.splitTextToSize(text,180) as string[]){ if(y>280){pdf.addPage();y=18;} pdf.text(line,15,y);y+=6;} };
    const {meta,headers,data}=exportRows();
    pdf.setFontSize(13);write('LAPORAN PINJAMAN JAMAAH');pdf.setFontSize(9);
    meta.forEach(([label,value])=>write(`${label}: ${value ?? '-'}`));
    write(`Jumlah baris: ${data.length}`);
    data.forEach((record,index)=>{write(`--- ${index+1} ---`);record.forEach((value,column)=>write(`${headers[column]}: ${value ?? 'Belum tersedia'}`));});
    if(!data.length)write('Tidak ada data yang cocok.');
    pdf.save(`laporan-${kind}-${filter.asOf}.pdf`);
  }
  function makeReminder(row: ReportRow, dueDate: string, amount: number) { const organization=contact.data; const details=[organization?.nama_lembaga,organization?.no_telp,organization?.email].filter(Boolean).join(' · ') || 'pengurus masjid (kontak belum tersedia)'; setReminder(`Assalamu’alaikum ${row.loan.name}, pengingat pinjaman ${row.loan.number}: jatuh tempo ${loanDate(dueDate)}, nominal ${money(amount)}. Kontak: ${details}. Terima kasih.`); }
  return <Card><CardHeader><CardTitle>{view === 'overview' ? 'Ringkasan dan pekerjaan tertunda' : 'Laporan pinjaman'}</CardTitle></CardHeader><CardContent className="space-y-5 text-sm">
    <p className="text-muted-foreground">Arus memakai tanggal transaksi, saldo memakai tanggal posisi. Koreksi dapat mengubah laporan periode lalu. Ini bukan saldo kas.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label>Transaksi dari<Input type="date" value={draftFilter.from} onChange={e=>set('from',e.target.value)} /></label><label>Transaksi sampai<Input type="date" value={draftFilter.to} onChange={e=>set('to',e.target.value)} /></label><label>Tanggal posisi<Input type="date" max={today()} value={draftFilter.asOf} onChange={e=>set('asOf',e.target.value)} /></label><label>Nama atau nomor pinjaman<Input value={draftFilter.customer} onChange={e=>set('customer',e.target.value)} /></label>
    </div>
    <Button type="button" variant="outline" aria-expanded={advanced} onClick={()=>setAdvanced(value=>!value)}>Filter lanjutan</Button>
    {advanced && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>Kategori<Select value={draftFilter.category || 'all'} onValueChange={value=>set('category',value==='all'?'':value)}><SelectTrigger aria-label="Kategori"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua kategori</SelectItem>{categories.map(([id,name])=><SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div>
      <div>Wilayah saat pencairan<Select value={draftFilter.region || 'all'} onValueChange={value=>set('region',value==='all'?'':value)}><SelectTrigger aria-label="Wilayah saat pencairan"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua wilayah</SelectItem>{regions.map(region=><SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select></div>
      <div>Status pada tanggal posisi<Select value={draftFilter.status || 'all'} onValueChange={value=>set('status',value==='all'?'':value)}><SelectTrigger aria-label="Status pada tanggal posisi"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{Object.entries(statusLabel).map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      {rules.data?.enabled && <div>Kolektabilitas (aturan v{rules.data.version})<Select value={draftCollectibility || 'all'} onValueChange={value=>setDraftCollectibility(value==='all'?'':value)}><SelectTrigger aria-label="Kolektabilitas"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua kolektabilitas</SelectItem>{rules.data.ranges?.map(range=><SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>)}</SelectContent></Select></div>}
    </div>}
    <div className="flex flex-wrap gap-2"><Button disabled={!validDraft} onClick={()=>{setFilter({...draftFilter});setCollectibility(draftCollectibility);}}>Terapkan filter</Button><Button variant="outline" onClick={()=>{const defaults=defaultFilters();setDraftFilter(defaults);setFilter(defaults);setDraftCollectibility('');setCollectibility('');}}>Reset filter</Button></div>
    {!validDraft && <p role="alert" className="text-destructive">Isi tanggal dengan benar; posisi tidak boleh melewati hari ini.</p>}
    <p className="text-muted-foreground">Filter aktif: {loanDate(filter.from)} s.d. {loanDate(filter.to)}; posisi {loanDate(filter.asOf)}; kategori {categories.find(([id])=>id===filter.category)?.[1] || 'semua'}; nasabah/nomor {filter.customer || 'semua'}; wilayah {filter.region || 'semua'}; status {statusLabel[filter.status] || 'semua'}; kolektabilitas {rules.data?.enabled ? collectibility || 'semua' : 'nonaktif'}.</p>
    {(query.isLoading || rules.isLoading) && <p>Memuat laporan...</p>}{query.error && <p role="alert" className="text-destructive">Laporan tidak dapat dimuat.</p>}{rules.error && <p role="alert" className="text-destructive">Pengaturan kolektabilitas tidak dapat dimuat; laporan belum dapat ditampilkan.</p>}
    {query.data && rules.data && valid && <>
      <p className="text-muted-foreground">Data laporan dimuat {new Date(query.dataUpdatedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB · {rows.length} pinjaman sesuai filter.</p>
      {rows.some(r=>r.incomplete||r.loan.historical_incomplete) && <p role="alert" className="rounded border border-amber-500 p-3">Sebagian riwayat migrasi tidak lengkap; saldo yang tidak dapat diverifikasi tidak disertakan. Agregat tanpa tanggal tidak dimasukkan ke arus.</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><p>Nasabah aktif terverifikasi ({loanDate(filter.asOf)}): <strong>{distinct(active)}</strong></p><p>Pinjaman aktif terverifikasi ({loanDate(filter.asOf)}): <strong>{active.length}</strong></p><p>Pencairan ({loanDate(filter.from)}–{loanDate(filter.to)}): <strong>{money(total(r=>r.disbursed))}</strong></p><p>Pembayaran ({loanDate(filter.from)}–{loanDate(filter.to)}): <strong>{money(total(r=>r.paid))}</strong></p><p>Sisa pokok ({loanDate(filter.asOf)}): <strong>{money(remaining)}</strong></p><p>Tunggakan ({loanDate(filter.asOf)}): <strong>{money(overdueAmount)}</strong></p><p>Nasabah menunggak ({loanDate(filter.asOf)}): <strong>{distinct(overdue)}</strong></p><p>Klaim menunggu saat ini: <strong>{pending}</strong></p><p>Rasio tunggakan / sisa: <strong>{remaining ? `${(100*overdueAmount/remaining).toFixed(1)}%` : 'Tidak berlaku'}</strong></p><p>Nasabah menunggak / aktif: <strong>{distinct(active) ? `${(100*distinct(overdue)/distinct(active)).toFixed(1)}%` : 'Tidak berlaku'}</strong></p></div>
      {view === 'report' && <>
      <GroupTable key={`kategori-${JSON.stringify(filter)}-${collectibility}`} title="Distribusi kategori" groups={categoryGroups}/><GroupTable key={`nasabah-${JSON.stringify(filter)}-${collectibility}`} title="Distribusi nasabah" groups={personGroups}/><GroupTable key={`wilayah-${JSON.stringify(filter)}-${collectibility}`} title="Distribusi RT/RW saat pencairan" groups={regionGroups}/>
      <section className="space-y-2 rounded border p-3"><h3 className="font-semibold">Profil nasabah</h3><label className="block">Cari profil nasabah<Input value={profileSearch} onChange={e=>setProfileSearch(e.target.value)} placeholder="Cari nama atau ID nasabah" /></label><p className="text-muted-foreground">Menampilkan maksimal 20 pilihan dari {profileMatches.length} hasil, termasuk profil yang dipilih; ketik nama atau ID untuk mencari.</p><div>Pilih nasabah<Select value={profileId || 'none'} onValueChange={value=>setProfileId(value==='none'?'':value)}><SelectTrigger aria-label="Pilih nasabah"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Pilih nasabah</SelectItem>{visibleProfiles.map(([id,name])=><SelectItem key={id} value={id}>{name} ({id})</SelectItem>)}</SelectContent></Select></div>
        {profileId && <><p>Pencairan tercatat sampai {loanDate(filter.asOf)}: {money(profileRows.reduce((sum,r)=>sum+(r.loan.disbursement && r.loan.disbursement.date<=filter.asOf ? Number(r.loan.disbursement.amount) : 0),0))}</p><p>Pembayaran terkonfirmasi yang diketahui: {money(profileRows.reduce((sum,r)=>sum+r.loan.payments.filter(p=>p.status==='confirmed' && p.date<=filter.asOf).reduce((a,p)=>a+Number(p.amount),0),0))}</p><p>Sisa pokok terverifikasi: {money(profileRows.reduce((sum,r)=>sum+(r.position?.remaining ?? 0),0))} · tunggakan: {money(profileRows.reduce((sum,r)=>sum+(r.position?.overdue ?? 0),0))}</p><p>Transaksi terkonfirmasi yang diketahui: {profileRows.reduce((sum,r)=>sum+r.loan.payments.filter(p=>p.status==='confirmed' && p.date<=filter.asOf).length,0)} · angsuran lunas: {profileRows.reduce((sum,r)=>sum+(r.position?.settledInstallments ?? 0),0)}</p>{profileRows.some(r=>r.incomplete||r.loan.historical_incomplete) && <p>Riwayat atau saldo sebagian pinjaman belum lengkap; angka hanya mencakup data yang dapat diverifikasi.</p>}<LoanCollectibilityStatus customerId={profileId} asOf={filter.asOf}/>{profileRows.map(r=><p key={r.loan.id}><Button variant="link" className="h-auto p-0" onClick={()=>onSelectLoan?.(r.loan.id)}>{r.loan.number}</Button> · {statusLabel[r.positionStatus]} · sisa {r.position ? money(r.position.remaining) : 'belum tersedia'} · tunggakan {r.position ? money(r.position.overdue) : 'belum tersedia'}</p>)}</>}
      </section>
      <div><h3 className="font-semibold">Tren transaksi bulanan ({loanDate(filter.from)}–{loanDate(filter.to)})</h3>{[...months.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([month,v])=><p key={month}>{month}: pencairan {money(v.disbursed)} · pembayaran {money(v.paid)}</p>)}{months.size===0 && <p>Tidak ada transaksi terkonfirmasi.</p>}</div>
      </>}
      <>
      <PagedList key={`due-${JSON.stringify(filter)}-${collectibility}`} title={`Jatuh tempo tujuh hari ke depan per ${loanDate(filter.asOf)}`} items={due} empty="Tidak ada jatuh tempo pada rentang ini." renderItem={({row,item})=><div key={`${row.loan.id}-${item.dueDate}`} className="flex flex-wrap gap-2 border-t py-2"><Button variant="link" className="h-auto p-0" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} · {row.loan.name}</Button><span>{loanDate(item.dueDate)} · {money(item.remaining)}</span><Button size="sm" variant="outline" onClick={()=>makeReminder(row,item.dueDate,item.remaining)}>Siapkan pengingat</Button></div>}/>
      <PagedList key={`overdue-${JSON.stringify(filter)}-${collectibility}`} title="Tunggakan berdasarkan hari keterlambatan" items={[...overdue].sort((a,b)=>b.position!.daysPastDue-a.position!.daysPastDue)} empty="Tidak ada tunggakan terverifikasi." renderItem={row=><div key={row.loan.id} className="flex flex-wrap gap-2 border-t py-2"><Button variant="link" className="h-auto p-0" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} · {row.loan.name}</Button><span>{row.position!.daysPastDue} hari · {money(row.position!.overdue)}</span><Button size="sm" variant="outline" onClick={()=>makeReminder(row,row.position!.installments.find(i=>i.dueDate<filter.asOf && i.remaining>0)?.dueDate || filter.asOf,row.position!.overdue)}>Siapkan pengingat</Button></div>}/>
      <PagedList key={`promises-${JSON.stringify(filter)}-${collectibility}`} title="Janji dan tindak lanjut terakhir" items={promises} empty="Belum ada janji atau tindak lanjut." renderItem={({row,item})=><p key={row.loan.id}><Button variant="link" className="h-auto p-0" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} · {row.loan.name}</Button> · janji {loanDate(item.promise_date,'-')} {item.promise_amount ? money(Number(item.promise_amount)) : ''} · tindak lanjut {loanDate(item.next_followup_date,'-')}</p>}/>
      <PagedList key={`contracts-${JSON.stringify(filter)}-${collectibility}`} title="Kontrak draf belum lengkap" items={missingContracts} empty="Tidak ada kontrak draf yang belum lengkap." renderItem={row=><p key={row.loan.id}><Button variant="link" className="h-auto p-0" onClick={()=>onSelectLoan?.(row.loan.id)}>{row.loan.number} · {row.loan.name}</Button></p>}/>
      {reminder && <label className="block">Teks pengingat untuk dikirim manual<Textarea className="min-h-24" value={reminder} onChange={e=>setReminder(e.target.value)} /></label>}
      </>
      {view === 'report' && <div className="flex flex-wrap items-end gap-2"><div>Jenis laporan<Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Jenis laporan"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pinjaman">Pinjaman/nasabah</SelectItem><SelectItem value="jadwal">Jadwal</SelectItem><SelectItem value="pembayaran">Pembayaran</SelectItem><SelectItem value="tunggakan">Tunggakan</SelectItem><SelectItem value="distribusi">Distribusi</SelectItem></SelectContent></Select></div><Button variant="outline" onClick={exportData}>Unduh CSV</Button><Button variant="outline" onClick={()=>void exportPdf()}>Unduh PDF</Button></div>}
    </>}
  </CardContent></Card>;
});
