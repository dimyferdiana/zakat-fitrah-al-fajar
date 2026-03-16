import { useMemo, useState } from 'react';
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
import { Download, FileText, Calendar as CalendarIcon, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePembayaranList } from '@/hooks/useMuzakki';
import { supabase } from '@/lib/supabase';
import { offlineStore } from '@/lib/offlineStore';
import { exportPemasukanPDF, exportPemasukanExcel } from '@/utils/export';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const UANG_KATEGORI_ROWS: Array<{ key: string; label: string }> = [
  { key: 'zakat_fitrah_uang', label: 'ZAKAT FITRAH (UANG)' },
  { key: 'maal_penghasilan_uang', label: 'MAAL/PENGHASILAN' },
  { key: 'infak_sedekah_uang', label: 'INFAK/SEDEKAH' },
  { key: 'fidyah_uang', label: 'FIDYAH UANG' },
];

const BERAS_KATEGORI_ROWS: Array<{ key: string; label: string }> = [
  { key: 'zakat_fitrah_beras', label: 'ZAKAT FITRAH (BERAS)' },
  { key: 'maal_beras', label: 'MAAL/BERAS' },
  { key: 'infak_sedekah_beras', label: 'INFAK/SEDEKAH BERAS' },
  { key: 'fidyah_beras', label: 'FIDYAH BERAS' },
];

type MatrixRow = {
  key: string;
  label: string;
  monthly: number[];
  total: number;
};

type ReportMatrixTableProps = {
  title: string;
  rows: MatrixRow[];
  valueFormatter: (value: number) => string;
};

