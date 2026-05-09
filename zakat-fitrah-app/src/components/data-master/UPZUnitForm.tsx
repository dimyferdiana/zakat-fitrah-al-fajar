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
import { useCreateUPZUnit, useUpdateUPZUnit } from '@/hooks/useOrgSettings'
import type { UPZUnit } from '@/hooks/useOrgSettings'

const schema = z.object({
  nama_unit: z.string().min(1, 'Nama unit wajib diisi'),
  petugas_amil: z.string().optional(),
  lokasi: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface UPZUnitFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: UPZUnit | null
}

export function UPZUnitForm({ open, onOpenChange, initialData }: UPZUnitFormProps) {
  const createUnit = useCreateUPZUnit()
  const updateUnit = useUpdateUPZUnit()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nama_unit: '', petugas_amil: '', lokasi: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        nama_unit: initialData?.nama_unit ?? '',
        petugas_amil: initialData?.petugas_amil ?? '',
        lokasi: initialData?.lokasi ?? '',
      })
    }
  }, [open, initialData, form])

  const onSubmit = async (values: FormValues) => {
    if (initialData) {
      await updateUnit.mutateAsync({ id: initialData.id, ...values })
    } else {
      await createUnit.mutateAsync(values)
    }
    onOpenChange(false)
  }

  const isPending = createUnit.isPending || updateUnit.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Unit UPZ' : 'Tambah Unit UPZ'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField control={form.control} name="nama_unit" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Unit <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} placeholder="Contoh: Musholla Al-Ikhlas" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="petugas_amil" render={({ field }) => (
              <FormItem>
                <FormLabel>Petugas Amil</FormLabel>
                <FormControl><Input {...field} placeholder="Nama petugas amil" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lokasi" render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasi</FormLabel>
                <FormControl><Input {...field} placeholder="Alamat / lokasi unit" /></FormControl>
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
