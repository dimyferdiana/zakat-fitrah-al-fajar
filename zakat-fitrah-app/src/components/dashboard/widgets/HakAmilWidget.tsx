import { HakAmilCard } from '@/components/dashboard/HakAmilCard';

interface HakAmilWidgetProps {
  tahunZakatId?: string;
}

export function HakAmilWidget({ tahunZakatId }: HakAmilWidgetProps) {
  return <HakAmilCard tahunZakatId={tahunZakatId} />;
}
