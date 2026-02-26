import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { RekonsiliasiForm } from '@/components/settings/RekonsiliasiForm';
import { RekonsiliasiTable } from '@/components/settings/RekonsiliasiTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { offlineStore } from '@/lib/offlineStore';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

type TahunZakat = {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  is_active: boolean;
};

type HakAmilRow = {
  id?: string;
  tahun_zakat_id: string;
  jumlah_uang_rp: number;
  updated_by: string;
  updated_at: string;
};

export function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hakAmilValue, setHakAmilValue] = useState<string>('');
  const [selectedTahun, setSelectedTahun] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  // Query: Get tahun zakat list
  const { data: tahunList = [] } = useQuery<TahunZakat[]>({
    queryKey: ['tahun-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tahun_zakat')
        .select('*')
        .order('tahun_masehi', { ascending: false });

      if (error) throw error;
      return (data as TahunZakat[]) || [];
    },
  });

  // Query: Get active tahun zakat
  const { data: activeTahun } = useQuery<TahunZakat | null>({
    queryKey: ['active-tahun'],
    queryFn: async () => {
      if (OFFLINE_MODE) return (offlineStore.getActiveTahunZakat() as TahunZakat) ?? null;

      const { data, error } = await supabase
        .from('tahun_zakat')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return (data as TahunZakat) || null;
    },
  });

  // Query: Get current hak amil for selected tahun
  const { data: currentHakAmil } = useQuery<{ jumlah_uang_rp?: number } | null>({
    queryKey: ['hak-amil', selectedTahun || activeTahun?.id],
    queryFn: async () => {
      const tahunId = selectedTahun || activeTahun?.id;
      if (!tahunId) return null;
      if (OFFLINE_MODE) return null;

      const { data, error } = await supabase
        .from('hak_amil')
        .select('*')
        .eq('tahun_zakat_id', tahunId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      return data as { jumlah_uang_rp?: number };
    },
    enabled: !!(selectedTahun || activeTahun?.id),
  });

  // Mutation: Upsert hak amil
  const updateHakAmilMutation = useMutation({
    mutationFn: async ({ tahunId, jumlah }: { tahunId: string; jumlah: number }) => {
      if (OFFLINE_MODE) return { tahun_zakat_id: tahunId, jumlah_uang_rp: jumlah };

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not authenticated');

      const payload: HakAmilRow = {
        tahun_zakat_id: tahunId,
        jumlah_uang_rp: jumlah,
        updated_by: authUser.id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('hak_amil')
        .upsert(payload as any, {
          onConflict: 'tahun_zakat_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hak-amil'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Hak amil berhasil diperbarui');
      setHakAmilValue('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui hak amil');
    },
  });

  const handleSaveHakAmil = () => {
    const tahunId = selectedTahun || activeTahun?.id;
    if (!tahunId) {
      toast.error('Pilih tahun zakat terlebih dahulu');
      return;
    }

    const jumlah = parseFloat(hakAmilValue);
    if (isNaN(jumlah) || jumlah < 0) {
      toast.error('Jumlah harus berupa angka positif');
      return;
    }

    updateHakAmilMutation.mutate({ tahunId, jumlah });
  };

  const tahunOptions =
    tahunList?.map((t) => ({
      id: t.id,
      label: `${t.tahun_hijriah} H (${t.tahun_masehi} M)${t.is_active ? ' - Aktif' : ''}`,
    })) || [];

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pengaturan" description="Kelola pengaturan aplikasi" />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda tidak memiliki akses ke halaman pengaturan. Hubungi administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola rekonsiliasi dan hak amil (Admin Only)"
      />

      <Tabs defaultValue="rekonsiliasi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rekonsiliasi">Rekonsiliasi</TabsTrigger>
          <TabsTrigger value="hak-amil">Hak Amil</TabsTrigger>
        </TabsList>

        <TabsContent value="rekonsiliasi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rekonsiliasi Manual</CardTitle>
              <CardDescription>
                Tambahkan adjustment manual untuk mengoreksi selisih antara sistem dan penghitungan fisik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Catatan:</strong> Rekonsiliasi akan langsung mempengaruhi saldo dashboard.
                  Gunakan nilai positif (+) untuk menambah stok, nilai negatif (-) untuk mengurangi stok.
                </AlertDescription>
              </Alert>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Filter Tahun</Label>
                  <Select value={selectedTahun} onValueChange={setSelectedTahun}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {tahunOptions.map((tahun) => (
                        <SelectItem key={tahun.id} value={tahun.id}>
                          {tahun.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <RekonsiliasiForm
                  tahunZakatId={activeTahun?.id || ''}
                  tahunOptions={tahunOptions}
                />
              </div>

              <Separator />

              <RekonsiliasiTable
                tahunZakatId={selectedTahun === 'all' ? undefined : selectedTahun || activeTahun?.id}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hak-amil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hak Amil</CardTitle>
              <CardDescription>
                Atur hak amil (bagian pengurus) dari total pemasukan uang per tahun
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Catatan:</strong> Hak amil akan otomatis dikurangkan dari saldo uang di dashboard.
                  Menurut syariat, hak amil maksimal 12.5% (1/8) dari total zakat.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Tahun Zakat</Label>
                  <Select
                    value={selectedTahun || activeTahun?.id || ''}
                    onValueChange={(value) => {
                      setSelectedTahun(value);
                      setHakAmilValue('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun zakat" />
                    </SelectTrigger>
                    <SelectContent>
                      {tahunOptions.map((tahun) => (
                        <SelectItem key={tahun.id} value={tahun.id}>
                          {tahun.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentHakAmil && (
                  <Alert>
                    <AlertDescription>
                      <strong>Hak Amil Saat Ini:</strong>{' '}
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(Number(currentHakAmil.jumlah_uang_rp))}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="hak-amil-input">Jumlah Hak Amil (Rp)</Label>
                  <Input
                    id="hak-amil-input"
                    type="number"
                    step="1000"
                    placeholder="0"
                    value={hakAmilValue}
                    onChange={(e) => setHakAmilValue(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Masukkan jumlah baru untuk mengganti nilai yang ada
                  </p>
                </div>

                <Button
                  onClick={handleSaveHakAmil}
                  disabled={!hakAmilValue || updateHakAmilMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateHakAmilMutation.isPending ? 'Menyimpan...' : 'Simpan Hak Amil'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
