import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QurbanRegistrationWithParticipants } from '@/types/qurban'
import { useCreateQurban, useUpdateQurban } from '@/hooks/useQurban'
import { PhotoUpload } from '@/components/qurban/PhotoUpload'

const qurbanSchema = z.object({
  tanggal: z.date({ message: 'Tanggal wajib diisi' }),
  nama: z.string().min(1, 'Nama wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  no_hp: z.string().max(15).refine(
    (val) => val === '' || val.length >= 8,
    'No HP tidak valid (minimal 8 karakter)'
  ),
  jenis: z.enum(['sapi', 'kambing']),
  sumber_hewan: z.enum(['beli', 'titipan']),
  biaya_perawatan: z.number().nullable().optional(),
  participants: z
    .array(z.object({ nama: z.string().min(1, 'Nama peserta wajib diisi') }))
    .min(1, 'Minimal 1 peserta'),
  nominal: z.number().min(0).optional(),
  status: z.enum(['terdaftar', 'lunas']),
  catatan: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.sumber_hewan === 'beli' && (!data.nominal || data.nominal <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nominal wajib diisi',
      path: ['nominal'],
    })
  }
})

type QurbanFormValues = z.infer<typeof qurbanSchema>

interface QurbanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: QurbanRegistrationWithParticipants | null
  onSuccess?: () => void
}

export function QurbanForm({ open, onOpenChange, initialData, onSuccess }: QurbanFormProps) {
  const createMutation = useCreateQurban()
  const updateMutation = useUpdateQurban()

  const form = useForm<QurbanFormValues>({
    resolver: zodResolver(qurbanSchema),
    defaultValues: {
      tanggal: new Date(),
      nama: '',
      alamat: '',
      no_hp: '',
      jenis: 'sapi',
      sumber_hewan: 'beli',
      biaya_perawatan: null,
      participants: [{ nama: '' }],
      nominal: undefined,
      status: 'terdaftar',
      catatan: '',
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'participants',
  })

  const watchJenis = form.watch('jenis')
  const watchSumberHewan = form.watch('sumber_hewan')

  // Reset form on open/close or initialData change
  useEffect(() => {
    if (open) {
      if (initialData) {
        const sortedParticipants = [...(initialData.qurban_participants || [])].sort(
          (a, b) => a.urutan - b.urutan
        )
        form.reset({
          tanggal: new Date(initialData.tanggal),
          nama: initialData.nama,
          alamat: initialData.alamat,
          no_hp: initialData.no_hp,
          jenis: initialData.jenis as 'sapi' | 'kambing',
          sumber_hewan: initialData.sumber_hewan as 'beli' | 'titipan',
          biaya_perawatan: initialData.biaya_perawatan ?? null,
          participants:
            sortedParticipants.length > 0
              ? sortedParticipants.map((p) => ({ nama: p.nama }))
              : [{ nama: '' }],
          nominal: initialData.nominal,
          status: initialData.status as 'terdaftar' | 'lunas',
          catatan: initialData.catatan ?? '',
        })
      } else {
        form.reset({
          tanggal: new Date(),
          nama: '',
          alamat: '',
          no_hp: '',
          jenis: 'sapi',
          sumber_hewan: 'beli',
          biaya_perawatan: null,
          participants: [{ nama: '' }],
          nominal: undefined,
          status: 'terdaftar',
          catatan: '',
        })
      }
    }
  }, [open, initialData, form])

  // When jenis changes, reset participants to 1 empty slot
  useEffect(() => {
    replace([{ nama: '' }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchJenis])

  const maxParticipants = watchJenis === 'sapi' ? 7 : 1

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (values: QurbanFormValues) => {
    const payload = {
      tanggal: format(values.tanggal, 'yyyy-MM-dd'),
      nama: values.nama,
      alamat: values.alamat,
      no_hp: values.no_hp,
      jenis: values.jenis,
      sumber_hewan: values.sumber_hewan,
      biaya_perawatan: values.sumber_hewan === 'titipan' ? (values.biaya_perawatan ?? null) : null,
      participants: values.participants,
      nominal: values.nominal ?? 0,
      status: values.status,
      catatan: values.catatan || undefined,
    }

    if (initialData) {
      await updateMutation.mutateAsync({ ...payload, id: initialData.id })
    } else {
      await createMutation.mutateAsync(payload)
    }

    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Tambah'} Pendaftaran Qurban
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tanggal */}
            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal *</FormLabel>
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
                            format(field.value, 'dd MMMM yyyy', { locale: idLocale })
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nama */}
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pendaftar *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" {...field} />
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
                    <Textarea placeholder="Alamat lengkap" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* No HP */}
            <FormField
              control={form.control}
              name="no_hp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No HP <span className="text-muted-foreground font-normal">(opsional)</span></FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="08123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jenis */}
            <FormField
              control={form.control}
              name="jenis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Hewan *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis hewan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sapi">Sapi</SelectItem>
                      <SelectItem value="kambing">Kambing/Domba</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sumber Hewan */}
            <FormField
              control={form.control}
              name="sumber_hewan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sumber Hewan *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sumber hewan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beli">Beli (Panitia Carikan)</SelectItem>
                      <SelectItem value="titipan">Titipan (Bawa Sendiri)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Biaya Perawatan — hanya tampil jika sumber_hewan = titipan */}
            {watchSumberHewan === 'titipan' && (
              <FormField
                control={form.control}
                name="biaya_perawatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biaya Perawatan (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Participants / Qurban a/n */}
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">
                Qurban a/n *{' '}
                <span className="text-muted-foreground font-normal">
                  (maks. {maxParticipants} orang)
                </span>
              </p>
              {fields.map((fieldItem, index) => (
                <FormField
                  key={fieldItem.id}
                  control={form.control}
                  name={`participants.${index}.nama`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-6 shrink-0">
                          {index + 1}.
                        </span>
                        <FormControl>
                          <Input placeholder={`Nama peserta ${index + 1}`} {...field} />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            title="Hapus peserta"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <FormMessage className="ml-8" />
                    </FormItem>
                  )}
                />
              ))}
              {fields.length < maxParticipants && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ nama: '' })}
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Peserta
                </Button>
              )}
              {form.formState.errors.participants?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.participants.root.message}
                </p>
              )}
              {typeof form.formState.errors.participants?.message === 'string' && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.participants.message}
                </p>
              )}
            </div>

            {/* Nominal */}
            <FormField
              control={form.control}
              name="nominal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nominal (Rp){' '}
                    {watchSumberHewan === 'beli' ? (
                      '*'
                    ) : (
                      <span className="text-muted-foreground font-normal">(opsional)</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="terdaftar">Terdaftar</SelectItem>
                      <SelectItem value="lunas">Lunas</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Catatan tambahan (opsional)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Foto Hewan — only shown when editing an existing record */}
            {initialData?.id && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Foto Hewan (Opsional)</p>
                <PhotoUpload
                  registrationId={initialData.id}
                  currentPhotoUrl={initialData.photo_url}
                />
              </div>
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
                {isSubmitting
                  ? 'Menyimpan...'
                  : initialData
                    ? 'Perbarui'
                    : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
