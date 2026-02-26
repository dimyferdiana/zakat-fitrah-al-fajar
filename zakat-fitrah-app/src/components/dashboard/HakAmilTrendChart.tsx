import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useHakAmilMonthlyTrend } from '@/hooks/useHakAmil';

interface HakAmilTrendChartProps {
  tahunZakatId?: string;
  year?: number;
}

const COLORS = {
  zakat_fitrah: '#6366f1',
  zakat_maal: '#8b5cf6',
  infak: '#22c55e',
  fidyah: '#f59e0b',
  beras_kg: '#0ea5e9',
};

const LABELS = {
  zakat_fitrah: 'Zakat Fitrah',
  zakat_maal: 'Zakat Maal',
  infak: 'Infak/Sedekah',
  fidyah: 'Fidyah',
  beras_kg: 'Beras (kg)',
  total: 'Total (Rp)',
};

const formatCurrencyShort = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatWeightShort = (value: number) => `${value.toFixed(1)}kg`;

const formatWeightFull = (value: number) =>
  `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} kg`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.find((p: { dataKey: string }) => p.dataKey === 'total');
  const bars = payload.filter((p: { dataKey: string }) => p.dataKey !== 'total');
  return (
    <div className="rounded-md border bg-background p-3 shadow-md text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {bars.map((p: { dataKey: string; color: string; value: number }) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{LABELS[p.dataKey as keyof typeof LABELS]}</span>
          <span>
            {p.dataKey === 'beras_kg' ? formatWeightFull(p.value) : formatCurrencyFull(p.value)}
          </span>
        </div>
      ))}
      {total && (
        <div className="flex items-center justify-between gap-4 border-t mt-1 pt-1 font-semibold">
          <span>Total</span>
          <span>{formatCurrencyFull(total.value)}</span>
        </div>
      )}
    </div>
  );
};

export function HakAmilTrendChart({ tahunZakatId, year }: HakAmilTrendChartProps) {
  const currentYear = year ?? new Date().getFullYear();
  const { data: trendData, isLoading } = useHakAmilMonthlyTrend(tahunZakatId, currentYear);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Tren Hak Amil</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Per bulan — {currentYear}</p>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        ) : !trendData || trendData.every((d) => d.total === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada data tren hak amil</p>
            <p className="text-xs text-muted-foreground mt-1">
              Data akan muncul setelah ada transaksi pemasukan
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={trendData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="money"
                tickFormatter={formatCurrencyShort}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <YAxis
                yAxisId="kg"
                orientation="right"
                tickFormatter={formatWeightShort}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => LABELS[value as keyof typeof LABELS] ?? value}
              />
              <Bar yAxisId="money" dataKey="zakat_fitrah" stackId="a" fill={COLORS.zakat_fitrah} radius={[0, 0, 0, 0]} />
              <Bar yAxisId="money" dataKey="zakat_maal" stackId="a" fill={COLORS.zakat_maal} />
              <Bar yAxisId="money" dataKey="infak" stackId="a" fill={COLORS.infak} />
              <Bar yAxisId="money" dataKey="fidyah" stackId="a" fill={COLORS.fidyah} />
              <Bar yAxisId="kg" dataKey="beras_kg" fill={COLORS.beras_kg} />
              <Line
                yAxisId="money"
                type="monotone"
                dataKey="total"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="total"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
