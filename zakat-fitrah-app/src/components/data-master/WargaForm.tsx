import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateMuzakki, useUpdateMuzakki } from '@/hooks/useMuzakki'
import type { MuzakkiMaster } from '@/hooks/useMuzakki'

const schema = z.object({
  nama_kk: z.string().min(1, 'Nama KK wajib diisi'),
  nik: z.string()
    .refine((v) => !v || /^\d{16}$/.test(v), 'NIK harus 16 digit angka')
    .optional()
    .or(z.literal('')),
  jenis_kelamin: z.enum(['laki-laki', 'perempuan', '']).optional(),
  tanggal_lahir: z.string().optional(),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  rt: z.string().optional(),
  rw: z.string().optional(),
  no_telp: z.string().optional(),
  keterangan: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface WargaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: MuzakkiMaster | null
}

export function WargaForm({ open, onOpenChange, initialData }: WargaFormProps) {
  const createMuzakki = useCreateMuzakki()
  const updateMuzakki = useUpdateMuzakki()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama_kk: '', nik: '', jenis_kelamin: '', tanggal_lahir: '',
      alamat: '', rt: '', rw: '', no_telp: '', keterangan: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        nama_kk: initialData?.nama_kk ?? '',
        nik: initialData?.nik ?? '',
        jenis_kelamin: (initialData?.jenis_kelamin as 'laki-laki' | 'perempuan' | '') ?? '',
        tanggal_lahir: initialData?.tanggal_lahir ?? '',
        alamat: initialData?.alamat ?? '',
        rt: initialData?.rt ?? '',
        rw: initialData?.rw ?? '',
        no_telp: initialData?.no_telp ?? '',
        keterangan: initialData?.keterangan ?? '',
      })
    }
  }, [open, initialData, form])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      nama_kk: values.nama_kk,
      alamat: values.alamat,
      no_telp: values.no_telp || undefined,
      nik: values.nik || undefined,
      jenis_kelamin: (values.jenis_kelamin || undefined) as 'laki-laki' | 'perempuan' | undefined,
      tanggal_lahir: values.tanggal_lahir || undefined,
      rt: values.rt || undefined,
      rw: values.rw || undefined,
      keterangan: values.keterangan || undefined,
    }
    if (initialData) {
      await updateMuzakki.mutateAsync({ id: initialData.id, ...payload })
    } else {
      await createMuzakki.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isPending = createMuzakki.isPending || updateMuzakki.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Warga' : 'Tambah Warga'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField control={form.control} name="nama_kk" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama KK <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} placeholder="Nama kepala keluarga" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="nik" render={({ field }) => (
              <FormItem>
                <FormLabel>NIK</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="16 digit NIK" maxLength={16} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="jenis_kelamin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <FormControl>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tanggal_lahir" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="alamat" render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} placeholder="Alamat lengkap" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="rt" render={({ field }) => (
                <FormItem>
                  <FormLabel>RT</FormLabel>
                  <FormControl><Input {...field} placeholder="001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rw" render={({ field }) => (
                <FormItem>
                  <FormLabel>RW</FormLabel>
                  <FormControl><Input {...field} placeholder="002" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="no_telp" render={({ field }) => (
              <FormItem>
                <FormLabel>No. Telp / WhatsApp</FormLabel>
                <FormControl><Input {...field} placeholder="08xxxxxxxxxx" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="keterangan" render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl><Textarea {...field} placeholder="Catatan tambahan..." rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
