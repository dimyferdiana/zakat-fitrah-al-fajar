import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QurbanDashboardStats } from '@/types/qurban'

interface QurbanPaymentChartProps {
  stats: QurbanDashboardStats
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

export function QurbanPaymentChart({ stats }: QurbanPaymentChartProps) {
  const chartData = [
    { name: 'Lunas', value: stats.lunasNominal, color: '#22c55e' },
    { name: 'Belum Bayar', value: stats.belumBayarNominal, color: '#f59e0b' },
  ]

  const isEmpty = stats.lunasNominal === 0 && stats.belumBayarNominal === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Pembayaran</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Belum ada data
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    typeof value === 'number' ? formatCurrency(value) : (value ?? ''),
                    '',
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-2 text-sm border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span className="text-muted-foreground">Lunas</span>
                </span>
                <span className="font-medium">
                  {stats.lunasCount} peserta ({formatCurrency(stats.lunasNominal)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#f59e0b' }}
                  />
                  <span className="text-muted-foreground">Belum Bayar</span>
                </span>
                <span className="font-medium">
                  {stats.belumBayarCount} peserta ({formatCurrency(stats.belumBayarNominal)})
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
