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
import { PemasukanForm } from '@/components/pemasukan/PemasukanForm';
import { BuktiBayarModal } from '@/components/pemasukan/BuktiBayarModal';
import { BuktiPemasukanUang } from '@/components/pemasukan/BuktiPemasukanUang';
import { BulkPemasukanForm } from '@/components/pemasukan/BulkPemasukanForm';
import {
  useCreatePemasukanUang,
  useUpdatePemasukanUang,
  useDeletePemasukanUang,
  usePemasukanUangList,
} from '@/hooks/usePemasukanUang';
import { useAccountsList } from '@/hooks/useAccountsLedger';
import type { PemasukanUang } from '@/hooks/usePemasukanUang';
import { useTahunZakatList } from '@/hooks/useDashboard';
import { Plus, Receipt, Edit, Trash2, MoreVertical, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

const kategoriLabels: Record<string, string> = {
  fidyah_uang: 'Fidyah Uang',
  maal_penghasilan_uang: 'Maal/Penghasilan',
  infak_sedekah_uang: 'Infak/Sedekah',
  zakat_fitrah_uang: 'Zakat Fitrah (Uang)',
};

export function PemasukanUang() {
  const [pageSize, setPageSize] = useState(20);
  const { data: tahunList, isLoading: tahunLoading } = useTahunZakatList();
  const activeTahun = useMemo(() => tahunList?.find((t) => t.is_active), [tahunList]);
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>(() => activeTahun?.id);
  const [kategori, setKategori] = useState<'semua' | 'fidyah_uang' | 'maal_penghasilan_uang' | 'infak_sedekah_uang' | 'zakat_fitrah_uang'>('semua');
  const [accountFilter, setAccountFilter] = useState<'semua' | 'channel:kas' | 'channel:bank' | `account:${string}`>('semua');
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [buktiOpen, setBuktiOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PemasukanUang | null>(null);
  const [editingItem, setEditingItem] = useState<PemasukanUang | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PemasukanUang | null>(null);
  const [bulkMode, setBulkMode] = useState(false);

  const selectedAccountId = accountFilter.startsWith('account:')
    ? accountFilter.replace('account:', '')
    : undefined;
  const selectedAkun = accountFilter === 'channel:kas'
    ? 'kas'
    : accountFilter === 'channel:bank'
      ? 'bank'
      : 'semua';

  const {
    data: pemasukan,
    isLoading,
    refetch,
  } = usePemasukanUangList({
    tahunZakatId: selectedTahun || activeTahun?.id,
    kategori,
    akun: selectedAkun,
    accountId: selectedAccountId,
    page,
    pageSize,
  });

  const createMutation = useCreatePemasukanUang();
  const updateMutation = useUpdatePemasukanUang();
  const deleteMutation = useDeletePemasukanUang();
  const accountsQuery = useAccountsList({ is_active: true });

  const accountOptions = accountsQuery.data || [];
  const accountNameMap = useMemo(
    () => new Map(accountOptions.map((account) => [account.id, account.account_name])),
    [accountOptions]
  );
  const cashAccounts = useMemo(
    () => accountOptions.filter((account) => account.account_channel === 'kas'),
    [accountOptions]
  );
  const bankAccounts = useMemo(
    () => accountOptions.filter((account) => account.account_channel === 'bank'),
    [accountOptions]
  );
  const otherAccounts = useMemo(
    () => accountOptions.filter((account) => account.account_channel !== 'kas' && account.account_channel !== 'bank'),
    [accountOptions]
  );

  const handleSubmit = async (values: {
    tahun_zakat_id: string;
    kategori: PemasukanUang['kategori'];
    akun: PemasukanUang['akun'];
    account_id: string;
    jumlah_uang_rp: number;
    tanggal: string;
    catatan?: string;
    muzakki_id?: string;
    bukti_bayar_url?: string;
    bukti_bayar_file?: File;
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

  const handleEdit = (item: PemasukanUang) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: PemasukanUang) => {
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

  const handleShowBukti = (item: PemasukanUang) => {
    setSelectedItem(item);
    setBuktiOpen(true);
  };

  const handleShowReceipt = (item: PemasukanUang) => {
    setSelectedItem(item);
    setReceiptOpen(true);
  };

  const tahunOptions = tahunList || [];

  if (tahunLoading && !tahunList) {
    return <LoadingSpinner text="Memuat tahun zakat..." />;
  }

  const tahunDisplay = tahunOptions.find((t) => t.id === (selectedTahun || activeTahun?.id));
  const totalCount = pemasukan?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan Uang"
        description="Catat penerimaan uang untuk fidyah, maal/penghasilan, dan infak/sedekah"
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

            <Select value={kategori} onValueChange={(val) => { setKategori(val as 'semua' | 'fidyah_uang' | 'maal_penghasilan_uang' | 'infak_sedekah_uang' | 'zakat_fitrah_uang'); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kategori</SelectItem>
                <SelectItem value="fidyah_uang">Fidyah Uang</SelectItem>
                <SelectItem value="maal_penghasilan_uang">Maal/Penghasilan</SelectItem>
                <SelectItem value="infak_sedekah_uang">Infak/Sedekah</SelectItem>
                <SelectItem value="zakat_fitrah_uang">Zakat Fitrah (Uang)</SelectItem>
              </SelectContent>
            </Select>

            {!bulkMode && (
              <Select
                value={accountFilter}
                onValueChange={(val) => {
                  setAccountFilter(val as 'semua' | 'channel:kas' | 'channel:bank' | `account:${string}`);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Akun</SelectItem>
                  <SelectItem value="channel:kas">Semua Kas</SelectItem>
                  <SelectItem value="channel:bank">Semua Bank</SelectItem>
                  {cashAccounts.map((account) => (
                    <SelectItem key={account.id} value={`account:${account.id}`}>
                      Kas: {account.account_name}
                    </SelectItem>
                  ))}
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={`account:${account.id}`}>
                      Bank: {account.account_name}
                    </SelectItem>
                  ))}
                  {otherAccounts.map((account) => (
                    <SelectItem key={account.id} value={`account:${account.id}`}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={bulkMode ? 'default' : 'outline'}
              onClick={() => setBulkMode((m) => !m)}
            >
              <Layers className="mr-2 h-4 w-4" />
              {bulkMode ? 'Mode Bulk (Aktif)' : 'Mode Bulk'}
            </Button>
            {!bulkMode && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Penerimaan
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          {bulkMode ? (
            <BulkPemasukanForm tahunZakatId={selectedTahun || activeTahun?.id || ''} />
          ) : (
            <>
          {isLoading && <LoadingSpinner text="Memuat penerimaan..." />}

          {!isLoading && pemasukan?.data.length === 0 && (
            <EmptyState
              icon={Plus}
              title="Belum ada penerimaan"
              description="Catat penerimaan uang pertama untuk tahun ini"
              action={{ label: 'Tambah Penerimaan', onClick: () => setFormOpen(true) }}
            />
          )}

          {!isLoading && pemasukan && pemasukan.data.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4">Tanggal</th>
                      <th className="py-2 pr-4">Kategori</th>
                      <th className="py-2 pr-4">Akun</th>
                      <th className="py-2 pr-4">Nominal</th>
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
                        <td className="py-2 pr-4 capitalize">
                          {accountNameMap.get(item.account_id || '') || item.akun}
                        </td>
                        <td className="py-2 pr-4 font-medium">{formatCurrency(Number(item.jumlah_uang_rp))}</td>
                        <td className="py-2 pr-4">{item.muzakki?.nama_kk || '-'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{item.catatan || '-'}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShowBukti(item)}>
                                  <Receipt className="mr-2 h-4 w-4" />
                                  Lihat Bukti Bayar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShowReceipt(item)}>
                                  <Receipt className="mr-2 h-4 w-4" />
                                  Lihat Receipt PDF
                                </DropdownMenuItem>
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

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {pemasukan.data.length} dari {totalCount} data
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Per halaman</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[88px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={!hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Halaman {page} dari {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={!hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      <PemasukanForm
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
          akun: editingItem.akun,
          account_id: editingItem.account_id || undefined,
          jumlah_uang_rp: editingItem.jumlah_uang_rp,
          tanggal: editingItem.tanggal,
          catatan: editingItem.catatan || undefined,
          muzakki_id: editingItem.muzakki_id || undefined,
          bukti_bayar_url: editingItem.bukti_bayar_url || undefined,
        } : undefined}
        accountOptions={accountOptions.map((account) => ({
          id: account.id,
          account_name: account.account_name,
          account_channel: account.account_channel,
        }))}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => handleSubmit(values)}
      />

      {selectedItem && (
        <BuktiBayarModal
          open={buktiOpen}
          onOpenChange={setBuktiOpen}
          attachmentUrl={selectedItem.bukti_bayar_url}
        />
      )}

      {selectedItem && (
        <BuktiPemasukanUang
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          data={{
            ...selectedItem,
            account_name: accountNameMap.get(selectedItem.account_id || '') || null,
          }}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penerimaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus penerimaan ini? Tindakan ini tidak dapat dibatalkan.
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

export default PemasukanUang;
