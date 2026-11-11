import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { makeSchedule, scheduleDurationDays, validateSchedule, type Installment } from '@/lib/loanSchedule';
import { loanPosition } from '@/lib/loanCalculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoanDashboard } from '@/components/loans/LoanDashboard';
import { downloadLoanReceipt } from '@/lib/loanReceipt';
import { downloadLoanDocument } from '@/lib/loanDocuments';
import { LoanContractTemplate } from '@/components/loans/LoanContractTemplate';
import { LoanFollowups } from '@/components/loans/LoanFollowups';
import { LoanClaimQueue } from '@/components/loans/LoanClaimQueue';
import { WargaForm } from '@/components/data-master/WargaForm';
import { LoanPolicyControls } from '@/components/loans/LoanPolicyControls';
import { LoanDraftControls } from '@/components/loans/LoanDraftControls';
import { LoanAccountRecovery } from '@/components/loans/LoanAccountRecovery';
import { LoanStaffAccountLink } from '@/components/loans/LoanStaffAccountLink';
import { LoanCustomerSelect } from '@/components/loans/LoanCustomerSelect';
import { LoanScheduleEditor } from '@/components/loans/LoanScheduleEditor';
import { LoanPaymentForm } from '@/components/loans/LoanPaymentForm';
import { LoanPaymentSummary } from '@/components/loans/LoanPaymentSummary';
import { LoanDisbursementEvidence } from '@/components/loans/LoanDisbursementEvidence';
import { uploadDisbursementEvidence, type DisbursementEvidence } from '@/lib/loanDisbursementEvidence';
import { LoanCollectibilityControls, LoanCollectibilityStatus } from '@/components/loans/LoanCollectibilityControls';

interface Person {
  id: string;
  nama_kk: string;
  nama_lengkap: string | null;
  alamat: string;
  no_telp: string | null;
  jenis_identitas: 'individu' | 'rumah_tangga' | 'belum_diverifikasi';
  identitas_terverifikasi: boolean;
}
interface Customer { id: string; person_id: string; person: Pick<Person, 'nama_kk' | 'nama_lengkap' | 'alamat'> | null }
interface Category { id: string; name: string }
interface Loan { id: string; loan_number: string; purpose: string; principal: number; status: string; customer: { person: Pick<Person, 'nama_kk' | 'nama_lengkap'> | null } | null }
interface LoanDetail {
  id: string;
  status: string;
  planned_disbursement_date: string | null;
  guarantor_relationship: string | null;
  guarantor_contact: string | null;
  guarantor: Pick<Person, 'nama_kk' | 'nama_lengkap'> | null;
  migration_cutoff: string | null;
  loan_installments: { due_date: string; amount: number; opening_remaining: number | null; installment_number: number }[];
  loan_payments: { id: string; payment_date: string; amount: number; status: 'confirmed' | 'pending' | 'rejected' | 'cancelled'; method: string; reason: string | null }[];
  loan_documents: { id: string; payment_id: string | null; kind: string; storage_path: string; shared_with_customer: boolean }[];
}

const client = supabase as unknown as SupabaseClient;
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const message = (error: unknown) => error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : 'Permintaan tidak berhasil.';

