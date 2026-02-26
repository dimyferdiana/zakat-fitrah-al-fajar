import { HakAmilTrendChart } from '@/components/dashboard/HakAmilTrendChart';

interface HakAmilTrendWidgetProps {
  tahunZakatId?: string;
}

export function HakAmilTrendWidget({ tahunZakatId }: HakAmilTrendWidgetProps) {
  return <HakAmilTrendChart tahunZakatId={tahunZakatId} />;
}
