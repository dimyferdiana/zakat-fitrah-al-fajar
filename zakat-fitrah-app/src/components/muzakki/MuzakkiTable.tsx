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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Search, Edit, Trash2, Printer, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
  created_at: string;
  updated_at: string;
}

interface MuzakkiTableProps {
  data: PembayaranZakat[];
  totalCount: number;
  isLoading: boolean;
  onEdit: (pembayaran: PembayaranZakat) => void;
  onDelete: (id: string) => void;
  onPrint: (pembayaran: PembayaranZakat) => void;
  searchValue: string;
  onSearchChange: (search: string) => void;
  jenisZakatValue: string;
  onJenisZakatChange: (jenis: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function MuzakkiTable({
  data,
  totalCount,
  isLoading,
  onEdit,
  onDelete,
  onPrint,
  searchValue,
  onSearchChange,
  jenisZakatValue,
  onJenisZakatChange,
  onSortChange,
  currentPage,
  pageSize,
  onPageChange,
}: MuzakkiTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('tanggal_bayar');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');



  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    onSortChange(column, newSortOrder);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
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
        <Select value={jenisZakatValue} onValueChange={onJenisZakatChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Jenis Zakat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Jenis</SelectItem>
            <SelectItem value="beras">Beras</SelectItem>
            <SelectItem value="uang">Uang</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('muzakki.nama_kk')}
              >
                Nama KK
              </TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="text-center">Jiwa</TableHead>
              <TableHead>Jenis Zakat</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('tanggal_bayar')}
              >
                Tanggal
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data pembayaran.
                </TableCell>
              </TableRow>
            ) : (
              data.map((pembayaran) => (
                <TableRow key={pembayaran.id}>
                  <TableCell className="font-medium">{pembayaran.muzakki.nama_kk}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {pembayaran.muzakki.alamat}
                  </TableCell>
                  <TableCell className="text-center">{pembayaran.jumlah_jiwa}</TableCell>
                  <TableCell>
                    <Badge variant={pembayaran.jenis_zakat === 'beras' ? 'default' : 'secondary'}>
                      {pembayaran.jenis_zakat === 'beras' ? 'Beras' : 'Uang'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {pembayaran.jenis_zakat === 'beras'
                      ? `${formatNumber(pembayaran.jumlah_beras_kg)} kg`
                      : formatCurrency(pembayaran.jumlah_uang_rp)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(pembayaran.tanggal_bayar), 'dd MMM yyyy', {
                      locale: idLocale,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPrint(pembayaran)}
                        title="Print Bukti"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(pembayaran)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(pembayaran.id)}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogTitle>Hapus Pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data pembayaran zakat akan dihapus secara
              permanen dari database.
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
