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
import { ReceiptShell } from '@/components/pemasukan/ReceiptShell';
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
    doc.text('BUKTI PEMBAYARAN ZAKAT FITRAH', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += SECTION_GAP;

    // Receipt number and date
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`No. Bukti: ${data.id.slice(0, 8).toUpperCase()}`, leftX, yPosition);
    yPosition += 4;
    doc.text(
      `Tanggal: ${format(new Date(data.tanggal_bayar), 'dd MMMM yyyy', { locale: idLocale })}`,
      leftX,
      yPosition
    );
    yPosition += SECTION_GAP;

    // Muzakki details
    const detailLabelX = leftX;
    const detailValueX = leftX + 45; // Value column position

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATA MUZAKKI', detailLabelX, yPosition);
    yPosition += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nama KK:`, detailLabelX, yPosition);
    doc.text(data.muzakki.nama_kk, detailValueX, yPosition);
    yPosition += 5;

    doc.text(`Alamat:`, detailLabelX, yPosition);
    const alamatLines = doc.splitTextToSize(data.muzakki.alamat, pageWidth - MARGIN - detailValueX - 2);
    doc.text(alamatLines, detailValueX, yPosition);
    yPosition += 4 * alamatLines.length;

    if (data.muzakki.no_telp) {
      doc.text(`No. Telp:`, detailLabelX, yPosition);
      doc.text(data.muzakki.no_telp, detailValueX, yPosition);
      yPosition += 5;
    }

    yPosition += 3;

    // Payment details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DETAIL PEMBAYARAN', detailLabelX, yPosition);
    yPosition += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Jumlah Jiwa:`, detailLabelX, yPosition);
    doc.text(`${data.jumlah_jiwa} jiwa`, detailValueX, yPosition);
    yPosition += 5;

    doc.text(`Jenis Zakat:`, detailLabelX, yPosition);
    doc.text(data.jenis_zakat === 'beras' ? 'Beras' : 'Uang', detailValueX, yPosition);
    yPosition += 5;

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
          <ReceiptShell ref={contentRef} title="BUKTI PEMBAYARAN ZAKAT FITRAH">

            {/* Receipt Info */}
            <div className="text-xs space-y-1">
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
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Data Muzakki</h3>
              <div className="grid gap-1 text-xs">
                <div className="flex">
                  <span className="w-32 text-muted-foreground">Nama KK:</span>
                  <span className="font-medium">{data.muzakki.nama_kk}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-muted-foreground">Alamat:</span>
                  <span className="font-medium">{data.muzakki.alamat}</span>
                </div>
                {data.muzakki.no_telp && (
                  <div className="flex">
                    <span className="w-32 text-muted-foreground">No. Telp:</span>
                    <span className="font-medium">{data.muzakki.no_telp}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Detail Pembayaran</h3>
              <div className="grid gap-1 text-xs">
                <div className="flex">
                  <span className="w-32 text-muted-foreground">Jumlah Jiwa:</span>
                  <span className="font-medium">{data.jumlah_jiwa} jiwa</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-muted-foreground">Jenis Zakat:</span>
                  <span className="font-medium">
                    {data.jenis_zakat === 'beras' ? 'Beras' : 'Uang'}
                  </span>
                </div>
                
                {hasSplitPayment ? (
                  <>
                    <div className="flex items-center">
                      <span className="w-32 text-muted-foreground">Zakat Fitrah:</span>
                      <span className="text-sm font-semibold">
                        {data.jenis_zakat === 'beras'
                          ? `${formatNumber(data.jumlah_beras_kg)} kg`
                          : formatCurrency(data.jumlah_uang_rp)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 text-muted-foreground">Sedekah/Infak:</span>
                      <span className="text-sm font-semibold text-green-700">
                        {data.jenis_zakat === 'beras'
                          ? `${sedekahAmount.toFixed(2)} kg`
                          : formatCurrency(sedekahAmount)}
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center">
                      <span className="w-32 text-muted-foreground font-semibold">Total Pembayaran:</span>
                      <span className="text-base font-bold">
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
                    <span className="w-32 text-muted-foreground">Total:</span>
                    <span className="text-base font-bold">
                      {data.jenis_zakat === 'beras'
                        ? `${formatNumber(data.jumlah_beras_kg)} kg`
                        : formatCurrency(data.jumlah_uang_rp)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </ReceiptShell>

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
