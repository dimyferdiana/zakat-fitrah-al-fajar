import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Package, DollarSign, AlertCircle } from 'lucide-react';
import { DistribusiTable } from '@/components/distribusi/DistribusiTable';
import { DistribusiForm } from '@/components/distribusi/DistribusiForm';
import { BuktiTerima } from '@/components/distribusi/BuktiTerima';
import {
  useDistribusiList,
  useStokCheck,
  useCreateDistribusi,
  useUpdateDistribusiStatus,
  useDeleteDistribusi,
} from '@/hooks/useDistribusi';
import { useTahunZakatList } from '@/hooks/useDashboard';

export default function Distribusi() {
  const [selectedTahun, setSelectedTahun] = useState<string>('');
  const [jenisFilter, setJenisFilter] = useState<'semua' | 'beras' | 'uang'>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'pending' | 'selesai'>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [selesaiId, setSelesaiId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Queries
  const { data: tahunZakatData, isLoading: loadingTahunZakat } = useTahunZakatList();
  const tahunZakatList = tahunZakatData || [];
  const activeTahun = tahunZakatList.find((t: any) => t.is_active);

  // Set default selected tahun to active year
  if (selectedTahun === '' && activeTahun) {
    setSelectedTahun(activeTahun.id);
  }

  const { data: distribusiData, isLoading: loadingDistribusi } = useDistribusiList({
    tahun_zakat_id: selectedTahun,
    jenis_distribusi: jenisFilter === 'semua' ? undefined : jenisFilter,
    status: statusFilter === 'semua' ? undefined : statusFilter,
    page: currentPage,
    limit: 20,
  });

  const { data: stokData, isLoading: loadingStok } = useStokCheck(selectedTahun);

  // Mutations
  const createMutation = useCreateDistribusi();
  const updateStatusMutation = useUpdateDistribusiStatus();
  const deleteMutation = useDeleteDistribusi();

  // Handlers
  const handleOpenForm = () => {
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
  };

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync({
      mustahik_id: data.mustahik_id,
      tahun_zakat_id: selectedTahun,
      jenis_distribusi: data.jenis_distribusi,
      jumlah: data.jumlah,
      tanggal_distribusi: data.tanggal_distribusi.toISOString(),
    });
    handleCloseForm();
  };

  const handlePrint = (distribusi: any) => {
    setPrintData(distribusi);
  };

  const handleMarkSelesai = async () => {
    if (!selesaiId) return;
    await updateStatusMutation.mutateAsync({ id: selesaiId, status: 'selesai' });
    setSelesaiId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const stok = stokData || {
    total_pemasukan_beras: 0,
    total_pemasukan_uang: 0,
    total_distribusi_beras: 0,
    total_distribusi_uang: 0,
    sisa_beras: 0,
    sisa_uang: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distribusi Zakat</h1>
          <p className="text-muted-foreground">
            Kelola distribusi zakat kepada mustahik
          </p>
        </div>
        <Button onClick={handleOpenForm} disabled={!selectedTahun}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Distribusi
        </Button>
      </div>

      {/* Tahun Zakat Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tahun Zakat</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTahun}
            onValueChange={(value) => {
              setSelectedTahun(value);
              setCurrentPage(1);
            }}
            disabled={loadingTahunZakat}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Pilih tahun zakat" />
            </SelectTrigger>
            <SelectContent>
              {(tahunZakatList as any).map((tahun: any) => (
                <SelectItem key={tahun.id} value={tahun.id}>
                  {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                  {tahun.is_active && ' - Aktif'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stock Summary */}
      {selectedTahun && !loadingStok && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Beras</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pemasukan:</span>
                  <span>{formatNumber(stok.total_pemasukan_beras)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Distribusi:</span>
                  <span>{formatNumber(stok.total_distribusi_beras)} kg</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Sisa Stok:</span>
                  <span
                    className={`text-2xl font-bold ${
                      stok.sisa_beras > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatNumber(stok.sisa_beras)} kg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Uang</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pemasukan:</span>
                  <span>{formatCurrency(stok.total_pemasukan_uang)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Distribusi:</span>
                  <span>{formatCurrency(stok.total_distribusi_uang)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Sisa Stok:</span>
                  <span
                    className={`text-2xl font-bold ${
                      stok.sisa_uang > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(stok.sisa_uang)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning if stock is zero */}
      {selectedTahun && !loadingStok && (stok.sisa_beras === 0 && stok.sisa_uang === 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Stok zakat habis! Tidak dapat melakukan distribusi sampai ada pemasukan baru.
          </AlertDescription>
        </Alert>
      )}

      {/* Distribusi Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Distribusi</CardTitle>
        </CardHeader>
        <CardContent>
          <DistribusiTable
            data={distribusiData?.data || []}
            totalCount={distribusiData?.totalCount || 0}
            isLoading={loadingDistribusi}
            currentPage={currentPage}
            onPrint={handlePrint}
            onMarkSelesai={(id) => setSelesaiId(id)}
            onDelete={(id) => setDeleteId(id)}
            onFilterJenis={(jenis: string) => setJenisFilter(jenis as 'semua' | 'beras' | 'uang')}
            onFilterStatus={(status: string) => setStatusFilter(status as 'semua' | 'pending' | 'selesai')}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <DistribusiForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        tahunZakatId={selectedTahun}
      />

      {/* Print Dialog */}
      <BuktiTerima
        open={!!printData}
        onOpenChange={(open) => !open && setPrintData(null)}
        distribusi={printData}
      />

      {/* Mark Selesai Confirmation */}
      <AlertDialog open={!!selesaiId} onOpenChange={(open) => !open && setSelesaiId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Selesai</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin distribusi ini sudah selesai diberikan kepada mustahik?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkSelesai}>
              Ya, Tandai Selesai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Distribusi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus distribusi ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
