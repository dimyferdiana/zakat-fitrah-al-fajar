import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, TrendingUp } from 'lucide-react';
import { useTahunZakatList } from '@/hooks/useDashboard';
import { LaporanPemasukan } from '@/components/laporan/LaporanPemasukan';
import { LaporanDistribusi } from '@/components/laporan/LaporanDistribusi';
import { LaporanMustahik } from '@/components/laporan/LaporanMustahik';
import { LaporanHakAmil } from '@/components/laporan/LaporanHakAmil';
import { PerbandinganTahun } from '@/components/laporan/PerbandinganTahun';

export default function Laporan() {
  const [selectedTahun, setSelectedTahun] = useState<string>('');
  const [activeTab, setActiveTab] = useState('pemasukan');
  const [isMobile, setIsMobile] = useState(false);

  const { data: tahunZakatData, isLoading: loadingTahunZakat } = useTahunZakatList();
  const tahunZakatList = tahunZakatData || [];
  const activeTahun = tahunZakatList.find((t: any) => t.is_active);

  // Set default selected tahun to active year
  if (selectedTahun === '' && activeTahun) {
    setSelectedTahun(activeTahun.id);
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">
            Lihat dan export laporan zakat fitrah
          </p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Tahun Zakat Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tahun Zakat</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTahun}
            onValueChange={setSelectedTahun}
            disabled={loadingTahunZakat}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Pilih tahun zakat" />
            </SelectTrigger>
            <SelectContent>
              {tahunZakatList.map((tahun: any) => (
                <SelectItem key={tahun.id} value={tahun.id}>
                  {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                  {tahun.is_active && ' - Aktif'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabs for Different Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih laporan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pemasukan">Pemasukan</SelectItem>
              <SelectItem value="distribusi">Distribusi</SelectItem>
              <SelectItem value="mustahik">Mustahik</SelectItem>
              <SelectItem value="hakamil">Hak Amil</SelectItem>
              <SelectItem value="perbandingan">Perbandingan Tahun</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <TabsList>
            <TabsTrigger value="pemasukan">Pemasukan</TabsTrigger>
            <TabsTrigger value="distribusi">Distribusi</TabsTrigger>
            <TabsTrigger value="mustahik">Mustahik</TabsTrigger>
            <TabsTrigger value="hakamil">Hak Amil</TabsTrigger>
            <TabsTrigger value="perbandingan">
              <TrendingUp className="mr-2 h-4 w-4" />
              Perbandingan Tahun
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="pemasukan">
          <LaporanPemasukan tahunZakatId={selectedTahun} />
        </TabsContent>

        <TabsContent value="distribusi">
          <LaporanDistribusi tahunZakatId={selectedTahun} />
        </TabsContent>

        <TabsContent value="mustahik">
          <LaporanMustahik tahunZakatId={selectedTahun} />
        </TabsContent>

        <TabsContent value="hakamil">
          <LaporanHakAmil tahunZakatId={selectedTahun} />
        </TabsContent>

        <TabsContent value="perbandingan">
          <PerbandinganTahun />
        </TabsContent>
      </Tabs>
    </div>
  );
}
