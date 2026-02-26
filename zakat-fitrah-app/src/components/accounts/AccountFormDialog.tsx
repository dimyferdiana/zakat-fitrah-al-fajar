import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface AccountFormValues {
  name: string;
  type: 'kas' | 'bank' | 'qris';
  accountNumber?: string;
}

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    account_name?: string;
    account_channel?: 'kas' | 'bank' | 'qris';
    name?: string;
    nama?: string;
    type?: 'kas' | 'bank' | 'qris';
    jenis?: 'kas' | 'bank' | 'qris';
    account_number?: string | null;
    nomor_rekening?: string | null;
  } | null;
  onSubmit: (values: AccountFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: AccountFormDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'kas' | 'bank' | 'qris'>('kas');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialData?.account_name || initialData?.name || initialData?.nama || '');
    setType(initialData?.account_channel || initialData?.type || initialData?.jenis || 'kas');
    setAccountNumber(initialData?.account_number || initialData?.nomor_rekening || '');
  }, [open, initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    await onSubmit({
      name: trimmedName,
      type,
      accountNumber: accountNumber.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tambah Rekening' : 'Edit Rekening'}</DialogTitle>
          <DialogDescription>
            Isi data rekening kas/bank yang akan digunakan untuk transaksi.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Rekening</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Kas Utama"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis</label>
            <Select value={type} onValueChange={(value) => setType(value as 'kas' | 'bank' | 'qris')}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kas">Kas</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor Rekening (opsional)</label>
            <Input
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Contoh: 1234567890"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
