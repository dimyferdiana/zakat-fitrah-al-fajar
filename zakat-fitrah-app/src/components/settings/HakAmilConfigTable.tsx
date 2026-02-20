import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export type HakAmilBasisMode = 'net_after_reconciliation' | 'gross_before_reconciliation';

export interface HakAmilConfigTableRow {
  id: string;
  tahun_label: string;
  basis_mode: HakAmilBasisMode;
  zakat_fitrah_pct: number;
  zakat_maal_pct: number;
  infak_pct: number;
  fidyah_pct: number;
  beras_pct: number;
  updated_at?: string | null;
  updated_by_name?: string | null;
}

interface HakAmilConfigTableProps {
  data: HakAmilConfigTableRow[];
  isLoading?: boolean;
  onEdit?: (row: HakAmilConfigTableRow) => void;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function basisModeLabel(mode: HakAmilBasisMode) {
  if (mode === 'gross_before_reconciliation') {
    return 'Bruto';
  }
  return 'Neto';
}

export function HakAmilConfigTable({ data, isLoading = false, onEdit }: HakAmilConfigTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tahun Zakat</TableHead>
            <TableHead>Basis</TableHead>
            <TableHead className="text-right">ZF</TableHead>
            <TableHead className="text-right">ZM</TableHead>
            <TableHead className="text-right">Infak</TableHead>
            <TableHead className="text-right">Fidyah</TableHead>
            <TableHead className="text-right">Beras</TableHead>
            <TableHead>Update Terakhir</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                Memuat konfigurasi hak amil...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                Belum ada konfigurasi hak amil per tahun.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.tahun_label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{basisModeLabel(row.basis_mode)}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatPercent(row.zakat_fitrah_pct)}</TableCell>
                <TableCell className="text-right">{formatPercent(row.zakat_maal_pct)}</TableCell>
                <TableCell className="text-right">{formatPercent(row.infak_pct)}</TableCell>
                <TableCell className="text-right">
                  {row.fidyah_pct === 0 ? '0% (Tidak diambil)' : formatPercent(row.fidyah_pct)}
                </TableCell>
                <TableCell className="text-right">
                  {row.beras_pct === 0 ? '0% (Tidak diambil)' : formatPercent(row.beras_pct)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.updated_at
                    ? `${new Date(row.updated_at).toLocaleDateString('id-ID')} • ${row.updated_by_name || '-'}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(row)}
                      disabled={!onEdit}
                      title="Edit konfigurasi"
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
