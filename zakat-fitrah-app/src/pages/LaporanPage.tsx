import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export function LaporanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Lihat dan cetak laporan zakat"
      />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Halaman Laporan dalam pengembangan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
