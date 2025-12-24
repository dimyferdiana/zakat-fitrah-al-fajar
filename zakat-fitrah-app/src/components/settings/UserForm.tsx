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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch.tsx';

const formSchema = z.object({
  nama_lengkap: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  role: z.enum(['admin', 'petugas', 'viewer'], {
    message: 'Pilih salah satu role',
  }),
  password: z
    .string()
    .min(8, { message: 'Password minimal 8 karakter' })
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface User {
  id: string;
  email: string;
  nama_lengkap: string;
  role: 'admin' | 'petugas' | 'viewer';
  is_active: boolean;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues & { id?: string }) => void;
  editData?: User | null;
  isSubmitting: boolean;
}

export function UserForm({
  open,
  onOpenChange,
  onSubmit,
  editData,
  isSubmitting,
}: UserFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_lengkap: '',
      email: '',
      role: 'viewer',
      password: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        nama_lengkap: editData.nama_lengkap,
        email: editData.email,
        role: editData.role,
        password: '',
        is_active: editData.is_active,
      });
    } else {
      form.reset({
        nama_lengkap: '',
        email: '',
        role: 'viewer',
        password: '',
        is_active: true,
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

  const isEditMode = !!editData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Tambah'} User</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Perbarui informasi user'
              : 'Tambahkan user baru. Email konfirmasi akan dikirim.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nama Lengkap */}
            <FormField
              control={form.control}
              name="nama_lengkap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmad Abdullah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="ahmad@example.com"
                      {...field}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  {isEditMode && (
                    <FormDescription>Email tidak dapat diubah</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="petugas">Petugas</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Admin: Akses penuh | Petugas: Input data | Viewer: Lihat saja
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password (Create only) */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimal 8 karakter"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      User akan menerima email untuk mengatur ulang password
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Is Active (Edit only) */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <FormDescription>
                        User non-aktif tidak dapat login
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
                {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
