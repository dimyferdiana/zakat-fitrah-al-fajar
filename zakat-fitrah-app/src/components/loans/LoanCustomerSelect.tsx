import { useId, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';

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
    <label className="block" htmlFor={selectId}>{label}</label><select id={selectId} className="h-10 w-full rounded border bg-background px-3" value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Pilih nasabah</option>
      {visible.map(customer => <option key={customer.id} value={customer.id}>{customer.person?.nama_lengkap || customer.person?.nama_kk || customer.id}{customer.person?.alamat ? ` — ${customer.person.alamat}` : ''} ({customer.id})</option>)}
    </select>
  </div>;
}
