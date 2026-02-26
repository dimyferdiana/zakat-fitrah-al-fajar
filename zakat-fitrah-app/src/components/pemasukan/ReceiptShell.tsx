import { forwardRef } from 'react';
import { Separator } from '@/components/ui/separator';

/**
 * ReceiptShell — shared printable wrapper for all receipt types.
 *
 * Renders the standard Al-Fajar organization header, a title, the
 * provided children (receipt-specific content), and the standard
 * signature/footer block.
 *
 * Use with forwardRef so the parent can pass a contentRef for react-to-print:
 *   <ReceiptShell ref={contentRef} title="BUKTI PEMASUKAN UANG">
 *     ...content...
 *   </ReceiptShell>
 */

interface ReceiptShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const ReceiptShell = forwardRef<HTMLDivElement, ReceiptShellProps>(
  ({ title, children, className, id }, ref) => {
    return (
      <div
        ref={ref}
        id={id ?? 'print-content'}
        className={`space-y-4 py-4 ${className ?? ''}`}
      >
        {/* ── Organization Header ── */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <img src="/logo-al-fajar.png" alt="Logo Al-Fajar" className="h-16 w-16" />
          </div>
          <h2 className="text-lg font-bold">YAYASAN AL-FAJAR PERMATA PAMULANG</h2>
          <p className="text-xs">
            Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan
          </p>
          <p className="text-xs">Email: permataalfajar@gmail.com</p>
          <p className="text-xs">Layanan Al Fajar 0877-1335-9800 (WA Only)</p>
        </div>

        <Separator />

        <h1 className="text-center text-lg font-bold">{title}</h1>

        {/* ── Receipt-specific content ── */}
        {children}

        <Separator />

        {/* ── Signature Section ── */}
        <div className="flex justify-end pt-4 pb-2">
          <div className="text-center text-xs space-y-1">
            <p className="font-bold text-[11px]">YAYASAN AL-FAJAR PERMATA PAMULANG</p>
            <img
              src="/stamp-signature.png"
              alt="Tanda Tangan &amp; Stempel"
              className="h-16 mx-auto"
            />
            <div>
              <p className="font-bold underline">H. Eldin Rizal Nasution</p>
              <p>Ketua</p>
            </div>
          </div>
        </div>

        {/* ── Footer Note ── */}
        <div className="text-center text-[10px] text-muted-foreground pt-2">
          <p>Simpan bukti ini sebagai tanda terima yang sah</p>
        </div>
      </div>
    );
  }
);

ReceiptShell.displayName = 'ReceiptShell';
