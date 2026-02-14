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

type PemasukanUangKategori =
  | 'zakat_fitrah_uang'
  | 'fidyah_uang'
  | 'maal_penghasilan_uang'
  | 'infak_sedekah_uang';

type AkunUang = 'kas' | 'bank';

interface PemasukanUang {
  id: string;
  tahun_zakat_id: string;
  muzakki_id: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
  kategori: PemasukanUangKategori;
  akun: AkunUang;
  jumlah_uang_rp: number;
  tanggal: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
}

interface BuktiPemasukanUangProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PemasukanUang;
}

export function BuktiPemasukanUang({ open, onOpenChange, data }: BuktiPemasukanUangProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryLabel = (kategori: PemasukanUangKategori) => {
    const labels = {
      zakat_fitrah_uang: 'Zakat Fitrah (Uang)',
      fidyah_uang: 'Fidyah (Uang)',
      maal_penghasilan_uang: 'Zakat Maal Penghasilan (Uang)',
      infak_sedekah_uang: 'Infak/Sedekah (Uang)',
    };
    return labels[kategori] || kategori;
  };

  const getAkunLabel = (akun: AkunUang) => {
    return akun === 'kas' ? 'Kas' : 'Bank';
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Bukti-Pemasukan-Uang-${data.id.substring(0, 8).toUpperCase()}`,
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

    yPosition += LOGO_SIZE + SECTION_GAP;

    // Header line (2px divider)
    doc.setLineWidth(DIVIDER_HEIGHT);
    doc.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
    yPosition += SECTION_GAP;

    // ============ TITLE SECTION ============
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('BUKTI PEMASUKAN UANG', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += SECTION_GAP + 2;

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

    doc.text(`Akun:`, detailLabelX, yPosition);
    doc.text(getAkunLabel(data.akun), detailValueX, yPosition);
    yPosition += 5;

    if (data.muzakki) {
      doc.text(`Dari:`, detailLabelX, yPosition);
      doc.text(data.muzakki.nama_kk, detailValueX, yPosition);
      yPosition += 5;
    }

    doc.text(`Jumlah Uang:`, detailLabelX, yPosition);
    doc.setFont('Helvetica', 'bold');
    doc.text(formatCurrency(data.jumlah_uang_rp), detailValueX, yPosition);
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
      ? `bukti-pemasukan-uang-${data.muzakki.nama_kk.replace(/\s+/g, '-')}.pdf`
      : `bukti-pemasukan-uang-${data.id.slice(0, 8)}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Bukti Pemasukan Uang</DialogTitle>
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

            <h1 className="text-center text-lg font-bold">BUKTI PEMASUKAN UANG</h1>

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
                <div>
                  <p className="text-muted-foreground">Akun</p>
                  <p className="font-medium">{getAkunLabel(data.akun)}</p>
                </div>
                {data.muzakki && (
                  <div>
                    <p className="text-muted-foreground">Dari</p>
                    <p className="font-medium">{data.muzakki.nama_kk}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Jumlah Uang</p>
                  <p className="font-semibold text-base">{formatCurrency(data.jumlah_uang_rp)}</p>
                </div>
              </div>
              {data.catatan && (
                <div>
                  <p className="text-muted-foreground text-xs">Catatan</p>
                  <p className="text-xs">{data.catatan}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Signatures */}
            <div className="flex justify-between text-sm pt-6">
              <div className="text-center">
                <p className="text-xs">Petugas</p>
                <div className="mt-12 border-t border-foreground pt-1 w-28">
                  <p className="text-[10px]">(......................)</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs">Penyetor</p>
                <div className="mt-12 border-t border-foreground pt-1 w-28">
                  <p className="text-[10px]">(......................)</p>
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
