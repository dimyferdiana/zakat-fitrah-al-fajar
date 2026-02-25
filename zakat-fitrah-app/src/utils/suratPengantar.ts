import jsPDF from 'jspdf';

// Organization constants (matching sedekahReceipt.ts)
const ORGANIZATION_NAME = 'YAYASAN AL-FAJAR PERMATA PAMULANG';
const ORGANIZATION_ADDRESS = 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan';
const ORGANIZATION_EMAIL = 'permataalfajar@gmail.com';
const ORGANIZATION_SERVICE = 'Layanan Al Fajar 0877-1335-9800 (WA Only)';
const KETUA_NAME = 'H. Eldin Rizal Nasution';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function formatDateIndonesian(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = INDONESIAN_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

/**
 * Generate Surat Permohonan Domain masjidalfajar.or.id
 * A4 portrait, formal Indonesian government letter style
 * with kop surat (logo + org info) and signature/stamp footer
 */
export async function generateSuratPengantarDomainPDF(date: Date = new Date()): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const W = pdf.internal.pageSize.getWidth();  // 210mm
  const H = pdf.internal.pageSize.getHeight(); // 297mm
  const ML = 22;  // left margin
  const MR = 22;  // right margin
  const MT = 18;  // top margin
  const CW = W - ML - MR; // ~166mm content width
  const LX = ML;
  const RX = W - MR;
  const LH = 5.5; // line height mm

  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, W, H, 'F');

  let y = MT;

  // ============ KOP SURAT / LETTERHEAD ============
  const LOGO_SIZE = 22;
  const LOGO_GAP = 5;

  try {
    pdf.addImage('/logo-al-fajar.png', 'PNG', LX, y, LOGO_SIZE, LOGO_SIZE);
  } catch {
    // ignore if image not available
  }

  const textX = LX + LOGO_SIZE + LOGO_GAP;
  const logoMidY = y + LOGO_SIZE / 2;

  // Organization name (bold, large)
  pdf.setFontSize(15);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(ORGANIZATION_NAME, textX, logoMidY - 4);

  // Contact details
  pdf.setFontSize(9);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(ORGANIZATION_ADDRESS, textX, logoMidY + 1.5);
  pdf.text(`Email : ${ORGANIZATION_EMAIL}`, textX, logoMidY + 6);
  pdf.text(ORGANIZATION_SERVICE, textX, logoMidY + 10.5);

  y = MT + LOGO_SIZE + 5;

  // Double divider line (formal Indonesian letter style)
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(LX, y, RX, y);
  y += 1.8;
  pdf.setLineWidth(0.3);
  pdf.line(LX, y, RX, y);
  y += 9;

  // ============ LETTER REFERENCE / NOMOR SURAT ============
  pdf.setFontSize(11);
  const LABEL_W = 28;
  const SEP_X = LX + LABEL_W;
  const VAL_X = SEP_X + 5;

  const romanMonth = ROMAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const letterNumber = `001/SP-DOM/YAF/${romanMonth}/${year}`;

  const metaRows: [string, string, boolean][] = [
    ['Nomor', letterNumber, false],
    ['Lampiran', '-', false],
    ['Hal', 'Permohonan Domain masjidalfajar.or.id', true],
  ];

  for (const [label, value, bold] of metaRows) {
    pdf.setFont('Helvetica', 'normal');
    pdf.text(label, LX, y);
    pdf.text(':', SEP_X, y);
    pdf.setFont('Helvetica', bold ? 'bold' : 'normal');
    const wrapped = pdf.splitTextToSize(value, CW - LABEL_W - 8);
    pdf.text(wrapped, VAL_X, y);
    y += wrapped.length * LH;
  }

  y += 7;

  // Kepada / Addressee
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Kepada Yth.', LX, y);
  y += LH;
  pdf.setFont('Helvetica', 'bold');
  pdf.text('Pengelola Nama Domain Internet Indonesia (PANDI)', LX, y);
  y += LH;
  pdf.setFont('Helvetica', 'normal');
  pdf.text('Di Tempat', LX, y);
  y += LH * 2.2;

  // ============ LETTER BODY ============
  pdf.text('Dengan hormat,', LX, y);
  y += LH * 1.8;

  pdf.text('Yang bertanda tangan di bawah ini:', LX, y);
  y += LH + 2;

  // Signatory block (indented)
  const DLX = LX + 8;
  const D_LABEL_W = 28;
  const D_SEP_X = DLX + D_LABEL_W;
  const D_VAL_X = D_SEP_X + 5;

  const sigDetails: [string, string, boolean][] = [
    ['Nama', KETUA_NAME, true],
    ['Jabatan', 'Ketua Yayasan', false],
    ['Organisasi', ORGANIZATION_NAME, false],
    ['Alamat', ORGANIZATION_ADDRESS, false],
  ];

  for (const [label, value, bold] of sigDetails) {
    pdf.setFont('Helvetica', 'normal');
    pdf.text(label, DLX, y);
    pdf.text(':', D_SEP_X, y);
    pdf.setFont('Helvetica', bold ? 'bold' : 'normal');
    const wrapped = pdf.splitTextToSize(value, CW - 8 - D_LABEL_W - 8);
    pdf.text(wrapped, D_VAL_X, y);
    y += wrapped.length * LH;
  }

  y += LH;

  // Main body paragraph 1
  const p1Lines = pdf.splitTextToSize(
    'Dengan ini mengajukan permohonan pendaftaran nama domain internet kepada Pengelola Nama Domain Internet Indonesia (PANDI) untuk keperluan organisasi/yayasan kami, dengan rincian sebagai berikut:',
    CW
  );
  pdf.setFont('Helvetica', 'normal');
  pdf.text(p1Lines, LX, y);
  y += p1Lines.length * LH + 3;

  // Domain name (bold, indented)
  pdf.setFont('Helvetica', 'bold');
  pdf.text('Nama Domain  :  masjidalfajar.or.id', LX + 8, y);
  pdf.setFont('Helvetica', 'normal');
  y += LH * 2;

  // Paragraph 2
  const p2Lines = pdf.splitTextToSize(
    'Domain tersebut akan digunakan sebagai situs web resmi Yayasan Al-Fajar Permata Pamulang, sebuah yayasan sosial keagamaan yang bergerak di bidang keagamaan dan kemasyarakatan di wilayah Pamulang, Tangerang Selatan, Provinsi Banten.',
    CW
  );
  pdf.text(p2Lines, LX, y);
  y += p2Lines.length * LH + LH;

  // Paragraph 3
  const p3Lines = pdf.splitTextToSize(
    'Surat permohonan ini dibuat dengan sebenar-benarnya dan kami bertanggung jawab penuh atas penggunaan nama domain tersebut sesuai dengan ketentuan yang berlaku.',
    CW
  );
  pdf.text(p3Lines, LX, y);
  y += p3Lines.length * LH + LH;

  // Closing
  const closingLines = pdf.splitTextToSize(
    'Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami mengucapkan terima kasih.',
    CW
  );
  pdf.text(closingLines, LX, y);
  y += closingLines.length * LH + 12;

  // ============ SIGNATURE SECTION ============
  pdf.setFontSize(11);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(`Tangerang Selatan, ${formatDateIndonesian(date)}`, RX, y, { align: 'right' });
  y += LH;
  pdf.text('Ketua Yayasan,', RX, y, { align: 'right' });
  y += LH + 2;

  // Stamp + Signature image (matching receipt-design.pen pattern)
  const STAMP_W = 46;
  const STAMP_H = 23;
  const stampX = RX - STAMP_W;

  try {
    pdf.addImage('/stamp-signature.png', 'PNG', stampX, y, STAMP_W, STAMP_H);
  } catch {
    // ignore if image not available
  }

  y += STAMP_H + 2;

  // Ketua name (bold)
  pdf.setFont('Helvetica', 'bold');
  pdf.text(KETUA_NAME, RX, y, { align: 'right' });
  y += 0.8;

  // Underline below name
  const nameW = pdf.getTextWidth(KETUA_NAME);
  pdf.setLineWidth(0.26);
  pdf.line(RX - nameW - 1, y, RX, y);
  y += LH;

  pdf.setFont('Helvetica', 'normal');
  pdf.text('Ketua Yayasan', RX, y, { align: 'right' });

  // Suppress unused variable warning
  void H;

  return pdf;
}

/**
 * Download Surat Permohonan Domain as PDF
 */
export async function downloadSuratPengantarDomain(date?: Date) {
  const pdf = await generateSuratPengantarDomainPDF(date);
  pdf.save('Surat-Permohonan-Domain-masjidalfajar.or.id.pdf');
}
