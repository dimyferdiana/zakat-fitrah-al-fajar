import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const client = supabase as unknown as SupabaseClient;
export function LoanStaffAccountLink({ customerId, enabled, onLinked }: { customerId: string; enabled: boolean; onLinked?: () => void }) {
  const [staff, setStaff] = useState('');
  const [pending, setPending] = useState(false);
  const [formError,setFormError] = useState('');
  const accounts = useQuery({ queryKey: ['loan-staff-accounts'], queryFn: async () => {
    const { data, error } = await client.rpc('loan_list_staff_accounts'); if (error) throw error;
    return data as { id: string; nama_lengkap: string; email: string }[];
  } });
  async function link() {
    setPending(true);
    try {
      const { error } = await client.rpc('loan_link_staff_customer', { p_customer_id: customerId, p_user_id: staff });
      if (error) throw error;
      toast.success('Akun pengurus ditautkan. Pengguna dapat beralih ke mode nasabah setelah memuat ulang aplikasi.');
      setStaff('');setFormError(''); onLinked?.();
    } catch { setFormError('Tautan tidak dapat disimpan. Pastikan identitas benar dan akun belum ditautkan.');toast.error('Tautan tidak dapat disimpan. Pastikan identitas benar dan akun belum ditautkan.'); }
    finally { setPending(false); }
  }
  return <section className="space-y-2 border-t pt-4"><h3 className="font-semibold">Pengurus yang juga nasabah</h3>
    <p className="text-sm text-muted-foreground">Pastikan kedua pilihan mewakili orang yang sama. Akun tetap memiliki kewenangan pengurus, sedangkan mode nasabah dibatasi pada pinjamannya sendiri.</p>
    <div className="space-y-1"><span className="text-sm">Akun pengurus</span><Select value={staff} onValueChange={setStaff}><SelectTrigger aria-label="Akun pengurus"><SelectValue placeholder="Pilih akun pengurus" /></SelectTrigger><SelectContent>{accounts.data?.map(s => <SelectItem key={s.id} value={s.id}>{s.nama_lengkap} · {s.email}</SelectItem>)}</SelectContent></Select></div>
    {accounts.isError && <p role="alert">Akun pengurus tidak dapat dimuat.</p>}
    {formError && <p role="alert" className="text-destructive">{formError}</p>}
    <Button variant="outline" disabled={!enabled || !staff || pending} onClick={() => void link()}>{pending?'Menyimpan...':'Tautkan akun pengurus'}</Button>
  </section>;
}
