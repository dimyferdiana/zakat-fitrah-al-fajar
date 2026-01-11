import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { jsPDF } from 'jspdf';

interface Distribusi {
  id: string;
  mustahik_id: string;
  tahun_zakat_id: string;
  jenis_distribusi: 'beras' | 'uang';
  jumlah: number;
  tanggal_distribusi: string;
  status: 'pending' | 'selesai';
  mustahik: {
    nama: string;
    alamat: string;
    jumlah_anggota: number;
    kategori_mustahik: {
      nama: string;
    };
  };
  tahun_zakat: {
    tahun_hijriah: string;
    tahun_masehi: number;
  };
}

interface BuktiTerimaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribusi: Distribusi | null;
}

export function BuktiTerima({ open, onOpenChange, distribusi }: BuktiTerimaProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Bukti-Terima-${distribusi?.id?.substring(0, 8)}`,
  });

  const handleDownloadPDF = () => {
    if (!distribusi || !contentRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;

    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BUKTI PENERIMAAN ZAKAT FITRAH', pageWidth / 2, y, { align: 'center' });
    y += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Masjid Al-Fajar', pageWidth / 2, y, { align: 'center' });
    y += 6;

    pdf.setFontSize(10);
    pdf.text('Jl. Contoh No. 123, Jakarta', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Line separator
    pdf.setLineWidth(0.5);
    pdf.line(20, y, pageWidth - 20, y);
    y += 10;

    // Receipt Info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`No. Bukti: ${distribusi.id.substring(0, 8).toUpperCase()}`, 20, y);
    pdf.text(
      `Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: localeId })}`,
      pageWidth - 20,
      y,
      { align: 'right' }
    );
    y += 12;

    // Mustahik Section
    pdf.setFont('helvetica', 'bold');
    pdf.text('Telah Diterima Oleh:', 20, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nama`, 25, y);
    pdf.text(`: ${distribusi.mustahik.nama}`, 70, y);
    y += 6;

    pdf.text(`Alamat`, 25, y);
    pdf.text(`: ${distribusi.mustahik.alamat}`, 70, y);
    y += 6;

    pdf.text(`Kategori`, 25, y);
    pdf.text(`: ${distribusi.mustahik.kategori_mustahik.nama}`, 70, y);
    y += 6;

    pdf.text(`Jumlah Anggota Keluarga`, 25, y);
    pdf.text(`: ${distribusi.mustahik.jumlah_anggota} orang`, 70, y);
    y += 12;

    // Distribution Section
    pdf.setFont('helvetica', 'bold');
    pdf.text('Distribusi Zakat:', 20, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Jenis Zakat`, 25, y);
    pdf.text(`: ${distribusi.jenis_distribusi === 'beras' ? 'Beras' : 'Uang'}`, 70, y);
    y += 6;

    pdf.text(`Jumlah`, 25, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const jumlahText =
      distribusi.jenis_distribusi === 'beras'
        ? `${distribusi.jumlah.toFixed(2)} kg`
        : formatCurrency(distribusi.jumlah);
    pdf.text(`: ${jumlahText}`, 70, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Tanggal Distribusi`, 25, y);
    pdf.text(
      `: ${format(new Date(distribusi.tanggal_distribusi), 'dd MMMM yyyy', {
        locale: localeId,
      })}`,
      70,
      y
    );
    y += 12;

    pdf.text(`Tahun Zakat`, 25, y);
    pdf.text(
      `: ${distribusi.tahun_zakat.tahun_hijriah} H (${distribusi.tahun_zakat.tahun_masehi} M)`,
      70,
      y
    );
    y += 15;

    // Signature Section
    const col1X = 40;
    const col2X = pageWidth - 70;

    pdf.setFont('helvetica', 'normal');
    pdf.text('Petugas,', col1X, y, { align: 'center' });
    pdf.text('Penerima,', col2X, y, { align: 'center' });
    y += 20;

    // Signature lines
    pdf.line(col1X - 25, y, col1X + 25, y);
    pdf.line(col2X - 25, y, col2X + 25, y);
    y += 2;

    pdf.setFontSize(8);
    pdf.text('(...........................)', col1X, y, { align: 'center' });
    pdf.text('(...........................)', col2X, y, { align: 'center' });

    // Footer
    y = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      'Simpan bukti ini sebagai tanda penerimaan yang sah',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    // Save PDF
    pdf.save(`Bukti-Terima-${distribusi.id.substring(0, 8)}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!distribusi) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Bukti Penerimaan Zakat</DialogTitle>
            <DialogDescription>
              Ringkasan penerimaan zakat untuk dicetak atau disimpan oleh mustahik.
            </DialogDescription>
          </DialogHeader>

          <div ref={contentRef} id="print-content" className="p-8 bg-white space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">BUKTI PENERIMAAN ZAKAT FITRAH</h1>
              <p className="text-lg font-semibold">Masjid Al-Fajar</p>
              <p className="text-sm text-muted-foreground">
                Jl. Contoh No. 123, Jakarta
              </p>
            </div>

            <div className="border-t-2 border-b-2 border-gray-300 py-4 mb-6">
              <div className="flex justify-between text-sm">
                <p>
                  <span className="font-semibold">No. Bukti:</span>{' '}
                  {distribusi.id.substring(0, 8).toUpperCase()}
                </p>
                <p>
                  <span className="font-semibold">Tanggal:</span>{' '}
                  {format(new Date(), 'dd MMMM yyyy', { locale: localeId })}
                </p>
              </div>
            </div>

            {/* Mustahik Info */}
            <div className="mb-6">
              <h2 className="font-bold mb-3">Telah Diterima Oleh:</h2>
              <div className="space-y-2 pl-4">
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium">: {distribusi.mustahik.nama}</span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Alamat</span>
                  <span>: {distribusi.mustahik.alamat}</span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Kategori</span>
                  <span>
                    :{' '}
                    <Badge variant="outline">
                      {distribusi.mustahik.kategori_mustahik.nama}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Jumlah Anggota Keluarga</span>
                  <span>: {distribusi.mustahik.jumlah_anggota} orang</span>
                </div>
              </div>
            </div>

            {/* Distribution Info */}
            <div className="mb-8">
              <h2 className="font-bold mb-3">Distribusi Zakat:</h2>
              <div className="space-y-2 pl-4">
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Jenis Zakat</span>
                  <span>
                    :{' '}
                    <Badge variant={distribusi.jenis_distribusi === 'beras' ? 'default' : 'secondary'}>
                      {distribusi.jenis_distribusi === 'beras' ? 'Beras' : 'Uang'}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="text-xl font-bold">
                    :{' '}
                    {distribusi.jenis_distribusi === 'beras'
                      ? `${distribusi.jumlah.toFixed(2)} kg`
                      : formatCurrency(distribusi.jumlah)}
                  </span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Tanggal Distribusi</span>
                  <span>
                    :{' '}
                    {format(new Date(distribusi.tanggal_distribusi), 'dd MMMM yyyy', {
                      locale: localeId,
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Tahun Zakat</span>
                  <span>
                    : {distribusi.tahun_zakat.tahun_hijriah} H (
                    {distribusi.tahun_zakat.tahun_masehi} M)
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-16">
              <div className="text-center">
                <p className="mb-16">Petugas,</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-sm">(............................)</p>
                </div>
              </div>
              <div className="text-center">
                <p className="mb-16">Penerima,</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-sm">(............................)</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground italic">
                Simpan bukti ini sebagai tanda penerimaan yang sah
              </p>
            </div>
          </div>

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>
        {`
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
        `}
      </style>
    </>
  );
}
