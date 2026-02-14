import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import jsPDF from 'jspdf';

interface PemasukanBeras {
  id: string;
  tahun_zakat_id: string;
  muzakki_id: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
  kategori: 'fidyah_beras' | 'infak_sedekah_beras' | 'zakat_fitrah_beras';
  jumlah_beras_kg: number;
  tanggal: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
}

interface BuktiPemasukanBerasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PemasukanBeras;
}

export function BuktiPemasukanBeras({ open, onOpenChange, data }: BuktiPemasukanBerasProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const getCategoryLabel = (kategori: PemasukanBeras['kategori']) => {
    const labels = {
      fidyah_beras: 'Fidyah (Beras)',
      infak_sedekah_beras: 'Infak/Sedekah (Beras)',
      zakat_fitrah_beras: 'Zakat Fitrah (Beras)',
    };
    return labels[kategori] || kategori;
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Bukti-Pemasukan-Beras-${data.id.substring(0, 8).toUpperCase()}`,
  });

  const handleDownloadPDF = () => {
    // Create landscape PDF (A5: 210x148mm) matching standard receipt format
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
    });

    // Layout constants matching receipt-design.pen frame specs
    const SCALE_FACTOR = 210 / 800; // A5 width / design width
    const MARGIN = 80 * SCALE_FACTOR; // 80px padding = 21mm
    const LOGO_SIZE = 80 * SCALE_FACTOR; // 80px = 21mm
    const SECTION_GAP = 20 * SCALE_FACTOR; // 20px main gap = 5.25mm
    const HEADER_GAP = 16 * SCALE_FACTOR; // 16px header gap = 4.2mm
    const DIVIDER_HEIGHT = 2 * SCALE_FACTOR; // 2px = 0.525mm
    const TOP_SHIFT = -8; // shift content up by 8mm
    const ORGANIZATION_NAME = 'YAYASAN AL-FAJAR PERMATA PAMULANG';
    const ORGANIZATION_ADDRESS = 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan';
    const ORGANIZATION_EMAIL = 'permataalfajar@gmail.com';
    const ORGANIZATION_SERVICE = 'Layanan Al Fajar 0877-1335-9800 (WA Only)';

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 148mm

    // Set white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let yPosition = MARGIN + TOP_SHIFT;
    const leftX = MARGIN;

    // ============ HEADER SECTION ============
    // Calculate centered group position (logo + gap + text)
    const headerGapPx = 5; // 16px gap ≈ 5mm
    const textGroupWidth = 90; // Approximate width of organization text
    const totalHeaderWidth = LOGO_SIZE + headerGapPx + textGroupWidth;
    const headerStartX = (pageWidth - totalHeaderWidth) / 2; // Center the entire group

    // Logo (left side of centered group)
    try {
      doc.addImage('/logo-al-fajar.png', 'PNG', headerStartX, yPosition, LOGO_SIZE, LOGO_SIZE);
    } catch (error) {
      console.warn('Could not embed logo image:', error);
    }

    // Text positioned right of logo with gap
    const headerTextX = headerStartX + LOGO_SIZE + HEADER_GAP;
    const headerTextGap = 4 * SCALE_FACTOR; // 4px gap between lines

    // Organization name (16px, bold)
    doc.setFontSize(16 * 0.75); // Convert px to pt (16px ≈ 12pt)
    doc.setFont('Helvetica', 'bold');
    const orgNameY = yPosition + (LOGO_SIZE / 2) - 2; // Vertically center with logo
    doc.text(ORGANIZATION_NAME, headerTextX, orgNameY);

    // Organization details (11px, normal, 4px gap)
    doc.setFontSize(11 * 0.75); // 11px ≈ 8.25pt
    doc.setFont('Helvetica', 'normal');
    const addressY = orgNameY + 4 + headerTextGap;
    doc.text(ORGANIZATION_ADDRESS, headerTextX, addressY);
    doc.text(`Email : ${ORGANIZATION_EMAIL}`, headerTextX, addressY + 3 + headerTextGap);
    doc.text(ORGANIZATION_SERVICE, headerTextX, addressY + 6 + headerTextGap * 2);

    yPosition += LOGO_SIZE + SECTION_GAP;

    // Header line (2px divider)
    doc.setLineWidth(DIVIDER_HEIGHT);
    doc.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
    yPosition += SECTION_GAP;

    // ============ TITLE SECTION ============
    doc.setFontSize(14 * 0.75); // 14px ≈ 10.5pt
    doc.setFont('Helvetica', 'bold');
    doc.text('BUKTI PEMASUKAN BERAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += SECTION_GAP;

    // Receipt number and date
    doc.setFontSize(11 * 0.75);
    doc.setFont('Helvetica', 'normal');
    doc.text(`No. Bukti: ${data.id.slice(0, 8).toUpperCase()}`, leftX, yPosition);
    doc.text(
      `Tanggal: ${format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}`,
      pageWidth - MARGIN,
      yPosition,
      { align: 'right' }
    );
    yPosition += SECTION_GAP;

    // Details
    const detailLabelX = leftX;
    const detailValueX = leftX + 50; // Value column position

    doc.setFont('Helvetica', 'bold');
    doc.text('DETAIL PEMASUKAN', detailLabelX, yPosition);
    yPosition += 7;

    doc.setFont('Helvetica', 'normal');
    doc.text(`Kategori:`, detailLabelX, yPosition);
    doc.text(getCategoryLabel(data.kategori), detailValueX, yPosition);
    yPosition += 6;

    if (data.muzakki) {
      doc.text(`Dari:`, detailLabelX, yPosition);
      doc.text(data.muzakki.nama_kk, detailValueX, yPosition);
      yPosition += 6;
    }

    doc.text(`Jumlah Beras:`, detailLabelX, yPosition);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${formatNumber(data.jumlah_beras_kg)} kg`, detailValueX, yPosition);
    yPosition += 6;

    if (data.catatan) {
      doc.setFont('Helvetica', 'normal');
      doc.text(`Catatan:`, detailLabelX, yPosition);
      const catatanLines = doc.splitTextToSize(data.catatan, pageWidth - MARGIN - detailValueX - 5);
      doc.text(catatanLines, detailValueX, yPosition);
      yPosition += 6 * catatanLines.length;
    }

    yPosition += 10;

    // Separator line
    doc.setLineWidth(0.3);
    doc.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
    yPosition += 10;

    // Footer - Signature
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Petugas,', leftX, yPosition);
    doc.text('Penyetor,', pageWidth - MARGIN - 40, yPosition);
    yPosition += 20;

    doc.text('(_________________)', leftX, yPosition);
    doc.text('(_________________)', pageWidth - MARGIN - 40, yPosition);
    yPosition += 10;

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      'Simpan bukti ini sebagai tanda terima yang sah',
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );

    // Save PDF
    const filename = data.muzakki 
      ? `bukti-pemasukan-beras-${data.muzakki.nama_kk.replace(/\s+/g, '-')}.pdf`
      : `bukti-pemasukan-beras-${data.id.slice(0, 8)}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Bukti Pemasukan Beras</DialogTitle>
            <DialogDescription>
              Cetak atau download bukti pemasukan untuk referensi
            </DialogDescription>
          </DialogHeader>

          {/* Print Content */}
          <div ref={contentRef} id="print-content" className="space-y-6 py-4">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">BUKTI PEMASUKAN BERAS</h1>
              <p className="text-lg font-medium mt-2">YAYASAN AL-FAJAR PERMATA PAMULANG</p>
              <p className="text-sm text-muted-foreground">Jl. Bukit Permata VII Blok E20/16</p>
            </div>

            <Separator />

            {/* Receipt Info */}
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-medium">No. Bukti:</span>{' '}
                {data.id.substring(0, 8).toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Tanggal:</span>{' '}
                {format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-3">
              <h3 className="font-semibold">Detail Pemasukan</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Kategori</p>
                  <p className="font-medium">{getCategoryLabel(data.kategori)}</p>
                </div>
                {data.muzakki && (
                  <div>
                    <p className="text-muted-foreground">Dari</p>
                    <p className="font-medium">{data.muzakki.nama_kk}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Jumlah Beras</p>
                  <p className="font-semibold text-lg">{formatNumber(data.jumlah_beras_kg)} kg</p>
                </div>
              </div>
              {data.catatan && (
                <div>
                  <p className="text-muted-foreground text-sm">Catatan</p>
                  <p className="text-sm">{data.catatan}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Signatures */}
            <div className="flex justify-between text-sm pt-8">
              <div className="text-center">
                <p>Petugas</p>
                <div className="mt-16 border-t border-foreground pt-1 w-32">
                  (.....................)
                </div>
              </div>
              <div className="text-center">
                <p>Penyetor</p>
                <div className="mt-16 border-t border-foreground pt-1 w-32">
                  (.....................)
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground pt-4">
              Simpan bukti ini sebagai tanda terima yang sah
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
