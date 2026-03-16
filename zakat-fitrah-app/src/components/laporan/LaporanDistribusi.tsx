import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useKategoriMustahik } from '@/hooks/useMustahik';
import { supabase } from '@/lib/supabase';
import { offlineStore } from '@/lib/offlineStore';
import { formatDateOnlyLocal } from '@/lib/date';
import { exportDistribusiPDF, exportDistribusiExcel } from '@/utils/export';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

interface LaporanDistribusiProps {
  tahunZakatId: string;
}

export function LaporanDistribusi({ tahunZakatId }: LaporanDistribusiProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [kategoriFilter, setKategoriFilter] = useState<string>('semua');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20;

  const { data: distribusiAllData, isLoading } = useQuery({
    queryKey: ['laporan-distribusi-all', tahunZakatId],
    queryFn: async () => {
      if (!tahunZakatId) return [];

      if (OFFLINE_MODE) {
        return offlineStore.getDistribusiList({
          tahun_zakat_id: tahunZakatId,
          status: 'semua',
          page: 1,
          limit: 10000,
        }).data;
      }

      const { data, error } = await supabase
        .from('distribusi_zakat')
        .select('*, mustahik(id, nama, alamat, kategori_id, kategori_mustahik(nama)), tahun_zakat(tahun_hijriah, tahun_masehi)')
        .eq('tahun_zakat_id', tahunZakatId)
        .order('tanggal_distribusi', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tahunZakatId,
  });

  const { data: kategoriData } = useKategoriMustahik();
  const kategoriList = kategoriData || [];

  const distribusiList = distribusiAllData || [];

  const filteredList = useMemo(() => {
    const fromStr = dateFrom ? formatDateOnlyLocal(dateFrom) : null;
    const toStr = dateTo ? formatDateOnlyLocal(dateTo) : null;

    const resolveKategoriId = (item: any) => {
      if (item.mustahik?.kategori_id) return item.mustahik.kategori_id as string;
      const kategoriName = item.mustahik?.kategori_mustahik?.nama;
      if (!kategoriName) return null;
      return (kategoriList.find((kategori: any) => kategori.nama === kategoriName)?.id as string) || null;
    };

    return distribusiList.filter((d: any) => {
      const tanggal = d.tanggal_distribusi ? String(d.tanggal_distribusi).slice(0, 10) : null;
      if (!tanggal) return false;

      if (fromStr && tanggal < fromStr) return false;
      if (toStr && tanggal > toStr) return false;
      if (kategoriFilter !== 'semua' && resolveKategoriId(d) !== kategoriFilter) return false;
      return true;
    });
  }, [distribusiList, dateFrom, dateTo, kategoriFilter, kategoriList]);

  const totalCount = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedList = useMemo(
    () => filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredList, currentPage]
  );

  const resolveKategoriId = (item: any) => {
    if (item.mustahik?.kategori_id) return item.mustahik.kategori_id as string;
    const kategoriName = item.mustahik?.kategori_mustahik?.nama;
    if (!kategoriName) return null;
    return (kategoriList.find((kategori: any) => kategori.nama === kategoriName)?.id as string) || null;
  };

  // Calculate summary per kategori
  const summaryByKategori = kategoriList.map((kategori: any) => {
    const distribusiKategori = filteredList.filter(
      (d: any) => resolveKategoriId(d) === kategori.id
    );

    const totalBeras = distribusiKategori
      .filter((d: any) => d.jenis_distribusi === 'beras')
      .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0);

    const totalUang = distribusiKategori
      .filter((d: any) => d.jenis_distribusi === 'uang')
      .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0);

    const count = new Set(distribusiKategori.map((d: any) => d.mustahik_id).filter(Boolean)).size;

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

  const hasPagination = totalCount > pageSize;

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, kategoriFilter]);

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
                pagedList.map((distribusi: any) => (
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
          {hasPagination && (
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
