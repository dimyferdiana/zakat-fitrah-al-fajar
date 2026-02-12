import { useState, useEffect, useCallback } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
  akun_uang?: 'kas' | 'bank' | null;
  jumlah_uang_dibayar_rp?: number | null;
  created_at: string;
  updated_at: string;
  sedekah_uang?: number | null;
  sedekah_beras?: number | null;
}

interface FormData {
  nama_kk: string;
  alamat: string;
  no_telp?: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  tanggal_bayar: Date;
  tahun_zakat_id: string;
  akun_uang?: 'kas' | 'bank';
  jumlah_uang_dibayar_rp?: number;
  jumlah_beras_dibayar_kg?: number;
  kewajiban_uang?: number;
  kewajiban_beras?: number;
  beras_kurang?: boolean;
  has_overpayment?: boolean;
  zakat_amount?: number;
  sedekah_amount?: number;
  id?: string;
  muzakki_id?: string;
}

export function Muzakki() {
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [jenisZakat, setJenisZakat] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('tanggal_bayar');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<PembayaranZakat | null>(null);
  const [printData, setPrintData] = useState<PembayaranZakat | null>(null);
  const [berasKurangDialog, setBerasKurangDialog] = useState<{
    open: boolean;
    payload: FormData | null;
    kekurangan: number;
  }>({ open: false, payload: null, kekurangan: 0 });
  
  const [overpaymentDialog, setOverpaymentDialog] = useState<{
    open: boolean;
    payload: FormData | null;
    zakatAmount: number;
    sedekahAmount: number;
    jenisZakat: 'beras' | 'uang';
  }>({ open: false, payload: null, zakatAmount: 0, sedekahAmount: 0, jenisZakat: 'beras' });

  const pageSize = 20;

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

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
    // Check if beras is insufficient
    if (data.jenis_zakat === 'beras' && data.beras_kurang) {
      const kekurangan = (data.kewajiban_beras ?? 0) - (data.jumlah_beras_dibayar_kg ?? 0);
      setBerasKurangDialog({
        open: true,
        payload: data,
        kekurangan,
      });
      return;
    }

    // Check if overpayment exists
    if (data.has_overpayment && data.zakat_amount && data.sedekah_amount) {
      setOverpaymentDialog({
        open: true,
        payload: data,
        zakatAmount: data.zakat_amount,
        sedekahAmount: data.sedekah_amount,
        jenisZakat: data.jenis_zakat,
      });
      return;
    }

    await handleSubmitInternal(data);
  };

  const handleSubmitInternal = async (data: FormData) => {
    const submitData = {
      nama_kk: data.nama_kk,
      alamat: data.alamat,
      no_telp: data.no_telp,
      jumlah_jiwa: data.jumlah_jiwa,
      jenis_zakat: data.jenis_zakat,
      tanggal_bayar: data.tanggal_bayar.toISOString().split('T')[0],
      tahun_zakat_id: data.tahun_zakat_id,
      akun_uang: data.akun_uang,
      jumlah_uang_dibayar_rp: data.jumlah_uang_dibayar_rp,
      jumlah_beras_dibayar_kg: data.jumlah_beras_dibayar_kg,
      has_overpayment: data.has_overpayment,
      zakat_amount: data.zakat_amount,
      sedekah_amount: data.sedekah_amount,
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

  const confirmOverpayment = async () => {
    if (!overpaymentDialog.payload) return;
    
    await handleSubmitInternal(overpaymentDialog.payload);
    setOverpaymentDialog({ open: false, payload: null, zakatAmount: 0, sedekahAmount: 0, jenisZakat: 'beras' });
  };

  const cancelOverpayment = () => {
    setOverpaymentDialog({ open: false, payload: null, zakatAmount: 0, sedekahAmount: 0, jenisZakat: 'beras' });
  };

  // Overpayment dialog removed - all money amounts accepted as zakat

  const recordAsInfaq = async () => {
    if (!berasKurangDialog.payload) return;
    
    // Record as infaq/sadaqah instead
    // TODO: Implement infaq creation via API
    // For now, show error message that this needs negotiation
    alert(
      `Beras kurang ${berasKurangDialog.kekurangan.toFixed(2)} kg dari kewajiban.\n\n` +
      'Silakan diskusikan dengan muzakki untuk:\n' +
      '1. Melengkapi kekurangan beras, atau\n' +
      '2. Jika tidak mampu, akan dicatat sebagai infaq/sadaqah'
    );
    
    setBerasKurangDialog({ open: false, payload: null, kekurangan: 0 });
  };

  const cancelBerasKurang = () => {
    setBerasKurangDialog({ open: false, payload: null, kekurangan: 0 });
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
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          jenisZakatValue={jenisZakat}
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

      {/* Overpayment Confirmation Dialog */}
      <AlertDialog open={overpaymentDialog.open} onOpenChange={(open) => !open && cancelOverpayment()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembagian Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>Pembayaran melebihi kewajiban zakat. Sistem akan membagi pembayaran sebagai berikut:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Pembayaran Zakat:</span>
                    <span className="font-bold">
                      {overpaymentDialog.jenisZakat === 'beras'
                        ? `${overpaymentDialog.zakatAmount.toFixed(2)} kg`
                        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(overpaymentDialog.zakatAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Sedekah/Infak:</span>
                    <span className="font-bold text-green-700">
                      {overpaymentDialog.jenisZakat === 'beras'
                        ? `${overpaymentDialog.sedekahAmount.toFixed(2)} kg`
                        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(overpaymentDialog.sedekahAmount)}
                    </span>
                  </div>
                  <div className="border-t border-blue-300 pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      {overpaymentDialog.jenisZakat === 'beras'
                        ? `${(overpaymentDialog.zakatAmount + overpaymentDialog.sedekahAmount).toFixed(2)} kg`
                        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(overpaymentDialog.zakatAmount + overpaymentDialog.sedekahAmount)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  * Dua catatan terpisah akan dibuat: pembayaran zakat dan sedekah/infak
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelOverpayment}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverpayment}>Lanjutkan dengan Pembagian Ini</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Beras Insufficiency Dialog */}
      <AlertDialog open={berasKurangDialog.open} onOpenChange={(open) => !open && cancelBerasKurang()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beras Kurang dari Kewajiban</AlertDialogTitle>
            <AlertDialogDescription>
              Beras yang diterima kurang {berasKurangDialog.kekurangan.toFixed(2)} kg dari kewajiban zakat fitrah.
              <br /><br />
              Silakan mintakan kekurangan kepada muzakki. Jika muzakki tidak mampu melengkapi, 
              setelah negosiasi dapat dicatat sebagai infaq/sadaqah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBerasKurang}>Batal & Perbaiki</AlertDialogCancel>
            <AlertDialogAction onClick={recordAsInfaq}>Catat sebagai Infaq</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
