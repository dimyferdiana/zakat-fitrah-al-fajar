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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar as CalendarIcon, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePembayaranList } from '@/hooks/useMuzakki';
import { exportPemasukanPDF, exportPemasukanExcel } from '@/utils/export';

interface LaporanPemasukanProps {
  tahunZakatId: string;
}

export function LaporanPemasukan({ tahunZakatId }: LaporanPemasukanProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [jenisFilter, setJenisFilter] = useState<'semua' | 'beras' | 'uang'>('semua');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: muzakkiData, isLoading } = usePembayaranList({
    tahunZakatId: tahunZakatId,
    jenisZakat: jenisFilter === 'semua' ? undefined : jenisFilter,
    page: currentPage,
    pageSize: 20,
  });

  const pembayaranList = muzakkiData?.data || [];
  const totalCount = muzakkiData?.count || 0;

  // Calculate summary
  const totalBeras = pembayaranList
    .filter((p: any) => p.jenis_zakat === 'beras')
    .reduce((sum: number, p: any) => sum + (p.jumlah_beras_kg || 0), 0);

  const totalUang = pembayaranList
    .filter((p: any) => p.jenis_zakat === 'uang')
    .reduce((sum: number, p: any) => sum + (p.jumlah_uang_rp || 0), 0);

  const totalMuzakki = new Set(pembayaranList.map((p: any) => p.muzakki_id)).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '0.00';
    return value.toFixed(2);
  };

  const handleExportPDF = () => {
    exportPemasukanPDF(pembayaranList, {
      dateFrom,
      dateTo,
      jenisFilter,
      totalBeras,
      totalUang,
      totalMuzakki,
    });
  };

  const handleExportExcel = () => {
    exportPemasukanExcel(pembayaranList, {
      dateFrom,
      dateTo,
      jenisFilter,
      totalBeras,
      totalUang,
      totalMuzakki,
    });
  };

  const totalPages = Math.ceil(totalCount / 20);

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
            <div className="text-2xl font-bold">{formatNumber(totalBeras)} kg</div>
            <p className="text-xs text-muted-foreground">Zakat beras terkumpul</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uang</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalUang)}</div>
            <p className="text-xs text-muted-foreground">Zakat uang terkumpul</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Muzakki</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMuzakki}</div>
            <p className="text-xs text-muted-foreground">Kepala keluarga</p>
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
                    {dateFrom ? format(dateFrom, 'PPP', { locale: localeId }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={localeId}
                    initialFocus
                  />
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
                    {dateTo ? format(dateTo, 'PPP', { locale: localeId }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={localeId}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Jenis Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Jenis Zakat</label>
              <Select value={jenisFilter} onValueChange={(value: any) => setJenisFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="beras">Beras</SelectItem>
                  <SelectItem value="uang">Uang</SelectItem>
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
          <CardTitle>Detail Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama KK</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-center">Jiwa</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pembayaranList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data pembayaran
                  </TableCell>
                </TableRow>
              ) : (
                pembayaranList.map((pembayaran: any) => (
                  <TableRow key={pembayaran.id}>
                    <TableCell>
                      {format(new Date(pembayaran.tanggal_bayar), 'dd MMM yyyy', {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{pembayaran.muzakki?.nama_kk}</TableCell>
                    <TableCell>{pembayaran.muzakki?.alamat}</TableCell>
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
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
