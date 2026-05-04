import { useMemo, useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  Calendar as CalendarIcon,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePemasukanUangList } from '@/hooks/usePemasukanUang';
import { usePemasukanBerasList } from '@/hooks/usePemasukanBeras';
import { exportPemasukanPDF, exportPemasukanExcel } from '@/utils/export';

const PAGE_SIZE = 20;

interface LaporanPemasukanProps {
  tahunZakatId: string;
}

const kategoriLabels: Record<string, string> = {
  fidyah_uang: 'Fidyah Uang',
  maal_penghasilan_uang: 'Maal/Penghasilan',
  infak_sedekah_uang: 'Infak/Sedekah',
  zakat_fitrah_uang: 'Zakat Fitrah (Uang)',
  fidyah_beras: 'Fidyah Beras',
  infak_sedekah_beras: 'Infak/Sedekah Beras',
  zakat_fitrah_beras: 'Zakat Fitrah (Beras)',
  maal_beras: 'Zakat Maal (Beras)',
};

export function LaporanPemasukan({ tahunZakatId }: LaporanPemasukanProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [jenisFilter, setJenisFilter] = useState<'semua' | 'beras' | 'uang'>('semua');
  const [currentPage, setCurrentPage] = useState(1);

  const showUang = jenisFilter === 'semua' || jenisFilter === 'uang';
  const showBeras = jenisFilter === 'semua' || jenisFilter === 'beras';

  // Fetch all filtered data (large page size, client-side pagination)
  const { data: uangData, isLoading: isLoadingUang } = usePemasukanUangList({
    tahunZakatId: tahunZakatId || undefined,
    dateFrom,
    dateTo,
    pageSize: 5000,
  });

  const { data: berasData, isLoading: isLoadingBeras } = usePemasukanBerasList({
    tahunZakatId: tahunZakatId || undefined,
    dateFrom,
    dateTo,
    pageSize: 5000,
  });

  const isLoading = isLoadingUang || isLoadingBeras;

  // Summary totals from fetched data
  const totalBerasKg = useMemo(
    () => (berasData?.data || []).reduce((sum, item) => sum + Number(item.jumlah_beras_kg), 0),
    [berasData]
  );
  const totalUangRp = useMemo(
    () => (uangData?.data || []).reduce((sum, item) => sum + Number(item.jumlah_uang_rp), 0),
    [uangData]
  );

  // Combine and sort all rows
  const allRows = useMemo(() => {
    const uangRows = showUang
      ? (uangData?.data || []).map((item) => ({
          id: item.id,
          tanggal: item.tanggal,
          muzakki: item.muzakki?.nama_kk || '-',
          kategori: kategoriLabels[item.kategori] || item.kategori,
          jenis: 'Uang' as const,
          nominalDisplay: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(Number(item.jumlah_uang_rp)),
          tag: item.tag,
          catatan: item.catatan,
        }))
      : [];

    const berasRows = showBeras
      ? (berasData?.data || []).map((item) => ({
          id: item.id,
          tanggal: item.tanggal,
          muzakki: item.muzakki?.nama_kk || '-',
          kategori: kategoriLabels[item.kategori] || item.kategori,
          jenis: 'Beras' as const,
          nominalDisplay: `${Number(item.jumlah_beras_kg).toFixed(2)} kg`,
          tag: item.tag,
          catatan: item.catatan,
        }))
      : [];

    return [...uangRows, ...berasRows].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );
  }, [uangData, berasData, showUang, showBeras]);

  const totalCount = allRows.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginatedRows = allRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportPDF = () => {
    exportPemasukanPDF(allRows as any, {
      dateFrom,
      dateTo,
      jenisFilter,
      totalBeras: totalBerasKg,
      totalUang: totalUangRp,
      totalMuzakki: new Set(allRows.map((r) => r.muzakki).filter((m) => m !== '-')).size,
    });
  };

  const handleExportExcel = () => {
    exportPemasukanExcel(allRows as any, {
      dateFrom,
      dateTo,
      jenisFilter,
      totalBeras: totalBerasKg,
      totalUang: totalUangRp,
      totalMuzakki: new Set(allRows.map((r) => r.muzakki).filter((m) => m !== '-')).size,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beras</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingBeras ? '...' : `${totalBerasKg.toFixed(2)} kg`}
            </div>
            <p className="text-xs text-muted-foreground">Zakat beras terkumpul</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uang</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingUang
                ? '...'
                : new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(totalUangRp)}
            </div>
            <p className="text-xs text-muted-foreground">Zakat uang terkumpul</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalCount}</div>
            <p className="text-xs text-muted-foreground">Jumlah penerimaan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date From */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP', { locale: localeId }) : 'Semua tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => { setDateFrom(d); setCurrentPage(1); }}
                    locale={localeId}
                    initialFocus
                  />
                  {dateFrom && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateFrom(undefined); setCurrentPage(1); }}>
                        Hapus filter tanggal
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP', { locale: localeId }) : 'Semua tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => { setDateTo(d); setCurrentPage(1); }}
                    locale={localeId}
                    initialFocus
                  />
                  {dateTo && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateTo(undefined); setCurrentPage(1); }}>
                        Hapus filter tanggal
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Jenis Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Jenis Penerimaan</label>
              <Select
                value={jenisFilter}
                onValueChange={(value: 'semua' | 'beras' | 'uang') => {
                  setJenisFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="uang">Uang</SelectItem>
                  <SelectItem value="beras">Beras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detail Penerimaan
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalCount} transaksi)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Muzakki</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {!tahunZakatId
                      ? 'Pilih tahun zakat untuk melihat data'
                      : 'Tidak ada data penerimaan'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.tanggal && !isNaN(new Date(row.tanggal).getTime())
                        ? format(new Date(row.tanggal), 'dd MMM yyyy', { locale: localeId })
                        : '-'}
                    </TableCell>
                    <TableCell>{row.kategori}</TableCell>
                    <TableCell>{row.muzakki}</TableCell>
                    <TableCell>
                      {row.tag?.name ? (
                        <Badge variant="outline" className="text-xs">
                          {row.tag.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.jenis === 'Beras' ? 'default' : 'secondary'}>
                        {row.jenis}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.nominalDisplay}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
