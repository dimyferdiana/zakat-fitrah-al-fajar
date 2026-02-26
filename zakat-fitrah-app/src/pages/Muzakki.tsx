import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { MuzakkiTable } from '@/components/muzakki/MuzakkiTable';
import { MuzakkiForm, type MuzakkiFormValues } from '@/components/muzakki/MuzakkiForm';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  useMuzakkiList,
  useCreateMuzakki,
  useUpdateMuzakki,
  useDeleteMuzakki,
  useMuzakkiTransactionHistory,
  type MuzakkiTransactionItem,
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
  id?: string;
}

export function Muzakki() {
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'nama_kk' | 'alamat' | 'no_telp'>('nama_kk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Muzakki | null>(null);
  const [historyMuzakki, setHistoryMuzakki] = useState<Muzakki | null>(null);
  const [printData, setPrintData] = useState<PembayaranZakat | null>(null);

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
    data: muzakkiData,
    isLoading,
    refetch,
  } = useMuzakkiList({
    search,
    page: currentPage,
    pageSize,
    sortBy,
    sortOrder,
  });

  const {
    data: transactionHistory,
    isLoading: isHistoryLoading,
  } = useMuzakkiTransactionHistory({
    muzakkiId: historyMuzakki?.id || null,
    tahunZakatId: selectedTahun || activeTahun?.id,
  });

  const createMutation = useCreateMuzakki();
  const updateMutation = useUpdateMuzakki();
  const deleteMutation = useDeleteMuzakki();

  const handleOpenForm = (data?: Muzakki) => {
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
    const submitData: MuzakkiFormValues = {
      nama_kk: data.nama_kk,
      alamat: data.alamat,
      no_telp: data.no_telp,
    };

    if (data.id) {
      await updateMutation.mutateAsync({
        ...submitData,
        id: data.id,
      });
    } else {
      await createMutation.mutateAsync(submitData);
    }

    handleCloseForm();
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    refetch();
  };

  const handlePrint = (item: MuzakkiTransactionItem) => {
    if (item.raw_pembayaran) {
      setPrintData(item.raw_pembayaran);
    }
  };

  if (isLoading && !muzakkiData) {
    return <LoadingSpinner text="Memuat data muzakki..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Muzakki"
        description="Kelola data muzakki. Entri transaksi dilakukan di modul Penerimaan."
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
          Tambah Muzakki
        </Button>
      </div>

      {/* Table */}
      {muzakkiData && muzakkiData.data.length === 0 && !search ? (
        <EmptyState
          icon={Users}
          title="Belum ada data muzakki"
          description="Mulai dengan menambahkan data muzakki pertama"
          action={{
            label: 'Tambah Muzakki',
            onClick: () => handleOpenForm(),
          }}
        />
      ) : (
        <MuzakkiTable
          data={muzakkiData?.data || []}
          totalCount={muzakkiData?.count || 0}
          isLoading={isLoading}
          onEdit={handleOpenForm}
          onViewHistory={setHistoryMuzakki}
          onDelete={handleDelete}
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          onSortChange={(column, order) => {
            setSortBy(column as 'nama_kk' | 'alamat' | 'no_telp');
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
        onOpenChange={(open) => {
          if (!open) {
            handleCloseForm();
          }
        }}
        onSubmit={handleSubmit}
        editData={editData}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Transaction History Dialog (Read-only) */}
      <Dialog open={!!historyMuzakki} onOpenChange={(open) => !open && setHistoryMuzakki(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riwayat Transaksi: {historyMuzakki?.nama_kk}</DialogTitle>
            <DialogDescription>
              Riwayat ini bersifat baca-saja. Tambah/edit transaksi dilakukan di modul Penerimaan.
            </DialogDescription>
          </DialogHeader>

          {isHistoryLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat riwayat transaksi...</div>
          ) : transactionHistory && transactionHistory.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-center">Jiwa</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionHistory.map((item: MuzakkiTransactionItem) => (
                    <TableRow key={`${item.source}-${item.id}`}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale })}
                      </TableCell>
                      <TableCell>{item.kategori_label}</TableCell>
                      <TableCell className="text-center">
                        {item.jumlah_jiwa ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.jumlah_beras_kg != null
                          ? `${item.jumlah_beras_kg.toFixed(2)} kg`
                          : item.jumlah_uang_rp != null
                          ? new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(item.jumlah_uang_rp)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.catatan ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.source === 'pembayaran_zakat' && item.raw_pembayaran ? (
                          <Button variant="ghost" size="sm" onClick={() => handlePrint(item)}>
                            Cetak
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada riwayat transaksi untuk muzakki ini pada tahun yang dipilih.
            </div>
          )}
        </DialogContent>
      </Dialog>

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
