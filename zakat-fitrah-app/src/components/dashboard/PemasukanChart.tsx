import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PemasukanChartProps {
  data: Array<{
    month: string;
    beras: number;
    uang: number;
  }>;
}

export function PemasukanChart({ data }: PemasukanChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Pemasukan Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="beras" fill="#8884d8" name="Beras (kg)" />
            <Bar yAxisId="right" dataKey="uang" fill="#82ca9d" name="Uang (Rp)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
