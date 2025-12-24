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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch.tsx';

const formSchema = z.object({
  tahun_hijriah: z.string().min(5, { message: 'Tahun Hijriah harus minimal 5 karakter (e.g., 1446 H)' }),
  tahun_masehi: z.number().min(2020, { message: 'Tahun Masehi minimal 2020' }).max(2100, { message: 'Tahun Masehi maksimal 2100' }),
  nilai_beras_kg: z.number().min(0, { message: 'Nilai beras minimal 0' }),
  nilai_uang_rp: z.number().min(0, { message: 'Nilai uang minimal 0' }),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface TahunZakat {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
  is_active: boolean;
}

interface NilaiZakatFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues & { id?: string }) => void;
  editData?: TahunZakat | null;
  isSubmitting: boolean;
}

export function NilaiZakatForm({
  open,
  onOpenChange,
  onSubmit,
  editData,
  isSubmitting,
}: NilaiZakatFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun_hijriah: '',
      tahun_masehi: new Date().getFullYear(),
      nilai_beras_kg: 2.5,
      nilai_uang_rp: 45000,
      is_active: false,
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        tahun_hijriah: editData.tahun_hijriah,
        tahun_masehi: editData.tahun_masehi,
        nilai_beras_kg: editData.nilai_beras_kg,
        nilai_uang_rp: editData.nilai_uang_rp,
        is_active: editData.is_active,
      });
    } else {
      form.reset({
        tahun_hijriah: '',
        tahun_masehi: new Date().getFullYear(),
        nilai_beras_kg: 2.5,
        nilai_uang_rp: 45000,
        is_active: false,
      });
    }
  }, [editData, form, open]);

  const handleSubmit = (values: FormValues) => {
    const submitData = {
      ...values,
      ...(editData && { id: editData.id }),
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit' : 'Tambah'} Tahun Zakat</DialogTitle>
          <DialogDescription>
            {editData
              ? 'Perbarui nilai zakat untuk tahun ini'
              : 'Tambahkan tahun zakat baru dengan nilai per jiwa'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tahun Hijriah */}
            <FormField
              control={form.control}
              name="tahun_hijriah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Hijriah *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 1446 H" {...field} />
                  </FormControl>
                  <FormDescription>Format: [Tahun] H (contoh: 1446 H)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tahun Masehi */}
            <FormField
              control={form.control}
              name="tahun_masehi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Masehi *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2025"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nilai Beras */}
            <FormField
              control={form.control}
              name="nilai_beras_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai Beras per Jiwa (kg) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Nilai standar: 2.5 kg per jiwa</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nilai Uang */}
            <FormField
              control={form.control}
              name="nilai_uang_rp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai Uang per Jiwa (Rp) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1000"
                      placeholder="45000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Sesuaikan dengan harga beras lokal</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Tahun Aktif</FormLabel>
                    <FormDescription>
                      Aktifkan untuk digunakan sebagai tahun zakat berjalan. Hanya 1 tahun yang dapat
                      aktif.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
