import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getTerbilangText } from '@/lib/terbilang';

interface Receipt {
  receipt_number: string; issued_at: string; status: string; loan_number: string;
  customer_name: string | null; payment_date: string; amount: number; method: string;
  reference: string | null; verified_by_name: string | null; remaining: number;
}

export async function downloadLoanReceipt(paymentId: string, issue: boolean) {
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc('loan_receipt', { p_payment_id: paymentId, p_issue: issue });
  if (error) throw error;
  if (!data) throw new Error('Tanda terima belum diterbitkan pengurus.');
  const receipt = data as Receipt;
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a5' });
  const formatMoney = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  pdf.setFontSize(14); pdf.text('TANDA TERIMA PEMBAYARAN PINJAMAN', 12, 15);
  pdf.setFontSize(10); pdf.text('Yayasan Al-Fajar Permata Pamulang', 12, 22);
  if (receipt.status === 'cancelled') { pdf.setTextColor(180, 0, 0); pdf.setFontSize(14); pdf.text('DIBATALKAN', 12, 31); pdf.setTextColor(0, 0, 0); }
  pdf.setFontSize(9);
  const lines = [
    `Nomor tanda terima: ${receipt.receipt_number}`, `Nomor pinjaman: ${receipt.loan_number}`,
    `Nasabah: ${receipt.customer_name || 'Tidak tersedia'}`, `Tanggal pembayaran: ${receipt.payment_date}`,
    `Nominal: ${formatMoney(Number(receipt.amount))}`, `Terbilang: ${getTerbilangText(Number(receipt.amount))}`,
    `Metode: ${receipt.method}`, `Referensi: ${receipt.reference || '-'}`,
    `Penerima/pemeriksa: ${receipt.verified_by_name || 'Tidak tersedia'}`,
    `Waktu diterbitkan: ${new Date(receipt.issued_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
    `Sisa pokok saat terbit: ${formatMoney(Number(receipt.remaining))}`,
    'Dokumen ini merupakan bukti pencatatan penerimaan pembayaran.',
  ];
  let y = 39;
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 122) as string[];
    pdf.text(wrapped, 12, y); y += wrapped.length * 5 + 2;
  }
  pdf.save(`tanda-terima-${receipt.receipt_number}.pdf`);
}
