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

// Constants matching receipt-design.pen
const ORGANIZATION_NAME = 'YAYASAN AL-FAJAR PERMATA PAMULANG';
const ORGANIZATION_ADDRESS = 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan';
const KETUA_NAME = 'H. Eldin Rizal Nasution';
const DOA_TEXT =
  'Semoga Allah SWT memberikan pahala kepada Bpk./Ibu/Sdr. atas harta yang telah dikeluarkan dan menjadi berkah dan suci atas harta yang lainnya.';

// Layout constants (converted from receipt-design.pen: 800x566px with 80px padding)
// Conversion: 96 DPI standard, 1px ≈ 0.2646mm
const MARGIN = 21.2; // 80px padding
const LOGO_SIZE = 13.2; // 50px
const LABEL_WIDTH = 47.6; // 180px label width
const ROW_GAP = 2.1; // 8px gap between detail rows
const SECTION_GAP = 4.2; // 16px main gap between sections (from .pen file)
const HEADER_GAP = 4.2; // 16px gap in header
const LINE_HEIGHT = 4.5; // ~17px line height for text rows
const DETAILS_TOP_PADDING = 2.6; // 10px top padding for details section

/**
 * Generate Sedekah receipt PDF matching receipt-design.pen layout
 * White background, printer-friendly
 */
