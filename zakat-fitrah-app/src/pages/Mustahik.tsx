import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { MustahikTable } from '@/components/mustahik/MustahikTable';
import { MustahikForm } from '@/components/mustahik/MustahikForm';
import { ImportTahunLalu } from '@/components/mustahik/ImportTahunLalu';
import { RiwayatMustahik } from '@/components/mustahik/RiwayatMustahik';
import {
  useMustahikList,
  useKategoriMustahik,
  useCreateMustahik,
  useUpdateMustahik,
  useToggleMustahikActive,
  useBulkToggleMustahik,
  usePreviousYearMustahik,
  useImportMustahik,
  useMustahikHistory,
  type Mustahik,
} from '@/hooks/useMustahik';

export default function MustahikPage() {
  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'aktif' | 'non-aktif' | 'semua'>('semua');
  const [currentPage, setCurrentPage] = useState(1);

  // State for form
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Mustahik | null>(null);

  // State for import
  const [importOpen, setImportOpen] = useState(false);

  // State for history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedMustahik, setSelectedMustahik] = useState<Mustahik | null>(null);

  // State for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | null>(null);

  // Queries
  const { data: mustahikData, isLoading: loadingMustahik } = useMustahikList({
    search,
    kategori_id: kategoriFilter,
    status: statusFilter,
    page: currentPage,
    limit: 20,
  });

  const { data: kategoriList = [] } = useKategoriMustahik();
  const { data: previousYearData = [], isLoading: loadingPreviousYear } = usePreviousYearMustahik(
    new Date().getFullYear()
  );
  const { data: historyData = [], isLoading: loadingHistory } = useMustahikHistory(
    selectedMustahik?.id || null
  );

  // Mutations
  const createMutation = useCreateMustahik();
  const updateMutation = useUpdateMustahik();
  const toggleActiveMutation = useToggleMustahikActive();
  const bulkToggleMutation = useBulkToggleMustahik();
  const importMutation = useImportMustahik();

  // Handlers
  const handleOpenForm = (mustahik?: Mustahik) => {
    setEditData(mustahik || null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditData(null);
  };

  const handleSubmit = async (data: any) => {
    if (data.id) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
    handleCloseForm();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await toggleActiveMutation.mutateAsync({ id, is_active: !currentStatus });
  };

  const handleViewHistory = (mustahik: Mustahik) => {
    setSelectedMustahik(mustahik);
    setHistoryOpen(true);
  };

  const handleImport = async (selectedIds: string[]) => {
    await importMutation.mutateAsync(selectedIds);
  };

  const handleBulkAction = async () => {
    if (bulkAction && selectedIds.length > 0) {
      await bulkToggleMutation.mutateAsync({
        ids: selectedIds,
        is_active: bulkAction === 'activate',
      });
      setSelectedIds([]);
      setBulkAction(null);
    }
  };

  const mustahikList = mustahikData?.data || [];
  const totalCount = mustahikData?.totalCount || 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Mustahik"
        description="Kelola data penerima zakat (8 asnaf)"
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Mustahik
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Import Tahun Lalu
        </Button>
        {selectedIds.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => setBulkAction('activate')}
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aktifkan ({selectedIds.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setBulkAction('deactivate')}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Nonaktifkan ({selectedIds.length})
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <MustahikTable
            data={mustahikList}
            totalCount={totalCount}
            isLoading={loadingMustahik}
            kategoriList={kategoriList}
            onEdit={handleOpenForm}
            onToggleActive={handleToggleActive}
            onViewHistory={handleViewHistory}
            onSearch={setSearch}
            onFilterKategori={setKategoriFilter}
            onFilterStatus={(status) => setStatusFilter(status as 'aktif' | 'non-aktif' | 'semua')}
            onPageChange={setCurrentPage}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            currentPage={currentPage}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <MustahikForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editData={editData}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        kategoriList={kategoriList}
      />

      {/* Import Dialog */}
      <ImportTahunLalu
        open={importOpen}
        onOpenChange={setImportOpen}
        previousYearData={previousYearData}
        isLoading={loadingPreviousYear}
        onImport={handleImport}
        isImporting={importMutation.isPending}
      />

      {/* History Dialog */}
      <RiwayatMustahik
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        mustahik={selectedMustahik}
        history={historyData}
        isLoading={loadingHistory}
      />

      {/* Bulk Action Confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'activate' ? 'Aktifkan' : 'Nonaktifkan'} Mustahik
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin {bulkAction === 'activate' ? 'mengaktifkan' : 'menonaktifkan'}{' '}
              {selectedIds.length} mustahik yang dipilih?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>
              {bulkAction === 'activate' ? 'Aktifkan' : 'Nonaktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
