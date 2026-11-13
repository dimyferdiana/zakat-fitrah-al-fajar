import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { loanStatus } from '@/lib/loanDisplay';

type Summary = { id: string; loan_number: string; purpose: string; principal: number; status: string };
const client = supabase as unknown as SupabaseClient;

export function LoanViewerSummary() {
  const { user } = useAuth();
  const summary = useQuery({
    queryKey: ['loan-viewer-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await client.rpc('loan_viewer_summary');
      if (error) throw error;
      return (data ?? []) as Summary[];
    },
  });
  return <div className="space-y-5">
    <h1 className="text-2xl font-semibold">Ringkasan Pinjaman</h1>
    <Card><CardHeader><CardTitle>Daftar pinjaman</CardTitle></CardHeader><CardContent>
      {summary.isLoading && <p>Memuat ringkasan...</p>}
      {summary.isError && <p role="alert">Ringkasan tidak tersedia. Viewer memerlukan izin dari admin.</p>}
      {summary.data?.length === 0 && <p>Belum ada pinjaman.</p>}
      {!!summary.data?.length && <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nomor</TableHead><TableHead>Keperluan</TableHead><TableHead>Pokok</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
        {summary.data.map(row => <TableRow key={row.id}><TableCell>{row.loan_number}</TableCell><TableCell>{row.purpose}</TableCell><TableCell>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.principal)}</TableCell><TableCell>{loanStatus(row.status)}</TableCell></TableRow>)}
      </TableBody></Table></div>}
    </CardContent></Card>
  </div>;
}
