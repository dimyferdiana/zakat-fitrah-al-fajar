import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateRekonsiliasi } from '@/hooks/useRekonsiliasi';

const rekonsiliasiSchema = z.object({
  tahun_zakat_id: z.string().min(1, 'Tahun zakat wajib dipilih'),
  jenis: z.enum(['uang', 'beras']),
  akun: z.enum(['kas', 'bank']).optional(),
  jumlah: z
    .number()
    .refine((val) => val !== 0, 'Jumlah tidak boleh 0'),
  tanggal: z.string().min(1, 'Tanggal wajib dipilih'),
  catatan: z.string().min(10, 'Catatan minimal 10 karakter'),
}).refine((val) => {
  if (val.jenis === 'uang') {
    return !!val.akun;
  }
  return true;
}, {
  path: ['akun'],
  message: 'Pilih akun',
});

type RekonsiliasiFormData = z.infer<typeof rekonsiliasiSchema>;

interface RekonsiliasiFormProps {
  tahunZakatId: string;
  tahunOptions: Array<{ id: string; label: string }>;
}

export function RekonsiliasiForm({ tahunZakatId, tahunOptions }: RekonsiliasiFormProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateRekonsiliasi();

  const form = useForm<RekonsiliasiFormData>({
    resolver: zodResolver(rekonsiliasiSchema),
    defaultValues: {
      tahun_zakat_id: tahunZakatId,
      jenis: 'uang',
      jumlah: undefined,
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      catatan: '',
    },
  });

  const jenis = form.watch('jenis');

  const onSubmit = async (data: RekonsiliasiFormData) => {
    await createMutation.mutateAsync(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Rekonsiliasi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Rekonsiliasi</DialogTitle>
          <DialogDescription>
            Tambahkan adjustment manual untuk kas/beras. Gunakan nilai positif untuk menambah, negatif untuk mengurangi.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tahun_zakat_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Zakat</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun zakat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tahunOptions.map((tahun) => (
                        <SelectItem key={tahun.id} value={tahun.id}>
                          {tahun.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jenis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="uang">Uang (Rp)</SelectItem>
                      <SelectItem value="beras">Beras (kg)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {jenis === 'uang' && (
              <FormField
                control={form.control}
                name="akun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Akun</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih akun" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kas">Kas</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="jumlah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah {jenis === 'uang' ? '(Rp)' : '(kg)'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={jenis === 'uang' ? '0' : '0.00'}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const next = raw === '' ? undefined : Number(raw);
                        field.onChange(Number.isNaN(next) ? undefined : next);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Gunakan angka positif untuk menambah, negatif untuk mengurangi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal</FormLabel>
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
                            format(new Date(field.value), 'dd/MM/yyyy')
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
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
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
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Adjustment selisih kas berdasarkan penghitungan fisik"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Jelaskan alasan rekonsiliasi ini dilakukan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
