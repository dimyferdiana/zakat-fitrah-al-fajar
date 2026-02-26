import { useState, useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarIcon, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { useMustahikList } from '@/hooks/useMustahik';
import { useStokCheck, type StokSummary } from '@/hooks/useDistribusi';
import { offlineStore } from '@/lib/offlineStore';
import { supabase } from '@/lib/supabase';
import { isUuid } from '@/lib/utils';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

const formSchema = z.object({
  mustahik_id: z.string().min(1, { message: 'Pilih mustahik penerima' }),
  jenis_distribusi: z.enum(['beras', 'uang'], {
    message: 'Pilih jenis distribusi',
  }),
  jumlah: z.number().min(0.01, { message: 'Jumlah minimal 0.01' }),
  tanggal_distribusi: z.date({ message: 'Pilih tanggal distribusi' }),
});

type FormValues = z.infer<typeof formSchema>;

interface DistribusiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  tahunZakatId: string;
}

export function DistribusiForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  tahunZakatId,
}: DistribusiFormProps) {
  const [selectedMustahik, setSelectedMustahik] = useState<any>(null);
  const [eligibleMustahik, setEligibleMustahik] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mustahik_id: '',
      jenis_distribusi: 'beras',
      jumlah: 0,
      tanggal_distribusi: new Date(),
    },
  });

  // Queries
  const { data: mustahikData } = useMustahikList({
    status: 'aktif',
    page: 1,
    limit: 1000,
  });
  const { data: stokData, isLoading: loadingStok } = useStokCheck(tahunZakatId);

  const mustahikList = mustahikData?.data || [];
  const jenisDistribusi = form.watch('jenis_distribusi');
  const jumlah = form.watch('jumlah');
  const mustahikId = form.watch('mustahik_id');

    // Filter out mustahik who already received distribusi in this tahun
    useEffect(() => {
      const fetchEligible = async () => {
        if (!tahunZakatId) {
          setEligibleMustahik([]);
          return;
        }

        if (OFFLINE_MODE || !isUuid(tahunZakatId)) {
          const offlineTakenIds = new Set(
            offlineStore
              .getDistribusiList({ tahun_zakat_id: tahunZakatId, status: 'semua', page: 1, limit: 1000 })
              .data
              .filter((d) => d.status === 'pending' || d.status === 'selesai')
              .map((d) => d.mustahik_id)
          );

          const fallbackEligible = (mustahikList as any).filter(
            (m: any) => !offlineTakenIds.has(m.id)
          );
          setEligibleMustahik(fallbackEligible);

          if (mustahikId && offlineTakenIds.has(mustahikId)) {
            form.setValue('mustahik_id', '');
          }
          return;
        }

        const { data: alreadyReceived, error } = await supabase
          .from('distribusi_zakat')
          .select('mustahik_id')
          .eq('tahun_zakat_id', tahunZakatId)
          .in('status', ['pending', 'selesai']);

        if (error) {
          console.error('Gagal memuat data distribusi:', error.message);
          setEligibleMustahik(mustahikList);
          return;
        }

        const takenIds = new Set((alreadyReceived || []).map((d: any) => d.mustahik_id));
        const filtered = (mustahikList as any).filter((m: any) => !takenIds.has(m.id));
        setEligibleMustahik(filtered);

        // If the currently selected mustahik is no longer eligible, clear selection
        if (mustahikId && takenIds.has(mustahikId)) {
          form.setValue('mustahik_id', '');
        }
      };

      fetchEligible();
    }, [tahunZakatId, mustahikList, mustahikId, form]);

  const stok: StokSummary = stokData || {
    total_pemasukan_beras: 0,
    total_pemasukan_uang: 0,
    total_distribusi_beras: 0,
    total_distribusi_uang: 0,
    sisa_beras: 0,
    sisa_uang: 0,
  };

  // Update selected mustahik info
  useEffect(() => {
    if (mustahikId) {
      const mustahik = (mustahikList as any).find((m: any) => m.id === mustahikId);
      setSelectedMustahik(mustahik || null);
    } else {
      setSelectedMustahik(null);
    }
  }, [mustahikId, mustahikList]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        mustahik_id: '',
        jenis_distribusi: 'beras',
        jumlah: 0,
        tanggal_distribusi: new Date(),
      });
      setSelectedMustahik(null);
    }
  }, [open, form]);

  const sisaStok = jenisDistribusi === 'beras' ? stok.sisa_beras : stok.sisa_uang;
  const sisaSetelahDistribusi = sisaStok - jumlah;
  const stokTidakCukup = sisaSetelahDistribusi < 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const handleSubmit = (values: FormValues) => {
    if (stokTidakCukup) {
      return;
    }
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Distribusi Zakat</DialogTitle>
          <DialogDescription>
            Distribusikan zakat kepada mustahik yang berhak
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Mustahik Selection */}
            <FormField
              control={form.control}
              name="mustahik_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mustahik Penerima *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mustahik" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(eligibleMustahik as any).map((mustahik: any) => (
                        <SelectItem key={mustahik.id} value={mustahik.id}>
                          {mustahik.nama} - {mustahik.kategori_mustahik?.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Mustahik yang belum menerima zakat fitrah di tahun ini
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mustahik Details */}
            {selectedMustahik && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Detail Mustahik</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Kategori:</span>{' '}
                        {selectedMustahik.kategori_mustahik?.nama}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Alamat:</span>{' '}
                        {selectedMustahik.alamat}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Jumlah Anggota:</span>{' '}
                        {selectedMustahik.jumlah_anggota} orang
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Jenis Distribusi */}
            <FormField
              control={form.control}
              name="jenis_distribusi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Distribusi *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beras" id="beras" />
                        <label
                          htmlFor="beras"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Beras (kg)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="uang" id="uang" />
                        <label
                          htmlFor="uang"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Uang (Rp)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock Info */}
            {!loadingStok && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pemasukan:</span>
                      <span className="font-medium">
                        {jenisDistribusi === 'beras'
                          ? `${formatNumber(stok.total_pemasukan_beras)} kg`
                          : formatCurrency(stok.total_pemasukan_uang)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Distribusi:</span>
                      <span className="font-medium">
                        {jenisDistribusi === 'beras'
                          ? `${formatNumber(stok.total_distribusi_beras)} kg`
                          : formatCurrency(stok.total_distribusi_uang)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Sisa Stok:</span>
                      <span className="font-semibold text-lg">
                        {jenisDistribusi === 'beras'
                          ? `${formatNumber(stok.sisa_beras)} kg`
                          : formatCurrency(stok.sisa_uang)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Jumlah */}
            <FormField
              control={form.control}
              name="jumlah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jumlah ({jenisDistribusi === 'beras' ? 'kg' : 'Rp'}) *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={jenisDistribusi === 'beras' ? '0.1' : '1000'}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock Validation Alert */}
            {jumlah > 0 && (
              <div>
                {stokTidakCukup ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Stok tidak mencukupi! Sisa stok hanya{' '}
                      {jenisDistribusi === 'beras'
                        ? `${formatNumber(sisaStok)} kg`
                        : formatCurrency(sisaStok)}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sisa setelah distribusi:</span>
                        <span className="font-semibold">
                          {jenisDistribusi === 'beras'
                            ? `${formatNumber(sisaSetelahDistribusi)} kg`
                            : formatCurrency(sisaSetelahDistribusi)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Tanggal Distribusi */}
            <FormField
              control={form.control}
              name="tanggal_distribusi"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Distribusi *</FormLabel>
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
                            format(field.value, 'PPP', { locale: localeId })
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
                        locale={localeId}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || stokTidakCukup}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
