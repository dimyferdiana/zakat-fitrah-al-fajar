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

function formatTypeLabel(type: BulkRow['transactionType']) {
  if (type === 'zakat_fitrah') return 'Zakat Fitrah';
  if (type === 'maal') return 'Maal';
  if (type === 'infak') return 'Infak';
  if (type === 'fidyah') return 'Fidyah';
  return '-';
}

function formatMediumLabel(medium: BulkRow['paymentMedium']) {
  if (medium === 'uang') return 'Uang';
  if (medium === 'beras_kg') return 'Beras';
  if (medium === 'beras_liter') return 'Beras';
  return '-';
}

function formatUnitLabel(unit: BulkRow['unit']) {
  if (unit === 'rp') return 'Rp';
  if (unit === 'kg') return 'kg';
  if (unit === 'liter') return 'liter';
  return '-';
}

function formatAmount(row: BulkRow) {
  if (!row.amount) return '-';

  if (row.paymentMedium === 'uang') {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(row.amount);
  }

  return row.amount.toFixed(2);
}

export function BulkTandaTerima({ open, onOpenChange, result }: BulkTandaTerimaProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Tanda-Terima-Bulk-${result.receiptNo}`,
  });

  const today = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });
  const validRows = result.rows.filter((row) => row.muzakkiId !== null);

  const totals = result.rows.reduce(
    (acc, row) => {
      if (!row.amount || !row.paymentMedium) return acc;
      if (row.paymentMedium === 'uang') acc.uang += row.amount;
      if (row.paymentMedium === 'beras_kg') acc.kg += row.amount;
      if (row.paymentMedium === 'beras_liter') acc.liter += row.amount;
      return acc;
    },
    { uang: 0, kg: 0, liter: 0 }
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Tanda Terima Zakat - Penerimaan Massal</DialogTitle>
            <DialogDescription>
              No. Resi: <span className="font-mono font-semibold">{result.receiptNo}</span>
              {' · '}
              {validRows.length} baris · {today}
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

            <div className="text-xs mb-3">
              <span className="text-muted-foreground">Penerimaan Massal - </span>
              <span className="font-semibold">{validRows.length} Baris</span>
              {totals.uang > 0 && (
                <>
                  {' · '}Total Uang:{' '}
                  <span className="font-semibold">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(totals.uang)}
                  </span>
                </>
              )}
              {totals.kg > 0 && (
                <>
                  {' · '}Total Beras (kg): <span className="font-semibold">{totals.kg.toFixed(2)} kg</span>
                </>
              )}
              {totals.liter > 0 && (
                <>
                  {' · '}Total Beras (liter):{' '}
                  <span className="font-semibold">{totals.liter.toFixed(2)} liter</span>
                </>
              )}
            </div>

            <p className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-muted-foreground">Perincian</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[10px] border border-foreground/20">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border border-foreground/20 px-1 py-1 text-center w-7">No</th>
                    <th className="border border-foreground/20 px-2 py-1 text-left min-w-[120px]">Nama Muzakki</th>
                    <th className="border border-foreground/20 px-2 py-1 text-left min-w-[80px]">Tipe</th>
                    <th className="border border-foreground/20 px-2 py-1 text-left min-w-[70px]">Media</th>
                    <th className="border border-foreground/20 px-1 py-1 text-right min-w-[80px]">Nilai</th>
                    <th className="border border-foreground/20 px-2 py-1 text-left min-w-[60px]">Satuan</th>
                    <th className="border border-foreground/20 px-2 py-1 text-left min-w-[120px]">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={`${row.muzakkiId ?? row.muzakkiNama}-${idx}`} className="even:bg-muted/10">
                      <td className="border border-foreground/20 px-1 py-1 text-center text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="border border-foreground/20 px-2 py-1 font-medium">{row.muzakkiNama}</td>
                      <td className="border border-foreground/20 px-2 py-1">{formatTypeLabel(row.transactionType)}</td>
                      <td className="border border-foreground/20 px-2 py-1">{formatMediumLabel(row.paymentMedium)}</td>
                      <td className="border border-foreground/20 px-1 py-1 text-right font-mono">{formatAmount(row)}</td>
                      <td className="border border-foreground/20 px-2 py-1">{formatUnitLabel(row.unit)}</td>
                      <td className="border border-foreground/20 px-2 py-1">{row.notes.trim() || '-'}</td>
                    </tr>
                  ))}
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
