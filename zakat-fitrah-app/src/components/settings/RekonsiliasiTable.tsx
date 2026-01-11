import { format } from 'date-fns';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRekonsiliasiList, useDeleteRekonsiliasi, type Rekonsiliasi } from '@/hooks/useRekonsiliasi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

interface RekonsiliasiTableProps {
  tahunZakatId?: string;
  isAdmin: boolean;
}

export function RekonsiliasiTable({ tahunZakatId, isAdmin }: RekonsiliasiTableProps) {
  const { data: rekonsiliasi, isLoading } = useRekonsiliasiList(tahunZakatId);
  const deleteMutation = useDeleteRekonsiliasi();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Memuat data rekonsiliasi..." />;
  }

  if (!rekonsiliasi || rekonsiliasi.length === 0) {
    return (
      <EmptyState
        title="Belum ada rekonsiliasi"
        description="Data rekonsiliasi akan muncul di sini setelah Anda menambahkan rekonsiliasi."
      />
    );
  }

  const getJumlahDisplay = (item: Rekonsiliasi) => {
    if (item.jenis === 'uang' && item.jumlah_uang_rp !== null) {
      const value = Number(item.jumlah_uang_rp);
      const isPositive = value >= 0;
      return {
        value: formatCurrency(Math.abs(value)),
        icon: isPositive ? TrendingUp : TrendingDown,
        color: isPositive ? 'text-green-600' : 'text-red-600',
        type: isPositive ? 'Tambah' : 'Kurang',
      };
    }
    if (item.jenis === 'beras' && item.jumlah_beras_kg !== null) {
      const value = Number(item.jumlah_beras_kg);
      const isPositive = value >= 0;
      return {
        value: `${formatNumber(Math.abs(value))} kg`,
        icon: isPositive ? TrendingUp : TrendingDown,
        color: isPositive ? 'text-green-600' : 'text-red-600',
        type: isPositive ? 'Tambah' : 'Kurang',
      };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Akun</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead>Dibuat Oleh</TableHead>
            {isAdmin && <TableHead className="text-center">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rekonsiliasi.map((item) => {
            const jumlahDisplay = getJumlahDisplay(item);
            const Icon = jumlahDisplay?.icon;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {format(new Date(item.tanggal), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={item.jenis === 'uang' ? 'default' : 'secondary'}>
                    {item.jenis === 'uang' ? 'Uang' : 'Beras'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.jenis === 'uang' && item.akun ? (
                    <Badge variant="outline">
                      {item.akun === 'kas' ? 'Kas' : 'Bank'}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {jumlahDisplay && Icon && (
                    <div className="flex items-center gap-1">
                      <Icon className={`h-4 w-4 ${jumlahDisplay.color}`} />
                      <span className={jumlahDisplay.color}>
                        {jumlahDisplay.type}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {jumlahDisplay && (
                    <span className={jumlahDisplay.color}>
                      {jumlahDisplay.value}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {item.catatan}
                </TableCell>
                <TableCell>{item.users?.nama_lengkap || '-'}</TableCell>
                {isAdmin && (
                  <TableCell className="text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Rekonsiliasi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Data rekonsiliasi akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
