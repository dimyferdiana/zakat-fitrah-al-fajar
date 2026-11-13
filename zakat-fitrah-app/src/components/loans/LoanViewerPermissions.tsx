import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Viewer = { user_id: string; nama_lengkap: string; is_active: boolean; permitted: boolean };
const client = supabase as unknown as SupabaseClient;

export function LoanViewerPermissions() {
  const cache=useQueryClient();
  const viewers=useQuery({queryKey:['loan-viewers'],queryFn:async()=>{const {data,error}=await client.rpc('loan_list_viewers');if(error)throw error;return (data??[]) as Viewer[];}});
  const access=useMutation({mutationFn:async ({id,enabled}:{id:string;enabled:boolean})=>{const {error}=await client.rpc('loan_set_viewer_access',{p_user_id:id,p_enabled:enabled});if(error)throw error;},onSuccess:()=>{void cache.invalidateQueries({queryKey:['loan-viewers']});toast.success('Izin diperbarui');},onError:()=>toast.error('Izin tidak dapat diperbarui.')});
  return <Card><CardHeader><CardTitle>Izin baca viewer</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Izin ini hanya memberi akses membaca ringkasan pinjaman.</p>{viewers.isLoading && <p>Memuat viewer...</p>}{viewers.error && <p role="alert">Daftar viewer tidak tersedia.</p>}{viewers.data?.length===0 && <p>Belum ada pengguna viewer.</p>}{viewers.data?.map(viewer=><div key={viewer.user_id} className="flex items-center justify-between gap-3 border-t pt-3"><span>{viewer.nama_lengkap} {!viewer.is_active && '(nonaktif)'}</span><Button variant="outline" size="sm" disabled={access.isPending || (!viewer.is_active && !viewer.permitted)} onClick={()=>access.mutate({id:viewer.user_id,enabled:!viewer.permitted})}>{viewer.permitted?'Cabut izin':'Berikan izin'}</Button></div>)}</CardContent></Card>;
}
