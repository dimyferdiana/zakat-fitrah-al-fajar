import { useEffect, useState } from 'react';
import { Plus, Info, Lock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NilaiZakatTable } from '@/components/settings/NilaiZakatTable';
import { NilaiZakatForm } from '@/components/settings/NilaiZakatForm';
import { UserTable } from '@/components/settings/UserTable';
import { UserForm } from '@/components/settings/UserForm';
import { InvitationForm } from '@/components/settings/InvitationForm';
import { InvitationTable } from '@/components/settings/InvitationTable';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { RekonsiliasiForm } from '@/components/settings/RekonsiliasiForm';
import { RekonsiliasiTable } from '@/components/settings/RekonsiliasiTable';
import { HakAmilConfigForm } from '@/components/settings/HakAmilConfigForm';
import { HakAmilConfigTable } from '@/components/settings/HakAmilConfigTable';
import type { HakAmilConfigTableRow } from '@/components/settings/HakAmilConfigTable';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { offlineStore } from '@/lib/offlineStore';
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

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

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
  role: 'admin' | 'petugas';
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

  const [activeTab, setActiveTab] = useState('profile');
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

  // Invitation state
  const [invitationFormOpen, setInvitationFormOpen] = useState(false);

  // Rekonsiliasi state
  const [selectedTahun, setSelectedTahun] = useState<string>('');
  const [hakAmilValue, setHakAmilValue] = useState<string>('');

  // Hak Amil Config state
  const [editHakAmilConfig, setEditHakAmilConfig] = useState<any>(null);

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

  // Hak Amil Config queries
  const { data: hakAmilConfigs = [], isLoading: loadingHakAmilConfigs } = useQuery<HakAmilConfigTableRow[]>({
    queryKey: ['hak-amil-configs'],
    queryFn: async () => {
      if (OFFLINE_MODE) return offlineStore.getHakAmilConfigs();

      const { data, error } = await supabase
        .from('hak_amil_configs')
        .select(`
          id,
          tahun_zakat_id,
          basis_mode,
          persen_zakat_fitrah,
          persen_zakat_maal,
          persen_infak,
          persen_fidyah,
          persen_beras,
          updated_at,
          updated_by,
          tahun_zakat:tahun_zakat_id (
            tahun_hijriah,
            tahun_masehi
          )
        `)
        .order('updated_at', { ascending: false });

      // Graceful handling if table doesn't exist yet (migrations not run)
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('hak_amil_configs table not found - migrations 023/024 may not be applied yet');
          return [];
        }
        throw error;
      }

      // Fetch user names for updated_by
      const userIds = data.map((c: any) => c.updated_by).filter(Boolean);
      const uniqueUserIds = [...new Set(userIds)];
      
      let userMap: Record<string, string> = {};
      if (uniqueUserIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, nama_lengkap')
          .in('id', uniqueUserIds);
        
        if (users) {
          userMap = users.reduce((acc: Record<string, string>, u: any) => {
            acc[u.id] = u.nama_lengkap;
            return acc;
          }, {});
        }
      }

      return data.map((config: any) => ({
        id: config.id,
        tahun_label: `${config.tahun_zakat?.tahun_hijriah} H (${config.tahun_zakat?.tahun_masehi} M)`,
        basis_mode: config.basis_mode,
        zakat_fitrah_pct: config.persen_zakat_fitrah,
        zakat_maal_pct: config.persen_zakat_maal,
        infak_pct: config.persen_infak,
        fidyah_pct: config.persen_fidyah,
        beras_pct: config.persen_beras,
        updated_at: config.updated_at,
        updated_by_name: config.updated_by ? userMap[config.updated_by] : null,
      }));
    },
  });

  // Hak Amil Config mutation
  const saveHakAmilConfigMutation = useMutation({
    mutationFn: async (values: any) => {
      if (OFFLINE_MODE) {
        return offlineStore.upsertHakAmilConfig(values);
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not authenticated');

      const payload = {
        tahun_zakat_id: values.tahun_zakat_id,
        basis_mode: values.basis_mode,
        persen_zakat_fitrah: values.zakat_fitrah_pct,
        persen_zakat_maal: values.zakat_maal_pct,
        persen_infak: values.infak_pct,
        persen_fidyah: values.fidyah_pct,
        persen_beras: values.beras_pct,
        updated_by: authUser.id,
        updated_at: new Date().toISOString(),
      };

      // Check if config already exists for this tahun_zakat_id
      const { data: existingConfig } = await supabase
        .from('hak_amil_configs')
        .select('id')
        .eq('tahun_zakat_id', values.tahun_zakat_id)
        .maybeSingle();

      if (existingConfig) {
        // Update existing config
        const { data, error } = await supabase
          .from('hak_amil_configs')
          // @ts-expect-error - hak_amil_configs table exists but types not yet regenerated
          .update(payload)
          // @ts-expect-error - hak_amil_configs table exists but types not yet regenerated
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new config
        const { data, error } = await supabase
          .from('hak_amil_configs')
          // @ts-expect-error - hak_amil_configs table exists but types not yet regenerated
          .insert({ ...payload, created_by: authUser.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hak-amil-configs'] });
      toast.success('Konfigurasi hak amil berhasil disimpan');
      setEditHakAmilConfig(null);
    },
    onError: (error: any) => {
      // Provide helpful message if table doesn't exist yet
      if (error?.code === 'PGRST116' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        toast.error('Fitur Hak Amil belum tersedia. Hubungi administrator untuk menjalankan migrasi database.');
      } else {
        toast.error(error.message || 'Gagal menyimpan konfigurasi hak amil');
      }
    },
  });

  // Rekonsiliasi & Old Hak Amil hooks (legacy, for backward compatibility with old tab)
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

  // Query: Get current hak amil for selected tahun (legacy - unused)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _currentHakAmil } = useQuery<{ jumlah_uang_rp?: number } | null>({
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

  // Hak Amil Config handlers
  const handleSubmitHakAmilConfig = async (values: any) => {
    await saveHakAmilConfigMutation.mutateAsync(values);
  };

  const handleEditHakAmilConfig = (row: HakAmilConfigTableRow) => {
    // Find the tahun_zakat_id from the row
    const tahunZakat = tahunZakatList.find(
      t => `${t.tahun_hijriah} H (${t.tahun_masehi} M)` === row.tahun_label
    );

    setEditHakAmilConfig({
      tahun_zakat_id: tahunZakat?.id || '',
      basis_mode: row.basis_mode,
      zakat_fitrah_pct: row.zakat_fitrah_pct,
      zakat_maal_pct: row.zakat_maal_pct,
      infak_pct: row.infak_pct,
      fidyah_pct: row.fidyah_pct,
      beras_pct: row.beras_pct,
    });
  };

  const handleResetHakAmilConfigForm = () => {
    setEditHakAmilConfig(null);
  };

  // Rekonsiliasi & Hak Amil handlers (legacy code - keeping for backward compatibility)
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

  // Mark as used to avoid TypeScript warning (legacy handler kept for potential future use)
  void handleSaveHakAmil;

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
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="nilai-zakat">Nilai Zakat</SelectItem>
              {isAdmin && <SelectItem value="users">User Management</SelectItem>}
              {isAdmin && <SelectItem value="invitations">Invitations</SelectItem>}
              {isAdmin && <SelectItem value="rekonsiliasi">Rekonsiliasi</SelectItem>}
              <SelectItem value="hak-amil">Hak Amil</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="nilai-zakat">Nilai Zakat</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
            {isAdmin && <TabsTrigger value="invitations">Invitations</TabsTrigger>}
            {isAdmin && <TabsTrigger value="rekonsiliasi">Rekonsiliasi</TabsTrigger>}
            <TabsTrigger value="hak-amil">Hak Amil</TabsTrigger>
          </TabsList>
        )}

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <ProfileForm />
        </TabsContent>

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

        {/* Invitations Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Invitations</CardTitle>
                    <CardDescription>
                      Send invitation links to new users. Invitations expire after 24 hours.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setInvitationFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invitation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <InvitationTable />
              </CardContent>
            </Card>
            
            <InvitationForm 
              open={invitationFormOpen} 
              onClose={() => setInvitationFormOpen(false)} 
            />
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

        {/* Hak Amil Tab (All users can view, Admin can edit, Petugas read-only) */}
        <TabsContent value="hak-amil" className="space-y-4">
          {/* Read-only badge for petugas (Task 5.6) */}
          {user?.role === 'petugas' && (
            <Alert className="border-blue-200 bg-blue-50">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Mode Baca Saja:</strong> Anda dapat melihat konfigurasi hak amil, tetapi tidak dapat mengeditnya. 
                Hanya admin yang dapat mengubah konfigurasi.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi Hak Amil</CardTitle>
              <CardDescription>
                Atur perhitungan hak amil (bagian pengurus) per kategori penerimaan untuk setiap tahun zakat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Catatan:</strong> Hak amil dihitung otomatis untuk setiap transaksi berdasarkan konfigurasi di bawah.
                  Default sesuai PRD: Zakat Fitrah 12.5%, Zakat Maal 12.5%, Infak 20%, Fidyah 0%, Beras 0%.
                </AlertDescription>
              </Alert>

              {/* Hak Amil Config Form (Task 5.5 - Wave 1 component integration) - Admin only */}
              {isAdmin && (
                <>
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h3 className="text-sm font-semibold mb-4">
                      {editHakAmilConfig ? 'Edit Konfigurasi' : 'Tambah Konfigurasi Baru'}
                    </h3>
                    <HakAmilConfigForm
                      tahunOptions={tahunOptions}
                      onSubmit={handleSubmitHakAmilConfig}
                      isSubmitting={saveHakAmilConfigMutation.isPending}
                      initialValues={editHakAmilConfig || undefined}
                      submitLabel={editHakAmilConfig ? 'Update Konfigurasi' : 'Simpan Konfigurasi'}
                    />
                    {editHakAmilConfig && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetHakAmilConfigForm}
                        className="mt-3"
                      >
                        Reset Form
                      </Button>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Hak Amil Config Table with metadata (Task 5.7 - metadata already in component) */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Konfigurasi Per Tahun</h3>
                <HakAmilConfigTable
                  data={hakAmilConfigs}
                  isLoading={loadingHakAmilConfigs}
                  onEdit={isAdmin ? handleEditHakAmilConfig : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
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
