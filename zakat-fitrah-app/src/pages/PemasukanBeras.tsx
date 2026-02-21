import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PemasukanBerasForm } from '@/components/pemasukan/PemasukanBerasForm';
import { BuktiPemasukanBeras } from '@/components/pemasukan/BuktiPemasukanBeras';
import {
  useCreatePemasukanBeras,
  useUpdatePemasukanBeras,
  useDeletePemasukanBeras,
  usePemasukanBerasList,
} from '@/hooks/usePemasukanBeras';
import type { PemasukanBeras } from '@/hooks/usePemasukanBeras';
import { useTahunZakatList } from '@/hooks/useDashboard';
import { Plus, Receipt, Edit, Trash2, MoreVertical } from 'lucide-react';

const kategoriLabels: Record<string, string> = {
  fidyah_beras: 'Fidyah Beras',
  infak_sedekah_beras: 'Infak/Sedekah',
  zakat_fitrah_beras: 'Zakat Fitrah (Beras)',
  maal_beras: 'Zakat Maal (Beras)',
};

export function PemasukanBeras() {
  const [kategori, setKategori] = useState<'semua' | 'fidyah_beras' | 'infak_sedekah_beras' | 'zakat_fitrah_beras' | 'maal_beras'>('semua');
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [buktiOpen, setBuktiOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PemasukanBeras | null>(null);
  const [editingItem, setEditingItem] = useState<PemasukanBeras | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PemasukanBeras | null>(null);

  const { data: tahunList, isLoading: tahunLoading } = useTahunZakatList();
  const activeTahun = useMemo(() => tahunList?.find((t) => t.is_active), [tahunList]);
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>(() => activeTahun?.id);

  const {
    data: pemasukan,
    isLoading,
    refetch,
  } = usePemasukanBerasList({
    tahunZakatId: selectedTahun || activeTahun?.id,
    kategori,
    page,
    pageSize: 20,
  });

  const createMutation = useCreatePemasukanBeras();
  const updateMutation = useUpdatePemasukanBeras();
  const deleteMutation = useDeletePemasukanBeras();

  const handleSubmit = async (values: {
    tahun_zakat_id: string;
    kategori: PemasukanBeras['kategori'];
    jumlah_beras_kg: number;
    tanggal: string;
    catatan?: string;
    muzakki_id?: string;
  }) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ ...values, id: editingItem.id });
      setEditingItem(null);
    } else {
      await createMutation.mutateAsync(values);
    }
    setFormOpen(false);
    refetch();
  };

  const handleEdit = (item: PemasukanBeras) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: PemasukanBeras) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete.id);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      refetch();
    }
  };

  const handleShowBukti = (item: PemasukanBeras) => {
    setSelectedItem(item);
    setBuktiOpen(true);
  };

  const tahunOptions = tahunList || [];

  if (tahunLoading && !tahunList) {
    return <LoadingSpinner text="Memuat tahun zakat..." />;
  }

  const tahunDisplay = tahunOptions.find((t) => t.id === (selectedTahun || activeTahun?.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemasukan Beras"
        description="Catat pemasukan beras untuk fidyah, infak/sedekah, dan zakat fitrah"
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <Select
              value={selectedTahun || activeTahun?.id}
              onValueChange={(value) => {
                setSelectedTahun(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {tahunOptions.map((tahun) => (
                  <SelectItem key={tahun.id} value={tahun.id}>
                    {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                    {tahun.is_active && ' - Aktif'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={kategori} onValueChange={(val) => { setKategori(val as typeof kategori); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kategori</SelectItem>
                <SelectItem value="fidyah_beras">Fidyah Beras</SelectItem>
                <SelectItem value="infak_sedekah_beras">Infak/Sedekah</SelectItem>
                <SelectItem value="zakat_fitrah_beras">Zakat Fitrah (Beras)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pemasukan
          </Button>
        </CardHeader>
        <Separator />
        <CardContent>
          {isLoading && <LoadingSpinner text="Memuat pemasukan..." />}

          {!isLoading && pemasukan?.data.length === 0 && (
            <EmptyState
              icon={Plus}
              title="Belum ada pemasukan"
              description="Catat pemasukan beras pertama untuk tahun ini"
              action={{ label: 'Tambah Pemasukan', onClick: () => setFormOpen(true) }}
            />
          )}

          {!isLoading && pemasukan && pemasukan.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Tanggal</th>
                    <th className="py-2 pr-4">Kategori</th>
                    <th className="py-2 pr-4">Jumlah (Kg)</th>
                    <th className="py-2 pr-4">Muzakki</th>
                    <th className="py-2 pr-4">Catatan</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pemasukan.data.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-2 pr-4">{kategoriLabels[item.kategori] || item.kategori}</td>
                      <td className="py-2 pr-4 font-medium">{Number(item.jumlah_beras_kg).toFixed(2)} Kg</td>
                      <td className="py-2 pr-4">{item.muzakki?.nama_kk || '-'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.catatan || '-'}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowBukti(item)}
                          >
                            <Receipt className="mr-1 h-4 w-4" />
                            Bukti
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(item)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PemasukanBerasForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
        tahunOptions={tahunOptions}
        defaultTahunId={editingItem?.tahun_zakat_id || selectedTahun || activeTahun?.id}
        defaultValues={editingItem ? {
          tahun_zakat_id: editingItem.tahun_zakat_id,
          kategori: editingItem.kategori,
          jumlah_beras_kg: editingItem.jumlah_beras_kg,
          tanggal: editingItem.tanggal,
          catatan: editingItem.catatan || undefined,
          muzakki_id: editingItem.muzakki_id || undefined,
        } : undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => handleSubmit(values)}
      />

      {selectedItem && (
        <BuktiPemasukanBeras
          open={buktiOpen}
          onOpenChange={setBuktiOpen}
          data={selectedItem}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pemasukan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pemasukan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {tahunDisplay && (
        <p className="text-xs text-muted-foreground">
          Tahun aktif: {tahunDisplay.tahun_hijriah} ({tahunDisplay.tahun_masehi})
        </p>
      )}
    </div>
  );
}

export default PemasukanBeras;
