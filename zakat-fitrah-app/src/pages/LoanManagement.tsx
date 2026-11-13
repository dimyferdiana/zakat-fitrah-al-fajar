import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { loanPosition } from '@/lib/loanCalculations';
import { loanDate, loanStatus } from '@/lib/loanDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoanDashboard } from '@/components/loans/LoanDashboard';
import { downloadLoanReceipt } from '@/lib/loanReceipt';
import { downloadLoanDocument } from '@/lib/loanDocuments';
import { LoanContractTemplate } from '@/components/loans/LoanContractTemplate';
import { LoanFollowups } from '@/components/loans/LoanFollowups';
import { LoanClaimQueue } from '@/components/loans/LoanClaimQueue';
import { LoanPolicyControls } from '@/components/loans/LoanPolicyControls';
import { LoanDraftControls } from '@/components/loans/LoanDraftControls';
import { LoanScheduleEditor } from '@/components/loans/LoanScheduleEditor';
import { LoanPaymentForm } from '@/components/loans/LoanPaymentForm';
import { CancelPayment, ClaimReview } from '@/components/loans/LoanPaymentActions';
import { LoanPaymentPicker } from '@/components/loans/LoanPaymentPicker';
import { LoanPaymentSummary } from '@/components/loans/LoanPaymentSummary';
import { LoanDisbursementEvidence } from '@/components/loans/LoanDisbursementEvidence';
import { uploadDisbursementEvidence, type DisbursementEvidence } from '@/lib/loanDisbursementEvidence';
import { LoanCollectibilityControls, LoanCollectibilityStatus } from '@/components/loans/LoanCollectibilityControls';
import { CustomerListData, LoanListData, PaymentHistoryData } from '@/components/loans/LoanDataLists';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoanOverview } from '@/components/loans/LoanOverview';
import { LoanViewerPermissions } from '@/components/loans/LoanViewerPermissions';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import { LoanCustomerRegistration } from '@/components/loans/LoanCustomerRegistration';
import { LoanCustomerProfile } from '@/components/loans/LoanCustomerProfile';
import { LoanCreate } from '@/components/loans/LoanCreate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import '@/components/loans/loan-ui.css';

interface Person {
  id: string;
  nama_kk: string;
  nama_lengkap: string | null;
  alamat: string;
  no_telp: string | null;
  jenis_identitas: 'individu' | 'rumah_tangga' | 'belum_diverifikasi';
  identitas_terverifikasi: boolean;
}
interface Loan { id: string; loan_number: string; purpose: string; principal: number; status: string; customer: { person: Pick<Person, 'nama_kk' | 'nama_lengkap'> | null } | null }
interface LoanDetail {
  id: string;
  status: string;
  planned_disbursement_date: string | null;
  guarantor_relationship: string | null;
  guarantor_contact: string | null;
  guarantor: Pick<Person, 'nama_kk' | 'nama_lengkap'> | null;
  migration_cutoff: string | null;
  opening_balance: number | null;
  disbursement_date: string | null;
  loan_installments: { due_date: string; amount: number; opening_remaining: number | null; installment_number: number }[];
  loan_payments: { id: string; payment_date: string; amount: number; status: 'confirmed' | 'pending' | 'rejected' | 'cancelled'; method: string; reason: string | null }[];
  loan_documents: { id: string; payment_id: string | null; kind: string; storage_path: string; shared_with_customer: boolean }[];
}
interface DraftReadiness { person_ok:boolean; schedule_ok:boolean; contract_ok:boolean; conflict_number:string|null; policy_reasons:string[]; guarantor_ok:boolean }

const client = supabase as unknown as SupabaseClient;
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const message = (error: unknown) => error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : 'Permintaan tidak berhasil.';

