import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AccountLedgerTableProps {
  entries: Array<{
    id: string;
    date?: string;
    tanggal?: string;
    mutation_type?: string;
    tipe_mutasi?: string;
    amount?: number;
    nominal?: number;
    reference?: string | null;
    referensi?: string | null;
    note?: string | null;
    catatan?: string | null;
    running_balance?: number;
    saldo_berjalan?: number;
  }>;
  isLoading?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('id-ID');
}

export function AccountLedgerTable({ entries, isLoading }: AccountLedgerTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger Rekening</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat ledger...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data ledger untuk rekening ini.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Saldo Berjalan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const mutationType = entry.mutation_type || entry.tipe_mutasi || '-';
                const amount = Number(entry.amount ?? entry.nominal ?? 0);
                const runningBalance = Number(entry.running_balance ?? entry.saldo_berjalan ?? 0);

                return (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date || entry.tanggal)}</TableCell>
                    <TableCell className="uppercase">{mutationType}</TableCell>
                    <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                    <TableCell>{entry.reference || entry.referensi || '-'}</TableCell>
                    <TableCell>{entry.note || entry.catatan || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(runningBalance)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
