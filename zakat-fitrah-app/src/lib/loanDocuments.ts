import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface PrintData {
  loan_number: string; customer_name: string; purpose: string; principal: number; status: string; migration_cutoff: string | null;
  disbursement: { date: string; amount: number; method: string; reference: string | null } | null;
  schedule: { date: string; amount: number; opening_remaining: number | null }[];
  payments: { date: string; amount: number; status: string; method: string }[];
}
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));

export async function downloadLoanDocument(loanId: string, type: 'disbursement' | 'card') {
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc('loan_print_document_data', { p_loan_id: loanId });
  if (error) throw error;
  const loan = data as PrintData;
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;
  const write = (line: string) => {
    const lines = pdf.splitTextToSize(line, 180) as string[];
    for (const part of lines) { if (y > 280) { pdf.addPage(); y = 18; } pdf.text(part, 15, y); y += 6; }
  };
  pdf.setFontSize(13); write(type === 'card' ? 'KARTU PINJAMAN DAN RIWAYAT PEMBAYARAN' : 'RINGKASAN PENCAIRAN PINJAMAN');
  pdf.setFontSize(10); write('Yayasan Al-Fajar Permata Pamulang');
  write(`Nomor: ${loan.loan_number}`); write(`Nasabah: ${loan.customer_name}`); write(`Tujuan: ${loan.purpose}`);
  write(`Pokok: ${money(loan.principal)}`); write(`Status: ${loan.status}`);
  if (loan.disbursement) {
    write(`Tanggal pencairan: ${loan.disbursement.date}`); write(`Nominal pencairan: ${money(loan.disbursement.amount)}`);
    write(`Metode: ${loan.disbursement.method}`); write(`Referensi: ${loan.disbursement.reference || '-'}`);
  } else write('Rincian pencairan historis belum tersedia.');
  if (type === 'card') {
    if (loan.migration_cutoff) write(`Data sebelum ${loan.migration_cutoff} mungkin tidak lengkap.`);
    y += 3; write('Jadwal angsuran');
    loan.schedule.forEach((item, i) => write(`${i + 1}. ${item.date} — ${money(item.amount)}`));
    if (!loan.schedule.length) write('Jadwal belum tersedia.');
    y += 3; write('Riwayat pembayaran');
    loan.payments.forEach(item => write(`${item.date} — ${money(item.amount)} — ${item.method} — ${item.status}`));
    if (!loan.payments.length) write('Belum ada pembayaran yang tercatat.');
  }
  y += 3; write(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  pdf.save(`${type === 'card' ? 'kartu-pinjaman' : 'ringkasan-pencairan'}-${loan.loan_number}.pdf`);
}
