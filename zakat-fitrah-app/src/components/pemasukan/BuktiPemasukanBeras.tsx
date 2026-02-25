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
  kategori: 'fidyah_beras' | 'infak_sedekah_beras' | 'zakat_fitrah_beras' | 'maal_beras';
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
    const labels: Record<string, string> = {
      fidyah_beras: 'Fidyah (Beras)',
      infak_sedekah_beras: 'Infak/Sedekah (Beras)',
      zakat_fitrah_beras: 'Zakat Fitrah (Beras)',
      maal_beras: 'Zakat Maal (Beras)',
    };
    return labels[kategori] || kategori;
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Bukti-Pemasukan-Beras-${data.id.substring(0, 8).toUpperCase()}`,
  });

  const handleDownloadPDF = () => {
    // Create portrait PDF (A5: 148x210mm) matching standard receipt format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
    });

    // Layout constants for A5 portrait
    const MARGIN = 15; // 15mm margin
    const LOGO_SIZE = 20; // 20mm logo
    const SECTION_GAP = 5; // 5mm gap between sections
    const HEADER_GAP = 4; // 4mm header gap
    const DIVIDER_HEIGHT = 0.5; // 0.5mm divider
    const ORGANIZATION_NAME = 'YAYASAN AL-FAJAR PERMATA PAMULANG';
    const ORGANIZATION_ADDRESS = 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan';
    const ORGANIZATION_EMAIL = 'permataalfajar@gmail.com';
    const ORGANIZATION_SERVICE = 'Layanan Al Fajar 0877-1335-9800 (WA Only)';

    const pageWidth = doc.internal.pageSize.getWidth(); // 148mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

    // Set white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let yPosition = MARGIN;
    const leftX = MARGIN;

    // ============ HEADER SECTION ============
    // Logo centered
    const logoX = (pageWidth - LOGO_SIZE) / 2;
    try {
      doc.addImage('/logo-al-fajar.png', 'PNG', logoX, yPosition, LOGO_SIZE, LOGO_SIZE);
    } catch (error) {
      console.warn('Could not embed logo image:', error);
    }

    yPosition += LOGO_SIZE + HEADER_GAP;

    // Organization details - centered
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text(ORGANIZATION_NAME, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    const addressLines = doc.splitTextToSize(ORGANIZATION_ADDRESS, pageWidth - (MARGIN * 2));
    doc.text(addressLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4 * addressLines.length;
    
    doc.text(`Email: ${ORGANIZATION_EMAIL}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text(ORGANIZATION_SERVICE, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += SECTION_GAP;

    // Header line (2px divider)
    doc.setLineWidth(DIVIDER_HEIGHT);
    doc.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
    yPosition += SECTION_GAP;

    // ============ TITLE SECTION ============
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('BUKTI PENERIMAAN BERAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += SECTION_GAP;

    // Receipt number and date
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`No. Bukti: ${data.id.slice(0, 8).toUpperCase()}`, leftX, yPosition);
    yPosition += 4;
    doc.text(
      `Tanggal: ${format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}`,
      leftX,
      yPosition
    );
    yPosition += SECTION_GAP;

    // Details
    const detailLabelX = leftX;
    const detailValueX = leftX + 45; // Value column position

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DETAIL PEMASUKAN', detailLabelX, yPosition);
    yPosition += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Kategori:`, detailLabelX, yPosition);
    doc.text(getCategoryLabel(data.kategori), detailValueX, yPosition);
    yPosition += 5;

    if (data.muzakki) {
      doc.text(`Dari:`, detailLabelX, yPosition);
      doc.text(data.muzakki.nama_kk, detailValueX, yPosition);
      yPosition += 5;
    }

    doc.text(`Jumlah Beras:`, detailLabelX, yPosition);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${formatNumber(data.jumlah_beras_kg)} kg`, detailValueX, yPosition);
    yPosition += 5;

    if (data.catatan) {
      doc.setFont('Helvetica', 'normal');
      doc.text(`Catatan:`, detailLabelX, yPosition);
      const catatanLines = doc.splitTextToSize(data.catatan, pageWidth - MARGIN - detailValueX - 2);
      doc.text(catatanLines, detailValueX, yPosition);
      yPosition += 4 * catatanLines.length;
    }

    yPosition += 8;

    // Separator line
    doc.setLineWidth(0.3);
    doc.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
    yPosition += 8;

    // Footer - Official Signature (matching Bukti Sedekah style)
    const KETUA_NAME_PDF = 'H. Eldin Rizal Nasution';
    const stampW = 39.7;
    const stampH = 15.9;
    const signX = pageWidth - MARGIN - stampW / 2;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('YAYASAN AL-FAJAR PERMATA PAMULANG', signX, yPosition, { align: 'center' });
    yPosition += 3;

    try {
      doc.addImage('/stamp-signature.png', 'PNG', signX - stampW / 2, yPosition, stampW, stampH);
    } catch (error) {
      console.warn('Could not embed stamp image:', error);
    }
    yPosition += stampH + 1;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(KETUA_NAME_PDF, signX, yPosition, { align: 'center' });
    yPosition += 0.5;
    doc.setLineWidth(0.26);
    doc.line(signX - 18.5, yPosition, signX + 18.5, yPosition);
    yPosition += 4;
    doc.setFont('Helvetica', 'normal');
    doc.text('Ketua', signX, yPosition, { align: 'center' });
    yPosition += 8;

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
          <div ref={contentRef} id="print-content" className="space-y-4 py-4">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-3">
                <img src="/logo-al-fajar.png" alt="Logo" className="h-16 w-16" />
              </div>
              <h2 className="text-lg font-bold">YAYASAN AL-FAJAR PERMATA PAMULANG</h2>
              <p className="text-xs">Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan</p>
              <p className="text-xs">Email: permataalfajar@gmail.com</p>
              <p className="text-xs">Layanan Al Fajar 0877-1335-9800 (WA Only)</p>
            </div>

            <Separator />

            <h1 className="text-center text-lg font-bold">BUKTI PEMASUKAN BERAS</h1>

            {/* Receipt Info */}
            <div className="text-xs space-y-1">
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
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Detail Pemasukan</h3>
              <div className="grid gap-1 text-xs">
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

            {/* Signature - Official stamp matching Bukti Sedekah */}
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

            {/* Footer */}
            <p className="text-[10px] text-center text-muted-foreground pt-2">
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
