import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export function MuzakkiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Muzakki"
        description="Kelola data pemberi zakat (muzakki)"
      />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Halaman Data Muzakki dalam pengembangan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
