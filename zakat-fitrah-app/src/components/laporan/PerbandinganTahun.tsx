import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTahunZakatList } from '@/hooks/useDashboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface YearData {
  tahun_hijriah: string;
  tahun_masehi: number;
  pemasukan_beras: number;
  pemasukan_uang: number;
  distribusi_beras: number;
  distribusi_uang: number;
  sisa_beras: number;
  sisa_uang: number;
  total_muzakki: number;
  total_mustahik: number;
}

export function PerbandinganTahun() {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const { data: tahunZakatData } = useTahunZakatList();
  const tahunZakatList = tahunZakatData || [];

  // Fetch data for selected years
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['perbandingan-tahun', selectedYears],
    queryFn: async () => {
      if (selectedYears.length === 0) return [];

      const promises = selectedYears.map(async (tahunId) => {
        const tahun = tahunZakatList.find((t: any) => t.id === tahunId);
        if (!tahun) return null;

        // Get pemasukan
        const { data: pemasukanData } = await supabase
          .from('pembayaran_zakat')
          .select('jenis_zakat, total_kg, total_rp')
          .eq('tahun_zakat_id', tahunId);

        const pemasukanBeras = (pemasukanData as any)
          ?.filter((p: any) => p.jenis_zakat === 'beras')
          .reduce((sum: number, p: any) => sum + (p.total_kg || 0), 0) || 0;

        const pemasukanUang = (pemasukanData as any)
          ?.filter((p: any) => p.jenis_zakat === 'uang')
          .reduce((sum: number, p: any) => sum + (p.total_rp || 0), 0) || 0;

        // Get distribusi
        const { data: distribusiData } = await supabase
          .from('distribusi_zakat')
          .select('jenis_distribusi, jumlah, status')
          .eq('tahun_zakat_id', tahunId)
          .eq('status', 'selesai');

        const distribusiBeras = (distribusiData as any)
          ?.filter((d: any) => d.jenis_distribusi === 'beras')
          .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0) || 0;

        const distribusiUang = (distribusiData as any)
          ?.filter((d: any) => d.jenis_distribusi === 'uang')
          .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0) || 0;

        // Get muzakki count
        const { count: muzakkiCount } = await supabase
          .from('pembayaran_zakat')
          .select('muzakki_id', { count: 'exact', head: true })
          .eq('tahun_zakat_id', tahunId);

        // Get mustahik count
        const { count: mustahikCount } = await supabase
          .from('distribusi_zakat')
          .select('mustahik_id', { count: 'exact', head: true })
          .eq('tahun_zakat_id', tahunId)
          .eq('status', 'selesai');

        return {
          tahun_hijriah: (tahun as any).tahun_hijriah,
          tahun_masehi: (tahun as any).tahun_masehi,
          pemasukan_beras: pemasukanBeras,
          pemasukan_uang: pemasukanUang,
          distribusi_beras: distribusiBeras,
          distribusi_uang: distribusiUang,
          sisa_beras: pemasukanBeras - distribusiBeras,
          sisa_uang: pemasukanUang - distribusiUang,
          total_muzakki: muzakkiCount || 0,
          total_mustahik: mustahikCount || 0,
        } as YearData;
      });

      const results = await Promise.all(promises);
      return results.filter((r) => r !== null) as YearData[];
    },
    enabled: selectedYears.length > 0,
  });

  const handleYearToggle = (yearId: string) => {
    if (selectedYears.includes(yearId)) {
      setSelectedYears(selectedYears.filter((id) => id !== yearId));
    } else {
      if (selectedYears.length < 3) {
        setSelectedYears([...selectedYears, yearId]);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const renderGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{growth.toFixed(1)}%</span>
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{growth.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <Minus className="h-4 w-4" />
          <span className="text-sm font-medium">0%</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Tahun untuk Perbandingan (Maksimal 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tahunZakatList.map((tahun: any) => (
              <div key={tahun.id} className="flex items-center space-x-2">
                <Checkbox
                  id={tahun.id}
                  checked={selectedYears.includes(tahun.id)}
                  onCheckedChange={() => handleYearToggle(tahun.id)}
                  disabled={!selectedYears.includes(tahun.id) && selectedYears.length >= 3}
                />
                <label
                  htmlFor={tahun.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                  {tahun.is_active && (
                    <Badge variant="outline" className="ml-2">Aktif</Badge>
                  )}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedYears.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Pilih minimal 1 tahun untuk melihat perbandingan
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="text-center py-12">Loading...</CardContent>
        </Card>
      ) : (
        <>
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Data Zakat</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metrik</TableHead>
                    {comparisonData?.map((data, index) => (
                      <TableHead key={index} className="text-right">
                        {data.tahun_hijriah}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          ({data.tahun_masehi})
                        </span>
                      </TableHead>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableHead className="text-center">Pertumbuhan</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Pemasukan Beras */}
                  <TableRow>
                    <TableCell className="font-medium">Pemasukan Beras</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {formatNumber(data.pemasukan_beras)} kg
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableCell className="text-center">
                        {renderGrowthIndicator(
                          calculateGrowth(
                            comparisonData[comparisonData.length - 1].pemasukan_beras,
                            comparisonData[0].pemasukan_beras
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Pemasukan Uang */}
                  <TableRow>
                    <TableCell className="font-medium">Pemasukan Uang</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {formatCurrency(data.pemasukan_uang)}
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableCell className="text-center">
                        {renderGrowthIndicator(
                          calculateGrowth(
                            comparisonData[comparisonData.length - 1].pemasukan_uang,
                            comparisonData[0].pemasukan_uang
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Distribusi Beras */}
                  <TableRow>
                    <TableCell className="font-medium">Distribusi Beras</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {formatNumber(data.distribusi_beras)} kg
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableCell className="text-center">
                        {renderGrowthIndicator(
                          calculateGrowth(
                            comparisonData[comparisonData.length - 1].distribusi_beras,
                            comparisonData[0].distribusi_beras
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Distribusi Uang */}
                  <TableRow>
                    <TableCell className="font-medium">Distribusi Uang</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {formatCurrency(data.distribusi_uang)}
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableCell className="text-center">
                        {renderGrowthIndicator(
                          calculateGrowth(
                            comparisonData[comparisonData.length - 1].distribusi_uang,
                            comparisonData[0].distribusi_uang
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Sisa Beras */}
                  <TableRow>
                    <TableCell className="font-medium">Sisa Beras</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {formatNumber(data.sisa_beras)} kg
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && <TableCell />}
                  </TableRow>

                  {/* Sisa Uang */}
                  <TableRow>
                    <TableCell className="font-medium">Sisa Uang</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {formatCurrency(data.sisa_uang)}
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && <TableCell />}
                  </TableRow>

                  {/* Total Muzakki */}
                  <TableRow>
                    <TableCell className="font-medium">Total Muzakki</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {data.total_muzakki} KK
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableCell className="text-center">
                        {renderGrowthIndicator(
                          calculateGrowth(
                            comparisonData[comparisonData.length - 1].total_muzakki,
                            comparisonData[0].total_muzakki
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Total Mustahik */}
                  <TableRow>
                    <TableCell className="font-medium">Total Mustahik</TableCell>
                    {comparisonData?.map((data, index) => (
                      <TableCell key={index} className="text-right">
                        {data.total_mustahik} KK
                      </TableCell>
                    ))}
                    {comparisonData && comparisonData.length > 1 && (
                      <TableCell className="text-center">
                        {renderGrowthIndicator(
                          calculateGrowth(
                            comparisonData[comparisonData.length - 1].total_mustahik,
                            comparisonData[0].total_mustahik
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
