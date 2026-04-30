import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TransactionTag } from '@/hooks/useTransactionTags';

interface TagTableProps {
  data: TransactionTag[];
  isLoading: boolean;
  onDeactivate: (id: string) => void;
}

export function TagTable({ data, isLoading, onDeactivate }: TagTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse rounded bg-muted mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                Belum ada tag transaksi.
              </TableCell>
            </TableRow>
          ) : (
            data.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>
                  {tag.is_active ? (
                    <Badge variant="default">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {tag.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeactivate(tag.id)}
                    >
                      Nonaktifkan
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