export function LoanManagement() {
  const location = useLocation();
  const { pathname, search: urlSearch } = location;
  const navigate = useNavigate();
  const { loanId, customerId: routeCustomerId } = useParams();
  const mode = pathname === '/pinjaman/nasabah/baru' ? 'customerRegister' : routeCustomerId ? 'customerDetail' : loanId ? 'detail' : pathname.split('/').pop() ?? '';
  const validId = (id: string | undefined) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const selectedLoanId = validId(loanId) ? loanId! : '';
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  const queryClient = useQueryClient();
  const [contractTemplateId, setContractTemplateId] = useState('');
  const contractRequestId = useRef(crypto.randomUUID());
  const disbursementRequestId = useRef(crypto.randomUUID());
  const contractFile = useRef<HTMLInputElement>(null);
  const disbursementProof = useRef<HTMLInputElement>(null);
  const [pendingDisbursementProof, setPendingDisbursementProof] = useState<DisbursementEvidence | null>(null);
  const [disbursementDate, setDisbursementDate] = useState('');
  const [fundingLabel, setFundingLabel] = useState('');
  const [disbursementMethod, setDisbursementMethod] = useState('tunai');
  const [disbursementReference, setDisbursementReference] = useState('');
  const [uploadingContract, setUploadingContract] = useState(false);
  const [contractError,setContractError] = useState(''); const [disbursementError,setDisbursementError] = useState('');
  const [contractVerified, setContractVerified] = useState(false);
  const [confirmDisbursement,setConfirmDisbursement]=useState(false);
  const tabNames=['ringkasan','jadwal','pembayaran','dokumen','tindak-lanjut'];
  const queryParams=new URLSearchParams(urlSearch);
  const requestedTab=queryParams.get('tab') ?? 'ringkasan';
  const activeTab=tabNames.includes(requestedTab) ? requestedTab : 'ringkasan';
  const listParams=new URLSearchParams(urlSearch); listParams.delete('tab');
  const listSearch=listParams.toString() ? `?${listParams.toString()}` : '';
  function setDetailTab(tab:string){const params=new URLSearchParams(urlSearch);if(tab==='ringkasan')params.delete('tab');else params.set('tab',tab);navigate({pathname,search:params.toString()?`?${params}`:''},{replace:true,state:location.state});}

  const loanDetail = useQuery({
    queryKey: ['staff-loan-detail', selectedLoanId], enabled: !!selectedLoanId,
    queryFn: async ({ signal }) => {
      const { data, error } = await client.from('loans').select('id,status,planned_disbursement_date,disbursement_date,migration_cutoff,opening_balance,guarantor_relationship,guarantor_contact,guarantor:muzakki!loans_guarantor_id_fkey(nama_kk,nama_lengkap),loan_installments(due_date,amount,opening_remaining,installment_number),loan_payments(id,payment_date,amount,status,method,reason),loan_documents(id,payment_id,kind,storage_path,shared_with_customer)').eq('id', selectedLoanId).abortSignal(signal).single();
      if (error) throw error;
      return data as unknown as LoanDetail;
    },
  });
  const selectedLoanLookup = useQuery({
    queryKey:['staff-loan-selected',selectedLoanId], enabled:!!selectedLoanId,
    queryFn:async ({ signal }) => {
      const {data,error}=await client.from('loans').select('id,loan_number,purpose,principal,status,customer:loan_customers(person:muzakki!loan_customers_person_id_fkey(nama_kk,nama_lengkap))').eq('id',selectedLoanId).abortSignal(signal).single();
      if(error) throw error;
      return data as unknown as Loan;
    },
  });
  const readiness=useQuery({queryKey:['loan-draft-readiness',selectedLoanId,disbursementDate],enabled:!!selectedLoanId && loanDetail.data?.status==='draft',queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_draft_readiness',{p_loan_id:selectedLoanId,p_date:disbursementDate || null}).abortSignal(signal);if(error)throw error;return data as DraftReadiness;}});
  async function downloadEvidence(path: string, name = 'bukti-transfer') {
    try {
      const { data, error } = await client.storage.from('pinjaman-jamaah-private').download(path);
      if (error || !data) throw new Error('Bukti tidak dapat diunduh.');
      const url = URL.createObjectURL(data); const link = document.createElement('a');
      link.href = url; link.download = `${name}.${path.split('.').pop() || 'bin'}`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) { toast.error(message(error)); }
  }

  async function uploadContract() {
    const file = contractFile.current?.files?.[0];
    if (!file || !disbursementDate || !contractTemplateId || !contractVerified || file.size > 5242880) { setContractError('Pilih versi template, kontrak dan tanggal pencairan, lalu konfirmasi pemeriksaan; ukuran maksimal 5 MB.');if(!disbursementDate)document.getElementById('loan-disbursement-date')?.focus();else if(!file || file.size>5242880)contractFile.current?.focus();else document.getElementById('loan-contract-verified')?.focus();return; }
    const form = new FormData();
    form.set('loanId', selectedLoanId); form.set('requestId', contractRequestId.current);
    form.set('disbursementDate', disbursementDate); form.set('templateId', contractTemplateId); form.set('verified', 'true'); form.set('file', file);
    setUploadingContract(true);
    try {
      const { data, error } = await client.functions.invoke('loan-contract-upload', { body: form });
      if (error || !data?.success) throw new Error('Kontrak belum dapat disimpan. Periksa berkas dan draf.');
      contractRequestId.current = crypto.randomUUID();
      if (contractFile.current) contractFile.current.value = '';
      setContractVerified(false);setContractError('');
      void refreshLoanProjections(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', selectedLoanId] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      toast.success('Kontrak bertanda tangan tersimpan.');
    } catch (error) { setContractError(message(error));toast.error(message(error)); } finally { setUploadingContract(false); }
  }
  const disburse = useMutation({
    mutationFn: async () => {
      if (!disbursementDate || !fundingLabel.trim()) throw new Error('Tanggal pencairan dan sumber dana wajib diisi.');
      const proof = disbursementProof.current?.files?.[0] ?? null;
      if (proof && (!proof.size || proof.size > 5242880)) throw new Error('Bukti pencairan maksimal 5 MB.');
      const { data, error } = await client.rpc('loan_disburse', { p_loan_id: selectedLoanId, p_date: disbursementDate, p_method: disbursementMethod, p_reference: disbursementReference || null, p_funding_label: fundingLabel.trim(), p_request_id: disbursementRequestId.current });
      if (error) throw error;
      return { loanId: selectedLoanId, disbursementId: data as string, proof };
    },
    onSuccess: async ({ loanId, disbursementId, proof }) => {
      void refreshLoanProjections(queryClient);
      disbursementRequestId.current = crypto.randomUUID();
      void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-collectibility-status'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-collectibility'] });
      setDisbursementError('');toast.success('Pencairan tercatat.');
      if (proof) {
        const pending = { loanId, disbursementId, requestId: crypto.randomUUID(), file: proof };
        setPendingDisbursementProof(pending);
        try { await uploadDisbursementEvidence(pending); setPendingDisbursementProof(current => current?.requestId === pending.requestId ? null : current); void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] }); toast.success('Bukti pencairan tersimpan.'); }
        catch { toast.error('Pencairan sudah tercatat, tetapi bukti belum tersimpan. Ulangi unggah bukti.'); }
      }
    },
    onError: error => {setDisbursementError(message(error));toast.error(message(error));},
  });

  const selectDashboardLoan = (id: string) => navigate(`/pinjaman/daftar/${encodeURIComponent(id)}`);

  const detail = loanDetail.data;
  const selectedLoan = selectedLoanLookup.data;
  const sortedInstallments = [...(detail?.loan_installments ?? [])].sort((a, b) => a.installment_number - b.installment_number);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const invalidDisbursementDate = !!disbursementDate && (disbursementDate > today || sortedInstallments.some(item => item.due_date < disbursementDate));
  let position: ReturnType<typeof loanPosition> | null = null;
  try {
    const principalMatches = !!selectedLoan && sortedInstallments.reduce((sum,item) => sum + Number(item.amount),0) === Number(selectedLoan.principal);
    const openingValid = !detail?.migration_cutoff || (detail.migration_cutoff <= today && detail.opening_balance !== null && sortedInstallments.every(item => item.opening_remaining !== null) && sortedInstallments.reduce((sum,item) => sum + Number(item.opening_remaining),0) === Number(detail.opening_balance));
    if (detail && !['draft','cancelled'].includes(detail.status) && (!detail.disbursement_date || detail.disbursement_date <= today) && (detail.migration_cutoff || detail.disbursement_date) && sortedInstallments.length > 0 && principalMatches && openingValid) {
      position = loanPosition(sortedInstallments.map(item => ({ dueDate: item.due_date, amount: Number(item.amount) })),
        detail.loan_payments.filter(item => !detail.migration_cutoff || item.payment_date > detail.migration_cutoff)
          .map(item => ({ id: item.id, date: item.payment_date, amount: Number(item.amount), status: item.status })), today,
        detail.migration_cutoff ? sortedInstallments.map(item => Number(item.opening_remaining)) : undefined);
    }
  } catch { position = null; }

  return (
    <div className="loan-ui mx-auto min-w-0 max-w-5xl space-y-6">
      {(mode === 'detail' || mode === 'baru' || mode === 'customerDetail' || mode === 'customerRegister') && <Button variant="link" asChild><Link state={location.state} to={mode === 'customerDetail' || mode === 'customerRegister' ? `/pinjaman/nasabah${urlSearch}` : `/pinjaman/daftar${mode === 'detail' ? listSearch : urlSearch}`}>← Kembali ke {mode === 'customerDetail' || mode === 'customerRegister' ? 'Nasabah' : 'Pinjaman'}</Link></Button>}
      <h1 className="text-2xl font-semibold">{{ dashboard: 'Ringkasan Pinjaman', nasabah: 'Nasabah', customerRegister: 'Daftarkan Nasabah', customerDetail: 'Profil Nasabah', daftar: 'Pinjaman', detail: 'Rincian Pinjaman', baru: 'Buat Pinjaman', pembayaran: 'Pembayaran', laporan: 'Laporan Pinjaman', pengaturan: 'Pengaturan Pinjaman' }[mode]}</h1>
      {mode === 'dashboard' && <LoanOverview />}
      {mode === 'laporan' && <LoanDashboard view="report" onSelectLoan={selectDashboardLoan} />}
      {mode === 'pembayaran' && <><LoanPaymentPicker /><Tabs value={queryParams.get('tab') === 'riwayat' ? 'riwayat' : 'verifikasi'} onValueChange={tab => { const params = new URLSearchParams(urlSearch); if(tab === 'riwayat') params.set('tab',tab); else params.delete('tab'); navigate({pathname,search:params.toString() ? `?${params}` : ''},{replace:true,state:location.state}); }}><TabsList><TabsTrigger value="verifikasi">Perlu Verifikasi</TabsTrigger><TabsTrigger value="riwayat">Riwayat Pembayaran</TabsTrigger></TabsList><TabsContent value="verifikasi"><LoanClaimQueue onSelectLoan={id => navigate(`/pinjaman/daftar/${encodeURIComponent(id)}?tab=pembayaran`)} /></TabsContent><TabsContent value="riwayat"><PaymentHistoryData onSelectLoan={id => navigate(`/pinjaman/daftar/${encodeURIComponent(id)}?tab=pembayaran`)} /></TabsContent></Tabs></>}
      {mode === 'pengaturan' && <section className="space-y-4"><LoanPolicyControls isAdmin={isAdmin} /><LoanCollectibilityControls isAdmin={isAdmin} /><LoanContractTemplate isAdmin={isAdmin} draft={null} selected={contractTemplateId} onSelect={setContractTemplateId} />{isAdmin && <LoanViewerPermissions />}</section>}
      {mode === 'customerDetail' && <LoanCustomerProfile customerId={routeCustomerId ?? ''} isAdmin={isAdmin} />}
      {mode === 'customerRegister' && <LoanCustomerRegistration />}
      {mode === 'nasabah' && <CustomerListData />}

      {mode === 'baru' && <LoanCreate />}
      {mode === 'daftar' && <LoanListData />}
      {mode === 'detail' && !selectedLoanId && <p role="alert">Pinjaman tidak tersedia atau tidak dapat diakses.</p>}
      {mode === 'detail' && selectedLoanId && <Card><CardHeader><CardTitle>Rincian pinjaman</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        {loanDetail.isLoading && <p>Memuat rincian...</p>}
        {loanDetail.error && <p role="alert" className="text-destructive">Pinjaman tidak tersedia atau tidak dapat diakses.</p>}
        {detail && <>
          {selectedLoan && <div className="grid gap-2 rounded-md border p-4 sm:grid-cols-2"><p className="break-words">Nomor: <strong>{selectedLoan.loan_number}</strong></p><p>Nasabah: {selectedLoan.customer?.person?.nama_lengkap || selectedLoan.customer?.person?.nama_kk || 'Tidak tersedia'}</p><p>Status: {loanStatus(detail.status)}</p><p>Pokok: {rupiah(Number(selectedLoan.principal))}</p><p>Pembayaran terkonfirmasi{detail.migration_cutoff ? ' yang diketahui' : ''}: {rupiah(detail.loan_payments.filter(payment=>payment.status==='confirmed' && payment.payment_date<=today).reduce((sum,payment)=>sum+Number(payment.amount),0))}</p><p>Jatuh tempo relevan: {loanDate(position?.installments.find(item=>item.remaining>0)?.dueDate || (detail.status==='draft' ? sortedInstallments[0]?.due_date : null))}</p></div>}
          <LoanPaymentSummary position={position} installmentCount={sortedInstallments.length} migrated={!!detail.migration_cutoff} />
          {detail.status==='draft' && <div className="space-y-2 rounded-md border p-3"><h2 className="font-semibold">Progres draf</h2><p>Lengkapi data → Periksa jadwal → Siapkan kontrak → Catat pencairan</p>{readiness.isLoading && <p>Memeriksa persyaratan tersimpan...</p>}{readiness.error && <p role="alert">Persyaratan draf tidak dapat diperiksa.</p>}{readiness.data && <ul className="space-y-1"><li>{readiness.data.person_ok ? 'Selesai: Data nasabah tersedia' : 'Perlu tindakan: Data nasabah tidak aktif atau belum terverifikasi'} {!readiness.data.person_ok && <Button variant="link" onClick={()=>setDetailTab('ringkasan')}>Periksa data</Button>}</li><li>{readiness.data.schedule_ok ? 'Selesai: Jadwal sesuai data tersimpan' : 'Perlu tindakan: Jadwal tidak sesuai pokok atau tanggal pencairan'} {!readiness.data.schedule_ok && <Button variant="link" onClick={()=>setDetailTab('jadwal')}>Periksa jadwal</Button>}</li><li>{readiness.data.contract_ok ? 'Selesai: Kontrak sesuai dan terverifikasi' : 'Perlu tindakan: Pilih tanggal dan siapkan kontrak bertanda tangan yang sesuai'} {!readiness.data.contract_ok && <Button variant="link" onClick={()=>setDetailTab('dokumen')}>Siapkan kontrak</Button>}</li>{readiness.data.conflict_number && <li>Perlu tindakan: Nasabah masih memiliki kewajiban {readiness.data.conflict_number}.</li>}{!readiness.data.guarantor_ok && <li>Perlu tindakan: Penjamin tidak aktif atau belum terverifikasi. <Button variant="link" onClick={()=>setDetailTab('ringkasan')}>Periksa penjamin</Button></li>}{readiness.data.policy_reasons.length>0 && <li>Perlu tindakan: Kebijakan perlu dipenuhi atau pengecualian sah dicatat: {readiness.data.policy_reasons.map(reason=>({principal:'batas pokok',tenor:'batas tenor',guarantor:'penjamin'} as Record<string,string>)[reason] || 'persyaratan kebijakan').join(', ')}. <Button variant="link" onClick={()=>setDetailTab('ringkasan')}>Periksa kebijakan</Button></li>}</ul>}<p className="text-muted-foreground">Persyaratan tetap diperiksa server saat pencairan.</p></div>}
          <Tabs value={activeTab} onValueChange={setDetailTab}><TabsList className="h-auto w-full flex-wrap justify-start gap-1"><TabsTrigger value="ringkasan">Ringkasan</TabsTrigger><TabsTrigger value="jadwal">Jadwal</TabsTrigger><TabsTrigger value="pembayaran">Pembayaran</TabsTrigger><TabsTrigger value="dokumen">Dokumen</TabsTrigger><TabsTrigger value="tindak-lanjut">Tindak Lanjut</TabsTrigger></TabsList>
          <TabsContent value="ringkasan" className="space-y-4">
          {detail.status === 'draft' && <LoanDraftControls key={`draft-controls-${detail.id}`} loanId={detail.id} disbursementDate={disbursementDate} />}
          </TabsContent>
          <TabsContent value="jadwal" className="space-y-4">
          {detail.status === 'draft' && selectedLoan && <LoanScheduleEditor key={`${detail.id}-${detail.planned_disbursement_date}-${JSON.stringify(sortedInstallments)}`} loanId={detail.id} plannedDate={detail.planned_disbursement_date} principal={Number(selectedLoan.principal)} schedule={sortedInstallments.map(item => ({ dueDate: item.due_date, amount: Number(item.amount) }))} />}
          <p className="text-xs text-muted-foreground sm:hidden">Geser tabel ke samping untuk melihat seluruh kolom.</p><div className="overflow-x-auto"><Table className="min-w-[420px]"><TableHeader><TableRow><TableHead>Jatuh tempo</TableHead><TableHead>Nominal</TableHead><TableHead>Sisa</TableHead></TableRow></TableHeader><TableBody>{sortedInstallments.map((item, index) => <TableRow key={item.installment_number}><TableCell>{loanDate(item.due_date)}</TableCell><TableCell>{rupiah(Number(item.amount))}</TableCell><TableCell>{position ? rupiah(position.installments[index].remaining) : 'Belum tersedia'}</TableCell></TableRow>)}</TableBody></Table></div>
          </TabsContent>
          <TabsContent value="dokumen" className="space-y-4">
          {detail.status === 'draft' && <LoanContractTemplate isAdmin={false} selected={contractTemplateId} onSelect={id => { setContractTemplateId(id); setContractVerified(false); contractRequestId.current = crypto.randomUUID(); }} draft={selectedLoan ? {
            loanNumber: selectedLoan.loan_number, name: selectedLoan.customer?.person?.nama_lengkap || selectedLoan.customer?.person?.nama_kk || 'Tidak tersedia',
            purpose: selectedLoan.purpose, principal: Number(selectedLoan.principal), disbursementDate,
            guarantor: detail.guarantor?.nama_lengkap || detail.guarantor?.nama_kk || '', guarantorRelationship: detail.guarantor_relationship || '', guarantorContact: detail.guarantor_contact || '',
            schedule: sortedInstallments.map(item => ({ date: item.due_date, amount: Number(item.amount) })),
          } : null} />}
          {detail.status === 'draft' && <div className="space-y-3 rounded border p-4"><h2 className="font-semibold">Kontrak dan pencairan</h2>
            <p>Unggah kontrak bertanda tangan dengan tanggal pencairan yang akan digunakan. Maksimal 5 MB.</p>
            <label className="block">Tanggal pencairan<Input id="loan-disbursement-date" type="date" value={disbursementDate} aria-describedby={contractError?'loan-contract-error':undefined} onChange={event => { setDisbursementDate(event.target.value); setContractVerified(false); }} /></label>
            {disbursementDate && sortedInstallments.length > 0 && <p>Jadwal: {sortedInstallments.length} angsuran, {loanDate(sortedInstallments[0].due_date)} sampai {loanDate(sortedInstallments[sortedInstallments.length - 1].due_date)}; pokok {selectedLoan ? rupiah(Number(selectedLoan.principal)) : 'belum tersedia'}.</p>}
            {invalidDisbursementDate && <p role="alert" className="text-destructive">Tanggal pencairan tidak boleh melewati hari ini atau jatuh setelah salah satu tanggal angsuran. Tinjau dan ubah jadwal sebelum melanjutkan.</p>}
            <label className="block">Kontrak bertanda tangan<Input ref={contractFile} type="file" accept="application/pdf,image/jpeg,image/png" onChange={() => setContractVerified(false)} /></label>
            <label className="flex items-center gap-2"><Checkbox id="loan-contract-verified" checked={contractVerified} onCheckedChange={checked => setContractVerified(checked === true)} /> Saya sudah memeriksa kontrak dan tanda tangannya.</label>
            {contractError && <p id="loan-contract-error" role="alert" className="text-destructive">{contractError}</p>}
            <Button variant="outline" disabled={uploadingContract} onClick={() => void uploadContract()}>{uploadingContract?'Menyimpan...':'Simpan kontrak'}</Button>
            <label className="block">Label sumber dana<Input value={fundingLabel} onChange={event => setFundingLabel(event.target.value)} /></label>
            <div className="space-y-1"><span>Metode</span><Select value={disbursementMethod} onValueChange={setDisbursementMethod}><SelectTrigger aria-label="Metode"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tunai">Tunai</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem></SelectContent></Select></div>
            <label className="block">Referensi opsional<Input value={disbursementReference} onChange={event => setDisbursementReference(event.target.value)} /></label>
            <label className="block">Bukti pencairan opsional<Input ref={disbursementProof} type="file" accept="application/pdf,image/jpeg,image/png" /></label>
            {(!disbursementDate || !fundingLabel.trim()) && <p className="text-sm text-muted-foreground">Isi tanggal pencairan dan label sumber dana untuk melanjutkan.</p>}
            {disbursementError && <p role="alert" className="text-destructive">{disbursementError}</p>}
            <Button disabled={disburse.isPending || !disbursementDate || !fundingLabel.trim() || invalidDisbursementDate || readiness.isFetching || !readiness.data?.person_ok || !readiness.data?.schedule_ok || !readiness.data?.contract_ok || !readiness.data?.guarantor_ok || !!readiness.data?.conflict_number || !!readiness.data?.policy_reasons.length} onClick={() => setConfirmDisbursement(true)}>{disburse.isPending?'Menyimpan...':'Catat pencairan'}</Button>
            <AlertDialog open={confirmDisbursement} onOpenChange={setConfirmDisbursement}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Konfirmasi pencairan</AlertDialogTitle><AlertDialogDescription>Periksa data berikut sebelum mencatat pencairan. Persyaratan akan diperiksa ulang oleh server.</AlertDialogDescription></AlertDialogHeader><div className="space-y-1 text-sm"><p>Nasabah: {selectedLoan?.customer?.person?.nama_lengkap || selectedLoan?.customer?.person?.nama_kk}</p><p>Nomor: {selectedLoan?.loan_number}</p><p>Nominal: {selectedLoan ? rupiah(Number(selectedLoan.principal)) : 'Belum tersedia'}</p><p>Tanggal: {loanDate(disbursementDate)} · Sumber dana: {fundingLabel}</p><p>Kontrak: {readiness.data?.contract_ok ? 'Sesuai dan terverifikasi' : 'Belum sesuai'}</p></div><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={()=>disburse.mutate()}>Konfirmasi pencairan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>}
          {(detail.status === 'active' || detail.status === 'paid' || detail.status === 'needs_reconciliation') && <LoanDisbursementEvidence key={`disbursement-evidence-${detail.id}`} loanId={detail.id} pending={pendingDisbursementProof?.loanId === detail.id ? pendingDisbursementProof : null} onResolved={() => setPendingDisbursementProof(current => current?.loanId === detail.id ? null : current)} />}
          {detail.loan_documents.filter(item => item.kind === 'disbursement').map(item => <Button key={item.id} variant="outline" onClick={() => void downloadEvidence(item.storage_path,'bukti-pencairan')}>Unduh bukti pencairan</Button>)}
          <LoanCollectibilityStatus loanId={detail.id} />
          {detail.migration_cutoff && !detail.loan_documents.some(item => item.kind === 'contract_signed') && <p>Kontrak historis belum tersedia.</p>}
          {detail.loan_documents.some(item => item.kind === 'contract_signed') && <div className="space-y-2"><h2 className="font-semibold">Arsip kontrak bertanda tangan</h2>{detail.loan_documents.filter(item => item.kind === 'contract_signed').map(item => <div key={item.id} className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => void downloadEvidence(item.storage_path,'kontrak-bertanda-tangan')}>Unduh kontrak</Button><span>{item.shared_with_customer ? 'Dibagikan ke nasabah' : 'Belum dibagikan'}</span><Button variant="outline" onClick={() => void client.rpc('loan_set_contract_sharing',{p_document_id:item.id,p_shared:!item.shared_with_customer}).then(({error}) => { if (error) toast.error(message(error)); else { void queryClient.invalidateQueries({queryKey:['staff-loan-detail',selectedLoanId]}); toast.success('Akses kontrak diperbarui.'); } })}>{item.shared_with_customer ? 'Hentikan berbagi' : 'Bagikan ke nasabah'}</Button></div>)}</div>}
          {detail.status !== 'draft' && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void downloadLoanDocument(detail.id,'disbursement').catch(error => toast.error(message(error)))}>Unduh ringkasan pencairan</Button><Button variant="outline" onClick={() => void downloadLoanDocument(detail.id,'card').catch(error => toast.error(message(error)))}>Unduh kartu pinjaman</Button></div>}
          </TabsContent>
          <TabsContent value="pembayaran" className="space-y-4">
          {detail.loan_payments.filter(payment => payment.status === 'pending').map(payment => <div className="space-y-2 rounded border p-3" key={payment.id}><h2 className="font-semibold">Klaim menunggu pemeriksaan</h2><p>{loanDate(payment.payment_date)} · {rupiah(Number(payment.amount))}</p><ClaimReview payment={{id:payment.id,loanNumber:selectedLoan?.loan_number || 'Pinjaman',customer:selectedLoan?.customer?.person?.nama_lengkap || selectedLoan?.customer?.person?.nama_kk || 'Nasabah',date:payment.payment_date,amount:payment.amount}} proofs={detail.loan_documents.filter(document => document.kind === 'payment_evidence' && document.payment_id === payment.id)} /></div>)}
          {detail.status === 'needs_reconciliation' && <p className="rounded border p-3">Kewajiban kembali terbuka akibat koreksi pembayaran dan perlu rekonsiliasi. Pembayaran tetap dapat dicatat.</p>}
          {(detail.status === 'active' || detail.status === 'needs_reconciliation') && selectedLoan && <LoanPaymentForm key={`payment-form-${detail.id}`} loanId={detail.id} loanNumber={selectedLoan.loan_number} customerName={selectedLoan.customer?.person?.nama_lengkap || selectedLoan.customer?.person?.nama_kk || 'Nasabah'} remaining={position?.remaining ?? null} />}
          <div><h2 className="mb-2 font-semibold">Riwayat pembayaran</h2>{detail.loan_payments.length === 0 && <p>Belum ada pembayaran.</p>}{detail.loan_payments.map(payment => <div key={payment.id} className="space-y-2 border-t py-3"><p>{loanDate(payment.payment_date)} · {rupiah(Number(payment.amount))} · {payment.method} · {loanStatus(payment.status)}</p>{payment.reason && <p>Alasan: {payment.reason}</p>}{detail.loan_documents.filter(document => document.kind === 'payment_evidence' && document.payment_id === payment.id).map(document => <Button key={document.id} variant="outline" onClick={() => void downloadEvidence(document.storage_path)}>Unduh bukti</Button>)}{(payment.status === 'confirmed' || payment.status === 'cancelled') && <Button variant="outline" onClick={() => void downloadLoanReceipt(payment.id, payment.status === 'confirmed').catch(error => toast.error(message(error)))}>Unduh tanda terima</Button>}{payment.status === 'confirmed' && (!detail.migration_cutoff || payment.payment_date > detail.migration_cutoff) && <CancelPayment payment={{id:payment.id,loanNumber:selectedLoan?.loan_number || 'Pinjaman',customer:selectedLoan?.customer?.person?.nama_lengkap || selectedLoan?.customer?.person?.nama_kk || 'Nasabah',date:payment.payment_date,amount:payment.amount}} />}</div>)}</div>
          </TabsContent>
          <TabsContent value="tindak-lanjut" className="space-y-4">
          {(detail.status === 'active' || detail.status === 'paid' || detail.status === 'needs_reconciliation') && <LoanFollowups key={`followups-${detail.id}`} loanId={detail.id} />}
          </TabsContent>
          </Tabs>
        </>}
      </CardContent></Card>}
    </div>
  );
}
