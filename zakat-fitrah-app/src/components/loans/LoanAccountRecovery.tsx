import { useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoanCustomerSelect } from '@/components/loans/LoanCustomerSelect';

const client = supabase as unknown as SupabaseClient;
type Customer = { id: string; person: { nama_kk: string; nama_lengkap: string | null } | null };

export function LoanAccountRecovery({ customers }: { customers: Customer[] }) {
  const [customerId, setCustomerId] = useState('');
  const [action, setAction] = useState<'recover_email' | 'recover_password'>('recover_password');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const password = useRef<HTMLInputElement>(null);
  async function submit() {
    const secret = password.current?.value ?? '';
    if (password.current) password.current.value = '';
    if (!customerId || (action === 'recover_email' && !email.trim()) || (action === 'recover_password' && secret.length < 8)) {
      toast.error('Pilih nasabah dan isi email atau password minimal 8 karakter.'); return;
    }
    setPending(true);
    try {
      const { data, error } = await client.functions.invoke('loan-customer-account', {
        body: action === 'recover_email' ? { action, customerId, email: email.trim() } : { action, customerId, password: secret },
      });
      if (error || !data?.success) throw new Error();
      setEmail(''); toast.success('Akun diperbarui. Nasabah harus masuk kembali.');
    } catch {
      toast.error('Pemulihan belum berhasil. Akses mungkin ditangguhkan; periksa data lalu coba lagi.');
    } finally { setPending(false); }
  }
  return <section className="space-y-2 border-t pt-4">
    <h3 className="font-semibold">Pemulihan akun nasabah</h3>
    <p className="text-sm text-muted-foreground">Pastikan identitas nasabah sebelum mengubah akses. Sesi lama dicabut dan nasabah harus masuk kembali.</p>
    <LoanCustomerSelect customers={customers} value={customerId} onChange={setCustomerId} />
    <label className="block">Tindakan<select className="h-10 w-full rounded border bg-background px-3" value={action} onChange={event => setAction(event.target.value as typeof action)}><option value="recover_password">Atur ulang password</option><option value="recover_email">Ubah email</option></select></label>
    {action === 'recover_email' ? <label className="block">Email baru<Input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label> : <label className="block">Password baru<Input ref={password} type="password" autoComplete="new-password" minLength={8} /></label>}
    <Button variant="outline" disabled={pending} onClick={() => void submit()}>Simpan perubahan akses</Button>
  </section>;
}
