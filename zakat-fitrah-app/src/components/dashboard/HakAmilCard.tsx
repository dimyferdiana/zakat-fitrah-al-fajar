import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CircleDollarSign } from 'lucide-react';
import {
  useHakAmilDateRangeSummary,
  getDateRangeForPeriod,
  type HakAmilPeriod,
} from '@/hooks/useHakAmil';
import type { HakAmilKategori } from '@/types/database.types';

const PERIOD_OPTIONS: { value: HakAmilPeriod; label: string }[] = [
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'this_quarter', label: 'Kuartal Ini' },
  { value: 'this_semester', label: 'Semester Ini' },
  { value: 'this_year', label: 'Tahun Ini' },
];

const CATEGORY_LABELS: Record<HakAmilKategori, string> = {
  zakat_fitrah: 'Zakat Fitrah',
  zakat_maal: 'Zakat Maal',
  infak: 'Infak/Sedekah',
  fidyah: 'Fidyah',
  beras: 'Beras',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatPct = (value: number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value
  );

const formatWeight = (value: number) =>
  `${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value
  )} kg`;

interface HakAmilCardProps {
  tahunZakatId?: string;
}

export function HakAmilCard({ tahunZakatId }: HakAmilCardProps) {
  const [period, setPeriod] = useState<HakAmilPeriod>('this_month');
  const { startDate, endDate, label } = getDateRangeForPeriod(period);

  const { data: summary, isLoading } = useHakAmilDateRangeSummary(
    tahunZakatId,
    startDate,
    endDate
  );

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Hak Amil</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as HakAmilPeriod)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Memuat data...</div>
          </div>
        ) : !summary || summary.grand_total_hak_amil === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada data hak amil untuk periode ini
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Data akan muncul setelah ada transaksi pemasukan
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grand Total */}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-semibold">Total Hak Amil</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(summary.grand_total_hak_amil)}
              </span>
            </div>

            {/* Category Breakdown Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Rekonsiliasi</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Nominal Hak Amil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.categories.map((category) => (
                    <TableRow key={category.kategori}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              category.kategori === 'fidyah' || category.kategori === 'beras'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {CATEGORY_LABELS[category.kategori]}
                          </Badge>
                          {category.persen_hak_amil === 0 && (
                            <span className="text-xs text-muted-foreground">(Tidak diambil)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {category.kategori === 'beras'
                          ? formatWeight(summary.beras_metrics?.total_bruto_kg ?? 0)
                          : formatCurrency(category.total_bruto)}
                      </TableCell>
                      <TableCell className="text-right">
                        {category.kategori === 'beras'
                          ? formatWeight(summary.beras_metrics?.total_rekonsiliasi_kg ?? 0)
                          : formatCurrency(category.total_rekonsiliasi)}
                      </TableCell>
                      <TableCell className="text-right">
                        {category.kategori === 'beras'
                          ? formatWeight(summary.beras_metrics?.total_neto_kg ?? 0)
                          : formatCurrency(category.total_neto)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPct(category.persen_hak_amil)}%
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {category.kategori === 'beras'
                          ? formatWeight(summary.beras_metrics?.nominal_hak_amil_kg ?? 0)
                          : formatCurrency(category.nominal_hak_amil)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summary.grand_total_bruto)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summary.grand_total_rekonsiliasi)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summary.grand_total_neto)}
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summary.grand_total_hak_amil)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Cakupan Transaksi</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Pembayaran Zakat:</span>{' '}
                  <span className="font-semibold">{summary.coverage_debug?.pembayaran_zakat_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pemasukan Uang:</span>{' '}
                  <span className="font-semibold">{summary.coverage_debug?.pemasukan_uang_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pemasukan Beras:</span>{' '}
                  <span className="font-semibold">{summary.coverage_debug?.pemasukan_beras_count ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
