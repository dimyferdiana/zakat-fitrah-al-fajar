import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import jsPDF from 'jspdf'
import { BRANDING } from '@/lib/branding'
import { ORG_SERVICE } from '@/lib/constants'
import type { QurbanRegistrationWithParticipants } from '@/types/qurban'

// ─── Layout constants (A4 portrait: 210×297mm) ───────────────────────────────
const SCALE_FACTOR = 210 / 800
const MARGIN = 80 * SCALE_FACTOR        // ~21mm
const LOGO_SIZE = 95 * SCALE_FACTOR     // ~24.9mm
const LABEL_WIDTH = 190 * SCALE_FACTOR  // ~49.9mm
const ROW_GAP = 12 * SCALE_FACTOR       // ~3.15mm
const SECTION_GAP = 26 * SCALE_FACTOR   // ~6.83mm
const HEADER_GAP = 18 * SCALE_FACTOR    // ~4.73mm
const LINE_HEIGHT = 20 * SCALE_FACTOR   // ~5.25mm
const DIVIDER_HEIGHT = 2 * SCALE_FACTOR // ~0.525mm

const KETUA_NAME = 'H. Eldin Rizal Nasution'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrencyPdf(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getJenisLabel(jenis: string): string {
  if (jenis === 'sapi') return 'Qurban Sapi'
  if (jenis === 'kambing') return 'Qurban Kambing/Domba'
  return jenis
}

function getSumberHewanLabel(sumber: string): string {
  if (sumber === 'beli') return 'Beli dari Al-Fajar'
  if (sumber === 'titipan') return 'Titipan (Bawa Sendiri)'
  return sumber
}

// ─── Core PDF builder ────────────────────────────────────────────────────────
export function generateQurbanReceiptPDF(
  data: QurbanRegistrationWithParticipants,
): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()   // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight() // 297mm

  // White background
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  let y = MARGIN
  const leftX = MARGIN
  const valueX = MARGIN + LABEL_WIDTH

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const headerGap = 5
  const textGroupWidth = 90
  const totalHeaderWidth = LOGO_SIZE + headerGap + textGroupWidth
  const headerStartX = (pageWidth - totalHeaderWidth) / 2

  try {
    pdf.addImage(BRANDING.LOGO_PATH, 'PNG', headerStartX, y, LOGO_SIZE, LOGO_SIZE)
  } catch {
    console.warn('Could not embed logo image')
  }

  const headerTextX = headerStartX + LOGO_SIZE + HEADER_GAP
  const headerTextGap = 4 * SCALE_FACTOR

  pdf.setFontSize(14)
  pdf.setFont('Helvetica', 'bold')
  const orgNameY = y + LOGO_SIZE / 2 - 2
  pdf.text(BRANDING.ORGANIZATION_FULL, headerTextX, orgNameY)

  pdf.setFontSize(10)
  pdf.setFont('Helvetica', 'normal')
  const addressY = orgNameY + 4 + headerTextGap
  pdf.text(BRANDING.ADDRESS, headerTextX, addressY)
  pdf.text(`Email : permataalfajar@gmail.com`, headerTextX, addressY + 3 + headerTextGap)
  pdf.text(ORG_SERVICE, headerTextX, addressY + 6 + headerTextGap * 2)

  y += LOGO_SIZE + SECTION_GAP

  // Divider
  pdf.setLineWidth(DIVIDER_HEIGHT)
  pdf.line(leftX, y, pageWidth - MARGIN, y)
  y += SECTION_GAP

  // ── TITLE ───────────────────────────────────────────────────────────────────
  pdf.setFontSize(14)
  pdf.setFont('Helvetica', 'bold')
  pdf.text('BUKTI PENDAFTARAN QURBAN', pageWidth / 2, y, { align: 'center' })
  y += SECTION_GAP + 10 * SCALE_FACTOR

  // ── BODY DETAILS ────────────────────────────────────────────────────────────
  pdf.setFontSize(10)

  const row = (label: string, value: string, bold = false) => {
    pdf.setFont('Helvetica', 'normal')
    pdf.text(label, leftX, y)
    pdf.setFont('Helvetica', bold ? 'bold' : 'bold')
    const maxW = pageWidth - MARGIN - valueX - 5
    const lines = pdf.splitTextToSize(': ' + value, maxW)
    pdf.text(lines, valueX, y)
    y += ROW_GAP + lines.length * LINE_HEIGHT
  }

  // No. Qurban + Tanggal on same line
  pdf.setFont('Helvetica', 'normal')
  pdf.text('No. Qurban', leftX, y)
  pdf.setFont('Helvetica', 'bold')
  pdf.text(': ' + (data.no_qurban || '-'), valueX, y)

  const rightLabelX = pageWidth - MARGIN - 80
  pdf.setFont('Helvetica', 'normal')
  pdf.text('Tanggal :', rightLabelX, y)
  pdf.setFont('Helvetica', 'bold')
  try {
    pdf.text(
      format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale }),
      rightLabelX + 22,
      y,
    )
  } catch {
    pdf.text(data.tanggal, rightLabelX + 22, y)
  }
  y += ROW_GAP + LINE_HEIGHT

  row('Nama Pendaftar', data.nama)
  row('Alamat', data.alamat)
  row('No HP', data.no_hp)
  row('Jenis Qurban', getJenisLabel(data.jenis))
  row('Sumber Hewan', getSumberHewanLabel(data.sumber_hewan))

  if (data.sumber_hewan === 'titipan' && data.biaya_perawatan != null) {
    row('Biaya Perawatan', formatCurrencyPdf(data.biaya_perawatan))
  }

  // ── QURBAN A/N SECTION ──────────────────────────────────────────────────────
  const participants = data.qurban_participants || []
  if (participants.length > 0) {
    y += 2
    pdf.setFont('Helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('Qurban Atas Nama:', leftX, y)
    y += LINE_HEIGHT

    pdf.setFont('Helvetica', 'normal')
    const sorted = [...participants].sort((a, b) => a.urutan - b.urutan)
    for (const p of sorted) {
      pdf.text(`${p.urutan}. ${p.nama}`, leftX + 5, y)
      y += LINE_HEIGHT
    }
    y += 2
  }

  // ── PAYMENT SECTION ─────────────────────────────────────────────────────────
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('Nominal', leftX, y)
  pdf.setFont('Helvetica', 'bold')
  pdf.text(': ' + formatCurrencyPdf(data.nominal), valueX, y)
  y += ROW_GAP + LINE_HEIGHT

  pdf.setFont('Helvetica', 'normal')
  pdf.text('Status', leftX, y)

  if (data.status === 'lunas') {
    pdf.setFont('Helvetica', 'bold')
    pdf.setTextColor(21, 128, 61) // green-700
    pdf.text(': LUNAS', valueX, y)
    pdf.setTextColor(0, 0, 0)
  } else {
    pdf.setFont('Helvetica', 'normal')
    pdf.text(': TERDAFTAR', valueX, y)
  }
  y += ROW_GAP + LINE_HEIGHT

  if (data.catatan) {
    pdf.setFont('Helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Catatan', leftX, y)
    pdf.setFont('Helvetica', 'bold')
    const catatanLines = pdf.splitTextToSize(
      ': ' + data.catatan,
      pageWidth - MARGIN - valueX - 5,
    )
    pdf.text(catatanLines, valueX, y)
    y += ROW_GAP + catatanLines.length * LINE_HEIGHT
  }

  y += SECTION_GAP

  // ── FOOTER / SIGNATURE ──────────────────────────────────────────────────────
  const stampW = 39.7
  const stampH = 15.9
  const signX = pageWidth - MARGIN - stampW / 2

  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  pdf.text(BRANDING.ORGANIZATION_FULL, signX, y, { align: 'center' })
  y += 3

  try {
    pdf.addImage('/stamp-signature.png', 'PNG', signX - stampW / 2, y, stampW, stampH)
  } catch {
    console.warn('Could not embed stamp-signature image')
  }
  y += stampH + 1

  pdf.setFont('Helvetica', 'bold')
  pdf.text(KETUA_NAME, signX, y, { align: 'center' })
  y += 0.5

  pdf.setLineWidth(0.26)
  pdf.line(signX - 18.5, y, signX + 18.5, y)
  y += 3.5

  pdf.setFont('Helvetica', 'normal')
  pdf.text('Ketua', signX, y, { align: 'center' })

  // Safety: warn if content overflowed the page
  if (y > pageHeight - MARGIN) {
    console.warn('BuktiQurban: content may have overflowed the A4 page')
  }

  return pdf
}

// ─── Public utilities ─────────────────────────────────────────────────────────
export function downloadQurbanReceipt(data: QurbanRegistrationWithParticipants): void {
  const pdf = generateQurbanReceiptPDF(data)
  const slug = data.nama.replace(/\s+/g, '-')
  pdf.save(`Bukti-Qurban-${data.no_qurban || data.id.slice(0, 8)}-${slug}.pdf`)
}

export function printQurbanReceipt(data: QurbanRegistrationWithParticipants): void {
  const pdf = generateQurbanReceiptPDF(data)
  const pdfUrl = pdf.output('datauristring')
  const printWindow = window.open(pdfUrl)
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

// ─── React component ──────────────────────────────────────────────────────────
interface BuktiQurbanProps {
  data: QurbanRegistrationWithParticipants
}

export function BuktiQurban({ data }: BuktiQurbanProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadQurbanReceipt(data)}
      >
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => printQurbanReceipt(data)}
      >
        <Printer className="mr-2 h-4 w-4" />
        Cetak
      </Button>
    </div>
  )
}
