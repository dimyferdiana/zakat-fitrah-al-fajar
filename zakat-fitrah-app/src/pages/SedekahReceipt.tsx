import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SedekahReceiptForm } from '@/components/sedekah/SedekahReceiptForm';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/terbilang';
import { supabase } from '@/lib/supabase';

export function SedekahReceiptPage() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const {
    data: receipts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['bukti-sedekah-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bukti_sedekah')
        .select('id, receipt_number, category, donor_name, amount, tanggal, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buat Bukti Sedekah</h1>
        <p className="text-slate-600 mt-2">
          Buat dokumen bukti pembayaran sedekah/infak yang akan diberikan kepada donor.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Daftar Bukti Sedekah</h2>
          <Button
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Tambah
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-600">Memuat data bukti sedekah...</p>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-slate-600">Belum ada bukti sedekah yang dibuat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">No Bukti</th>
                  <th className="py-2 pr-4">Tanggal</th>
                  <th className="py-2 pr-4">Kategori</th>
                  <th className="py-2 pr-4">Donor</th>
                  <th className="py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt: any) => (
                  <tr key={receipt.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">{receipt.receipt_number}</td>
                    <td className="py-2 pr-4">{receipt.tanggal}</td>
                    <td className="py-2 pr-4">{receipt.category}</td>
                    <td className="py-2 pr-4">{receipt.donor_name}</td>
                    <td className="py-2 text-right">{formatRupiah(receipt.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div ref={formRef}>
          <SedekahReceiptForm onSuccess={refetch} />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Data donor akan disimpan untuk memudahkan pencarian di masa depan</li>
          <li>• Bukti sedekah yang dibuat akan tersimpan di database untuk riwayat</li>
          <li>• Untuk setiap pembuatan bukti, sistem akan otomatis mencari atau membuat profil donor</li>
          <li>• Pastikan data donor (nama, alamat) akurat sebelum membuat bukti</li>
        </ul>
      </div>
    </div>
  );
}

export default SedekahReceiptPage;
