import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// Formatting helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return value.toFixed(2);
};

const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + '%';
};

const formatDate = (date: string) => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: localeId });
};

// PDF Header
const addPDFHeader = (pdf: jsPDF, title: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Masjid Al-Fajar', pageWidth / 2, 28, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text('Jl. Contoh No. 123, Jakarta', pageWidth / 2, 34, { align: 'center' });
  
  pdf.setLineWidth(0.5);
  pdf.line(20, 38, pageWidth - 20, 38);
};

// PDF Footer
const addPDFFooter = (pdf: jsPDF) => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text(
    `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}`,
    20,
    pageHeight - 10
  );
  pdf.text(
    `Halaman ${(pdf as any).internal.getCurrentPageInfo().pageNumber}`,
    pageWidth - 20,
    pageHeight - 10,
    { align: 'right' }
  );
};

// ============================================================================
// PEMASUKAN EXPORTS
// ============================================================================

export const exportPemasukanPDF = (data: any[], summary: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  addPDFHeader(pdf, 'LAPORAN PEMASUKAN ZAKAT FITRAH');
  
  // Summary
  let y = 45;
  pdf.setFontSize(10);
  pdf.text(`Total Beras: ${formatNumber(summary.totalBeras)} kg`, 20, y);
  y += 6;
  pdf.text(`Total Uang: ${formatCurrency(summary.totalUang)}`, 20, y);
  y += 6;
  pdf.text(`Total Muzakki: ${summary.totalMuzakki} KK`, 20, y);
  y += 10;
  
  if (summary.dateFrom || summary.dateTo) {
    pdf.setFontSize(9);
    const periodText = summary.dateFrom && summary.dateTo
      ? `Periode: ${formatDate(summary.dateFrom)} - ${formatDate(summary.dateTo)}`
      : summary.dateFrom
      ? `Dari: ${formatDate(summary.dateFrom)}`
      : `Sampai: ${formatDate(summary.dateTo)}`;
    pdf.text(periodText, 20, y);
    y += 8;
  }
  
  // Table
  const tableData = data.map((item: any) => [
    formatDate(item.tanggal_bayar),
    item.muzakki?.nama_kk || '',
    item.jumlah_jiwa,
    item.jenis_zakat === 'beras' ? 'Beras' : 'Uang',
    item.jenis_zakat === 'beras'
      ? `${formatNumber(item.jumlah_beras_kg)} kg`
      : formatCurrency(item.jumlah_uang_rp),
  ]);
  
  autoTable(pdf, {
    startY: y,
    head: [['Tanggal', 'Nama KK', 'Jiwa', 'Jenis', 'Jumlah']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  addPDFFooter(pdf);
  pdf.save(`Laporan-Pemasukan-${Date.now()}.pdf`);
};

export const exportPemasukanExcel = (data: any[], summary: any) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['LAPORAN PEMASUKAN ZAKAT FITRAH'],
    ['Masjid Al-Fajar'],
    [],
    ['Total Beras', `${formatNumber(summary.totalBeras)} kg`],
    ['Total Uang', formatCurrency(summary.totalUang)],
    ['Total Muzakki', `${summary.totalMuzakki} KK`],
    [],
    ['Tanggal', 'Nama KK', 'Alamat', 'Jiwa', 'Jenis', 'Jumlah'],
    ...data.map((item: any) => [
      formatDate(item.tanggal_bayar),
      item.muzakki?.nama_kk || '',
      item.muzakki?.alamat || '',
      item.jumlah_jiwa,
      item.jenis_zakat === 'beras' ? 'Beras' : 'Uang',
      item.jenis_zakat === 'beras'
        ? `${formatNumber(item.jumlah_beras_kg)} kg`
        : formatCurrency(item.jumlah_uang_rp),
    ]),
  ]);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pemasukan');
  XLSX.writeFile(wb, `Laporan-Pemasukan-${Date.now()}.xlsx`);
};

// ============================================================================
// DISTRIBUSI EXPORTS
// ============================================================================

