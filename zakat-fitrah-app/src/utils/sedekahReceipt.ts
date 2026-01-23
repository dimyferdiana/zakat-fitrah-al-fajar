import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getTerbilangText, formatRupiah } from '@/lib/terbilang';

export interface SedekahReceiptData {
  receiptNumber: string;
  donorName: string;
  donorAddress: string;
  donorPhone?: string;
  category: string;
  amount: number;
  date: Date;
  notes?: string;
  stampImageUrl?: string;
  signatureImageUrl?: string;
}

const ORGANIZATION_NAME = 'YAYASAN AL-FAJAR PERMATA PAMULANG';
const ORGANIZATION_ADDRESS = 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan';
const KETUA_NAME = 'H. Eldin Rizal Nasution';
const DOA_TEXT =
  'Semoga Allah SWT memberikan pahala kepada Bpk./Ibu/Sdr.... atas harta yang telah dikeluarkan dan menjadi berkah dan suci atas harta yang lainnya.';

/**
 * Generate Sedekah receipt PDF in landscape format
 * White background, printer-friendly
 */
export async function generateSedekahReceiptPDF(data: SedekahReceiptData) {
  // Create landscape PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Set white background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  let yPosition = 15;

  // Header with organization name
  pdf.setFontSize(14);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(ORGANIZATION_NAME, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Organization address
  pdf.setFontSize(10);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(ORGANIZATION_ADDRESS, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Horizontal line
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 8;

  // Title
  pdf.setFontSize(12);
  pdf.setFont('Helvetica', 'bold');
  pdf.text('BUKTI PEMBAYARAN ZAKAT/INFAK/SEDEKAH', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  // Receipt details section
  pdf.setFontSize(10);
  pdf.setFont('Helvetica', 'normal');

  // Left column
  pdf.text('No Bukti :', 20, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(data.receiptNumber, 50, yPosition);
  pdf.setFont('Helvetica', 'normal');

  // Right column
  const rightColX = pageWidth / 2 + 20;
  pdf.text('Tanggal :', rightColX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(format(data.date, 'dd-MM-yyyy'), rightColX + 30, yPosition);
  pdf.setFont('Helvetica', 'normal');

  yPosition += 8;

  // Donor details
  pdf.text('Telah terima dari Bpk/Ibu/Sdr :', 20, yPosition);
  yPosition += 6;

  pdf.setFont('Helvetica', 'bold');
  pdf.text(data.donorName, 50, yPosition);
  pdf.setFont('Helvetica', 'normal');

  yPosition += 6;
  pdf.text('Alamat :', 20, yPosition);
  pdf.setFont('Helvetica', 'bold');

  // Wrap address text
  const addressLines = pdf.splitTextToSize(data.donorAddress, 120);
  pdf.text(addressLines, 50, yPosition);
  yPosition += addressLines.length * 5 + 2;

  pdf.setFont('Helvetica', 'normal');

  if (data.donorPhone) {
    pdf.text('Nomor Handphone :', 20, yPosition);
    pdf.setFont('Helvetica', 'bold');
    pdf.text(data.donorPhone, 50, yPosition);
    pdf.setFont('Helvetica', 'normal');
    yPosition += 6;
  }

  // Purpose
  pdf.text('Untuk pembayaran :', 20, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(data.category, 50, yPosition);
  pdf.setFont('Helvetica', 'normal');
  yPosition += 8;

  // Amount
  pdf.text('Sebesar Rp :', 20, yPosition);
  pdf.setFont('Helvetica', 'bold');
  const formattedAmount = formatRupiah(data.amount).replace('Rp', '').trim();
  pdf.text(formattedAmount, 50, yPosition);
  pdf.setFont('Helvetica', 'normal');
  yPosition += 6;

  // Terbilang
  pdf.text('Terbilang :', 20, yPosition);
  pdf.setFont('Helvetica', 'bold');
  const terbilangText = getTerbilangText(data.amount);
  const terbilangLines = pdf.splitTextToSize(terbilangText, 120);
  pdf.text(terbilangLines, 50, yPosition);
  yPosition += terbilangLines.length * 5 + 3;

  pdf.setFont('Helvetica', 'normal');

  // Doa text
  yPosition += 3;
  const doaLines = pdf.splitTextToSize(DOA_TEXT, pageWidth - 40);
  pdf.setFontSize(9);
  pdf.text(doaLines, pageWidth / 2, yPosition, { align: 'center', maxWidth: pageWidth - 40 });
  yPosition += doaLines.length * 4 + 5;

  // Signature section
  pdf.setFontSize(10);
  const signatureY = yPosition + 15;
  const signatureX = pageWidth - 60;

  // Ketua label and name
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Ketua', signatureX, signatureY);
  yPosition = signatureY + 20;
  pdf.setFont('Helvetica', 'bold');
  pdf.text(KETUA_NAME, signatureX, yPosition, { align: 'center', maxWidth: 50 });

  // Attempt to load and embed signature and stamp images if provided
  // Note: In production, these should be base64 encoded or properly hosted
  if (data.signatureImageUrl) {
    try {
      // Position signature image above the name
      pdf.addImage(data.signatureImageUrl, 'PNG', signatureX - 15, signatureY - 15, 50, 15);
    } catch (error) {
      console.warn('Could not embed signature image:', error);
    }
  }

  if (data.stampImageUrl) {
    try {
      // Position stamp image to the right of signature
      pdf.addImage(
        data.stampImageUrl,
        'PNG',
        signatureX + 20,
        signatureY - 20,
        40,
        40
      );
    } catch (error) {
      console.warn('Could not embed stamp image:', error);
    }
  }

  return pdf;
}

/**
 * Download Sedekah receipt PDF
 */
export async function downloadSedekahReceipt(data: SedekahReceiptData) {
  const pdf = await generateSedekahReceiptPDF(data);
  pdf.save(`Bukti-Sedekah-${data.receiptNumber}-${Date.now()}.pdf`);
}

/**
 * Open print dialog for Sedekah receipt
 */
export async function printSedekahReceipt(data: SedekahReceiptData) {
  const pdf = await generateSedekahReceiptPDF(data);
  const pdfUrl = pdf.output('datauristring');
  
  // Open in new window for printing
  const printWindow = window.open(pdfUrl);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
