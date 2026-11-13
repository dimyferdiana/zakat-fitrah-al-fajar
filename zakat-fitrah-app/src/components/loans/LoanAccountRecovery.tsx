import { useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const client = supabase as unknown as SupabaseClient;
export function LoanAccountRecovery({ customerId, onUpdated }: { customerId: string; onUpdated?: () => void }) {
  const [action, setAction] = useState<'recover_email' | 'recover_password'>('recover_password');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [formError,setFormError] = useState('');
  const password = useRef<HTMLInputElement>(null);
  const emailField = useRef<HTMLInputElement>(null);
  async function submit() {
    const secret = password.current?.value ?? '';
    if (!customerId || (action === 'recover_email' && (!email.trim() || !emailField.current?.validity.valid)) || (action === 'recover_password' && (secret.length < 8 || secret.length > 72))) {
      setFormError('Isi email yang valid atau password 8–72 karakter.');(action==='recover_email'?emailField:password).current?.focus();return;
    }
    setPending(true);
    try {
      const { data, error } = await client.functions.invoke('loan-customer-account', {
        body: action === 'recover_email' ? { action, customerId, email: email.trim() } : { action, customerId, password: secret },
      });
      if (error || !data?.success) throw new Error();
      setEmail('');if(password.current)password.current.value='';setFormError(''); onUpdated?.(); toast.success('Akun diperbarui. Nasabah harus masuk kembali.');
    } catch {
      onUpdated?.();
      setFormError('Pemulihan belum berhasil. Akses mungkin ditangguhkan; periksa data lalu coba lagi.');
      toast.error('Pemulihan belum berhasil. Akses mungkin ditangguhkan; periksa data lalu coba lagi.');
    } finally { setPending(false); }
  }
  return <section className="space-y-2 border-t pt-4">
    <h3 className="font-semibold">Pemulihan akun nasabah</h3>
    <p className="text-sm text-muted-foreground">Pastikan identitas nasabah sebelum mengubah akses. Sesi lama dicabut dan nasabah harus masuk kembali.</p>
    <div className="space-y-1"><span className="text-sm">Tindakan</span><Select value={action} onValueChange={value => setAction(value as typeof action)}><SelectTrigger aria-label="Tindakan"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recover_password">Atur ulang password</SelectItem><SelectItem value="recover_email">Ubah email</SelectItem></SelectContent></Select></div>
    {action === 'recover_email' ? <label className="block">Email baru<Input ref={emailField} type="email" value={email} aria-describedby={formError?'loan-recovery-error':undefined} onChange={event => setEmail(event.target.value)} /></label> : <label className="block">Password baru<Input ref={password} type="password" autoComplete="new-password" minLength={8} maxLength={72} aria-describedby={formError?'loan-recovery-error':undefined} /></label>}
    {formError && <p id="loan-recovery-error" role="alert" className="text-destructive">{formError}</p>}
    <Button variant="outline" disabled={pending} onClick={() => void submit()}>{pending?'Menyimpan...':'Simpan perubahan akses'}</Button>
  </section>;
}
