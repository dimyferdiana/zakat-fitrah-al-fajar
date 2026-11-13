import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { loanDateTime } from '@/lib/loanDisplay';

const client = supabase as unknown as SupabaseClient;
type Category = { id: string; name: string; is_active: boolean };
type Policy = { min_principal: number | null; max_principal: number | null; min_tenor_days: number | null; max_tenor_days: number | null; guarantor_required: boolean; permitted_exceptions: string[]; created_at: string };
const numberOrNull = (value: string) => value.trim() ? Number(value) : null;
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Permintaan tidak berhasil.';

export function LoanPolicyControls({ isAdmin = true }: { isAdmin?: boolean }) {
  const cache = useQueryClient();
  const [name, setName] = useState('');
  const [min, setMin] = useState(''); const [max, setMax] = useState('');
  const [minDays, setMinDays] = useState(''); const [maxDays, setMaxDays] = useState('');
  const [guarantor, setGuarantor] = useState(false);
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [formError,setFormError] = useState('');
  const categories = useQuery({ queryKey: ['loan-categories-all'], queryFn: async () => {
    const { data, error } = await client.from('loan_categories').select('id,name,is_active').order('name');
    if (error) throw error; return (data ?? []) as Category[];
  } });
  const policy = useQuery({ queryKey: ['loan-policy-active'], queryFn: async () => {
    const { data, error } = await client.from('loan_policies').select('min_principal,max_principal,min_tenor_days,max_tenor_days,guarantor_required,permitted_exceptions,created_at').eq('is_active', true).maybeSingle();
    if (error) throw error; return data as Policy | null;
  } });
  const category = useMutation({ mutationFn: async (item: { id: string | null; name: string; active: boolean }) => {
    const { error } = await client.rpc('loan_set_category', { p_id: item.id, p_name: item.name, p_active: item.active }); if (error) throw error;
  }, onSuccess: () => { setName(''); void cache.invalidateQueries({ queryKey: ['loan-categories'] }); void cache.invalidateQueries({ queryKey: ['loan-categories-all'] }); void cache.invalidateQueries({ queryKey: ['loan-categories-list-all'] }); toast.success('Kategori tersimpan.'); }, onError: error => toast.error(errorText(error)) });
  const save = useMutation({ mutationFn: async () => {
    const values = [min, max, minDays, maxDays];
    if (values.some(value => value && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))))) throw new Error('Batas harus berupa bilangan bulat.');
    const { error } = await client.rpc('loan_set_policy', { p_min: numberOrNull(min), p_max: numberOrNull(max), p_min_days: numberOrNull(minDays), p_max_days: numberOrNull(maxDays), p_guarantor: guarantor, p_exceptions: exceptions });
    if (error) throw error;
  }, onSuccess: () => { setFormError('');void cache.invalidateQueries({ queryKey: ['loan-policy-active'] }); toast.success('Versi kebijakan baru tersimpan.'); }, onError: error => {const text=errorText(error);setFormError(text);toast.error(text);document.getElementById('loan-policy-min')?.focus();} });
  const current = policy.data;
  function loadCurrent() {
    setMin(current?.min_principal?.toString() ?? ''); setMax(current?.max_principal?.toString() ?? '');
    setMinDays(current?.min_tenor_days?.toString() ?? ''); setMaxDays(current?.max_tenor_days?.toString() ?? '');
    setGuarantor(current?.guarantor_required ?? false); setExceptions(current?.permitted_exceptions ?? []);
  }
  return <section className="space-y-4 rounded border p-4"><h2 className="font-semibold">Kebijakan pinjaman</h2>
    {(policy.error || categories.error) && <p role="alert">Pengaturan tidak dapat dimuat.</p>}
    <p className="text-sm">{current ? `Kebijakan aktif sejak ${loanDateTime(current.created_at)}.` : 'Belum ada batas aktif atau penjamin wajib.'} Setiap penyimpanan membuat versi baru; kolom kosong berarti tanpa batas.</p>
    {current && <p className="text-sm">Pokok: {current.min_principal===null?'tanpa minimum':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(current.min_principal)}–{current.max_principal===null?'tanpa maksimum':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(current.max_principal)} · Tenor: {current.min_tenor_days ?? 'tanpa minimum'}–{current.max_tenor_days ?? 'tanpa maksimum'} hari · Penjamin: {current.guarantor_required ? 'wajib' : 'tidak wajib'} · Pengecualian: {current.permitted_exceptions.map(item=>({principal:'batas pokok',tenor:'batas tenor',guarantor:'penjamin'} as Record<string,string>)[item] || 'persyaratan lain').join(', ') || 'tidak ada'}</p>}
    {isAdmin && <>
    <Button variant="outline" onClick={loadCurrent}>Muat pengaturan saat ini</Button>
    <div className="grid gap-2 sm:grid-cols-2"><label>Pokok minimum<Input id="loan-policy-min" aria-describedby={formError?'loan-policy-error':undefined} type="number" min="1" value={min} onChange={e => setMin(e.target.value)} /></label><label>Pokok maksimum<Input type="number" min="1" value={max} onChange={e => setMax(e.target.value)} /></label><label>Tenor minimum (hari)<Input type="number" min="0" value={minDays} onChange={e => setMinDays(e.target.value)} /></label><label>Tenor maksimum (hari)<Input type="number" min="0" value={maxDays} onChange={e => setMaxDays(e.target.value)} /></label></div>
    <label className="flex items-center gap-2"><Checkbox checked={guarantor} onCheckedChange={value => setGuarantor(value === true)} /> Penjamin wajib</label>
    <p className="text-sm">Jenis pengecualian yang diizinkan (masing-masing tetap memerlukan alasan):</p>
    {([['principal','Batas pokok'],['tenor','Batas tenor'],['guarantor','Penjamin wajib']] as const).map(([key,label]) => <label key={key} className="mr-4 inline-flex items-center gap-2 text-sm"><Checkbox checked={exceptions.includes(key)} onCheckedChange={checked => setExceptions(v => checked === true ? [...v, key] : v.filter(x => x !== key))} /> {label}</label>)}
    {formError && <p id="loan-policy-error" role="alert" className="text-destructive">{formError}</p>}
    <div><Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending?'Menyimpan...':'Simpan versi kebijakan'}</Button></div>
    </>}
    <h3 className="font-semibold">Kategori tujuan</h3>{isAdmin && <div className="flex gap-2"><Input aria-label="Nama kategori baru" value={name} onChange={e => setName(e.target.value)} /><Button disabled={category.isPending || !name.trim()} onClick={() => category.mutate({ id: null, name, active: true })}>Tambah</Button></div>}
    {categories.data?.map(item => <div key={item.id} className="flex items-center justify-between gap-2 text-sm"><span>{item.name} · {item.is_active ? 'aktif' : 'nonaktif'}</span>{isAdmin && <Button variant="outline" disabled={category.isPending} onClick={() => category.mutate({ id: item.id, name: item.name, active: !item.is_active })}>{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>}</div>)}
  </section>;
}
