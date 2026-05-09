import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { useCreateMuzakki, useUpdateMuzakki } from '@/hooks/useMuzakki'
import type { MuzakkiMaster } from '@/hooks/useMuzakki'

const schema = z.object({
  nama_kk: z.string().min(1, 'Nama KK wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  no_telp: z.string().optional(),
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
    defaultValues: { nama_kk: '', alamat: '', no_telp: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        nama_kk: initialData?.nama_kk ?? '',
        alamat: initialData?.alamat ?? '',
        no_telp: initialData?.no_telp ?? '',
      })
    }
  }, [open, initialData, form])

  const onSubmit = async (values: FormValues) => {
    if (initialData) {
      await updateMuzakki.mutateAsync({ id: initialData.id, ...values })
    } else {
      await createMuzakki.mutateAsync(values)
    }
    onOpenChange(false)
  }

  const isPending = createMuzakki.isPending || updateMuzakki.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <FormField control={form.control} name="alamat" render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} placeholder="Alamat lengkap" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="no_telp" render={({ field }) => (
              <FormItem>
                <FormLabel>No. Telp</FormLabel>
                <FormControl><Input {...field} placeholder="08xxxxxxxxxx" /></FormControl>
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
