import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, TrendingUp, TrendingDown, Package } from 'lucide-react';
import type { Mustahik, DistribusiHistory } from '@/hooks/useMustahik';

interface RiwayatMustahikProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mustahik: Mustahik | null;
  history: DistribusiHistory[];
  isLoading: boolean;
}

export function RiwayatMustahik({
  open,
  onOpenChange,
  mustahik,
  history,
  isLoading,
}: RiwayatMustahikProps) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate comparison
  const currentYearTotal = history
    .filter((h) => h.tahun_zakat?.tahun_masehi === new Date().getFullYear())
    .reduce((sum, h) => sum + h.jumlah, 0);

  const lastYearTotal = history
    .filter((h) => h.tahun_zakat?.tahun_masehi === new Date().getFullYear() - 1)
    .reduce((sum, h) => sum + h.jumlah, 0);

  const hasComparison = currentYearTotal > 0 && lastYearTotal > 0;
  const isIncrease = currentYearTotal > lastYearTotal;
  const percentageChange = lastYearTotal > 0
    ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Riwayat Distribusi</DialogTitle>
          <DialogDescription>
            {mustahik ? `Riwayat penerimaan zakat untuk ${mustahik.nama}` : ''}
          </DialogDescription>
        </DialogHeader>

        {mustahik && (
          <div className="space-y-4">
            {/* Mustahik Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{mustahik.nama}</h3>
                    <Badge variant="outline">
                      {mustahik.kategori_mustahik?.nama || 'N/A'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{mustahik.alamat}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {mustahik.jumlah_anggota} anggota keluarga
                    </span>
                    {mustahik.no_telp && (
                      <span className="text-muted-foreground">• {mustahik.no_telp}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison */}
            {hasComparison && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Perbandingan Tahun Ini vs Tahun Lalu</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(currentYearTotal)} vs {formatCurrency(lastYearTotal)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncrease ? (
                        <TrendingUp className="h-6 w-6" />
                      ) : (
                        <TrendingDown className="h-6 w-6" />
                      )}
                      <span className="text-xl font-semibold">
                        {Math.abs(percentageChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History Timeline */}
            <div>
              <h4 className="font-semibold mb-3">Riwayat Penerimaan</h4>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">Memuat riwayat...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Belum ada riwayat distribusi
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <div className="mt-1">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {item.tahun_zakat?.tahun_hijriah || 'N/A'} ({item.tahun_zakat?.tahun_masehi})
                            </p>
                            <Badge
                              variant={
                                item.jenis_distribusi === 'beras' ? 'default' : 'secondary'
                              }
                            >
                              {item.jenis_distribusi === 'beras' ? 'Beras' : 'Uang'}
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold">
                            {item.jenis_distribusi === 'beras'
                              ? `${formatNumber(item.jumlah)} kg`
                              : formatCurrency(item.jumlah)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(item.tanggal_distribusi)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
