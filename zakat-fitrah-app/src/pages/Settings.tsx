import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NilaiZakatTable } from '@/components/settings/NilaiZakatTable';
import { NilaiZakatForm } from '@/components/settings/NilaiZakatForm';
import { UserTable } from '@/components/settings/UserTable';
import { UserForm } from '@/components/settings/UserForm';
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

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Nilai Zakat state
  const [nilaiZakatFormOpen, setNilaiZakatFormOpen] = useState(false);
  const [editNilaiZakat, setEditNilaiZakat] = useState<TahunZakat | null>(null);

  // User Management state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

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

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola nilai zakat dan pengguna sistem"
      />

      <Tabs defaultValue="nilai-zakat" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nilai-zakat">Nilai Zakat</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
        </TabsList>

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
                      Kelola akses pengguna sistem
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenUserForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <UserTable
                  data={usersList}
                  isLoading={loadingUsers}
                  onEdit={handleOpenUserForm}
                  onToggleActive={handleToggleUserActive}
                />
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
