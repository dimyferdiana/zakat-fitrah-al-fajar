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
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama tag wajib diisi' }).max(50, { message: 'Nama tag maksimal 50 karakter' }),
});

type FormValues = z.infer<typeof formSchema>;

interface TagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (data: { name: string }) => void;
}

export function TagForm({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: TagFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ name: '' });
    }
  }, [open, form]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({ name: values.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tag Transaksi</DialogTitle>
          <DialogDescription>
            Tambahkan tag baru untuk mengkategorikan transaksi
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tag *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Umum, Idul Fitri" maxLength={50} {...field} />
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
