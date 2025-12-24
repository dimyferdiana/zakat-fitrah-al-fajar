import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DistribusiProgressProps {
  totalPemasukan: number;
  totalDistribusi: number;
  sisa: number;
  jenis: 'beras' | 'uang';
}

export function DistribusiProgress({
  totalPemasukan,
  totalDistribusi,
  sisa,
  jenis,
}: DistribusiProgressProps) {
  const percentageDistributed = totalPemasukan > 0 ? (totalDistribusi / totalPemasukan) * 100 : 0;
  const percentageSisa = totalPemasukan > 0 ? (sisa / totalPemasukan) * 100 : 0;
  const isLowStock = percentageSisa < 10 && totalPemasukan > 0;

  const unit = jenis === 'beras' ? 'kg' : 'Rp';
  const formatValue = (value: number) => {
    if (jenis === 'uang') {
      return new Intl.NumberFormat('id-ID').format(value);
    }
    return value.toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Distribusi {jenis === 'beras' ? 'Beras' : 'Uang'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tersalurkan</span>
            <span className="font-medium">{percentageDistributed.toFixed(1)}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${percentageDistributed}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pemasukan:</span>
            <span className="font-medium">
              {formatValue(totalPemasukan)} {unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tersalurkan:</span>
            <span className="font-medium text-green-600">
              {formatValue(totalDistribusi)} {unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sisa:</span>
            <span className={`font-medium ${isLowStock ? 'text-orange-600' : ''}`}>
              {formatValue(sisa)} {unit}
            </span>
          </div>
        </div>

        {/* Low Stock Alert */}
        {isLowStock && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Peringatan: Sisa zakat {jenis} kurang dari 10% dari total pemasukan!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
