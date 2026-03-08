import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReceiptShell } from './ReceiptShell';
import type { BulkResult, BulkRow } from '@/types/bulk';

interface BulkTandaTerimaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BulkResult;
}

interface BulkPrintRow {
  no: number;
  namaMuzakki: string;
  zfBerasKg: number;
  zfBerasLiter: number;
  zfUang: number;
  maalUang: number;
  infakBerasKg: number;
  infakBerasLiter: number;
  infakUang: number;
  fidyahUang: number;
}

interface MoneyAccountSummaryRow {
  category: string;
  account: string;
  total: number;
}

function createEmptyPrintRow(namaMuzakki: string): BulkPrintRow {
  return {
    no: 0,
    namaMuzakki,
    zfBerasKg: 0,
    zfBerasLiter: 0,
    zfUang: 0,
    maalUang: 0,
    infakBerasKg: 0,
    infakBerasLiter: 0,
    infakUang: 0,
    fidyahUang: 0,
  };
}

function normalizeNameKey(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildPrintRows(rows: BulkRow[]): BulkPrintRow[] {
  const grouped = new Map<string, BulkPrintRow>();

  for (const row of rows) {
    if (!row.amount || row.amount <= 0 || !row.transactionType || !row.paymentMedium) continue;

    // Group by person so one muzakki is rendered in a single row on print.
    const key = row.muzakkiId ?? normalizeNameKey(row.muzakkiNama);
    if (!grouped.has(key)) grouped.set(key, createEmptyPrintRow(row.muzakkiNama));

    const current = grouped.get(key);
    if (!current) continue;

    if (row.transactionType === 'zakat_fitrah' && row.paymentMedium === 'beras_kg') current.zfBerasKg += row.amount;
    if (row.transactionType === 'zakat_fitrah' && row.paymentMedium === 'beras_liter') current.zfBerasLiter += row.amount;
    if (row.transactionType === 'zakat_fitrah' && row.paymentMedium === 'uang') current.zfUang += row.amount;

    if (row.transactionType === 'maal' && row.paymentMedium === 'uang') current.maalUang += row.amount;

    if (row.transactionType === 'infak' && row.paymentMedium === 'beras_kg') current.infakBerasKg += row.amount;
    if (row.transactionType === 'infak' && row.paymentMedium === 'beras_liter') current.infakBerasLiter += row.amount;
    if (row.transactionType === 'infak' && row.paymentMedium === 'uang') current.infakUang += row.amount;

    if (row.transactionType === 'fidyah' && row.paymentMedium === 'uang') current.fidyahUang += row.amount;
  }

  return Array.from(grouped.values()).map((row, idx) => ({ ...row, no: idx + 1 }));
}

function formatUang(v: number) {
  if (v <= 0) return '';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function formatBeras(v: number) {
  if (v <= 0) return '';
  return v.toFixed(2);
}

function sumColumn(rows: BulkPrintRow[], key: keyof Omit<BulkPrintRow, 'no' | 'namaMuzakki'>) {
  return rows.reduce((acc, row) => acc + row[key], 0);
}

function formatTransactionTypeLabel(type: BulkRow['transactionType']): string {
  if (type === 'zakat_fitrah') return 'Zakat Fitrah';
  if (type === 'maal') return 'Zakat Maal';
  if (type === 'infak') return 'Infaq';
  if (type === 'fidyah') return 'Fidyah';
  return '-';
}

function buildMoneyAccountSummary(rows: BulkRow[]): MoneyAccountSummaryRow[] {
  const grouped = new Map<string, MoneyAccountSummaryRow>();

  for (const row of rows) {
    if (row.paymentMedium !== 'uang' || !row.amount || row.amount <= 0) continue;
    const category = formatTransactionTypeLabel(row.transactionType);
    const channel = row.accountChannel === 'kas'
      ? 'Kas'
      : row.accountChannel === 'bank'
        ? 'Bank'
        : 'Akun';
    const accountName = row.accountName?.trim() || 'Rekening tidak diketahui';
    const accountLabel = `${channel} - ${accountName}`;
    const key = `${category}::${accountLabel}`;

    if (!grouped.has(key)) {
      grouped.set(key, { category, account: accountLabel, total: 0 });
    }

    const current = grouped.get(key);
    if (!current) continue;
    current.total += row.amount;
  }

  return Array.from(grouped.values());
}

export function BulkTandaTerima({ open, onOpenChange, result }: BulkTandaTerimaProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Tanda-Terima-Bulk-${result.receiptNo}`,
  });

  const today = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });
  const printRows = buildPrintRows(result.rows);
  const moneyAccountRows = buildMoneyAccountSummary(result.rows);

  const totals = {
    zfBerasKg: sumColumn(printRows, 'zfBerasKg'),
    zfBerasLiter: sumColumn(printRows, 'zfBerasLiter'),
    zfUang: sumColumn(printRows, 'zfUang'),
    maalUang: sumColumn(printRows, 'maalUang'),
    infakBerasKg: sumColumn(printRows, 'infakBerasKg'),
    infakBerasLiter: sumColumn(printRows, 'infakBerasLiter'),
    infakUang: sumColumn(printRows, 'infakUang'),
    fidyahUang: sumColumn(printRows, 'fidyahUang'),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Tanda Terima Zakat - Penerimaan Massal</DialogTitle>
            <DialogDescription>
              No. Resi: <span className="font-mono font-semibold">{result.receiptNo}</span>
              {' · '}
              {printRows.length} baris · {today}
            </DialogDescription>
          </DialogHeader>

          <ReceiptShell ref={contentRef} title="TANDA TERIMA ZAKAT (BULK)">
            <div className="flex justify-between text-xs mb-2">
              <div>
                <span className="text-muted-foreground">No. Resi: </span>
                <span className="font-mono font-semibold">{result.receiptNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tanggal: </span>
                <span className="font-medium">{today}</span>
              </div>
            </div>

            {moneyAccountRows.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold mb-1">Rincian Rekening Transaksi Uang</p>
                <table className="min-w-full text-[10px] border border-foreground/20">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-foreground/20 px-2 py-1 text-left">Kategori</th>
                      <th className="border border-foreground/20 px-2 py-1 text-left">Rekening</th>
                      <th className="border border-foreground/20 px-2 py-1 text-right">Total Uang (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moneyAccountRows.map((item) => (
                      <tr key={`${item.category}-${item.account}`}>
                        <td className="border border-foreground/20 px-2 py-1">{item.category}</td>
                        <td className="border border-foreground/20 px-2 py-1">{item.account}</td>
                        <td className="border border-foreground/20 px-2 py-1 text-right font-mono">{formatUang(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs mb-3">
              <span className="text-muted-foreground">Penerimaan Massal - </span>
              <span className="font-semibold">{printRows.length} Muzakki</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-[10px] border border-foreground/20">
                <thead>
                  <tr className="bg-muted/40">
                    <th rowSpan={2} className="border border-foreground/20 px-1 py-1 text-center w-8">No</th>
                    <th rowSpan={2} className="border border-foreground/20 px-2 py-1 text-left min-w-[200px]">Nama Muzakki</th>
                    <th colSpan={3} className="border border-foreground/20 px-2 py-1 text-center">Zakat Fitrah</th>
                    <th colSpan={1} className="border border-foreground/20 px-2 py-1 text-center">Zakat Maal</th>
                    <th colSpan={3} className="border border-foreground/20 px-2 py-1 text-center">Infaq</th>
                    <th colSpan={1} className="border border-foreground/20 px-2 py-1 text-center">Fidyah</th>
                  </tr>
                  <tr className="bg-muted/40">
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[86px]">Beras (kg)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[86px]">Beras (liter)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[88px]">Uang (Rp)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[88px]">Uang (Rp)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[86px]">Beras (kg)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[86px]">Beras (liter)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[88px]">Uang (Rp)</th>
                    <th className="border border-foreground/20 px-1 py-1 text-center min-w-[88px]">Uang (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {printRows.map((row) => (
                    <tr key={`${row.no}-${row.namaMuzakki}`} className="even:bg-muted/10">
                      <td className="border border-foreground/20 px-1 py-1 text-center text-muted-foreground">
                        {row.no}
                      </td>
                      <td className="border border-foreground/20 px-2 py-1 font-medium">{row.namaMuzakki}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(row.zfBerasKg)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(row.zfBerasLiter)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(row.zfUang)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(row.maalUang)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(row.infakBerasKg)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(row.infakBerasLiter)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(row.infakUang)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(row.fidyahUang)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td colSpan={2} className="border border-foreground/20 px-2 py-1 text-center">Jumlah</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(totals.zfBerasKg)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(totals.zfBerasLiter)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(totals.zfUang)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(totals.maalUang)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(totals.infakBerasKg)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatBeras(totals.infakBerasLiter)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(totals.infakUang)}</td>
                    <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatUang(totals.fidyahUang)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-3 text-[9px] text-red-600 space-y-0.5 print:hidden">
                <p className="font-semibold">Catatan error:</p>
                {result.errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
          </ReceiptShell>

          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Cetak / Print
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          body * { visibility: hidden; }
          #print-content,
          #print-content * { visibility: visible; }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 12px;
            background: white;
            font-size: 8pt;
          }
          #print-content table {
            font-size: 7pt;
          }
        }
      `}</style>
    </>
  );
}
