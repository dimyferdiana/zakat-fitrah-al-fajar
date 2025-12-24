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
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Users } from 'lucide-react';
import { useMustahikList, useKategoriMustahik } from '@/hooks/useMustahik';
import { exportMustahikPDF, exportMustahikExcel } from '@/utils/export';

interface LaporanMustahikProps {
  tahunZakatId: string;
}

export function LaporanMustahik({ }: LaporanMustahikProps) {
  const { data: mustahikData, isLoading } = useMustahikList({
    page: 1,
    limit: 1000, // Get all for report
  });

  const { data: kategoriData } = useKategoriMustahik();
  const kategoriList = kategoriData || [];

  const mustahikList = mustahikData?.data || [];

  // Group by kategori
  const groupedByKategori = kategoriList.map((kategori: any) => {
    const mustahikKategori = mustahikList.filter(
      (m: any) => m.kategori_id === kategori.id
    );

    const aktifCount = mustahikKategori.filter((m: any) => m.is_active).length;
    const nonAktifCount = mustahikKategori.filter((m: any) => !m.is_active).length;
    const totalAnggota = mustahikKategori.reduce(
      (sum: number, m: any) => sum + (m.jumlah_anggota || 0),
      0
    );

    return {
      kategori: kategori.nama,
      deskripsi: kategori.deskripsi,
      mustahikList: mustahikKategori,
      aktifCount,
      nonAktifCount,
      totalCount: mustahikKategori.length,
      totalAnggota,
    };
  });

  const totalAktif = groupedByKategori.reduce((sum, g) => sum + g.aktifCount, 0);
  const totalNonAktif = groupedByKategori.reduce((sum, g) => sum + g.nonAktifCount, 0);
  const totalMustahik = totalAktif + totalNonAktif;
  const totalAnggota = groupedByKategori.reduce((sum, g) => sum + g.totalAnggota, 0);

  const handleExportPDF = () => {
    exportMustahikPDF(groupedByKategori, {
      totalAktif,
      totalNonAktif,
      totalMustahik,
      totalAnggota,
    });
  };

  const handleExportExcel = () => {
    exportMustahikExcel(groupedByKategori, {
      totalAktif,
      totalNonAktif,
      totalMustahik,
      totalAnggota,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mustahik</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMustahik}</div>
            <p className="text-xs text-muted-foreground">Kepala keluarga</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAktif}</div>
            <p className="text-xs text-muted-foreground">Penerima aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Aktif</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{totalNonAktif}</div>
            <p className="text-xs text-muted-foreground">Penerima non-aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnggota}</div>
            <p className="text-xs text-muted-foreground">Jiwa total</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Export Laporan</CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* Grouped by Kategori */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-8">Loading...</CardContent>
        </Card>
      ) : (
        groupedByKategori.map((group, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{group.kategori}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{group.deskripsi}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{group.totalCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {group.aktifCount} aktif, {group.nonAktifCount} non-aktif
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.mustahikList.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  Tidak ada mustahik dalam kategori ini
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead className="text-center">Anggota</TableHead>
                      <TableHead>No. Telp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.mustahikList.map((mustahik: any) => (
                      <TableRow key={mustahik.id}>
                        <TableCell className="font-medium">{mustahik.nama}</TableCell>
                        <TableCell>{mustahik.alamat}</TableCell>
                        <TableCell className="text-center">{mustahik.jumlah_anggota}</TableCell>
                        <TableCell>{mustahik.no_telp || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            className={mustahik.is_active ? 'bg-green-600' : 'bg-gray-500'}
                          >
                            {mustahik.is_active ? 'Aktif' : 'Non-Aktif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Subtotal {group.kategori}:</span>
                  <span>{group.totalCount} mustahik ({group.totalAnggota} jiwa)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
