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
import { Download, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDistribusiList } from '@/hooks/useDistribusi';
import { useKategoriMustahik } from '@/hooks/useMustahik';
import { exportDistribusiPDF, exportDistribusiExcel } from '@/utils/export';

interface LaporanDistribusiProps {
  tahunZakatId: string;
}

export function LaporanDistribusi({ tahunZakatId }: LaporanDistribusiProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [kategoriFilter, setKategoriFilter] = useState<string>('semua');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: distribusiData, isLoading } = useDistribusiList({
    tahun_zakat_id: tahunZakatId,
    page: currentPage,
    limit: 20,
  });

  const { data: kategoriData } = useKategoriMustahik();
  const kategoriList = kategoriData || [];

  const distribusiList = distribusiData?.data || [];
  const totalCount = distribusiData?.totalCount || 0;

  // Filter by kategori (client-side for now)
  const filteredList = kategoriFilter === 'semua'
    ? distribusiList
    : distribusiList.filter((d: any) => d.mustahik?.kategori_id === kategoriFilter);

  // Calculate summary per kategori
  const summaryByKategori = kategoriList.map((kategori: any) => {
    const distribusiKategori = filteredList.filter(
      (d: any) => d.mustahik?.kategori_id === kategori.id
    );

    const totalBeras = distribusiKategori
      .filter((d: any) => d.jenis_distribusi === 'beras')
      .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0);

    const totalUang = distribusiKategori
      .filter((d: any) => d.jenis_distribusi === 'uang')
      .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0);

    const count = distribusiKategori.length;

    return {
      kategori: kategori.nama,
      totalBeras,
      totalUang,
      count,
    };
  });

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
    exportDistribusiPDF(filteredList, summaryByKategori);
  };

  const handleExportExcel = () => {
    exportDistribusiExcel(filteredList, summaryByKategori);
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      {/* Summary Per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Per Kategori Mustahik</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori (Asnaf)</TableHead>
                <TableHead className="text-right">Penerima</TableHead>
                <TableHead className="text-right">Beras (kg)</TableHead>
                <TableHead className="text-right">Uang (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryByKategori.map((summary, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{summary.kategori}</TableCell>
                  <TableCell className="text-right">{summary.count}</TableCell>
                  <TableCell className="text-right">{formatNumber(summary.totalBeras)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.totalUang)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {summaryByKategori.reduce((sum, s) => sum + s.count, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(summaryByKategori.reduce((sum, s) => sum + s.totalBeras, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summaryByKategori.reduce((sum, s) => sum + s.totalUang, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

            {/* Kategori Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Kategori</label>
              <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  {kategoriList.map((kategori: any) => (
                    <SelectItem key={kategori.id} value={kategori.id}>
                      {kategori.nama}
                    </SelectItem>
                  ))}
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

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Distribusi Per Mustahik</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Mustahik</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data distribusi
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((distribusi: any) => (
                  <TableRow key={distribusi.id}>
                    <TableCell>
                      {format(new Date(distribusi.tanggal_distribusi), 'dd MMM yyyy', {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{distribusi.mustahik?.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {distribusi.mustahik?.kategori_mustahik?.nama}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={distribusi.jenis_distribusi === 'beras' ? 'default' : 'secondary'}>
                        {distribusi.jenis_distribusi === 'beras' ? 'Beras' : 'Uang'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {distribusi.jenis_distribusi === 'beras'
                        ? `${formatNumber(distribusi.jumlah)} kg`
                        : formatCurrency(distribusi.jumlah)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          distribusi.status === 'selesai'
                            ? 'bg-green-600'
                            : 'bg-yellow-600 text-white'
                        }
                      >
                        {distribusi.status === 'selesai' ? 'Selesai' : 'Pending'}
                      </Badge>
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
