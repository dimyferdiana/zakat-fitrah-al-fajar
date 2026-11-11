import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LoanCustomerSelect } from '@/components/loans/LoanCustomerSelect';

const client = supabase as unknown as SupabaseClient;
export function LoanStaffAccountLink({ customers, enabled }: { customers: { id: string; person: { nama_kk: string; nama_lengkap: string | null } | null }[]; enabled: boolean }) {
  const [customer, setCustomer] = useState('');
  const [staff, setStaff] = useState('');
  const [pending, setPending] = useState(false);
  const accounts = useQuery({ queryKey: ['loan-staff-accounts'], queryFn: async () => {
    const { data, error } = await client.rpc('loan_list_staff_accounts'); if (error) throw error;
    return data as { id: string; nama_lengkap: string; email: string }[];
  } });
  async function link() {
    setPending(true);
    try {
      const { error } = await client.rpc('loan_link_staff_customer', { p_customer_id: customer, p_user_id: staff });
      if (error) throw error;
      toast.success('Akun pengurus ditautkan. Pengguna dapat beralih ke mode nasabah setelah memuat ulang aplikasi.');
      setCustomer(''); setStaff('');
    } catch { toast.error('Tautan tidak dapat disimpan. Pastikan identitas benar dan akun belum ditautkan.'); }
    finally { setPending(false); }
  }
  return <section className="space-y-2 border-t pt-4"><h3 className="font-semibold">Pengurus yang juga nasabah</h3>
    <p className="text-sm text-muted-foreground">Pastikan kedua pilihan mewakili orang yang sama. Akun tetap memiliki kewenangan pengurus, sedangkan mode nasabah dibatasi pada pinjamannya sendiri.</p>
    <LoanCustomerSelect label="Identitas nasabah" customers={customers} value={customer} onChange={setCustomer} />
    <label className="block">Akun pengurus<select className="h-10 w-full rounded border bg-background px-3" value={staff} onChange={e => setStaff(e.target.value)}><option value="">Pilih akun pengurus</option>{accounts.data?.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} · {s.email}</option>)}</select></label>
    {accounts.isError && <p role="alert">Akun pengurus tidak dapat dimuat.</p>}
    <Button variant="outline" disabled={!enabled || !staff || !customer || pending} onClick={() => void link()}>Tautkan akun pengurus</Button>
  </section>;
}
