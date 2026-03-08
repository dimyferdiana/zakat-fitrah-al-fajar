import { HakAmilBerasCard } from '@/components/dashboard/HakAmilBerasCard';

interface HakAmilBerasWidgetProps {
  tahunZakatId?: string;
}

export function HakAmilBerasWidget({ tahunZakatId }: HakAmilBerasWidgetProps) {
  return <HakAmilBerasCard tahunZakatId={tahunZakatId} />;
}