export function LoanManagement() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [createPersonOpen, setCreatePersonOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [firstDate, setFirstDate] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [count, setCount] = useState('3');
  const [customSchedule, setCustomSchedule] = useState('');
  const [preview, setPreview] = useState<Installment[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [contractTemplateId, setContractTemplateId] = useState('');
  const [cancellationReasons, setCancellationReasons] = useState<Record<string, string>>({});
  const [accountCustomerId, setAccountCustomerId] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const accountPassword = useRef<HTMLInputElement>(null);
  const requestId = useRef(crypto.randomUUID());
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
  const [contractVerified, setContractVerified] = useState(false);

  const people = useQuery({
    queryKey: ['loan-person-search', search], enabled: search.trim().length >= 2,
    queryFn: async () => {
      const term = search.replace(/[,()%_]/g, ' ').trim();
      if (term.length < 2) return [];
      const { data, error } = await client.from('muzakki').select('id, nama_kk, nama_lengkap, alamat, no_telp, jenis_identitas, identitas_terverifikasi')
        .or(`nama_kk.ilike.%${term}%,nama_lengkap.ilike.%${term}%,alamat.ilike.%${term}%,no_telp.ilike.%${term}%`).eq('aktif', true).limit(15);
      if (error) throw error;
      return (data ?? []) as Person[];
    },
  });
  const customers = useQuery({
    queryKey: ['loan-customers'],
    queryFn: async () => {
      const { data, error } = await client.from('loan_customers')
        .select('id, person_id, person:muzakki!loan_customers_person_id_fkey(nama_kk, nama_lengkap, alamat)').eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Customer[];
    },
  });
  const categories = useQuery({
    queryKey: ['loan-categories'],
    queryFn: async () => {
      const { data, error } = await client.from('loan_categories').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
  const staff = useQuery({ queryKey: ['loan-staff-choices'], queryFn: async () => {
    const { data, error } = await client.rpc('loan_staff_choices');
    if (error) throw error;
    return (data ?? []) as { id: string; nama_lengkap: string }[];
  } });
  const obligations = useQuery({ queryKey: ['loan-customer-obligations',customerId], enabled: !!customerId, queryFn: async () => {
    const { data, error } = await client.rpc('loan_customer_obligations', { p_customer: customerId });
    if (error) throw error;
    return (data ?? []) as { loan_number: string; status: string; remaining: number | null }[];
  } });
  const loans = useQuery({
    queryKey: ['staff-loans'],
    queryFn: async () => {
      const { data, error } = await client.from('loans').select('id, loan_number, purpose, principal, status, customer:loan_customers(person:muzakki!loan_customers_person_id_fkey(nama_kk,nama_lengkap))').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Loan[];
    },
  });
  const loanDetail = useQuery({
    queryKey: ['staff-loan-detail', selectedLoanId], enabled: !!selectedLoanId,
    queryFn: async () => {
      const { data, error } = await client.from('loans').select('id,status,planned_disbursement_date,migration_cutoff,guarantor_relationship,guarantor_contact,guarantor:muzakki!loans_guarantor_id_fkey(nama_kk,nama_lengkap),loan_installments(due_date,amount,opening_remaining,installment_number),loan_payments(id,payment_date,amount,status,method,reason),loan_documents(id,payment_id,kind,storage_path,shared_with_customer)').eq('id', selectedLoanId).single();
      if (error) throw error;
      return data as unknown as LoanDetail;
    },
  });
  const selectedLoanLookup = useQuery({
    queryKey:['staff-loan-selected',selectedLoanId], enabled:!!selectedLoanId && !!loans.data && !loans.data.some(loan=>loan.id===selectedLoanId),
    queryFn:async () => {
      const {data,error}=await client.from('loans').select('id,loan_number,purpose,principal,status,customer:loan_customers(person:muzakki!loan_customers_person_id_fkey(nama_kk,nama_lengkap))').eq('id',selectedLoanId).single();
      if(error) throw error;
      return data as unknown as Loan;
    },
  });
  const accountCreation = useQuery({
    queryKey: ['loan-account-creation'], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await client.rpc('loan_customer_creation_enabled');
      if (error) throw error;
      return data === true;
    },
  });

  const register = useMutation({
    mutationFn: async () => {
      if (!selectedPerson) throw new Error('Pilih data orang terlebih dahulu.');
      if (selectedPerson.jenis_identitas === 'rumah_tangga') throw new Error('Pilih individu; data rumah tangga tidak dapat menjadi nasabah.');
      if (!selectedPerson.identitas_terverifikasi || selectedPerson.jenis_identitas !== 'individu') {
        const { error } = await client.rpc('loan_confirm_individual', { p_person_id: selectedPerson.id, p_name: personName });
        if (error) throw error;
      }
      const { data, error } = await client.rpc('loan_register_customer', { p_person_id: selectedPerson.id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: id => {
      setCustomerId(id); setSelectedPerson(null); setSearch('');
      void queryClient.invalidateQueries({ queryKey: ['loan-customers'] });
      toast.success('Nasabah berhasil didaftarkan.');
    },
    onError: error => toast.error(message(error)),
  });

  function buildSchedule(): Installment[] {
    const amount = Number(principal);
    const items = frequency === 'custom'
      ? customSchedule.split('\n').filter(line => line.trim()).map(line => {
          const [dueDate, value, ...extra] = line.split(',').map(part => part.trim());
          if (extra.length || !dueDate || !/^\d+$/.test(value ?? '')) throw new Error('Gunakan format tanggal,nominal pada setiap baris.');
          return { dueDate, amount: Number(value) };
        })
      : makeSchedule(amount, Number(count), firstDate, frequency);
    validateSchedule(items, amount, plannedDate);
    return items;
  }

  const createDraft = useMutation({
    mutationFn: async () => {
      if (!customerId || !categoryId || !purpose.trim() || !responsibleId) throw new Error('Nasabah, kategori, tujuan, dan penanggung jawab wajib diisi.');
      const schedule = buildSchedule();
      const { data, error } = await client.rpc('loan_create_complete_draft', {
        p_customer_id: customerId, p_category_id: categoryId, p_purpose: purpose.trim(),
        p_principal: Number(principal), p_schedule: schedule, p_request_id: requestId.current,
        p_planned: plannedDate, p_responsible: responsibleId, p_notes: draftNotes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      requestId.current = crypto.randomUUID(); setPreview([]); setPurpose(''); setPrincipal(''); setDraftNotes('');
      void queryClient.invalidateQueries({ queryKey: ['staff-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      toast.success('Draft pinjaman tersimpan.');
    },
    onError: error => toast.error(message(error)),
  });

  async function createAccount() {
    const password = accountPassword.current?.value ?? '';
    if (accountPassword.current) accountPassword.current.value = '';
    try {
      if (!accountCustomerId || !accountEmail.trim() || password.length < 8) throw new Error('Pilih nasabah, isi email dan password minimal 8 karakter.');
      setCreatingAccount(true);
      const { data, error } = await client.functions.invoke('loan-customer-account', {
        body: { customerId: accountCustomerId, email: accountEmail.trim(), password },
      });
      if (error) throw new Error('Akun tidak dapat dibuat. Periksa data dan coba lagi.');
      if (!data?.success) throw new Error('Akun tidak dapat dibuat.');
      setAccountEmail(''); setAccountCustomerId(''); toast.success('Akun nasabah berhasil dibuat.');
    } catch (error) {
      toast.error(message(error));
    } finally {
      setCreatingAccount(false);
    }
  }

  const cancelPayment = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!reason.trim()) throw new Error('Alasan pembatalan wajib diisi.');
      const { error } = await client.rpc('loan_cancel_payment', { p_payment_id: id, p_reason: reason.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setCancellationReasons({});
      void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', selectedLoanId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-collectibility-status'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-collectibility'] });
      toast.success('Pembayaran dibatalkan.');
    },
    onError: error => toast.error(message(error)),
  });

  const reviewClaim = useMutation({
    mutationFn: async ({ id, accept, reason }: { id: string; accept: boolean; reason: string }) => {
      if (!accept && !reason.trim()) throw new Error('Alasan penolakan wajib diisi.');
      const { error } = await client.rpc('loan_review_payment_claim', { p_payment_id: id, p_accept: accept, p_reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setCancellationReasons({});
      void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', selectedLoanId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-claim-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-collectibility-status'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-collectibility'] });
      toast.success('Pemeriksaan klaim tersimpan.');
    },
    onError: error => toast.error(message(error)),
  });
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
    if (!file || !disbursementDate || !contractTemplateId || !contractVerified || file.size > 5242880) { toast.error('Pilih versi template, kontrak dan tanggal pencairan, lalu konfirmasi pemeriksaan; ukuran maksimal 5 MB.'); return; }
    const form = new FormData();
    form.set('loanId', selectedLoanId); form.set('requestId', contractRequestId.current);
    form.set('disbursementDate', disbursementDate); form.set('templateId', contractTemplateId); form.set('verified', 'true'); form.set('file', file);
    setUploadingContract(true);
    try {
      const { data, error } = await client.functions.invoke('loan-contract-upload', { body: form });
      if (error || !data?.success) throw new Error('Kontrak belum dapat disimpan. Periksa berkas dan draft.');
      contractRequestId.current = crypto.randomUUID();
      if (contractFile.current) contractFile.current.value = '';
      setContractVerified(false);
      void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', selectedLoanId] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      toast.success('Kontrak bertanda tangan tersimpan.');
    } catch (error) { toast.error(message(error)); } finally { setUploadingContract(false); }
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
      disbursementRequestId.current = crypto.randomUUID();
      void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-collectibility-status'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-customer-collectibility'] });
      toast.success('Pencairan tercatat.');
      if (proof) {
        const pending = { loanId, disbursementId, requestId: crypto.randomUUID(), file: proof };
        setPendingDisbursementProof(pending);
        try { await uploadDisbursementEvidence(pending); setPendingDisbursementProof(current => current?.requestId === pending.requestId ? null : current); void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] }); toast.success('Bukti pencairan tersimpan.'); }
        catch { toast.error('Pencairan sudah tercatat, tetapi bukti belum tersimpan. Ulangi unggah bukti.'); }
      }
    },
    onError: error => toast.error(message(error)),
  });

  const selectDashboardLoan = useCallback((id: string) => {
    if (id !== selectedLoanId) {
      contractRequestId.current = crypto.randomUUID();
      disbursementRequestId.current = crypto.randomUUID();
      setDisbursementDate(''); setFundingLabel(''); setDisbursementReference('');
    }
    setSelectedLoanId(id);
    setTimeout(() => document.getElementById('rincian-pinjaman')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }, [selectedLoanId]);

  const detail = loanDetail.data;
  const selectedLoan = loans.data?.find(loan => loan.id === selectedLoanId) ?? selectedLoanLookup.data;
  const sortedInstallments = [...(detail?.loan_installments ?? [])].sort((a, b) => a.installment_number - b.installment_number);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const invalidDisbursementDate = !!disbursementDate && (disbursementDate > today || sortedInstallments.some(item => item.due_date < disbursementDate));
  let position: ReturnType<typeof loanPosition> | null = null;
  try {
    if (detail && sortedInstallments.length > 0 && (!detail.migration_cutoff || sortedInstallments.every(item => item.opening_remaining !== null))) {
      position = loanPosition(sortedInstallments.map(item => ({ dueDate: item.due_date, amount: Number(item.amount) })),
        detail.loan_payments.filter(item => !detail.migration_cutoff || item.payment_date > detail.migration_cutoff)
          .map(item => ({ id: item.id, date: item.payment_date, amount: Number(item.amount), status: item.status })), today,
        detail.migration_cutoff ? sortedInstallments.map(item => Number(item.opening_remaining)) : undefined);
    }
  } catch { position = null; }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><h1 className="text-2xl font-semibold">Pinjaman Jamaah</h1><p className="text-sm text-muted-foreground">Kelola nasabah dan draft pinjaman.</p></div>
      <p className="text-sm text-muted-foreground">Pencairan dan pembayaran hanya dicatat dalam modul pinjaman; saldo kas dan rekening tidak berubah otomatis.</p>
      <nav aria-label="Navigasi pinjaman" className="flex flex-wrap gap-x-4 gap-y-2 text-sm"><a className="underline" href="#loan-dashboard">Dashboard &amp; laporan</a><a className="underline" href="#loan-customers">Nasabah</a><a className="underline" href="#loan-drafts">Pinjaman &amp; jadwal</a><a className="underline" href="#loan-claims">Pembayaran</a><a className="underline" href="#loan-settings">Pengaturan</a></nav>
      <section id="loan-dashboard"><LoanDashboard onSelectLoan={selectDashboardLoan} /></section>
      <section id="loan-claims"><LoanClaimQueue onSelectLoan={id => { setSelectedLoanId(id); setTimeout(() => document.getElementById('rincian-pinjaman')?.scrollIntoView({behavior:'smooth'}), 0); }} /></section>
      <section id="loan-settings" className="space-y-4">{isAdmin && <LoanPolicyControls />}<LoanCollectibilityControls isAdmin={isAdmin} /></section>
      <Card id="loan-customers"><CardHeader><CardTitle>Daftarkan nasabah</CardTitle></CardHeader><CardContent className="space-y-3">
        <label htmlFor="person-search" className="text-sm font-medium">Cari orang di Data Master</label>
        <Input id="person-search" placeholder="Ketik nama, alamat, atau nomor telepon" value={search} onChange={event => { setSearch(event.target.value); setSelectedPerson(null); }} />
        <Button type="button" variant="outline" onClick={() => setCreatePersonOpen(true)}>Tambah data orang</Button>
        <WargaForm open={createPersonOpen} onOpenChange={open => { setCreatePersonOpen(open); if (!open) void queryClient.invalidateQueries({ queryKey: ['loan-person-search'] }); }} />
        {people.error && <p role="alert" className="text-sm text-destructive">Pencarian tidak dapat dimuat.</p>}
        {people.data?.map(person => <button key={person.id} type="button" onClick={() => { setSelectedPerson(person); setPersonName(person.nama_lengkap || person.nama_kk); }} className="block w-full rounded border p-3 text-left text-sm hover:bg-muted">
          <strong>{person.nama_lengkap || person.nama_kk}</strong> — {person.alamat}{person.no_telp && ` · ${person.no_telp}`} <span className="text-muted-foreground">({person.jenis_identitas.replaceAll('_', ' ')})</span>
        </button>)}
        {selectedPerson && <div className="space-y-2 rounded border p-3">
          <p className="text-sm">Pilihan: <strong>{selectedPerson.nama_kk}</strong> — {selectedPerson.alamat}</p>
          {!selectedPerson.identitas_terverifikasi && <><label htmlFor="person-name" className="text-sm">Pastikan data ini mewakili satu individu. Nama lengkap:</label><Input id="person-name" value={personName} onChange={event => setPersonName(event.target.value)} /></>}
          <Button disabled={register.isPending || selectedPerson.jenis_identitas === 'rumah_tangga'} onClick={() => register.mutate()}>Konfirmasi individu dan daftarkan</Button>
          {selectedPerson.jenis_identitas === 'rumah_tangga' && <p className="text-sm text-destructive">Daftarkan anggota keluarga sebagai individu di Data Master terlebih dahulu.</p>}
        </div>}
      </CardContent></Card>

      {isAdmin && <Card data-testid="loan-account-panel"><CardHeader><CardTitle>Buat akun nasabah</CardTitle></CardHeader><CardContent className="space-y-3">
        {accountCreation.data !== true && <p className="text-sm text-muted-foreground">Pembuatan akun belum tersedia. Hubungi pengelola aplikasi.</p>}
        <LoanCustomerSelect customers={customers.data ?? []} value={accountCustomerId} onChange={setAccountCustomerId} />
        <label className="block space-y-1 text-sm">Email<Input type="email" autoComplete="off" value={accountEmail} onChange={event => setAccountEmail(event.target.value)} /></label>
        <label className="block space-y-1 text-sm">Password awal<Input ref={accountPassword} type="password" autoComplete="new-password" minLength={8} /></label>
        <Button disabled={accountCreation.data !== true || creatingAccount} onClick={() => void createAccount()}>Buat akun</Button>
        <LoanAccountRecovery customers={customers.data ?? []} />
        <LoanStaffAccountLink customers={customers.data ?? []} enabled={accountCreation.data === true} />
      </CardContent></Card>}

      <Card id="loan-drafts"><CardHeader><CardTitle>Buat draft pinjaman</CardTitle></CardHeader><CardContent className="space-y-4">
        {(customers.error || categories.error) && <p role="alert" className="text-sm text-destructive">Daftar nasabah atau kategori tidak dapat dimuat.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <LoanCustomerSelect customers={customers.data ?? []} value={customerId} onChange={setCustomerId} />
          <label className="space-y-1 text-sm">Kategori<select className="h-10 w-full rounded border bg-background px-3" value={categoryId} onChange={event => setCategoryId(event.target.value)}><option value="">Pilih kategori</option>{categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">Nominal pokok (Rp)<Input type="number" min="1" step="1" value={principal} onChange={event => { setPrincipal(event.target.value); setPreview([]); }} /></label>
          <label className="space-y-1 text-sm">Rencana tanggal pencairan<Input type="date" value={plannedDate} onChange={event => { setPlannedDate(event.target.value); setPreview([]); }} /></label>
        </div>
        <label className="block space-y-1 text-sm">Digunakan untuk<Input value={purpose} onChange={event => setPurpose(event.target.value)} /></label>
        <label className="block space-y-1 text-sm">Petugas penanggung jawab<select className="h-10 w-full rounded border bg-background px-3" value={responsibleId} onChange={event => setResponsibleId(event.target.value)}><option value="">Pilih petugas</option>{staff.data?.map(item => <option key={item.id} value={item.id}>{item.nama_lengkap}</option>)}</select></label>
        {staff.error && <p role="alert" className="text-destructive">Daftar petugas tidak dapat dimuat.</p>}
        <label className="block space-y-1 text-sm">Catatan (opsional)<Textarea value={draftNotes} onChange={event => setDraftNotes(event.target.value)} /></label>
        {obligations.isLoading && customerId && <p>Memeriksa kewajiban nasabah...</p>}
        {obligations.error && <p role="alert" className="text-destructive">Kewajiban nasabah tidak dapat diperiksa; pencairan tetap diperiksa oleh server.</p>}
        {obligations.data && obligations.data.length > 0 && <div className="rounded border p-3 text-sm"><p>Draft tetap dapat dibuat. Pencairan diblokir selama kewajiban berikut masih perlu ditangani:</p>{obligations.data.map(item => <p key={item.loan_number}>{item.loan_number} — {item.status === 'needs_reconciliation' ? 'perlu rekonsiliasi akibat koreksi' : 'aktif'} — sisa {item.remaining === null ? 'belum dapat dihitung' : rupiah(Number(item.remaining))}</p>)}</div>}
        <label className="block space-y-1 text-sm">Pola pembayaran<select className="h-10 w-full rounded border bg-background px-3" value={frequency} onChange={event => { setFrequency(event.target.value as typeof frequency); setPreview([]); }}><option value="monthly">Bulanan</option><option value="weekly">Mingguan</option><option value="custom">Tanggal khusus</option></select></label>
        {frequency !== 'custom' ? <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Jatuh tempo pertama<Input type="date" value={firstDate} onChange={event => { setFirstDate(event.target.value); setPreview([]); }} /></label><label className="space-y-1 text-sm">Jumlah angsuran<Input type="number" min="1" step="1" value={count} onChange={event => { setCount(event.target.value); setPreview([]); }} /></label></div> : <label className="block space-y-1 text-sm">Tanggal dan nominal, satu baris per angsuran (contoh: 2026-12-01,500000)<Textarea value={customSchedule} onChange={event => { setCustomSchedule(event.target.value); setPreview([]); }} /></label>}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => { try { setPreview(buildSchedule()); } catch (error) { toast.error(message(error)); } }}>Tinjau jadwal</Button><Button type="button" disabled={createDraft.isPending} onClick={() => createDraft.mutate()}>Simpan draft</Button></div>
        {preview.length > 0 && <div className="space-y-2 overflow-x-auto"><p className="text-sm">{frequency === 'custom' ? `${preview.length} angsuran` : `${preview.length} periode ${frequency === 'weekly' ? 'mingguan' : 'bulanan'}`} · {plannedDate} sampai {preview[preview.length - 1].dueDate} · {scheduleDurationDays(plannedDate, preview)} hari kalender</p><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Ke</th><th>Tanggal</th><th>Nominal</th></tr></thead><tbody>{preview.map((item, index) => <tr className="border-b" key={item.dueDate}><td className="p-2">{index + 1}</td><td>{item.dueDate}</td><td>{rupiah(item.amount)}</td></tr>)}</tbody></table></div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Pinjaman terbaru</CardTitle></CardHeader><CardContent>
        {loans.error && <p role="alert" className="text-destructive">Daftar pinjaman tidak dapat dimuat.</p>}
        {loans.isLoading && <p>Memuat pinjaman...</p>}
        {loans.data?.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pinjaman.</p>}
        <div className="divide-y">{loans.data?.map(loan => <button type="button" key={loan.id} onClick={() => { if (loan.id !== selectedLoanId) { contractRequestId.current = crypto.randomUUID(); disbursementRequestId.current = crypto.randomUUID(); setDisbursementDate(''); setFundingLabel(''); setDisbursementReference(''); } setSelectedLoanId(loan.id); }} className="flex w-full flex-wrap justify-between gap-2 py-3 text-left text-sm hover:bg-muted"><span><strong>{loan.loan_number}</strong> — {loan.customer?.person?.nama_lengkap || loan.customer?.person?.nama_kk || 'Nasabah'} · {loan.purpose}</span><span>{rupiah(Number(loan.principal))} · {loan.status}</span></button>)}</div>
      </CardContent></Card>
      <div id="rincian-pinjaman" />
      {selectedLoanId && <Card><CardHeader><CardTitle>Rincian pinjaman</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        {loanDetail.isLoading && <p>Memuat rincian...</p>}
        {loanDetail.error && <p role="alert" className="text-destructive">Rincian pinjaman tidak dapat dimuat.</p>}
        {detail && <>
          {detail.status === 'draft' && <LoanDraftControls key={`draft-controls-${detail.id}`} loanId={detail.id} disbursementDate={disbursementDate} />}
          {detail.status === 'draft' && selectedLoan && <LoanScheduleEditor key={`${detail.id}-${detail.planned_disbursement_date}-${JSON.stringify(sortedInstallments)}`} loanId={detail.id} plannedDate={detail.planned_disbursement_date} principal={Number(selectedLoan.principal)} schedule={sortedInstallments.map(item => ({ dueDate: item.due_date, amount: Number(item.amount) }))} />}
          {detail.status === 'draft' && <LoanContractTemplate isAdmin={isAdmin} selected={contractTemplateId} onSelect={id => { setContractTemplateId(id); setContractVerified(false); contractRequestId.current = crypto.randomUUID(); }} draft={selectedLoan ? {
            loanNumber: selectedLoan.loan_number, name: selectedLoan.customer?.person?.nama_lengkap || selectedLoan.customer?.person?.nama_kk || 'Tidak tersedia',
            purpose: selectedLoan.purpose, principal: Number(selectedLoan.principal), disbursementDate,
            guarantor: detail.guarantor?.nama_lengkap || detail.guarantor?.nama_kk || '', guarantorRelationship: detail.guarantor_relationship || '', guarantorContact: detail.guarantor_contact || '',
            schedule: sortedInstallments.map(item => ({ date: item.due_date, amount: Number(item.amount) })),
          } : null} />}
          {detail.status === 'draft' && <div className="space-y-3 rounded border p-4"><h2 className="font-semibold">Kontrak dan pencairan</h2>
            <p>Unggah kontrak bertanda tangan dengan tanggal pencairan yang akan digunakan. Maksimal 5 MB.</p>
            <label className="block">Tanggal pencairan<Input type="date" value={disbursementDate} onChange={event => { setDisbursementDate(event.target.value); setContractVerified(false); }} /></label>
            {disbursementDate && sortedInstallments.length > 0 && <p>Jadwal: {sortedInstallments.length} angsuran, {sortedInstallments[0].due_date} sampai {sortedInstallments[sortedInstallments.length - 1].due_date}; pokok {selectedLoan ? rupiah(Number(selectedLoan.principal)) : 'belum tersedia'}.</p>}
            {invalidDisbursementDate && <p role="alert" className="text-destructive">Tanggal pencairan tidak boleh melewati hari ini atau jatuh setelah salah satu tanggal angsuran. Tinjau dan ubah jadwal sebelum melanjutkan.</p>}
            <label className="block">Kontrak bertanda tangan<Input ref={contractFile} type="file" accept="application/pdf,image/jpeg,image/png" onChange={() => setContractVerified(false)} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={contractVerified} onChange={event => setContractVerified(event.target.checked)} /> Saya sudah memeriksa kontrak dan tanda tangannya.</label>
            <Button variant="outline" disabled={uploadingContract} onClick={() => void uploadContract()}>Simpan kontrak</Button>
            <label className="block">Label sumber dana<Input value={fundingLabel} onChange={event => setFundingLabel(event.target.value)} /></label>
            <label className="block">Metode<select className="h-10 w-full rounded border bg-background px-3" value={disbursementMethod} onChange={event => setDisbursementMethod(event.target.value)}><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="lainnya">Lainnya</option></select></label>
            <label className="block">Referensi opsional<Input value={disbursementReference} onChange={event => setDisbursementReference(event.target.value)} /></label>
            <label className="block">Bukti pencairan opsional<Input ref={disbursementProof} type="file" accept="application/pdf,image/jpeg,image/png" /></label>
            <Button disabled={disburse.isPending || !disbursementDate || invalidDisbursementDate} onClick={() => disburse.mutate()}>Catat pencairan</Button>
          </div>}
          <LoanPaymentSummary position={position} installmentCount={sortedInstallments.length} migrated={!!detail.migration_cutoff} />
          {(detail.status === 'active' || detail.status === 'paid' || detail.status === 'needs_reconciliation') && <LoanDisbursementEvidence key={`disbursement-evidence-${detail.id}`} loanId={detail.id} pending={pendingDisbursementProof?.loanId === detail.id ? pendingDisbursementProof : null} onResolved={() => setPendingDisbursementProof(current => current?.loanId === detail.id ? null : current)} />}
          {detail.loan_documents.filter(item => item.kind === 'disbursement').map(item => <Button key={item.id} variant="outline" onClick={() => void downloadEvidence(item.storage_path,'bukti-pencairan')}>Unduh bukti pencairan</Button>)}
          <LoanCollectibilityStatus loanId={detail.id} />
          {detail.migration_cutoff && !detail.loan_documents.some(item => item.kind === 'contract_signed') && <p>Kontrak historis belum tersedia.</p>}
          {detail.loan_documents.some(item => item.kind === 'contract_signed') && <div className="space-y-2"><h2 className="font-semibold">Arsip kontrak bertanda tangan</h2>{detail.loan_documents.filter(item => item.kind === 'contract_signed').map(item => <div key={item.id} className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => void downloadEvidence(item.storage_path,'kontrak-bertanda-tangan')}>Unduh kontrak</Button><span>{item.shared_with_customer ? 'Dibagikan ke nasabah' : 'Belum dibagikan'}</span><Button variant="outline" onClick={() => void client.rpc('loan_set_contract_sharing',{p_document_id:item.id,p_shared:!item.shared_with_customer}).then(({error}) => { if (error) toast.error(message(error)); else { void queryClient.invalidateQueries({queryKey:['staff-loan-detail',selectedLoanId]}); toast.success('Akses kontrak diperbarui.'); } })}>{item.shared_with_customer ? 'Hentikan berbagi' : 'Bagikan ke nasabah'}</Button></div>)}</div>}
          {detail.status !== 'draft' && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void downloadLoanDocument(detail.id,'disbursement').catch(error => toast.error(message(error)))}>Unduh ringkasan pencairan</Button><Button variant="outline" onClick={() => void downloadLoanDocument(detail.id,'card').catch(error => toast.error(message(error)))}>Unduh kartu pinjaman</Button></div>}
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b text-left"><th className="p-2">Jatuh tempo</th><th>Nominal</th><th>Sisa</th></tr></thead><tbody>{sortedInstallments.map((item, index) => <tr key={item.installment_number} className="border-b"><td className="p-2">{item.due_date}</td><td>{rupiah(Number(item.amount))}</td><td>{position ? rupiah(position.installments[index].remaining) : 'Belum tersedia'}</td></tr>)}</tbody></table></div>
          {detail.loan_payments.filter(payment => payment.status === 'pending').map(payment => <div className="space-y-2 rounded border p-3" key={payment.id}><h2 className="font-semibold">Klaim menunggu pemeriksaan</h2><p>{payment.payment_date} · {rupiah(Number(payment.amount))}</p>
            {detail.loan_documents.filter(document => document.kind === 'payment_evidence' && document.payment_id === payment.id).map(document => <Button key={document.id} variant="outline" onClick={() => void downloadEvidence(document.storage_path)}>Unduh bukti transfer</Button>)}
            <Input aria-label="Alasan penolakan" placeholder="Alasan jika ditolak" value={cancellationReasons[payment.id] ?? ''} onChange={event => setCancellationReasons(previous => ({ ...previous, [payment.id]: event.target.value }))} />
            <div className="flex gap-2"><Button disabled={reviewClaim.isPending} onClick={() => reviewClaim.mutate({ id: payment.id, accept: true, reason: '' })}>Konfirmasi</Button><Button variant="outline" disabled={reviewClaim.isPending} onClick={() => reviewClaim.mutate({ id: payment.id, accept: false, reason: cancellationReasons[payment.id] ?? '' })}>Tolak</Button></div>
          </div>)}
          {detail.status === 'needs_reconciliation' && <p className="rounded border p-3">Kewajiban kembali terbuka akibat koreksi pembayaran dan perlu rekonsiliasi. Pembayaran tetap dapat dicatat.</p>}
          {(detail.status === 'active' || detail.status === 'needs_reconciliation') && <LoanPaymentForm key={`payment-form-${detail.id}`} loanId={detail.id} />}
          {(detail.status === 'active' || detail.status === 'paid' || detail.status === 'needs_reconciliation') && <LoanFollowups key={`followups-${detail.id}`} loanId={detail.id} />}
          <div><h2 className="mb-2 font-semibold">Riwayat pembayaran</h2>{detail.loan_payments.length === 0 && <p>Belum ada pembayaran.</p>}{detail.loan_payments.map(payment => <div key={payment.id} className="space-y-2 border-t py-3"><p>{payment.payment_date} · {rupiah(Number(payment.amount))} · {payment.method} · {payment.status}</p>{payment.reason && <p>Alasan: {payment.reason}</p>}{(payment.status === 'confirmed' || payment.status === 'cancelled') && <Button variant="outline" onClick={() => void downloadLoanReceipt(payment.id, payment.status === 'confirmed').catch(error => toast.error(message(error)))}>Unduh tanda terima</Button>}{payment.status === 'confirmed' && (!detail.migration_cutoff || payment.payment_date > detail.migration_cutoff) && <div className="flex flex-wrap gap-2"><Input aria-label="Alasan pembatalan" placeholder="Alasan pembatalan wajib diisi" value={cancellationReasons[payment.id] ?? ''} onChange={event => setCancellationReasons(previous => ({ ...previous, [payment.id]: event.target.value }))} /><Button variant="outline" disabled={cancelPayment.isPending} onClick={() => cancelPayment.mutate({ id: payment.id, reason: cancellationReasons[payment.id] ?? '' })}>Batalkan pembayaran</Button></div>}</div>)}</div>
        </>}
      </CardContent></Card>}
    </div>
  );
}
