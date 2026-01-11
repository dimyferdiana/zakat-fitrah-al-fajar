import { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  nama_kk: z.string().min(3, { message: 'Nama KK minimal 3 karakter' }).max(100),
  alamat: z.string().min(5, { message: 'Alamat minimal 5 karakter' }),
  no_telp: z.string().optional(),
  jumlah_jiwa: z.number().min(1, { message: 'Minimal 1 jiwa' }).max(50),
  jenis_zakat: z.enum(['beras', 'uang'], { message: 'Pilih jenis zakat' }),
  tanggal_bayar: z.date({ message: 'Pilih tanggal pembayaran' }),
  akun_uang: z.enum(['kas', 'bank']).optional(),
  jumlah_uang_dibayar_rp: z.number().positive({ message: 'Nominal harus lebih dari 0' }).optional(),
}).refine((val) => {
  if (val.jenis_zakat === 'uang') {
    return !!val.akun_uang;
  }
  return true;
}, {
  path: ['akun_uang'],
  message: 'Pilih akun uang',
}).refine((val) => {
  if (val.jenis_zakat === 'uang') {
    return !!val.jumlah_uang_dibayar_rp && val.jumlah_uang_dibayar_rp > 0;
  }
  return true;
}, {
  path: ['jumlah_uang_dibayar_rp'],
  message: 'Nominal diterima wajib diisi',
});

type FormValues = z.infer<typeof formSchema>;

interface Muzakki {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface PembayaranZakat {
  id: string;
  muzakki_id: string;
  muzakki: Muzakki;
  tahun_zakat_id: string;
  tanggal_bayar: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
  akun_uang?: 'kas' | 'bank' | null;
  jumlah_uang_dibayar_rp?: number | null;
}

interface MuzakkiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues & { id?: string; muzakki_id?: string; tahun_zakat_id: string; kewajiban_uang?: number }) => void;
  editData?: PembayaranZakat | null;
  isSubmitting: boolean;
}

export function MuzakkiForm({
  open,
  onOpenChange,
  onSubmit,
  editData,
  isSubmitting,
}: MuzakkiFormProps) {
  const [nilaiPerOrang, setNilaiPerOrang] = useState<{
    beras: number;
    uang: number;
  } | null>(null);
  const [activeTahunId, setActiveTahunId] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_kk: '',
      alamat: '',
      no_telp: '',
      jumlah_jiwa: 1,
      jenis_zakat: 'beras',
      tanggal_bayar: new Date(),
      akun_uang: undefined,
      jumlah_uang_dibayar_rp: undefined,
    },
  });

  // Fetch active tahun_zakat and nilai per orang
  useEffect(() => {
    const fetchNilaiZakat = async () => {
      const { data, error } = await supabase
        .from('tahun_zakat')
        .select('id, nilai_beras_kg, nilai_uang_rp')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching tahun zakat:', error);
        return;
      }

      const typedData = data as { id: string; nilai_beras_kg: number; nilai_uang_rp: number };
      setActiveTahunId(typedData.id);
      setNilaiPerOrang({
        beras: typedData.nilai_beras_kg,
        uang: typedData.nilai_uang_rp,
      });
    };

    fetchNilaiZakat();
  }, []);

  // Populate form with edit data
  useEffect(() => {
    if (editData) {
      form.reset({
        nama_kk: editData.muzakki.nama_kk,
        alamat: editData.muzakki.alamat,
        no_telp: editData.muzakki.no_telp || '',
        jumlah_jiwa: editData.jumlah_jiwa,
        jenis_zakat: editData.jenis_zakat,
        tanggal_bayar: new Date(editData.tanggal_bayar),
        akun_uang: editData.akun_uang || undefined,
        jumlah_uang_dibayar_rp: editData.jumlah_uang_dibayar_rp || undefined,
      });
    } else {
      form.reset({
        nama_kk: '',
        alamat: '',
        no_telp: '',
        jumlah_jiwa: 1,
        jenis_zakat: 'beras',
        tanggal_bayar: new Date(),
        akun_uang: undefined,
        jumlah_uang_dibayar_rp: undefined,
      });
    }
  }, [editData, form, open]);

  // Calculate total zakat
  const jumlahJiwa = form.watch('jumlah_jiwa');
  const jenisZakat = form.watch('jenis_zakat');

  const totalZakat =
    nilaiPerOrang && jumlahJiwa
      ? jenisZakat === 'beras'
        ? jumlahJiwa * nilaiPerOrang.beras
        : jumlahJiwa * nilaiPerOrang.uang
      : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = (values: FormValues) => {
    const submitData = {
      ...values,
      tahun_zakat_id: activeTahunId,
      ...(editData && {
        id: editData.id,
        muzakki_id: editData.muzakki_id,
      }),
      kewajiban_uang:
        values.jenis_zakat === 'uang' && nilaiPerOrang
          ? values.jumlah_jiwa * nilaiPerOrang.uang
          : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit' : 'Tambah'} Pembayaran Zakat</DialogTitle>
          <DialogDescription>
            {editData
              ? 'Perbarui data pembayaran zakat fitrah'
              : 'Tambahkan pembayaran zakat fitrah baru'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nama KK */}
            <FormField
              control={form.control}
              name="nama_kk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kepala Keluarga *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Ahmad Sulaiman" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alamat */}
            <FormField
              control={form.control}
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jl. Contoh No. 123, RT/RW 01/02"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* No Telp */}
            <FormField
              control={form.control}
              name="no_telp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="08123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Jumlah Jiwa */}
              <FormField
                control={form.control}
                name="jumlah_jiwa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Jiwa *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Jenis Zakat */}
              <FormField
                control={form.control}
                name="jenis_zakat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Zakat *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beras">Beras</SelectItem>
                        <SelectItem value="uang">Uang</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {jenisZakat === 'uang' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="akun_uang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Akun Uang *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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

                <FormField
                  control={form.control}
                  name="jumlah_uang_dibayar_rp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nominal Diterima (Rp) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="100"
                          placeholder="Masukkan nominal diterima"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Tanggal Bayar */}
            <FormField
              control={form.control}
              name="tanggal_bayar"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Pembayaran *</FormLabel>
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

            {/* Calculated Total */}
            {nilaiPerOrang && (
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">Total Zakat</div>
                <div className="text-2xl font-bold">
                  {jenisZakat === 'beras'
                    ? `${totalZakat.toFixed(2)} kg`
                    : formatCurrency(totalZakat)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {jumlahJiwa} jiwa × {jenisZakat === 'beras'
                    ? `${nilaiPerOrang.beras} kg/jiwa`
                    : formatCurrency(nilaiPerOrang.uang) + '/jiwa'}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : editData ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
