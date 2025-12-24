import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export function DistribusiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribusi Zakat"
        description="Kelola distribusi zakat kepada mustahik"
      />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Halaman Distribusi Zakat dalam pengembangan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