function ReportMatrixTable({ title, rows, valueFormatter }: ReportMatrixTableProps) {
  const totalMonthly = MONTH_LABELS.map((_, monthIndex) => rows.reduce((sum, row) => sum + row.monthly[monthIndex], 0));
  const grandTotal = totalMonthly.reduce((sum, value) => sum + value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">NO</TableHead>
                <TableHead className="min-w-[280px]">NAMA</TableHead>
                {MONTH_LABELS.map((month) => (
                  <TableHead key={month} className="text-right">{month}</TableHead>
                ))}
                <TableHead className="text-right">JML</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    Belum ada data
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, rowIndex) => (
                  <TableRow key={row.key}>
                    <TableCell>{rowIndex + 1}</TableCell>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {row.monthly.map((value, monthIndex) => (
                      <TableCell key={`${row.key}-${monthIndex}`} className="text-right">
                        {valueFormatter(value)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold">{valueFormatter(row.total)}</TableCell>
                  </TableRow>
                ))
              )}
              {rows.length > 0 && (
                <TableRow>
                  <TableCell />
                  <TableCell className="font-semibold">JUMLAH</TableCell>
                  {totalMonthly.map((value, monthIndex) => (
                    <TableCell key={`total-${monthIndex}`} className="text-right font-semibold">
                      {valueFormatter(value)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold">{valueFormatter(grandTotal)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface LaporanPemasukanProps {
  tahunZakatId: string;
}

export function LaporanPemasukan({ tahunZakatId }: LaporanPemasukanProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [jenisFilter, setJenisFilter] = useState<'semua' | 'beras' | 'uang'>('semua');

  const { data: muzakkiData } = usePembayaranList({
    tahunZakatId: tahunZakatId,
    jenisZakat: jenisFilter === 'semua' ? undefined : jenisFilter,
    page: 1,
    pageSize: 10000,
  });

  const pembayaranList = muzakkiData?.data || [];

  const { data: insightData, isLoading: insightLoading } = useQuery({
    queryKey: ['laporan-pemasukan-insights', tahunZakatId],
    queryFn: async () => {
      if (!tahunZakatId) {
        return {
          pemasukanUang: [] as Array<{
            id: string;
            tanggal: string;
            kategori: string;
            akun: string;
            account_id?: string | null;
            jumlah_uang_rp: number;
            muzakki_id?: string | null;
          }> ,
          pemasukanBeras: [] as Array<{
            id: string;
            tanggal: string;
            kategori: string;
            jumlah_beras_kg: number;
            muzakki_id?: string | null;
          }> ,
          accounts: [] as Array<{ id: string; account_name: string }>,
        };
      }

      if (OFFLINE_MODE) {
        const pemasukanUang = offlineStore.getPemasukanUangList({
          tahunZakatId,
          page: 1,
          pageSize: 10000,
        }).data;
        const pemasukanBeras = offlineStore.getPemasukanBerasList({
          tahunZakatId,
          page: 1,
          pageSize: 10000,
        }).data;

        return {
          pemasukanUang,
          pemasukanBeras,
          accounts: [],
        };
      }

      const [{ data: uangRows, error: uangError }, { data: berasRows, error: berasError }, { data: accountRows, error: accountError }] = await Promise.all([
        supabase
          .from('pemasukan_uang')
          .select('id, tanggal, kategori, akun, account_id, jumlah_uang_rp, muzakki_id')
          .eq('tahun_zakat_id', tahunZakatId),
        supabase
          .from('pemasukan_beras')
          .select('id, tanggal, kategori, jumlah_beras_kg, muzakki_id')
          .eq('tahun_zakat_id', tahunZakatId),
        supabase
          .from('accounts')
          .select('id, account_name')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('account_name', { ascending: true }),
      ]);

      if (uangError) throw uangError;
      if (berasError) throw berasError;
      if (accountError) throw accountError;

      return {
        pemasukanUang: (uangRows || []) as Array<{
          id: string;
          tanggal: string;
          kategori: string;
          akun: string;
          account_id?: string | null;
          jumlah_uang_rp: number;
          muzakki_id?: string | null;
        }>,
        pemasukanBeras: (berasRows || []) as Array<{
          id: string;
          tanggal: string;
          kategori: string;
          jumlah_beras_kg: number;
          muzakki_id?: string | null;
        }>,
        accounts: (accountRows || []) as Array<{ id: string; account_name: string }>,
      };
    },
    enabled: !!tahunZakatId,
  });

  // Summary for the first report tab follows current pemasukan sources.
  const totalBeras = (insightData?.pemasukanBeras || []).reduce(
    (sum, row) => sum + Number(row.jumlah_beras_kg || 0),
    0
  );
  const totalUang = (insightData?.pemasukanUang || []).reduce(
    (sum, row) => sum + Number(row.jumlah_uang_rp || 0),
    0
  );
  const totalMuzakki = new Set(
    [...(insightData?.pemasukanUang || []), ...(insightData?.pemasukanBeras || [])]
      .map((row) => row.muzakki_id)
      .filter(Boolean)
  ).size;

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

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }),
    []
  );

  const monthIndex = (dateValue: string) => {
    const monthFromString = Number(dateValue.slice(5, 7));
    if (!Number.isNaN(monthFromString) && monthFromString >= 1 && monthFromString <= 12) {
      return monthFromString - 1;
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.getMonth();
  };

  const insightMatrices = useMemo(() => {
    const uangRows = insightData?.pemasukanUang || [];
    const berasRows = insightData?.pemasukanBeras || [];
    const accountRows = insightData?.accounts || [];

    const accountNameById = new Map(accountRows.map((account) => [account.id, account.account_name]));

    const byAccountMap = new Map<string, MatrixRow>();
    accountRows.forEach((account) => {
      byAccountMap.set(account.id, {
        key: account.id,
        label: account.account_name,
        monthly: Array(12).fill(0),
        total: 0,
      });
    });

    uangRows.forEach((row) => {
      const m = monthIndex(row.tanggal);
      if (m == null) return;

      const fallbackLabel = row.akun === 'bank' ? 'BANK' : 'KAS';
      const key = row.account_id || `fallback-${fallbackLabel}`;
      const label = row.account_id ? accountNameById.get(row.account_id) || fallbackLabel : fallbackLabel;

      if (!byAccountMap.has(key)) {
        byAccountMap.set(key, {
          key,
          label,
          monthly: Array(12).fill(0),
          total: 0,
        });
      }

      const target = byAccountMap.get(key)!;
      target.monthly[m] += Number(row.jumlah_uang_rp || 0);
      target.total += Number(row.jumlah_uang_rp || 0);
    });

    const byKategoriRpMap = new Map<string, MatrixRow>(
      UANG_KATEGORI_ROWS.map((row) => [
        row.key,
        {
          key: row.key,
          label: row.label,
          monthly: Array(12).fill(0),
          total: 0,
        },
      ])
    );

    const byKategoriOrgSets = new Map<string, Array<Set<string>>>(
      UANG_KATEGORI_ROWS.map((row) => [
        row.key,
        Array.from({ length: 12 }, () => new Set<string>()),
      ])
    );

    uangRows.forEach((row) => {
      const m = monthIndex(row.tanggal);
      if (m == null) return;

      if (byKategoriRpMap.has(row.kategori)) {
        const item = byKategoriRpMap.get(row.kategori)!;
        item.monthly[m] += Number(row.jumlah_uang_rp || 0);
        item.total += Number(row.jumlah_uang_rp || 0);

        const orgKey = row.muzakki_id || `anon-${row.id}`;
        byKategoriOrgSets.get(row.kategori)?.[m].add(orgKey);
      }
    });

    const byKategoriOrg = UANG_KATEGORI_ROWS.map((row) => {
      const monthly = (byKategoriOrgSets.get(row.key) || Array.from({ length: 12 }, () => new Set<string>())).map((set) => set.size);
      const total = monthly.reduce((sum, value) => sum + value, 0);
      return {
        key: row.key,
        label: row.label,
        monthly,
        total,
      } satisfies MatrixRow;
    });

    const byKategoriBerasMap = new Map<string, MatrixRow>(
      BERAS_KATEGORI_ROWS.map((row) => [
        row.key,
        {
          key: row.key,
          label: row.label,
          monthly: Array(12).fill(0),
          total: 0,
        },
      ])
    );

    berasRows.forEach((row) => {
      const m = monthIndex(row.tanggal);
      if (m == null) return;
      if (!byKategoriBerasMap.has(row.kategori)) return;

      const item = byKategoriBerasMap.get(row.kategori)!;
      item.monthly[m] += Number(row.jumlah_beras_kg || 0);
      item.total += Number(row.jumlah_beras_kg || 0);
    });

    const byAccount = Array.from(byAccountMap.values())
      .filter((row) => row.total > 0)
      .sort((a, b) => a.label.localeCompare(b.label));

    const byKategoriRp = UANG_KATEGORI_ROWS.map((row) => byKategoriRpMap.get(row.key)!).filter((row) => row.total > 0);
    const byKategoriBeras = BERAS_KATEGORI_ROWS.map((row) => byKategoriBerasMap.get(row.key)!).filter((row) => row.total > 0);

    return {
      byAccount,
      byKategoriRp,
      byKategoriOrg: byKategoriOrg.filter((row) => row.total > 0),
      byKategoriBeras,
    };
  }, [insightData]);

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

      <ReportMatrixTable
        title="Laporan Penerimaan ZIS+Fidyah Berdasarkan No Rekening"
        rows={insightMatrices.byAccount}
        valueFormatter={(value) => numberFormatter.format(value)}
      />

      <ReportMatrixTable
        title="Laporan Penerimaan ZIS+Fidyah (RP) Berdasarkan Kategori"
        rows={insightMatrices.byKategoriRp}
        valueFormatter={(value) => numberFormatter.format(value)}
      />

      <ReportMatrixTable
        title="Laporan Penerimaan ZIS+Fidyah (ORG) Berdasarkan Kategori"
        rows={insightMatrices.byKategoriOrg}
        valueFormatter={(value) => numberFormatter.format(value)}
      />

      <ReportMatrixTable
        title="Laporan Penerimaan ZIS+Fidyah (BERAS) Berdasarkan Kategori"
        rows={insightMatrices.byKategoriBeras}
        valueFormatter={(value) => value.toFixed(2)}
      />

      {insightLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Memuat insight laporan bulanan...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
