import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { MuzakkiTable } from '@/components/muzakki/MuzakkiTable';
import { MuzakkiForm } from '@/components/muzakki/MuzakkiForm';
import { BuktiPembayaran } from '@/components/muzakki/BuktiPembayaran';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Users } from 'lucide-react';
import {
  usePembayaranList,
  useCreatePembayaran,
  useUpdatePembayaran,
  useDeletePembayaran,
} from '@/hooks/useMuzakki';
import { useTahunZakatList } from '@/hooks/useDashboard';

interface Muzakki {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface PembayaranZakat {
  id: string;
  muzakki_id: string;
  muzakki: Muzakki;
  tahun_zakat_id: string;
  tanggal_bayar: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  total_beras_kg: number | null;
  total_uang_rp: number | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  nama_kk: string;
  alamat: string;
  no_telp?: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  tanggal_bayar: Date;
  tahun_zakat_id: string;
  id?: string;
  muzakki_id?: string;
}

export function Muzakki() {
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [jenisZakat, setJenisZakat] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('tanggal_bayar');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<PembayaranZakat | null>(null);
  const [printData, setPrintData] = useState<PembayaranZakat | null>(null);

  const pageSize = 20;

  const { data: tahunList } = useTahunZakatList();
  const activeTahun = tahunList?.find((t) => t.is_active);

  const {
    data: pembayaranData,
    isLoading,
    refetch,
  } = usePembayaranList({
    search,
    jenisZakat,
    tahunZakatId: selectedTahun || activeTahun?.id,
    page: currentPage,
    pageSize,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreatePembayaran();
  const updateMutation = useUpdatePembayaran();
  const deleteMutation = useDeletePembayaran();

  const handleOpenForm = (data?: PembayaranZakat) => {
    if (data) {
      setEditData(data);
    } else {
      setEditData(null);
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditData(null);
  };

  const handleSubmit = async (data: FormData) => {
    const submitData = {
      nama_kk: data.nama_kk,
      alamat: data.alamat,
      no_telp: data.no_telp,
      jumlah_jiwa: data.jumlah_jiwa,
      jenis_zakat: data.jenis_zakat,
      tanggal_bayar: data.tanggal_bayar.toISOString().split('T')[0],
      tahun_zakat_id: data.tahun_zakat_id,
    };

    if (data.id && data.muzakki_id) {
      // Update
      await updateMutation.mutateAsync({
        ...submitData,
        id: data.id,
        muzakki_id: data.muzakki_id,
      });
    } else {
      // Create
      await createMutation.mutateAsync(submitData);
    }

    handleCloseForm();
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    refetch();
  };

  const handlePrint = (data: PembayaranZakat) => {
    setPrintData(data);
  };

  if (isLoading && !pembayaranData) {
    return <LoadingSpinner text="Memuat data muzakki..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Muzakki & Pembayaran Zakat"
        description="Kelola data muzakki dan pembayaran zakat fitrah"
      />

      {/* Actions and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={selectedTahun || activeTahun?.id}
            onValueChange={(value) => {
              setSelectedTahun(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {tahunList?.map((tahun) => (
                <SelectItem key={tahun.id} value={tahun.id}>
                  {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                  {tahun.is_active && ' - Aktif'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pembayaran
        </Button>
      </div>

      {/* Table */}
      {pembayaranData && pembayaranData.data.length === 0 && !search && !jenisZakat ? (
        <EmptyState
          icon={Users}
          title="Belum ada pembayaran"
          description="Mulai dengan menambahkan pembayaran zakat fitrah pertama"
          action={{
            label: 'Tambah Pembayaran',
            onClick: () => handleOpenForm(),
          }}
        />
      ) : (
        <MuzakkiTable
          data={pembayaranData?.data || []}
          totalCount={pembayaranData?.count || 0}
          isLoading={isLoading}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          onJenisZakatChange={(value) => {
            setJenisZakat(value);
            setCurrentPage(1);
          }}
          onSortChange={(column, order) => {
            setSortBy(column);
            setSortOrder(order);
          }}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Form Dialog */}
      <MuzakkiForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        editData={editData}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Print Dialog */}
      {printData && (
        <BuktiPembayaran
          open={!!printData}
          onOpenChange={() => setPrintData(null)}
          data={printData}
        />
      )}
    </div>
  );
}
