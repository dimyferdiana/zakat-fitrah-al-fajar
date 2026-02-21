import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useHakAmilMonthlySummary } from '@/hooks/useHakAmil';
import type { HakAmilKategori } from '@/types/database.types';

interface HakAmilCardProps {
  tahunZakatId?: string;
}

/**
 * HakAmilCard displays a summary of hak amil for the current month
 * on the dashboard, broken down by category.
 */
export function HakAmilCard({ tahunZakatId }: HakAmilCardProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: summary, isLoading } = useHakAmilMonthlySummary(
    tahunZakatId,
    currentMonth,
    currentYear
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getCategoryLabel = (kategori: HakAmilKategori): string => {
    const labels: Record<HakAmilKategori, string> = {
      zakat_fitrah: 'Zakat Fitrah',
      zakat_maal: 'Zakat Maal',
      infak: 'Infak/Sedekah',
      fidyah: 'Fidyah',
      beras: 'Beras',
    };
    return labels[kategori];
  };

  const getCategoryBadgeVariant = (kategori: HakAmilKategori) => {
    if (kategori === 'fidyah' || kategori === 'beras') {
      return 'secondary';
    }
    return 'default';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hak Amil Bulan Ini</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.grand_total_hak_amil === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hak Amil Bulan Ini</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada data hak amil untuk bulan ini
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Data akan muncul setelah ada transaksi pemasukan
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Hak Amil Bulan Ini</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
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
                        <Badge variant={getCategoryBadgeVariant(category.kategori)}>
                          {getCategoryLabel(category.kategori)}
                        </Badge>
                        {category.persen_hak_amil === 0 && (
                          <span className="text-xs text-muted-foreground">
                            (Tidak diambil)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(category.total_bruto)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(category.total_rekonsiliasi)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(category.total_neto)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(category.persen_hak_amil)}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(category.nominal_hak_amil)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
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
        </div>
      </CardContent>
    </Card>
  );
}
