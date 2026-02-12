import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PemasukanChartProps {
  data: Array<{
    month: string;
    zakatBerasKg: number;
    fidyahBerasKg: number;
    sedekahBerasKg: number;
    zakatUangRp: number;
    fidyahUangRp: number;
    sedekahUangRp: number;
    maalUangRp: number;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export function PemasukanChart({ data }: PemasukanChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Pemasukan Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#82ca9d"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number | undefined, name: string) => {
                if (!value) return ['0', name];
                if (name.includes('(kg)')) {
                  return [`${value.toFixed(2)} kg`, name];
                }
                return [formatCurrency(value), name];
              }}
            />
            <Legend />
            {/* Beras bars - stacked */}
            <Bar yAxisId="left" dataKey="zakatBerasKg" stackId="beras" fill="#8884d8" name="Zakat Beras (kg)" />
            <Bar yAxisId="left" dataKey="fidyahBerasKg" stackId="beras" fill="#6366f1" name="Fidyah Beras (kg)" />
            <Bar yAxisId="left" dataKey="sedekahBerasKg" stackId="beras" fill="#a78bfa" name="Sedekah Beras (kg)" />
            {/* Uang bars - stacked */}
            <Bar yAxisId="right" dataKey="zakatUangRp" stackId="uang" fill="#82ca9d" name="Zakat Uang (Rp)" />
            <Bar yAxisId="right" dataKey="fidyahUangRp" stackId="uang" fill="#10b981" name="Fidyah Uang (Rp)" />
            <Bar yAxisId="right" dataKey="sedekahUangRp" stackId="uang" fill="#34d399" name="Sedekah Uang (Rp)" />
            <Bar yAxisId="right" dataKey="maalUangRp" stackId="uang" fill="#6ee7b7" name="Maal Uang (Rp)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
