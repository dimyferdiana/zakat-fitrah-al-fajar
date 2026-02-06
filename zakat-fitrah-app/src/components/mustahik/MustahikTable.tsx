import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Power, Search, ChevronLeft, ChevronRight, History, Trash2 } from 'lucide-react';
import type { Mustahik, KategoriMustahik } from '@/hooks/useMustahik';

interface MustahikTableProps {
  data: Mustahik[];
  totalCount: number;
  isLoading: boolean;
  kategoriList: KategoriMustahik[];
  onEdit: (mustahik: Mustahik) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onViewHistory: (mustahik: Mustahik) => void;
  onDelete: (id: string) => void;
  onSearch: (search: string) => void;
  onFilterKategori: (kategoriId: string) => void;
  onFilterStatus: (status: string) => void;
  onPageChange: (page: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  currentPage: number;
}

export function MustahikTable({
  data,
  totalCount,
  isLoading,
  kategoriList,
  onEdit,
  onToggleActive,
  onViewHistory,
  onDelete,
  onSearch,
  onFilterKategori,
  onFilterStatus,
  onPageChange,
  selectedIds,
  onSelectionChange,
  currentPage,
}: MustahikTableProps) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(search);
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, onSearch]);

  useEffect(() => {
    onFilterKategori(kategoriFilter === 'semua' ? '' : kategoriFilter);
  }, [kategoriFilter, onFilterKategori]);

  useEffect(() => {
    onFilterStatus(statusFilter);
  }, [statusFilter, onFilterStatus]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map((m) => m.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const limit = 20;
  const totalPages = Math.ceil(totalCount / limit);
  const allSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {kategoriList.map((kat) => (
              <SelectItem key={kat.id} value={kat.id}>
                {kat.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="non-aktif">Non-Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-center">Anggota</TableHead>
              <TableHead>Sudah Terima?</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Belum ada data mustahik.
                </TableCell>
              </TableRow>
            ) : (
              data.map((mustahik) => (
                <TableRow key={mustahik.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(mustahik.id)}
                      onCheckedChange={(checked: boolean) =>
                        handleSelectOne(mustahik.id, checked)
                      }
                      aria-label={`Select ${mustahik.nama}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {mustahik.nama}
                      {mustahik.is_data_lama && (
                        <Badge variant="secondary" className="text-xs">
                          Data Lama
                        </Badge>
                      )}
                      {!mustahik.is_data_lama &&
                        new Date(mustahik.created_at).getTime() >
                          Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                          <Badge className="bg-green-600 text-xs">Penerima Baru</Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{mustahik.alamat}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {mustahik.kategori_mustahik?.nama || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{mustahik.jumlah_anggota}</TableCell>
                  <TableCell>
                    {mustahik.has_received ? (
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        Sudah Terima
                      </Badge>
                    ) : (
                      <Badge variant="outline">Belum</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {mustahik.is_active ? (
                      <Badge className="bg-green-600">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Non-Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewHistory(mustahik)}
                        title="Lihat Riwayat"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(mustahik)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToggleId(mustahik.id)}
                        title={mustahik.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        <Power
                          className={`h-4 w-4 ${
                            mustahik.is_active ? 'text-red-600' : 'text-green-600'
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(mustahik.id)}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages} ({totalCount} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toggle Active Confirmation */}
      <AlertDialog open={!!toggleId} onOpenChange={() => setToggleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Mustahik</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengubah status mustahik ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toggleId) {
                  const mustahik = data.find((m) => m.id === toggleId);
                  if (mustahik) {
                    onToggleActive(toggleId, mustahik.is_active);
                  }
                  setToggleId(null);
                }
              }}
            >
              Ubah Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mustahik</AlertDialogTitle>
            <AlertDialogDescription>
              Data mustahik akan dihapus permanen. Jika sudah ada distribusi terkait,
              penghapusan akan ditolak oleh sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