export const exportDistribusiPDF = (data: any[], summary: any[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  addPDFHeader(pdf, 'LAPORAN DISTRIBUSI ZAKAT FITRAH');
  
  let y = 45;
  
  // Summary per kategori
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ringkasan Per Kategori:', 20, y);
  y += 8;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const summaryTableData = summary.map((s) => [
    s.kategori,
    s.count.toString(),
    `${formatNumber(s.totalBeras)} kg`,
    formatCurrency(s.totalUang),
  ]);
  
  autoTable(pdf, {
    startY: y,
    head: [['Kategori', 'Penerima', 'Beras (kg)', 'Uang (Rp)']],
    body: summaryTableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  y = (pdf as any).lastAutoTable.finalY + 10;
  
  // Detail distribusi
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detail Distribusi:', 20, y);
  y += 8;
  
  const detailTableData = data.map((item: any) => [
    formatDate(item.tanggal_distribusi),
    item.mustahik?.nama || '',
    item.mustahik?.kategori_mustahik?.nama || '',
    item.jenis_distribusi === 'beras' ? 'Beras' : 'Uang',
    item.jenis_distribusi === 'beras'
      ? `${formatNumber(item.jumlah)} kg`
      : formatCurrency(item.jumlah),
  ]);
  
  autoTable(pdf, {
    startY: y,
    head: [['Tanggal', 'Mustahik', 'Kategori', 'Jenis', 'Jumlah']],
    body: detailTableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  addPDFFooter(pdf);
  pdf.save(`Laporan-Distribusi-${Date.now()}.pdf`);
};

export const exportDistribusiExcel = (data: any[], summary: any[]) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['LAPORAN DISTRIBUSI ZAKAT FITRAH'],
    ['Masjid Al-Fajar'],
    [],
    ['Ringkasan Per Kategori'],
    ['Kategori', 'Penerima', 'Beras (kg)', 'Uang (Rp)'],
    ...summary.map((s) => [
      s.kategori,
      s.count,
      `${formatNumber(s.totalBeras)} kg`,
      formatCurrency(s.totalUang),
    ]),
    [],
    ['Detail Distribusi'],
    ['Tanggal', 'Mustahik', 'Alamat', 'Kategori', 'Jenis', 'Jumlah', 'Status'],
    ...data.map((item: any) => [
      formatDate(item.tanggal_distribusi),
      item.mustahik?.nama || '',
      item.mustahik?.alamat || '',
      item.mustahik?.kategori_mustahik?.nama || '',
      item.jenis_distribusi === 'beras' ? 'Beras' : 'Uang',
      item.jenis_distribusi === 'beras'
        ? `${formatNumber(item.jumlah)} kg`
        : formatCurrency(item.jumlah),
      item.status === 'selesai' ? 'Selesai' : 'Pending',
    ]),
  ]);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Distribusi');
  XLSX.writeFile(wb, `Laporan-Distribusi-${Date.now()}.xlsx`);
};

// ============================================================================
// MUSTAHIK EXPORTS
// ============================================================================

export const exportMustahikPDF = (groupedData: any[], summary: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  addPDFHeader(pdf, 'LAPORAN DAFTAR MUSTAHIK');
  
  let y = 45;
  
  // Summary
  pdf.setFontSize(10);
  pdf.text(`Total Mustahik: ${summary.totalMustahik} KK`, 20, y);
  y += 6;
  pdf.text(`Aktif: ${summary.totalAktif} KK | Non-Aktif: ${summary.totalNonAktif} KK`, 20, y);
  y += 6;
  pdf.text(`Total Anggota: ${summary.totalAnggota} jiwa`, 20, y);
  y += 10;
  
  // Loop through each kategori
  groupedData.forEach((group) => {
    if (group.mustahikList.length === 0) return;
    
    // Check if we need a new page
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${group.kategori} (${group.totalCount} mustahik)`, 20, y);
    y += 6;
    
    const tableData = group.mustahikList.map((m: any) => [
      m.nama,
      m.alamat,
      m.jumlah_anggota.toString(),
      m.no_telp || '-',
      m.is_active ? 'Aktif' : 'Non-Aktif',
    ]);
    
    autoTable(pdf, {
      startY: y,
      head: [['Nama', 'Alamat', 'Anggota', 'No. Telp', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    y = (pdf as any).lastAutoTable.finalY + 8;
  });
  
  addPDFFooter(pdf);
  pdf.save(`Laporan-Mustahik-${Date.now()}.pdf`);
};

export const exportMustahikExcel = (groupedData: any[], summary: any) => {
  const rows: any[] = [
    ['LAPORAN DAFTAR MUSTAHIK'],
    ['Masjid Al-Fajar'],
    [],
    ['Total Mustahik', `${summary.totalMustahik} KK`],
    ['Aktif', `${summary.totalAktif} KK`],
    ['Non-Aktif', `${summary.totalNonAktif} KK`],
    ['Total Anggota', `${summary.totalAnggota} jiwa`],
    [],
  ];
  
  groupedData.forEach((group) => {
    rows.push([`${group.kategori} (${group.totalCount} mustahik)`]);
    rows.push(['Nama', 'Alamat', 'Anggota', 'No. Telp', 'Status']);
    
    group.mustahikList.forEach((m: any) => {
      rows.push([
        m.nama,
        m.alamat,
        m.jumlah_anggota,
        m.no_telp || '-',
        m.is_active ? 'Aktif' : 'Non-Aktif',
      ]);
    });
    
    rows.push([]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mustahik');
  XLSX.writeFile(wb, `Laporan-Mustahik-${Date.now()}.xlsx`);
};

// ============================================================================
// HAK AMIL EXPORTS
// ============================================================================

// Helper: Map kategori to Indonesian labels
const getKategoriLabel = (kategori: string): string => {
  const labels: Record<string, string> = {
    'zakat_fitrah': 'Zakat Fitrah',
    'zakat_maal': 'Zakat Maal',
    'infak': 'Infak',
    'fidyah': 'Fidyah',
    'beras': 'Beras',
  };
  return labels[kategori] || kategori;
};

// Helper: Map basis mode to Indonesian labels
const getBasisModeLabel = (basisMode: string): string => {
  const labels: Record<string, string> = {
    'net_after_reconciliation': 'Neto Setelah Rekonsiliasi',
    'gross_before_reconciliation': 'Bruto Sebelum Rekonsiliasi',
  };
  return labels[basisMode] || basisMode;
};

// HAK AMIL Summary interface (matching useHakAmil.ts)
export interface HakAmilSummary {
  categories: Array<{
    kategori: 'zakat_fitrah' | 'zakat_maal' | 'infak' | 'fidyah' | 'beras';
    total_bruto: number;
    total_rekonsiliasi: number;
    total_neto: number;
    persen_hak_amil: number;
    nominal_hak_amil: number;
  }>;
  grand_total_bruto: number;
  grand_total_rekonsiliasi: number;
  grand_total_neto: number;
  grand_total_hak_amil: number;
}

export interface HakAmilExportFilters {
  periode: string; // e.g., "Januari 2026" or "Tahun 2026"
  tahunZakatNama: string; // e.g., "1445 H / 2024 M"
  basisMode: string; // e.g., "net_after_reconciliation"
}

export const exportHakAmilPDF = (
  summary: HakAmilSummary,
  filters: HakAmilExportFilters
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  addPDFHeader(pdf, 'LAPORAN HAK AMIL');
  
  let y = 45;
  
  // Filter metadata
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Periode:', 20, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(filters.periode, 45, y);
  y += 6;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tahun Zakat:', 20, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(filters.tahunZakatNama, 45, y);
  y += 6;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Basis Kalkulasi:', 20, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(getBasisModeLabel(filters.basisMode), 45, y);
  y += 10;
  
  // Category table
  const tableData = summary.categories.map((cat) => [
    getKategoriLabel(cat.kategori),
    formatCurrency(cat.total_bruto),
    formatCurrency(cat.total_rekonsiliasi),
    formatCurrency(cat.total_neto),
    formatPercentage(cat.persen_hak_amil),
    formatCurrency(cat.nominal_hak_amil),
  ]);
  
  // Add grand total row
  tableData.push([
    'TOTAL',
    formatCurrency(summary.grand_total_bruto),
    formatCurrency(summary.grand_total_rekonsiliasi),
    formatCurrency(summary.grand_total_neto),
    '-',
    formatCurrency(summary.grand_total_hak_amil),
  ]);
  
  autoTable(pdf, {
    startY: y,
    head: [['Kategori', 'Bruto', 'Rekonsiliasi', 'Neto', 'Persen (%)', 'Nominal Hak Amil']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    footStyles: { fillColor: [229, 231, 235], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: 'right', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 28 },
    },
    didParseCell: function(data) {
      // Make the last row (TOTAL) bold
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [229, 231, 235];
      }
    },
  });
  
  addPDFFooter(pdf);
  pdf.save(`Laporan-Hak-Amil-${Date.now()}.pdf`);
};

export const exportHakAmilExcel = (
  summary: HakAmilSummary,
  filters: HakAmilExportFilters
) => {
  const rows: any[] = [
    ['LAPORAN HAK AMIL'],
    ['Masjid Al-Fajar'],
    [],
    ['Periode', filters.periode],
    ['Tahun Zakat', filters.tahunZakatNama],
    ['Basis Kalkulasi', getBasisModeLabel(filters.basisMode)],
    [],
    ['Kategori', 'Bruto', 'Rekonsiliasi', 'Neto', 'Persen (%)', 'Nominal Hak Amil'],
  ];
  
  // Add category rows
  summary.categories.forEach((cat) => {
    rows.push([
      getKategoriLabel(cat.kategori),
      formatCurrency(cat.total_bruto),
      formatCurrency(cat.total_rekonsiliasi),
      formatCurrency(cat.total_neto),
      formatPercentage(cat.persen_hak_amil),
      formatCurrency(cat.nominal_hak_amil),
    ]);
  });
  
  // Add grand total row
  rows.push([
    'TOTAL',
    formatCurrency(summary.grand_total_bruto),
    formatCurrency(summary.grand_total_rekonsiliasi),
    formatCurrency(summary.grand_total_neto),
    '-',
    formatCurrency(summary.grand_total_hak_amil),
  ]);
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Add styling for header rows (bold)
  if (!ws['!cols']) ws['!cols'] = [];
  ws['!cols'][0] = { width: 20 };
  ws['!cols'][1] = { width: 18 };
  ws['!cols'][2] = { width: 18 };
  ws['!cols'][3] = { width: 18 };
  ws['!cols'][4] = { width: 12 };
  ws['!cols'][5] = { width: 20 };
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hak Amil');
  XLSX.writeFile(wb, `Laporan-Hak-Amil-${Date.now()}.xlsx`);
};
