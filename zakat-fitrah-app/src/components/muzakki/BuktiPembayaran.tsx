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
  const [isLoadingSedekah, setIsLoadingSedekah] = useState(false);

  // Check for related sedekah record when dialog opens
  useEffect(() => {
    if (open && data) {
      checkForSedekahRecord();
    }
  }, [open, data]);

  const checkForSedekahRecord = async () => {
    setIsLoadingSedekah(true);
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
    } finally {
      setIsLoadingSedekah(false);
    }
  };

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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BUKTI PEMBAYARAN ZAKAT FITRAH', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Masjid Al-Fajar', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;

    doc.setFontSize(10);
    doc.text('Jl. Contoh Alamat No. 123', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Receipt number and date
    doc.setFontSize(10);
    doc.text(`No. Bukti: ${data.id.slice(0, 8).toUpperCase()}`, 20, yPosition);
    doc.text(
      `Tanggal: ${format(new Date(data.tanggal_bayar), 'dd MMMM yyyy', { locale: idLocale })}`,
      pageWidth - 20,
      yPosition,
      { align: 'right' }
    );
    yPosition += 15;

    // Muzakki details
    doc.setFont('helvetica', 'bold');
    doc.text('DATA MUZAKKI', 20, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Nama Kepala Keluarga:`, 20, yPosition);
    doc.text(data.muzakki.nama_kk, 70, yPosition);
    yPosition += 6;

    doc.text(`Alamat:`, 20, yPosition);
    const alamatLines = doc.splitTextToSize(data.muzakki.alamat, pageWidth - 90);
    doc.text(alamatLines, 70, yPosition);
    yPosition += 6 * alamatLines.length;

    if (data.muzakki.no_telp) {
      doc.text(`No. Telepon:`, 20, yPosition);
      doc.text(data.muzakki.no_telp, 70, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Payment details
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL PEMBAYARAN', 20, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Jumlah Jiwa:`, 20, yPosition);
    doc.text(`${data.jumlah_jiwa} jiwa`, 70, yPosition);
    yPosition += 6;

    doc.text(`Jenis Zakat:`, 20, yPosition);
    doc.text(data.jenis_zakat === 'beras' ? 'Beras' : 'Uang', 70, yPosition);
    yPosition += 6;

    doc.text(`Total:`, 20, yPosition );
    doc.setFont('helvetica', 'bold');
    
    if (hasSplitPayment) {
      // Show split payment details
      doc.setFont('helvetica', 'normal');
      doc.text(`Zakat Fitrah:`, 30, yPosition);
      const zakatText =
        data.jenis_zakat === 'beras'
          ? `${formatNumber(data.jumlah_beras_kg)} kg`
          : formatCurrency(data.jumlah_uang_rp);
      doc.text(zakatText, 70, yPosition);
      yPosition += 6;

      doc.text(`Sedekah/Infak:`, 30, yPosition);
      const sedekahText =
        data.jenis_zakat === 'beras'
          ? `${sedekahAmount.toFixed(2)} kg`
          : formatCurrency(sedekahAmount);
      doc.text(sedekahText, 70, yPosition);
      yPosition += 6;

      // Separator line
      doc.setLineWidth(0.1);
      doc.line(30, yPosition, 90, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'bold');
      doc.text(`Total Pembayaran:`, 30, yPosition);
      const totalText =
        data.jenis_zakat === 'beras'
          ? `${(totalPayment || 0).toFixed(2)} kg`
          : formatCurrency(totalPayment || 0);
      doc.text(totalText, 70, yPosition);
      yPosition += 10;

      // Thank you message
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      const thankYouMsg = 'Terima kasih atas kontribusi sedekah Anda';
      doc.text(thankYouMsg, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    } else {
      const totalText =
        data.jenis_zakat === 'beras'
          ? `${formatNumber(data.jumlah_beras_kg)} kg`
          : formatCurrency(data.jumlah_uang_rp);
      doc.text(totalText, 70, yPosition);
      yPosition += 15;
    }

    // Separator line
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Footer - Signature
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Petugas,', 20, yPosition);
    doc.text('Penerima,', pageWidth - 60, yPosition);
    yPosition += 20;

    doc.text('(_________________)', 20, yPosition);
    doc.text('(_________________)', pageWidth - 60, yPosition);
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
