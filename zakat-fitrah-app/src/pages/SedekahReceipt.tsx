import { SedekahReceiptForm } from '@/components/sedekah/SedekahReceiptForm';

export function SedekahReceiptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buat Bukti Sedekah</h1>
        <p className="text-slate-600 mt-2">
          Buat dokumen bukti pembayaran sedekah/infak yang akan diberikan kepada donor.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <SedekahReceiptForm />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Data donor akan disimpan untuk memudahkan pencarian di masa depan</li>
          <li>• Bukti sedekah yang dibuat tidak akan disimpan di database (hanya PDF yang diunduh)</li>
          <li>• Untuk setiap pembuatan bukti, sistem akan otomatis mencari atau membuat profil donor</li>
          <li>• Pastikan data donor (nama, alamat) akurat sebelum membuat bukti</li>
        </ul>
      </div>
    </div>
  );
}

export default SedekahReceiptPage;