export async function generateSedekahReceiptPDF(data: SedekahReceiptData) {
  // Create landscape PDF (A4: 297x210mm matches 800x566px aspect ratio)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
  const contentWidth = pageWidth - MARGIN * 2; // ~257mm content area

  // Set white background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  let yPosition = MARGIN;
  const leftX = MARGIN;
  const valueX = MARGIN + LABEL_WIDTH; // Where values start after labels

  // ============ HEADER SECTION ============
  // Calculate centered group position (logo + gap + text) matching receipt-design.pen
  // Design: Header uses horizontal layout with justifyContent: center, alignItems: center, gap: 16
  const headerGap = 5; // 16px gap ≈ 5mm
  const textGroupWidth = 90; // Approximate width of organization text
  const totalHeaderWidth = LOGO_SIZE + headerGap + textGroupWidth;
  const headerStartX = (pageWidth - totalHeaderWidth) / 2; // Center the entire group

  // Logo (left side of centered group, 50x50px = ~13x13mm) with background
  // Design: #E8E8E8 fill, #CCCCCC border, 4px corner radius
  //pdf.setFillColor(232, 232, 232);
  //pdf.setDrawColor(204, 204, 204);
  //pdf.setLineWidth(0.26);
  //pdf.roundedRect(headerStartX, yPosition, LOGO_SIZE, LOGO_SIZE, 1, 1, 'FD');
  
  try {
    pdf.addImage('/logo-al-fajar.png', 'PNG', headerStartX, yPosition, LOGO_SIZE, LOGO_SIZE);
  } catch (error) {
    console.warn('Could not embed logo image:', error);
  }

  // Text positioned right of logo with gap (16px = 4.2mm)
  const headerTextX = headerStartX + LOGO_SIZE + HEADER_GAP;

  // Organization name (16px, bold) - Design uses Inter font
  // Note: jsPDF doesn't have Inter by default, using Helvetica as fallback
  pdf.setFontSize(16 * 0.75); // Convert px to pt (16px ≈ 12pt)
  pdf.setFont('Helvetica', 'bold');
  pdf.text(ORGANIZATION_NAME, headerTextX, yPosition + 4.5);

  // Organization address (11px, normal)
  pdf.setFontSize(11 * 0.75); // 11px ≈ 8.25pt
  pdf.setFont('Helvetica', 'normal');
  pdf.text(ORGANIZATION_ADDRESS, headerTextX, yPosition + 9);

  yPosition += LOGO_SIZE + SECTION_GAP;

  // Header line (1px = ~0.26mm)
  pdf.setLineWidth(0.26);
  pdf.line(leftX, yPosition, pageWidth - MARGIN, yPosition);
  yPosition += SECTION_GAP + 3; // 16px gap + extra 3mm for more space

  // ============ TITLE SECTION ============
  // Title - centered (14px bold)
  pdf.setFontSize(14 * 0.75); // 14px ≈ 10.5pt
  pdf.setFont('Helvetica', 'bold');
  pdf.text('BUKTI PEMBAYARAN ZAKAT/INFAK/SEDEKAH', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += SECTION_GAP + DETAILS_TOP_PADDING; // 16px gap + 10px top padding

  // ============ DETAILS SECTION ============
  // All labels and values: 11px (8.25pt)
  pdf.setFontSize(11 * 0.75);

  // Row 1: No Bukti (left) | Tanggal (right)
  pdf.setFont('Helvetica', 'normal');
  pdf.text('No Bukti :', leftX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(data.receiptNumber, valueX, yPosition);

  // Tanggal - right aligned
  const rightLabelX = pageWidth - MARGIN - 80;
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Tanggal :', rightLabelX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(format(data.date, 'dd-MM-yyyy'), rightLabelX + 25, yPosition);
  yPosition += ROW_GAP + LINE_HEIGHT; // 8px gap between rows

  // Row 2: Donor name
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Telah terima dari Bpk/Ibu/Sdr :', leftX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(data.donorName, valueX, yPosition);
  yPosition += ROW_GAP + LINE_HEIGHT;

  // Row 3: Address (with text wrapping, fixed width 400px = ~105mm)
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Alamat :', leftX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  const maxAddressWidth = 105; // 400px from design
  const addressLines = pdf.splitTextToSize(data.donorAddress, maxAddressWidth);
  pdf.text(addressLines, valueX, yPosition);
  yPosition += ROW_GAP + addressLines.length * LINE_HEIGHT;

  // Row 4: Phone (optional)
  if (data.donorPhone) {
    pdf.setFont('Helvetica', 'normal');
    pdf.text('Nomor Handphone :', leftX, yPosition);
    pdf.setFont('Helvetica', 'bold');
    pdf.text(data.donorPhone, valueX, yPosition);
    yPosition += ROW_GAP + LINE_HEIGHT;
  }

  // Row 5: Category
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Untuk pembayaran :', leftX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(data.category, valueX, yPosition);
  yPosition += ROW_GAP + LINE_HEIGHT;

  // Row 6: Amount
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Sebesar :', leftX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(formatRupiah(data.amount), valueX, yPosition);
  yPosition += ROW_GAP + LINE_HEIGHT;

  // Row 7: Terbilang (with text wrapping, fixed width 400px = ~105mm)
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Terbilang :', leftX, yPosition);
  pdf.setFont('Helvetica', 'bold');
  const terbilangText = getTerbilangText(data.amount);
  const terbilangLines = pdf.splitTextToSize(terbilangText, maxAddressWidth);
  pdf.text(terbilangLines, valueX, yPosition);
  yPosition += terbilangLines.length * LINE_HEIGHT + SECTION_GAP;

  // ============ DOA TEXT SECTION ============
  // Doa - LEFT aligned (11px normal in design)
  pdf.setFontSize(11 * 0.75);
  pdf.setFont('Helvetica', 'normal');
  const doaLines = pdf.splitTextToSize(DOA_TEXT, contentWidth);
  pdf.text(doaLines, leftX, yPosition);
  yPosition += doaLines.length * LINE_HEIGHT + SECTION_GAP; // 16px gap after doa

  // ============ SIGNATURE SECTION ============
  // Right-aligned signature box (matching receipt-design.pen)
  // Design: Signature section has justifyContent: end (right-aligned)
  const signatureBoxWidth = 39.7; // 150px stamp width
  const signatureX = pageWidth - MARGIN - signatureBoxWidth / 2;

  // Organization name above signature (11px normal)
  pdf.setFontSize(11 * 0.75);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(ORGANIZATION_NAME, signatureX, yPosition, { align: 'center' });
  yPosition += 3; // Small gap (4px in design)

  // Stamp + Signature area (150x60px = ~39.7x15.9mm)
  // Design: #F5F5F5 fill, #CCCCCC border, 4px corner radius
  const stampWidth = 39.7;
  const stampHeight = 15.9;
  const stampX = signatureX - stampWidth / 2;
  
  // Draw background box for stamp area
  //pdf.setFillColor(245, 245, 245);
  //pdf.setDrawColor(204, 204, 204);
  //pdf.setLineWidth(0.26);
  //pdf.roundedRect(stampX, yPosition, stampWidth, stampHeight, 1, 1, 'FD');

  // Load stamp + signature combined image
  const stampSignatureUrl = data.signatureImageUrl || data.stampImageUrl || '/stamp-signature.png';

  try {
    pdf.addImage(stampSignatureUrl, 'PNG', stampX, yPosition, stampWidth, stampHeight);
  } catch (error) {
    console.warn('Could not embed stamp + signature image:', error);
  }

  yPosition += stampHeight + 1; // Small gap (4px)

  // Ketua name (11px bold)
  pdf.setFont('Helvetica', 'bold');
  pdf.text(KETUA_NAME, signatureX, yPosition, { align: 'center' });
  yPosition += 0.5;

  // Underline (140px = ~37mm, 1px height)
  const underlineWidth = 37;
  pdf.setLineWidth(0.26);
  pdf.line(signatureX - underlineWidth / 2, yPosition, signatureX + underlineWidth / 2, yPosition);
  yPosition += 3.5; // Small gap (4px)

  // Ketua title (11px normal)
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Ketua', signatureX, yPosition, { align: 'center' });

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
