import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export function MustahikPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Mustahik"
        description="Kelola data penerima zakat (mustahik)"
      />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Halaman Data Mustahik dalam pengembangan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
