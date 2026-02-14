import { useRef, useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';

interface Muzakki {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface PembayaranZakat {
  id: string;
  muzakki_id: string;
  muzakki: Muzakki;
  tahun_zakat_id: string;
  tanggal_bayar: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
}

interface BuktiPembayaranProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PembayaranZakat;
}

export function BuktiPembayaran({ open, onOpenChange, data }: BuktiPembayaranProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [sedekahAmount, setSedekahAmount] = useState<number | null>(null);

  const checkForSedekahRecord = async () => {
    try {
      const tableName = data.jenis_zakat === 'uang' ? 'pemasukan_uang' : 'pemasukan_beras';
      const amountField = data.jenis_zakat === 'uang' ? 'jumlah_uang_rp' : 'jumlah_beras_kg';
      
      const { data: sedekahData, error } = await supabase
        .from(tableName)
        .select(amountField)
        .eq('muzakki_id', data.muzakki_id)
        .eq('tanggal', data.tanggal_bayar)
        .maybeSingle();

      if (!error && sedekahData) {
        setSedekahAmount(sedekahData[amountField]);
      } else {
        setSedekahAmount(null);
      }
    } catch (error) {
      console.error('Error fetching sedekah record:', error);
      setSedekahAmount(null);
    }
  };

  // Check for related sedekah record when dialog opens
  useEffect(() => {
    if (open && data) {
      checkForSedekahRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  const hasSplitPayment = sedekahAmount !== null && sedekahAmount > 0;
  const totalPayment = hasSplitPayment
    ? (data.jenis_zakat === 'beras'
        ? (data.jumlah_beras_kg || 0) + sedekahAmount
        : (data.jumlah_uang_rp || 0) + sedekahAmount)
    : (data.jenis_zakat === 'beras' ? data.jumlah_beras_kg : data.jumlah_uang_rp);

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Bukti-Pembayaran-${data.id.substring(0, 8).toUpperCase()}`,
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
    doc.text('BUKTI PEMBAYARAN ZAKAT FITRAH', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += SECTION_GAP;

    // Receipt number and date
    doc.setFontSize(11 * 0.75);
    doc.setFont('Helvetica', 'normal');
    doc.text(`No. Bukti: ${data.id.slice(0, 8).toUpperCase()}`, leftX, yPosition);
    doc.text(
      `Tanggal: ${format(new Date(data.tanggal_bayar), 'dd MMMM yyyy', { locale: idLocale })}`,
      pageWidth - MARGIN,
      yPosition,
      { align: 'right' }
    );
    yPosition += SECTION_GAP;

    // Muzakki details
    const detailLabelX = leftX;
    const detailValueX = leftX + 50; // Value column position

    doc.setFont('Helvetica', 'bold');
    doc.text('DATA MUZAKKI', detailLabelX, yPosition);
    yPosition += 7;

    doc.setFont('Helvetica', 'normal');
    doc.text(`Nama Kepala Keluarga:`, detailLabelX, yPosition);
    doc.text(data.muzakki.nama_kk, detailValueX, yPosition);
    yPosition += 6;

    doc.text(`Alamat:`, detailLabelX, yPosition);
    const alamatLines = doc.splitTextToSize(data.muzakki.alamat, pageWidth - MARGIN - detailValueX - 5);
    doc.text(alamatLines, detailValueX, yPosition);
    yPosition += 6 * alamatLines.length;

    if (data.muzakki.no_telp) {
      doc.text(`No. Telepon:`, detailLabelX, yPosition);
      doc.text(data.muzakki.no_telp, detailValueX, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Payment details
    doc.setFont('Helvetica', 'bold');
    doc.text('DETAIL PEMBAYARAN', detailLabelX, yPosition);
    yPosition += 7;

    doc.setFont('Helvetica', 'normal');
    doc.text(`Jumlah Jiwa:`, detailLabelX, yPosition);
    doc.text(`${data.jumlah_jiwa} jiwa`, detailValueX, yPosition);
    yPosition += 6;

    doc.text(`Jenis Zakat:`, detailLabelX, yPosition);
    doc.text(data.jenis_zakat === 'beras' ? 'Beras' : 'Uang', detailValueX, yPosition);
    yPosition += 6;

    doc.text(`Total:`, detailLabelX, yPosition );
    doc.setFont('Helvetica', 'bold');
    
    if (hasSplitPayment) {
      // Show split payment details
      doc.setFont('Helvetica', 'normal');
      doc.text(`Zakat Fitrah:`, detailLabelX + 10, yPosition);
      const zakatText =
        data.jenis_zakat === 'beras'
          ? `${formatNumber(data.jumlah_beras_kg)} kg`
          : formatCurrency(data.jumlah_uang_rp);
      doc.text(zakatText, detailValueX, yPosition);
      yPosition += 6;

      doc.text(`Sedekah/Infak:`, detailLabelX + 10, yPosition);
      const sedekahText =
        data.jenis_zakat === 'beras'
          ? `${sedekahAmount.toFixed(2)} kg`
          : formatCurrency(sedekahAmount);
      doc.text(sedekahText, detailValueX, yPosition);
      yPosition += 6;

      // Separator line
      doc.setLineWidth(0.1);
      doc.line(detailLabelX + 10, yPosition, detailValueX + 40, yPosition);
      yPosition += 4;

      doc.setFont('Helvetica', 'bold');
      doc.text(`Total Pembayaran:`, detailLabelX + 10, yPosition);
      const totalText =
        data.jenis_zakat === 'beras'
          ? `${(totalPayment || 0).toFixed(2)} kg`
          : formatCurrency(totalPayment || 0);
      doc.text(totalText, detailValueX, yPosition);
      yPosition += 10;

      // Thank you message
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      const thankYouMsg = 'Terima kasih atas kontribusi sedekah Anda';
      doc.text(thankYouMsg, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    } else {
      const totalText =
        data.jenis_zakat === 'beras'
          ? `${formatNumber(data.jumlah_beras_kg)} kg`
          : formatCurrency(data.jumlah_uang_rp);
      doc.text(totalText, detailValueX, yPosition);
      yPosition += 15;
    }

    // Separator line
    doc.setLineWidth(0.3);
    doc.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
    yPosition += 10;

    // Footer - Signature
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Petugas,', leftX, yPosition);
    doc.text('Penerima,', pageWidth - MARGIN - 40, yPosition);
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
    doc.save(`bukti-zakat-${data.muzakki.nama_kk.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Bukti Pembayaran Zakat Fitrah</DialogTitle>
            <DialogDescription>
              Cetak atau download bukti pembayaran untuk {data.muzakki.nama_kk}
            </DialogDescription>
          </DialogHeader>

          {/* Print Content */}
          <div ref={contentRef} id="print-content" className="space-y-6 py-4">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">BUKTI PEMBAYARAN ZAKAT FITRAH</h1>
              <p className="text-lg font-medium mt-2">Masjid Al-Fajar</p>
              <p className="text-sm text-muted-foreground">Jl. Contoh Alamat No. 123</p>
            </div>

            <Separator />

            {/* Receipt Info */}
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">No. Bukti:</span>
                <span className="ml-2 font-medium">{data.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tanggal:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(data.tanggal_bayar), 'dd MMMM yyyy', { locale: idLocale })}
                </span>
              </div>
            </div>

            <Separator />

            {/* Muzakki Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Data Muzakki</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex">
                  <span className="w-40 text-muted-foreground">Nama Kepala Keluarga:</span>
                  <span className="font-medium">{data.muzakki.nama_kk}</span>
                </div>
                <div className="flex">
                  <span className="w-40 text-muted-foreground">Alamat:</span>
                  <span className="font-medium">{data.muzakki.alamat}</span>
                </div>
                {data.muzakki.no_telp && (
                  <div className="flex">
                    <span className="w-40 text-muted-foreground">No. Telepon:</span>
                    <span className="font-medium">{data.muzakki.no_telp}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Detail Pembayaran</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex">
                  <span className="w-40 text-muted-foreground">Jumlah Jiwa:</span>
                  <span className="font-medium">{data.jumlah_jiwa} jiwa</span>
                </div>
                <div className="flex">
                  <span className="w-40 text-muted-foreground">Jenis Zakat:</span>
                  <span className="font-medium">
                    {data.jenis_zakat === 'beras' ? 'Beras' : 'Uang'}
                  </span>
                </div>
                
                {hasSplitPayment ? (
                  <>
                    <div className="flex items-center">
                      <span className="w-40 text-muted-foreground">Zakat Fitrah:</span>
                      <span className="text-lg font-semibold">
                        {data.jenis_zakat === 'beras'
                          ? `${formatNumber(data.jumlah_beras_kg)} kg`
                          : formatCurrency(data.jumlah_uang_rp)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-40 text-muted-foreground">Sedekah/Infak:</span>
                      <span className="text-lg font-semibold text-green-700">
                        {data.jenis_zakat === 'beras'
                          ? `${sedekahAmount.toFixed(2)} kg`
                          : formatCurrency(sedekahAmount)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center">
                      <span className="w-40 text-muted-foreground font-semibold">Total Pembayaran:</span>
                      <span className="text-xl font-bold">
                        {data.jenis_zakat === 'beras'
                          ? `${(totalPayment || 0).toFixed(2)} kg`
                          : formatCurrency(totalPayment || 0)}
                      </span>
                    </div>
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800 italic text-center">
                      Terima kasih atas kontribusi sedekah Anda
                    </div>
                  </>
                ) : (
                  <div className="flex items-center">
                    <span className="w-40 text-muted-foreground">Total:</span>
                    <span className="text-xl font-bold">
                      {data.jenis_zakat === 'beras'
                        ? `${formatNumber(data.jumlah_beras_kg)} kg`
                        : formatCurrency(data.jumlah_uang_rp)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="text-center">
                <p className="text-sm mb-16">Petugas,</p>
                <div className="border-t border-foreground pt-1 inline-block min-w-[150px]">
                  <p className="text-xs">Nama & Tanda Tangan</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm mb-16">Penerima,</p>
                <div className="border-t border-foreground pt-1 inline-block min-w-[150px]">
                  <p className="text-xs">Nama & Tanda Tangan</p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-xs text-muted-foreground pt-4">
              <p>Simpan bukti ini sebagai tanda terima yang sah</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }

          body * {
            visibility: hidden;
          }

          #print-content,
          #print-content * {
            visibility: visible;
          }

          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
        }
      `}</style>
    </>
  );
}
