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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  nama_kk: z.string().min(3, { message: 'Nama KK minimal 3 karakter' }).max(100),
  alamat: z.string().min(5, { message: 'Alamat minimal 5 karakter' }),
  no_telp: z.string().optional(),
});

export type MuzakkiFormValues = z.infer<typeof formSchema>;

interface MuzakkiMaster {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface MuzakkiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MuzakkiFormValues & { id?: string }) => void;
  editData?: MuzakkiMaster | null;
  isSubmitting: boolean;
}

export function MuzakkiForm({
  open,
  onOpenChange,
  onSubmit,
  editData,
  isSubmitting,
}: MuzakkiFormProps) {
  const form = useForm<MuzakkiFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_kk: '',
      alamat: '',
      no_telp: '',
    },
  });

  // Populate form with edit data
  useEffect(() => {
    if (editData) {
      form.reset({
        nama_kk: editData.nama_kk,
        alamat: editData.alamat,
        no_telp: editData.no_telp || '',
      });
    } else {
      form.reset({
        nama_kk: '',
        alamat: '',
        no_telp: '',
      });
    }
  }, [editData, form, open]);

  const handleSubmit = (values: MuzakkiFormValues) => {
    const submitData = {
      ...values,
      ...(editData && {
        id: editData.id,
      }),
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit' : 'Tambah'} Muzakki</DialogTitle>
          <DialogDescription>
            {editData
              ? 'Perbarui data master muzakki'
              : 'Tambahkan data master muzakki baru'}
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
