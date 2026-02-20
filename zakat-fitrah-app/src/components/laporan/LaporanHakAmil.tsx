import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  useHakAmilMonthlySummary,
  useHakAmilYearlySummary,
  useHakAmilConfig,
} from '@/hooks/useHakAmil';
import type { HakAmilKategori } from '@/types/database.types';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface LaporanHakAmilProps {
  tahunZakatId: string;
}

/**
 * LaporanHakAmil displays filterable hak amil reports with export capabilities.
 * Supports monthly and yearly views with optional category filtering.
 */
export function LaporanHakAmil({ tahunZakatId }: LaporanHakAmilProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [categoryFilter, setCategoryFilter] = useState<HakAmilKategori | 'all'>('all');
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Fetch tahun zakat name for export metadata
  const { data: tahunZakat } = useQuery({
    queryKey: ['tahun-zakat', tahunZakatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tahun_zakat')
        .select('nama')
        .eq('id', tahunZakatId)
        .single();
      if (error) throw error;
      return data as { nama: string };
    },
  });

  // Fetch hak amil config for basis mode
  const { data: hakAmilConfig } = useHakAmilConfig(tahunZakatId);

  // Fetch data based on view mode
  const { data: monthlySummary, isLoading: loadingMonthly } = useHakAmilMonthlySummary(
    tahunZakatId,
    viewMode === 'monthly' ? parseInt(selectedMonth) : undefined,
    viewMode === 'monthly' ? parseInt(selectedYear) : undefined
  );

  const { data: yearlySummary, isLoading: loadingYearly } = useHakAmilYearlySummary(
    viewMode === 'yearly' ? tahunZakatId : undefined
  );

  const summary = viewMode === 'monthly' ? monthlySummary : yearlySummary;
  const isLoading = viewMode === 'monthly' ? loadingMonthly : loadingYearly;

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

  // Filter categories based on selected filter
  const filteredCategories =
    categoryFilter === 'all'
      ? summary?.categories || []
      : (summary?.categories || []).filter((cat) => cat.kategori === categoryFilter);

  const handleExportPDF = async () => {
    if (!summary || !tahunZakat || !hakAmilConfig) {
      toast.error('Data belum siap untuk export');
      return;
    }

    setExportingPDF(true);
    try {
      // Import export function (added by Agent C)
      const { exportHakAmilPDF } = await import('@/utils/export');
      
      // Build periode string
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const periode = viewMode === 'monthly' 
        ? `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`
        : `Tahun ${selectedYear}`;
      
      // Build basis mode label
      const basisModeLabel = hakAmilConfig.basis_mode === 'net_after_reconciliation'
        ? 'Neto (Setelah Rekonsiliasi)'
        : 'Bruto (Sebelum Rekonsiliasi)';

      await exportHakAmilPDF(summary, {
        periode,
        tahunZakatNama: tahunZakat.nama,
        basisMode: basisModeLabel,
      });

      toast.success('Laporan PDF berhasil diunduh');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Gagal mengunduh laporan PDF. Fitur ini mungkin belum tersedia.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!summary || !tahunZakat || !hakAmilConfig) {
      toast.error('Data belum siap untuk export');
      return;
    }

    setExportingExcel(true);
    try {
      // Import export function (added by Agent C)
      const { exportHakAmilExcel } = await import('@/utils/export');
      
      // Build periode string
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const periode = viewMode === 'monthly' 
        ? `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`
        : `Tahun ${selectedYear}`;
      
      // Build basis mode label
      const basisModeLabel = hakAmilConfig.basis_mode === 'net_after_reconciliation'
        ? 'Neto (Setelah Rekonsiliasi)'
        : 'Bruto (Sebelum Rekonsiliasi)';

      await exportHakAmilExcel(summary, {
        periode,
        tahunZakatNama: tahunZakat.nama,
        basisMode: basisModeLabel,
      });

      toast.success('Laporan Excel berhasil diunduh');
    } catch (error) {
      console.error('Export Excel error:', error);
      toast.error('Gagal mengunduh laporan Excel. Fitur ini mungkin belum tersedia.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Generate months for dropdown
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' }),
  }));

  // Generate recent years for dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'monthly' | 'yearly')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Per Bulan</TabsTrigger>
              <TabsTrigger value="yearly">Per Tahun</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Controls */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Month Picker (only for monthly view) */}
            {viewMode === 'monthly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Bulan</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Year Picker (for monthly view) */}
            {viewMode === 'monthly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Tahun</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Kategori</label>
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as HakAmilKategori | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="zakat_fitrah">Zakat Fitrah</SelectItem>
                  <SelectItem value="zakat_maal">Zakat Maal</SelectItem>
                  <SelectItem value="infak">Infak/Sedekah</SelectItem>
                  <SelectItem value="fidyah">Fidyah</SelectItem>
                  <SelectItem value="beras">Beras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPDF || !summary || isLoading}
            >
              {exportingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportingExcel || !summary || isLoading}
            >
              {exportingExcel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!isLoading && summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.grand_total_bruto)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Rekonsiliasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.grand_total_rekonsiliasi)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.grand_total_neto)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Hak Amil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summary.grand_total_hak_amil)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Rincian Hak Amil{' '}
            {viewMode === 'monthly'
              ? `- ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
              : '- Per Tahun'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          ) : !summary || filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada data hak amil untuk periode ini
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Data akan muncul setelah ada transaksi pemasukan
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Rekonsiliasi</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead className="text-right">% Hak Amil</TableHead>
                    <TableHead className="text-right">Nominal Hak Amil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
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
                  {/* Totals Row (only show if filtering all categories) */}
                  {categoryFilter === 'all' && (
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
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
