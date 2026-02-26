import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, X, History } from 'lucide-react';

interface MuzakkiMaster {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface MuzakkiStats {
  transaksiCount: number;
  tanggalTerakhir: string | null;
}

interface MuzakkiTableProps {
  data: MuzakkiMaster[];
  statsByMuzakkiId?: Record<string, MuzakkiStats>;
  totalCount: number;
  isLoading: boolean;
  onEdit: (muzakki: MuzakkiMaster) => void;
  onViewHistory: (muzakki: MuzakkiMaster) => void;
  onDelete: (id: string) => void;
  searchValue: string;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function MuzakkiTable({
  data,
  statsByMuzakkiId,
  totalCount,
  isLoading,
  onEdit,
  onViewHistory,
  onDelete,
  searchValue,
  onSearchChange,
  onSortChange,
  currentPage,
  pageSize,
  onPageChange,
}: MuzakkiTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('nama_kk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: 'nama_kk' | 'alamat' | 'no_telp') => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    onSortChange(column, newSortOrder);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama KK atau alamat..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              title="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('nama_kk')}
              >
                Nama KK
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('alamat')}
              >
                Alamat
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('no_telp')}
              >
                No. Telepon
              </TableHead>
              <TableHead className="text-center">Riwayat Transaksi</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data muzakki.
                </TableCell>
              </TableRow>
            ) : (
              data.map((muzakki) => {
                const stats = statsByMuzakkiId?.[muzakki.id];

                return (
                  <TableRow key={muzakki.id}>
                    <TableCell className="font-medium">{muzakki.nama_kk}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {muzakki.alamat}
                    </TableCell>
                    <TableCell>{muzakki.no_telp || '-'}</TableCell>
                    <TableCell className="text-center">
                      {stats ? stats.transaksiCount : 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewHistory(muzakki)}
                          title="Lihat Riwayat"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(muzakki)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(muzakki.id)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {data.length} dari {totalCount} data
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Halaman {currentPage} dari {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Muzakki?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data muzakki akan dihapus secara permanen jika
              tidak memiliki riwayat transaksi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
