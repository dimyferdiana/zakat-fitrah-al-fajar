import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ReceiptShell } from './ReceiptShell';
import type { BulkResult, BulkRow } from '@/types/bulk';

interface BulkTandaTerimaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BulkResult;
}

const TABLE_COLS = [
  { key: 'zakatFitrahBeras', label: 'ZF Beras (kg)', beras: true },
  { key: 'zakatFitrahUang',  label: 'ZF Uang (Rp)',  beras: false },
  { key: 'zakatMaalBeras',   label: 'ZM Beras (kg)', beras: true },
  { key: 'zakatMaalUang',    label: 'ZM Uang (Rp)',  beras: false },
  { key: 'infakBeras',       label: 'Inf/Sed Beras (kg)', beras: true },
  { key: 'infakUang',        label: 'Inf/Sed Uang (Rp)',  beras: false },
] as const;

type ColKey = (typeof TABLE_COLS)[number]['key'];

function formatRp(v: number | null) {
  if (!v) return '—';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function formatKg(v: number | null) {
  if (!v) return '—';
  return v.toFixed(2);
}

function colValue(row: BulkRow, key: ColKey, beras: boolean): string {
  const v = row[key];
  if (!v || v === 0) return '—';
  return beras ? formatKg(v) : formatRp(v);
}

function colTotal(rows: BulkRow[], key: ColKey, beras: boolean): string {
  const total = rows.reduce((sum, r) => sum + (r[key] ?? 0), 0);
  if (total === 0) return '—';
  return beras ? total.toFixed(2) : formatRp(total);
}

export function BulkTandaTerima({ open, onOpenChange, result }: BulkTandaTerimaProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Tanda-Terima-Bulk-${result.receiptNo}`,
  });

  const validRows = result.rows.filter((r) => r.muzakkiId !== null);
  const today = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });

  const totalUang = result.rows.reduce(
    (s, r) => s + (r.zakatFitrahUang ?? 0) + (r.zakatMaalUang ?? 0) + (r.infakUang ?? 0),
    0
  );
  const totalBeras = result.rows.reduce(
    (s, r) => s + (r.zakatFitrahBeras ?? 0) + (r.zakatMaalBeras ?? 0) + (r.infakBeras ?? 0),
    0
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Tanda Terima Zakat — Penerimaan Massal</DialogTitle>
            <DialogDescription>
              No. Resi: <span className="font-mono font-semibold">{result.receiptNo}</span>
              {' · '}{validRows.length} muzakki · {today}
            </DialogDescription>
          </DialogHeader>

          {/* ── Printable area ── */}
          <ReceiptShell ref={contentRef} title="TANDA TERIMA ZAKAT (FITRAH / MAL)">
            {/* Receipt meta */}
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
              <span className="text-muted-foreground">Penerimaan Massal — </span>
              <span className="font-semibold">{validRows.length} Muzakki</span>
              {totalUang > 0 && (
                <> · Total Uang: <span className="font-semibold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalUang)}
                </span></>
              )}
              {totalBeras > 0 && (
                <> · Total Beras: <span className="font-semibold">{totalBeras.toFixed(2)} kg</span></>
              )}
            </div>

            {/* Perincian table */}
            <p className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-muted-foreground">Perincian</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[10px] border border-foreground/20">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border border-foreground/20 px-1 py-1 text-center w-7">No</th>
                    <th className="border border-foreground/20 px-2 py-1 text-left min-w-[120px]">Nama Muzakki</th>
                    {TABLE_COLS.map((col) => (
                      <th key={col.key} className="border border-foreground/20 px-1 py-1 text-right min-w-[70px]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={idx} className="even:bg-muted/10">
                      <td className="border border-foreground/20 px-1 py-1 text-center text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="border border-foreground/20 px-2 py-1 font-medium">
                        {row.muzakkiNama}
                      </td>
                      {TABLE_COLS.map((col) => (
                        <td key={col.key} className="border border-foreground/20 px-1 py-1 text-right font-mono">
                          {colValue(row, col.key, col.beras)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="bg-muted/30 font-semibold">
                    <td colSpan={2} className="border border-foreground/20 px-2 py-1 text-right">
                      Total
                    </td>
                    {TABLE_COLS.map((col) => (
                      <td key={col.key} className="border border-foreground/20 px-1 py-1 text-right font-mono">
                        {colTotal(result.rows, col.key, col.beras)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Submission errors if any */}
            {result.errors.length > 0 && (
              <div className="mt-3 text-[9px] text-red-600 space-y-0.5 print:hidden">
                <p className="font-semibold">Catatan error:</p>
                {result.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </ReceiptShell>

          {/* Actions */}
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

      {/* Landscape print styles */}
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
