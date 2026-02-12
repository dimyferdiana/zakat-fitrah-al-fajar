import { useEffect } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PemasukanBerasKategori } from '@/hooks/usePemasukanBeras';

const formSchema = z.object({
  tahun_zakat_id: z.string().min(1, { message: 'Tahun zakat wajib dipilih' }),
  kategori: z.enum(['fidyah_beras', 'infak_sedekah_beras', 'zakat_fitrah_beras'], {
    message: 'Pilih kategori',
  }),
  jumlah_beras_kg: z.number().positive({ message: 'Jumlah harus lebih dari 0' }),
  tanggal: z.date({ message: 'Tanggal wajib diisi' }),
  catatan: z.string().max(255, { message: 'Maksimal 255 karakter' }).optional().or(z.literal('')),
  muzakki_id: z.string().optional(),
});

export type PemasukanBerasFormValues = z.infer<typeof formSchema>;

interface TahunOption {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  is_active: boolean;
}

interface MuzakkiOption {
  id: string;
  nama_kk: string;
}

interface PemasukanBerasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    tahun_zakat_id: string;
    kategori: PemasukanBerasKategori;
    jumlah_beras_kg: number;
    tanggal: string;
    catatan?: string;
    muzakki_id?: string;
  }) => void;
  tahunOptions: TahunOption[];
  defaultTahunId?: string;
  isSubmitting: boolean;
}

export function PemasukanBerasForm({
  open,
  onOpenChange,
  onSubmit,
  tahunOptions,
  defaultTahunId,
  isSubmitting,
}: PemasukanBerasFormProps) {
  const form = useForm<PemasukanBerasFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun_zakat_id: defaultTahunId || '',
      kategori: 'fidyah_beras',
      jumlah_beras_kg: 0,
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

  const { data: muzakkiOptions } = useQuery({
    queryKey: ['muzakki-options'],
    queryFn: async (): Promise<MuzakkiOption[]> => {
      const { data, error } = await supabase
        .from('muzakki')
        .select('id, nama_kk')
        .order('nama_kk', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = (values: PemasukanBerasFormValues) => {
    onSubmit({
      ...values,
      catatan: values.catatan || undefined,
      tanggal: values.tanggal.toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pemasukan Beras</DialogTitle>
          <DialogDescription>
            Catat pemasukan beras (fidyah, infak/sedekah, zakat fitrah)
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
                      <SelectItem value="fidyah_beras">Fidyah Beras</SelectItem>
                      <SelectItem value="infak_sedekah_beras">Infak/Sedekah</SelectItem>
                      <SelectItem value="zakat_fitrah_beras">Zakat Fitrah (Beras)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jumlah_beras_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Beras (Kg) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
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
                  <Select 
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} 
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih muzakki (opsional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Tanpa muzakki</SelectItem>
                      {muzakkiOptions?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nama_kk}
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
