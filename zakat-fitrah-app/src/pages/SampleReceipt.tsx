import { useEffect, useState } from 'react';
import { downloadSedekahReceipt } from '@/utils/sedekahReceipt';
import { Button } from '@/components/ui/button';

export function SampleReceipt() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sampleData, setSampleData] = useState({
    receiptNumber: 'INF/000001',
    donorName: 'Ahmad Hidayat',
    donorAddress: 'Jl. Contoh No. 12, Pamulang',
    donorPhone: '0812-3456-7890',
    category: 'Infak',
    amount: 250000,
    date: new Date().toISOString(),
    notes: 'Contoh bukti sedekah otomatis',
  });

  const generateSample = async () => {
    try {
      setIsGenerating(true);
      await downloadSedekahReceipt({
        receiptNumber: sampleData.receiptNumber,
        donorName: sampleData.donorName,
        donorAddress: sampleData.donorAddress,
        donorPhone: sampleData.donorPhone,
        category: sampleData.category,
        amount: sampleData.amount,
        date: new Date(sampleData.date),
        notes: sampleData.notes,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('last_sedekah_receipt_sample');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSampleData((prev) => ({
          ...prev,
          ...parsed,
          date: parsed.date || prev.date,
        }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-4 max-w-md w-full">
        <h1 className="text-xl font-semibold">Sample Bukti Sedekah</h1>
        <p className="text-sm text-slate-600">
          Klik tombol di bawah untuk mengunduh PDF sample.
        </p>
        <Button type="button" onClick={generateSample} disabled={isGenerating}>
          {isGenerating ? 'Membuat PDF...' : 'Unduh Lagi'}
        </Button>
      </div>
    </div>
  );
}

export default SampleReceipt;
