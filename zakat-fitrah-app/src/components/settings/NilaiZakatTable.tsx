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
import { Edit, CheckCircle2 } from 'lucide-react';

interface TahunZakat {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NilaiZakatTableProps {
  data: TahunZakat[];
  isLoading: boolean;
  onEdit: (tahun: TahunZakat) => void;
  onSetActive: (id: string) => void;
  hasTransactions: (id: string) => boolean;
}

export function NilaiZakatTable({
  data,
  isLoading,
  onEdit,
  onSetActive,
  hasTransactions,
}: NilaiZakatTableProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '0.00';
    return value.toFixed(2);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tahun Hijriah</TableHead>
            <TableHead>Tahun Masehi</TableHead>
            <TableHead className="text-right">Beras (kg)</TableHead>
            <TableHead className="text-right">Uang (Rp)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Memuat data...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Belum ada data tahun zakat.
              </TableCell>
            </TableRow>
          ) : (
            data.map((tahun) => (
              <TableRow key={tahun.id}>
                <TableCell className="font-medium">{tahun.tahun_hijriah}</TableCell>
                <TableCell>{tahun.tahun_masehi}</TableCell>
                <TableCell className="text-right">{formatNumber(tahun.nilai_beras_kg)} kg</TableCell>
                <TableCell className="text-right">{formatCurrency(tahun.nilai_uang_rp)}</TableCell>
                <TableCell>
                  {tahun.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Tidak Aktif</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {!tahun.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetActive(tahun.id)}
                        title="Aktifkan Tahun Ini"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Aktifkan
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(tahun)}
                      disabled={hasTransactions(tahun.id)}
                      title={
                        hasTransactions(tahun.id)
                          ? 'Tidak dapat edit karena ada transaksi'
                          : 'Edit'
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
