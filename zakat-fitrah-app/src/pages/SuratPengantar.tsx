import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ScrollText, Printer } from 'lucide-react';
import { downloadSuratPengantarDomain, generateSuratPengantarDomainPDF } from '@/utils/suratPengantar';
import { toast } from 'sonner';

const LETTER_DATE = new Date(2026, 1, 25); // 25 Februari 2026

export function SuratPengantarPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await downloadSuratPengantarDomain(LETTER_DATE);
      toast.success('PDF berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      const pdf = await generateSuratPengantarDomainPDF(LETTER_DATE);
      const pdfUrl = pdf.output('datauristring');
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
      toast.success('Membuka dialog cetak...');
    } catch {
      toast.error('Gagal membuka dialog cetak');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Surat Pengantar</h1>
        <p className="text-slate-600 mt-2">
          Surat resmi dari Yayasan Al-Fajar Permata Pamulang.
        </p>
      </div>

      {/* Document card */}
      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        <div className="flex items-start gap-4 pb-4 border-b">
          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
            <ScrollText className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Surat Permohonan Domain masjidalfajar.or.id
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Surat pengantar untuk persyaratan pendaftaran domain .or.id kepada PANDI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Nomor Surat</p>
            <p className="font-medium">001/SP-DOM/YAF/II/2026</p>
          </div>
          <div>
            <p className="text-slate-500">Tanggal</p>
            <p className="font-medium">25 Februari 2026</p>
          </div>
          <div>
            <p className="text-slate-500">Perihal</p>
            <p className="font-medium">Permohonan Domain masjidalfajar.or.id</p>
          </div>
          <div>
            <p className="text-slate-500">Ditandatangani oleh</p>
            <p className="font-medium">H. Eldin Rizal Nasution</p>
            <p className="text-xs text-slate-400">Ketua Yayasan</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleDownload} disabled={isLoading} className="gap-2">
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
          <Button onClick={handlePrint} disabled={isLoading} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Persyaratan Domain .or.id</h3>
        <p className="text-sm text-amber-800 mb-3">
          Berdasarkan ketentuan PANDI, domain <strong>.or.id</strong> untuk organisasi sosial,
          kemasyarakatan, dan yayasan memerlukan dokumen berikut:
        </p>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• <strong>Akta Notaris</strong> Pendirian Organisasi/Yayasan</li>
          <li>• <strong>Surat Permohonan Domain</strong> dari Ketua Organisasi/Yayasan — <em>dokumen ini</em></li>
          <li>• KTP Ketua Yayasan</li>
        </ul>
        <p className="text-xs text-amber-700 mt-3">
          Ajukan ke registrar domain .or.id terdaftar atau langsung ke PANDI (pandi.id).
        </p>
      </div>
    </div>
  );
}

export default SuratPengantarPage;
