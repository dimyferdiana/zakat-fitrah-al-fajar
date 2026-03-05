import { useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AkunUang, PemasukanUangKategori } from '@/hooks/usePemasukanUang';
import { MuzakkiCreatableCombobox } from '@/components/pemasukan/MuzakkiCreatableCombobox';
import { useState } from 'react';
import { validatePaymentProofFile } from '@/lib/paymentProof';

const formSchema = z.object({
  tahun_zakat_id: z.string().min(1, { message: 'Tahun zakat wajib dipilih' }),
  kategori: z.enum(['fidyah_uang', 'maal_penghasilan_uang', 'infak_sedekah_uang', 'zakat_fitrah_uang'], {
    message: 'Pilih kategori',
  }),
  account_id: z.string().min(1, { message: 'Pilih rekening' }),
  jumlah_uang_rp: z.number().positive({ message: 'Nominal harus lebih dari 0' }),
  tanggal: z.date({ message: 'Tanggal wajib diisi' }),
  catatan: z.string().max(255, { message: 'Maksimal 255 karakter' }).optional().or(z.literal('')),
  muzakki_id: z.string().optional(),
});

export type PemasukanFormValues = z.infer<typeof formSchema>;

interface TahunOption {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  is_active: boolean;
}

interface PemasukanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    tahun_zakat_id: string;
    kategori: PemasukanUangKategori;
    akun: AkunUang;
    account_id: string;
    jumlah_uang_rp: number;
    tanggal: string;
    catatan?: string;
    muzakki_id?: string;
    bukti_bayar_url?: string;
    bukti_bayar_file?: File;
  }) => void;
  tahunOptions: TahunOption[];
  defaultTahunId?: string;
  defaultValues?: {
    tahun_zakat_id: string;
    kategori: PemasukanUangKategori;
    akun: AkunUang;
    account_id?: string;
    jumlah_uang_rp: number;
    tanggal: string;
    catatan?: string;
    muzakki_id?: string;
    bukti_bayar_url?: string;
  };
  accountOptions: Array<{
    id: string;
    account_name: string;
    account_channel: 'kas' | 'bank' | 'qris';
  }>;
  isSubmitting: boolean;
}

export function PemasukanForm({
  open,
  onOpenChange,
  onSubmit,
  tahunOptions,
  defaultTahunId,
  defaultValues,
  accountOptions,
  isSubmitting,
}: PemasukanFormProps) {
  const [selectedProofFile, setSelectedProofFile] = useState<File | undefined>(undefined);
  const [proofError, setProofError] = useState<string | null>(null);

  const form = useForm<PemasukanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ? {
      tahun_zakat_id: defaultValues.tahun_zakat_id,
      kategori: defaultValues.kategori,
      account_id: defaultValues.account_id || accountOptions[0]?.id || '',
      jumlah_uang_rp: defaultValues.jumlah_uang_rp,
      tanggal: new Date(defaultValues.tanggal),
      catatan: defaultValues.catatan || '',
      muzakki_id: defaultValues.muzakki_id,
    } : {
      tahun_zakat_id: defaultTahunId || '',
      kategori: 'fidyah_uang',
      account_id: accountOptions[0]?.id || '',
      jumlah_uang_rp: 0,
      tanggal: new Date(),
      catatan: '',
      muzakki_id: undefined,
    },
  });

  useEffect(() => {
    if (defaultTahunId) {
      form.setValue('tahun_zakat_id', defaultTahunId);
    }
  }, [defaultTahunId, form]);

  useEffect(() => {
    const currentValue = form.getValues('account_id');
    if (!currentValue && accountOptions.length > 0) {
      form.setValue('account_id', accountOptions[0].id);
    }
  }, [accountOptions, form]);

  // Reset form when defaultValues change (e.g., when editing a different item)
  useEffect(() => {
    if (defaultValues) {
      setSelectedProofFile(undefined);
      setProofError(null);
      form.reset({
        tahun_zakat_id: defaultValues.tahun_zakat_id,
        kategori: defaultValues.kategori,
        account_id: defaultValues.account_id || accountOptions[0]?.id || '',
        jumlah_uang_rp: defaultValues.jumlah_uang_rp,
        tanggal: new Date(defaultValues.tanggal),
        catatan: defaultValues.catatan || '',
        muzakki_id: defaultValues.muzakki_id,
      });
    }
  }, [defaultValues, form]);

  useEffect(() => {
    if (!open) {
      setSelectedProofFile(undefined);
      setProofError(null);
    }
  }, [open]);

  const handleSubmit = (values: PemasukanFormValues) => {
    if (proofError) {
      return;
    }

    const selectedAccount = accountOptions.find((account) => account.id === values.account_id);
    const akun: AkunUang = selectedAccount?.account_channel === 'kas' ? 'kas' : 'bank';

    onSubmit({
      ...values,
      akun,
      catatan: values.catatan || undefined,
      bukti_bayar_url: defaultValues?.bukti_bayar_url,
      bukti_bayar_file: selectedProofFile,
      tanggal: values.tanggal.toISOString().split('T')[0],
    });
  };

  const handleProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedProofFile(undefined);
      setProofError(null);
      return;
    }

    const validationError = validatePaymentProofFile(file);
    if (validationError) {
      setSelectedProofFile(undefined);
      setProofError(validationError);
      return;
    }

    setSelectedProofFile(file);
    setProofError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pemasukan Uang</DialogTitle>
          <DialogDescription>
            Catat pemasukan uang (fidyah, maal, infak/sedekah)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tahun_zakat_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Zakat *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tahunOptions.map((tahun) => (
                        <SelectItem key={tahun.id} value={tahun.id}>
                          {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                          {tahun.is_active ? ' - Aktif' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kategori"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fidyah_uang">Fidyah Uang</SelectItem>
                        <SelectItem value="maal_penghasilan_uang">Maal/Penghasilan</SelectItem>
                        <SelectItem value="infak_sedekah_uang">Infak/Sedekah</SelectItem>
                        <SelectItem value="zakat_fitrah_uang">Zakat Fitrah (Uang)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rekening *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih rekening" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountOptions.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name} ({account.account_channel.toUpperCase()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jumlah_uang_rp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nominal (Rp) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="100"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd MMMM yyyy', { locale: idLocale })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="muzakki_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Muzakki (Opsional)</FormLabel>
                  <FormControl>
                    <MuzakkiCreatableCombobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Opsional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Bukti Bayar (Opsional)</label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProofFileChange}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Maksimal 1 gambar (JPG/PNG/WEBP), ukuran 1 MB.</p>
              {selectedProofFile && (
                <p className="text-xs text-muted-foreground">
                  File terpilih: {selectedProofFile.name}
                </p>
              )}
              {defaultValues?.bukti_bayar_url && (
                <div className="space-y-2 rounded-md border p-2">
                  <p className="text-xs font-medium text-muted-foreground">Bukti bayar saat ini</p>
                  <a href={defaultValues.bukti_bayar_url} target="_blank" rel="noreferrer">
                    <img
                      src={defaultValues.bukti_bayar_url}
                      alt="Bukti bayar saat ini"
                      className="h-28 w-auto rounded-md border object-cover"
                    />
                  </a>
                  <a
                    className="text-xs text-primary underline"
                    href={defaultValues.bukti_bayar_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat bukti bayar saat ini
                  </a>
                  {selectedProofFile && (
                    <p className="text-xs text-muted-foreground">
                      File baru akan menggantikan bukti bayar saat ini setelah disimpan.
                    </p>
                  )}
                </div>
              )}
              {proofError && <p className="text-xs text-destructive">{proofError}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
