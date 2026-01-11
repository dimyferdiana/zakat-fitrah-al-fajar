import { useEffect, useState } from 'react';
import { Plus, Info } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NilaiZakatTable } from '@/components/settings/NilaiZakatTable';
import { NilaiZakatForm } from '@/components/settings/NilaiZakatForm';
import { UserTable } from '@/components/settings/UserTable';
import { UserForm } from '@/components/settings/UserForm';
import { RekonsiliasiForm } from '@/components/settings/RekonsiliasiForm';
import { RekonsiliasiTable } from '@/components/settings/RekonsiliasiTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  useTahunZakatList,
  useCreateTahunZakat,
  useUpdateTahunZakat,
  useToggleTahunZakatActive,
} from '@/hooks/useNilaiZakat';
import {
  useUsersList,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
} from '@/hooks/useUsers';
import { useAuth } from '@/lib/auth';

interface TahunZakat {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  nama_lengkap: string;
  role: 'admin' | 'petugas' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type HakAmilRow = {
  id?: string;
  tahun_zakat_id: string;
  jumlah_uang_rp: number;
  updated_by: string;
  updated_at: string;
};

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('nilai-zakat');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Nilai Zakat state
  const [nilaiZakatFormOpen, setNilaiZakatFormOpen] = useState(false);
  const [editNilaiZakat, setEditNilaiZakat] = useState<TahunZakat | null>(null);

  // User Management state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Rekonsiliasi & Hak Amil state
  const [selectedTahun, setSelectedTahun] = useState<string>('');
  const [hakAmilValue, setHakAmilValue] = useState<string>('');

  // Nilai Zakat hooks
  const { data: tahunZakatList = [], isLoading: loadingTahunZakat } = useTahunZakatList();
  const createTahunZakatMutation = useCreateTahunZakat();
  const updateTahunZakatMutation = useUpdateTahunZakat();
  const toggleTahunZakatActiveMutation = useToggleTahunZakatActive();

  // User Management hooks
  const { data: usersList = [], isLoading: loadingUsers } = useUsersList();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const toggleUserActiveMutation = useToggleUserActive();

  // Rekonsiliasi & Hak Amil hooks
  // Query: Get active tahun zakat
  const { data: activeTahun } = useQuery<TahunZakat | null>({
    queryKey: ['active-tahun'],
    queryFn: async () => {
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

  // Nilai Zakat handlers
  const handleOpenNilaiZakatForm = (tahun?: TahunZakat) => {
    setEditNilaiZakat(tahun || null);
    setNilaiZakatFormOpen(true);
  };

  const handleCloseNilaiZakatForm = () => {
    setNilaiZakatFormOpen(false);
    setEditNilaiZakat(null);
  };

  const handleSubmitNilaiZakat = async (data: any) => {
    if (data.id) {
      await updateTahunZakatMutation.mutateAsync(data);
    } else {
      await createTahunZakatMutation.mutateAsync(data);
    }
    handleCloseNilaiZakatForm();
  };

  const handleSetActive = async (id: string) => {
    await toggleTahunZakatActiveMutation.mutateAsync(id);
  };

  const checkHasTransactions = (): boolean => {
    // For now, return false. In production, you'd check this properly
    return false;
  };

  // User Management handlers
  const handleOpenUserForm = (user?: User) => {
    setEditUser(user || null);
    setUserFormOpen(true);
  };

  const handleCloseUserForm = () => {
    setUserFormOpen(false);
    setEditUser(null);
  };

  const handleSubmitUser = async (data: any) => {
    if (data.id) {
      await updateUserMutation.mutateAsync(data);
    } else {
      await createUserMutation.mutateAsync(data);
    }
    handleCloseUserForm();
  };

  const handleToggleUserActive = async (id: string, currentStatus: boolean) => {
    await toggleUserActiveMutation.mutateAsync({
      id,
      is_active: !currentStatus,
    });
  };

  // Rekonsiliasi & Hak Amil handlers
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
    tahunZakatList?.map((t) => ({
      id: t.id,
      label: `${t.tahun_hijriah} H (${t.tahun_masehi} M)${t.is_active ? ' - Aktif' : ''}`,
    })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola nilai zakat dan pengguna sistem"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih menu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nilai-zakat">Nilai Zakat</SelectItem>
              {isAdmin && <SelectItem value="users">User Management</SelectItem>}
              {isAdmin && <SelectItem value="rekonsiliasi">Rekonsiliasi</SelectItem>}
              {isAdmin && <SelectItem value="hak-amil">Hak Amil</SelectItem>}
            </SelectContent>
          </Select>
        ) : (
          <TabsList>
            <TabsTrigger value="nilai-zakat">Nilai Zakat</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
            {isAdmin && <TabsTrigger value="rekonsiliasi">Rekonsiliasi</TabsTrigger>}
            {isAdmin && <TabsTrigger value="hak-amil">Hak Amil</TabsTrigger>}
          </TabsList>
        )}

        {/* Nilai Zakat Tab */}
        <TabsContent value="nilai-zakat" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Konfigurasi Nilai Zakat</CardTitle>
                  <CardDescription>
                    Kelola nilai zakat per jiwa untuk setiap tahun
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenNilaiZakatForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Tahun Zakat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <NilaiZakatTable
                data={tahunZakatList}
                isLoading={loadingTahunZakat}
                onEdit={handleOpenNilaiZakatForm}
                onSetActive={handleSetActive}
                hasTransactions={checkHasTransactions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manajemen User</CardTitle>
                    <CardDescription>
                      Untuk menambah user baru, gunakan Supabase Dashboard: Authentication → Users → Add User
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenUserForm()} disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah User (Coming Soon)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersList.length === 0 && !loadingUsers && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">User management requires service role access.</p>
                    <p className="text-sm">Please use Supabase Dashboard to manage users.</p>
                  </div>
                )}
                {usersList.length > 0 && (
                  <UserTable
                    data={usersList}
                    isLoading={loadingUsers}
                    onEdit={handleOpenUserForm}
                    onToggleActive={handleToggleUserActive}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Rekonsiliasi Tab (Admin Only) */}
        {isAdmin && (
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
        )}

        {/* Hak Amil Tab (Admin Only) */}
        {isAdmin && (
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
        )}
      </Tabs>

      {/* Forms */}
      <NilaiZakatForm
        open={nilaiZakatFormOpen}
        onOpenChange={setNilaiZakatFormOpen}
        onSubmit={handleSubmitNilaiZakat}
        editData={editNilaiZakat}
        isSubmitting={createTahunZakatMutation.isPending || updateTahunZakatMutation.isPending}
      />

      {isAdmin && (
        <UserForm
          open={userFormOpen}
          onOpenChange={setUserFormOpen}
          onSubmit={handleSubmitUser}
          editData={editUser}
          isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
        />
      )}
    </div>
  );
}
