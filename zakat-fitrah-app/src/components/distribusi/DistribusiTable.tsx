import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';
import { Printer, CheckCircle2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Distribusi } from '@/hooks/useDistribusi';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface DistribusiTableProps {
  data: Distribusi[];
  totalCount: number;
  isLoading: boolean;
  onPrint: (distribusi: Distribusi) => void;
  onMarkSelesai: (id: string) => void;
  onDelete: (id: string) => void;
  onFilterJenis: (jenis: string) => void;
  onFilterStatus: (status: string) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
}

export function DistribusiTable({
  data,
  totalCount,
  isLoading,
  onPrint,
  onMarkSelesai,
  onDelete,
  onFilterJenis,
  onFilterStatus,
  onPageChange,
  currentPage,
}: DistribusiTableProps) {
  const [jenisFilter, setJenisFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selesaiId, setSelesaiId] = useState<string | null>(null);

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

  const limit = 20;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={jenisFilter}
          onValueChange={(value) => {
            setJenisFilter(value);
            onFilterJenis(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Jenis Distribusi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Jenis</SelectItem>
            <SelectItem value="beras">Beras</SelectItem>
            <SelectItem value="uang">Uang</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            onFilterStatus(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Mustahik</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
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
                  Belum ada data distribusi.
                </TableCell>
              </TableRow>
            ) : (
              data.map((distribusi) => (
                <TableRow key={distribusi.id}>
                  <TableCell className="font-medium">
                    {distribusi.mustahik?.nama || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {distribusi.mustahik?.kategori_mustahik?.nama || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={distribusi.jenis_distribusi === 'beras' ? 'default' : 'secondary'}>
                      {distribusi.jenis_distribusi === 'beras' ? 'Beras' : 'Uang'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {distribusi.jenis_distribusi === 'beras'
                      ? `${formatNumber(distribusi.jumlah)} kg`
                      : formatCurrency(distribusi.jumlah)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(distribusi.tanggal_distribusi), 'dd MMM yyyy', {
                      locale: localeId,
                    })}
                  </TableCell>
                  <TableCell>
                    {distribusi.status === 'selesai' ? (
                      <Badge className="bg-green-600">Selesai</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-600 text-white">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPrint(distribusi)}
                        title="Print Bukti"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {distribusi.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelesaiId(distribusi.id)}
                          title="Tandai Selesai"
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {distribusi.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(distribusi.id)}
                          title="Hapus"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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

      {/* Mark Selesai Confirmation */}
      <AlertDialog open={!!selesaiId} onOpenChange={() => setSelesaiId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Selesai</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin distribusi ini sudah selesai diberikan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selesaiId) {
                  onMarkSelesai(selesaiId);
                  setSelesaiId(null);
                }
              }}
            >
              Ya, Tandai Selesai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Distribusi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus distribusi ini? Tindakan ini tidak dapat dibatalkan.
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
