import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { QurbanEvent } from '@/types/qurban'
import { useCreateQurbanEvent, useUpdateQurbanEvent } from '@/hooks/useQurbanEvents'

const eventSchema = z.object({
  nama: z.string().min(1, 'Nama event wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  catatan: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

interface QurbanEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: QurbanEvent | null
}

export function QurbanEventDialog({ open, onOpenChange, initialData }: QurbanEventDialogProps) {
  const createMutation = useCreateQurbanEvent()
  const updateMutation = useUpdateQurbanEvent()

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      nama: '',
      tanggal: '',
      catatan: '',
    },
  })

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          nama: initialData.nama,
          tanggal: initialData.tanggal,
          catatan: initialData.catatan ?? '',
        })
      } else {
        form.reset({
          nama: '',
          tanggal: '',
          catatan: '',
        })
      }
    }
  }, [open, initialData, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (values: EventFormValues) => {
    const payload = {
      nama: values.nama,
      tanggal: values.tanggal,
      catatan: values.catatan || undefined,
    }

    if (initialData) {
      await updateMutation.mutateAsync({ ...payload, id: initialData.id })
    } else {
      await createMutation.mutateAsync(payload)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Buat'} Event Qurban
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nama Event */}
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Event *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Idul Adha 1446 H / 2025"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tanggal */}
            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                  <FormLabel>
                    Catatan{' '}
                    <span className="text-muted-foreground font-normal">(opsional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan untuk event ini"
                      rows={3}
                      {...field}
                    />
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
                {isSubmitting
                  ? 'Menyimpan...'
                  : initialData
                    ? 'Perbarui'
                    : 'Buat Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
