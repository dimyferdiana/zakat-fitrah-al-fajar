import { useId, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Customer = { id: string; person: { nama_kk: string; nama_lengkap: string | null; alamat?: string } | null };

export function LoanCustomerSelect({ customers, value, onChange, label = 'Nasabah' }: {
  customers: Customer[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [search, setSearch] = useState('');
  const selectId = useId();
  const matches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('id-ID');
    return customers.filter(customer => `${customer.person?.nama_lengkap || customer.person?.nama_kk || ''} ${customer.person?.alamat || ''} ${customer.id}`.toLocaleLowerCase('id-ID').includes(term));
  }, [customers, search]);
  const selected = customers.find(customer => customer.id === value);
  const visible = matches.slice(0, 20);
  if (selected && !visible.some(customer => customer.id === selected.id)) visible.unshift(selected);
  return <div className="space-y-1 text-sm">
    <label className="block">Cari {label.toLocaleLowerCase('id-ID')}<Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari nama, alamat, atau ID" /></label>
    {matches.length > 20 && <p className="text-muted-foreground">Menampilkan 20 dari {matches.length} hasil yang dimuat dan pilihan yang sudah dipilih. Ketik untuk mencari.</p>}
    <label className="block" htmlFor={selectId}>{label}</label><Select value={value || 'none'} onValueChange={next => onChange(next === 'none' ? '' : next)}><SelectTrigger id={selectId}><SelectValue placeholder="Pilih nasabah" /></SelectTrigger><SelectContent>
      <SelectItem value="none">Pilih nasabah</SelectItem>
      {visible.map(customer => <SelectItem key={customer.id} value={customer.id}>{customer.person?.nama_lengkap || customer.person?.nama_kk || customer.id}{customer.person?.alamat ? ` — ${customer.person.alamat}` : ''} ({customer.id})</SelectItem>)}
    </SelectContent></Select>
  </div>;
}
