import { useState } from 'react';
import { SedekahReceiptForm } from '@/components/sedekah/SedekahReceiptForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatRupiah } from '@/lib/terbilang';
import { downloadSedekahReceipt } from '@/utils/sedekahReceipt';
import {
  useSedekahReceiptsList,
  useDeleteSedekahReceipt,
  type SedekahReceiptRow,
} from '@/hooks/useSedekahReceipts';
import { toast } from 'sonner';
import { Pencil, Trash2, Download } from 'lucide-react';

export function SedekahReceiptPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'buat'>('daftar');
  const [editTarget, setEditTarget] = useState<SedekahReceiptRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SedekahReceiptRow | null>(null);

  const { data: receipts = [], isLoading, refetch } = useSedekahReceiptsList();
  const deleteReceipt = useDeleteSedekahReceipt();

  const handleEditClose = () => setEditTarget(null);

  const handleEditSuccess = () => {
    setEditTarget(null);
    refetch();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReceipt.mutateAsync(deleteTarget.id);
      toast.success(`Bukti ${deleteTarget.receipt_number} berhasil dihapus`);
    } catch {
      toast.error('Gagal menghapus bukti sedekah');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRedownload = async (receipt: SedekahReceiptRow) => {
    try {
      await downloadSedekahReceipt({
        receiptNumber: receipt.receipt_number,
        donorName: receipt.donor_name,
        donorAddress: receipt.donor_address,
        donorPhone: receipt.donor_phone ?? undefined,
        category: receipt.category,
        amount: receipt.amount,
        date: new Date(receipt.tanggal),
        notes: receipt.notes ?? undefined,
      });
      toast.success('PDF berhasil diunduh ulang');
    } catch {
      toast.error('Gagal mengunduh PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bukti Sedekah</h1>
        <p className="text-slate-600 mt-2">
          Kelola dan buat dokumen bukti pembayaran sedekah/infak.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daftar' | 'buat')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daftar">Daftar Bukti Sedekah</TabsTrigger>
          <TabsTrigger value="buat">Buat Bukti Baru</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Daftar ─────────────────────────────────────── */}
        <TabsContent value="daftar">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Daftar Bukti Sedekah</h2>
              <Button onClick={() => setActiveTab('buat')}>+ Tambah Baru</Button>
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
                      <th className="py-2 pr-4 text-right">Jumlah</th>
                      <th className="py-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr key={receipt.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="py-2 pr-4 font-medium">{receipt.receipt_number}</td>
                        <td className="py-2 pr-4">{receipt.tanggal}</td>
                        <td className="py-2 pr-4">{receipt.category}</td>
                        <td className="py-2 pr-4">{receipt.donor_name}</td>
                        <td className="py-2 pr-4 text-right">{formatRupiah(receipt.amount)}</td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Unduh ulang PDF"
                              onClick={() => handleRedownload(receipt)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Edit bukti"
                              onClick={() => setEditTarget(receipt)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Hapus bukti"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteTarget(receipt)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Buat Baru ───────────────────────────────────── */}
        <TabsContent value="buat">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Buat Bukti Sedekah Baru</h2>
            <SedekahReceiptForm
              onSuccess={() => {
                refetch();
                setActiveTab('daftar');
              }}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-blue-900 mb-2">Informasi</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Data donor akan disimpan untuk memudahkan pencarian di masa depan</li>
              <li>• Bukti sedekah yang dibuat akan tersimpan di database untuk riwayat</li>
              <li>• Untuk setiap pembuatan bukti, sistem akan otomatis mencari atau membuat profil donor</li>
              <li>• Pastikan data donor (nama, alamat) akurat sebelum membuat bukti</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && handleEditClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Bukti Sedekah – {editTarget?.receipt_number}
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <SedekahReceiptForm
              editData={editTarget}
              onSuccess={handleEditSuccess}
              onCancel={handleEditClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────── */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bukti Sedekah?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus bukti{' '}
              <strong>{deleteTarget?.receipt_number}</strong> atas nama{' '}
              <strong>{deleteTarget?.donor_name}</strong>.
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SedekahReceiptPage;

