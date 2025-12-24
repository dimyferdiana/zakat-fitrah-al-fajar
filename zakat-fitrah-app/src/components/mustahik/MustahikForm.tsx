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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Mustahik, KategoriMustahik } from '@/hooks/useMustahik';

const formSchema = z.object({
  nama: z.string().min(3, { message: 'Nama minimal 3 karakter' }),
  alamat: z.string().min(5, { message: 'Alamat minimal 5 karakter' }),
  kategori_id: z.string().min(1, { message: 'Pilih kategori mustahik' }),
  jumlah_anggota: z.number().min(1, { message: 'Jumlah anggota minimal 1' }),
  no_telp: z.string().optional(),
  catatan: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MustahikFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues & { id?: string }) => void;
  editData?: Mustahik | null;
  isSubmitting: boolean;
  kategoriList: KategoriMustahik[];
}

export function MustahikForm({
  open,
  onOpenChange,
  onSubmit,
  editData,
  isSubmitting,
  kategoriList,
}: MustahikFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      alamat: '',
      kategori_id: '',
      jumlah_anggota: 1,
      no_telp: '',
      catatan: '',
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        nama: editData.nama,
        alamat: editData.alamat,
        kategori_id: editData.kategori_id,
        jumlah_anggota: editData.jumlah_anggota,
        no_telp: editData.no_telp || '',
        catatan: editData.catatan || '',
      });
    } else {
      form.reset({
        nama: '',
        alamat: '',
        kategori_id: '',
        jumlah_anggota: 1,
        no_telp: '',
        catatan: '',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit' : 'Tambah'} Mustahik</DialogTitle>
          <DialogDescription>
            {editData
              ? 'Perbarui informasi penerima zakat'
              : 'Tambahkan penerima zakat baru'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nama */}
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Ahmad bin Abdullah" {...field} />
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
                  <FormLabel>Alamat Lengkap *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alamat lengkap"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kategori */}
              <FormField
                control={form.control}
                name="kategori_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Mustahik *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kategoriList.map((kat) => (
                          <SelectItem key={kat.id} value={kat.id}>
                            {kat.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>8 golongan penerima zakat</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Jumlah Anggota */}
              <FormField
                control={form.control}
                name="jumlah_anggota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Anggota Keluarga *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Termasuk kepala keluarga</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* No Telp */}
            <FormField
              control={form.control}
              name="no_telp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Telepon</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opsional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Catatan */}
            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informasi tambahan (opsional)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Contoh: kondisi kesehatan, pekerjaan, dll
                  </FormDescription>
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
