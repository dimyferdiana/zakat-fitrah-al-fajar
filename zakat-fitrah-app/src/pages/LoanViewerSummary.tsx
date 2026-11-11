import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Summary = { id: string; loan_number: string; purpose: string; principal: number; status: string };
type Viewer = { user_id: string; nama_lengkap: string; is_active: boolean; permitted: boolean };
const client = supabase as unknown as SupabaseClient;

export function LoanViewerSummary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const summary = useQuery({
    queryKey: ['loan-viewer-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await client.rpc('loan_viewer_summary');
      if (error) throw error;
      return (data ?? []) as Summary[];
    },
  });
  const viewers = useQuery({
    queryKey: ['loan-viewers'], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await client.rpc('loan_list_viewers');
      if (error) throw error;
      return (data ?? []) as Viewer[];
    },
  });
  const access = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await client.rpc('loan_set_viewer_access', { p_user_id: id, p_enabled: enabled });
      if (error) throw error;
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['loan-viewers'] }); toast.success('Izin diperbarui'); },
    onError: () => toast.error('Izin tidak dapat diperbarui.'),
  });
  return <div className="space-y-5">
    <h1 className="text-2xl font-semibold">Ringkasan Pinjaman</h1>
    <Card><CardHeader><CardTitle>Daftar pinjaman</CardTitle></CardHeader><CardContent>
      {summary.isLoading && <p>Memuat ringkasan...</p>}
      {summary.isError && <p role="alert">Ringkasan tidak tersedia. Viewer memerlukan izin dari admin.</p>}
      {summary.data?.length === 0 && <p>Belum ada pinjaman.</p>}
      {!!summary.data?.length && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Nomor</th><th>Keperluan</th><th>Pokok</th><th>Status</th></tr></thead><tbody>
        {summary.data.map(row => <tr key={row.id} className="border-t"><td className="py-2">{row.loan_number}</td><td>{row.purpose}</td><td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.principal)}</td><td>{row.status}</td></tr>)}
      </tbody></table></div>}
    </CardContent></Card>
    {isAdmin && <Card><CardHeader><CardTitle>Izin baca viewer</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Izin ini hanya memberi akses membaca ringkasan pinjaman.</p>
      {viewers.isError && <p role="alert">Daftar viewer tidak tersedia.</p>}
      {viewers.data?.length === 0 && <p>Belum ada pengguna viewer.</p>}
      {viewers.data?.map(viewer => <div key={viewer.user_id} className="flex items-center justify-between gap-3 border-t pt-3"><span>{viewer.nama_lengkap} {!viewer.is_active && '(nonaktif)'}</span><Button variant="outline" size="sm" disabled={access.isPending || (!viewer.is_active && !viewer.permitted)} onClick={() => access.mutate({ id: viewer.user_id, enabled: !viewer.permitted })}>{viewer.permitted ? 'Cabut izin' : 'Berikan izin'}</Button></div>)}
    </CardContent></Card>}
  </div>;
}
