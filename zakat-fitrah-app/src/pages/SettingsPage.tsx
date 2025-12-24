import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola pengaturan aplikasi"
      />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Halaman Pengaturan dalam pengembangan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
