import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Camera, ImageOff } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { QurbanAnimal } from '@/types/qurban'
import { useCreateQurbanAnimal, useUpdateQurbanAnimal } from '@/hooks/useQurbanAnimals'

const animalSchema = z
  .object({
    jenis: z.enum(['sapi', 'kambing']),
    sumber_hewan: z.enum(['beli', 'titipan', 'al_fajar']),
    nomor: z.string().min(1, 'Nomor hewan wajib diisi'),
    berat_kg: z.number().positive().nullable().optional(),
    harga: z.number().positive().nullable().optional(),
    biaya_perawatan: z.number().positive().nullable().optional(),
    jumlah_hewan: z.number().int().min(1).nullable().optional(),
    catatan: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sumber_hewan === 'beli') {
      if (!data.harga) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Harga wajib diisi',
          path: ['harga'],
        })
      }
    }
    if (data.sumber_hewan === 'titipan') {
      // biaya_perawatan is optional for titipan — no required check
    }
    if (data.sumber_hewan === 'al_fajar') {
      if (!data.jumlah_hewan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Jumlah hewan wajib diisi',
          path: ['jumlah_hewan'],
        })
      }
    }
  })

type AnimalFormValues = z.infer<typeof animalSchema>

interface AnimalFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  eventId: string
  initialData?: QurbanAnimal | null
  existingAnimals: QurbanAnimal[]
}

function generateNomor(jenis: 'sapi' | 'kambing', existingAnimals: QurbanAnimal[]): string {
  const prefix = jenis === 'sapi' ? 'SAP' : 'KAM'
  const sameJenis = existingAnimals.filter((a) => a.jenis === jenis)
  const nextNum = sameJenis.length + 1
  return `${prefix}-${String(nextNum).padStart(3, '0')}`
}

export function AnimalForm({
  open,
  onOpenChange,
  eventId,
  initialData,
  existingAnimals,
}: AnimalFormProps) {
  const createMutation = useCreateQurbanAnimal()
  const updateMutation = useUpdateQurbanAnimal()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<AnimalFormValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      jenis: 'sapi',
      sumber_hewan: 'beli',
      nomor: '',
      berat_kg: null,
      harga: undefined,
      biaya_perawatan: null,
      jumlah_hewan: null,
      catatan: '',
    },
  })

  const watchJenis = form.watch('jenis')
  const watchSumberHewan = form.watch('sumber_hewan')

  // Reset form on open/close or initialData change
  useEffect(() => {
    if (open) {
      setSelectedFile(null)
      setPreviewUrl(null)
      if (initialData) {
        form.reset({
          jenis: initialData.jenis,
          sumber_hewan: initialData.sumber_hewan,
          nomor: initialData.nomor,
          berat_kg: initialData.berat_kg ?? null,
          harga: initialData.harga ?? null,
          biaya_perawatan: initialData.biaya_perawatan ?? null,
          jumlah_hewan: null,
          catatan: initialData.catatan ?? '',
        })
        setPreviewUrl(initialData.foto_url ?? null)
      } else {
        const nomor = generateNomor('sapi', existingAnimals)
        form.reset({
          jenis: 'sapi',
          sumber_hewan: 'beli',
          nomor,
          berat_kg: null,
          harga: undefined,
          biaya_perawatan: null,
          jumlah_hewan: null,
          catatan: '',
        })
      }
    }
  }, [open, initialData, form, existingAnimals])

  // Auto-generate nomor when jenis changes (only in create mode)
  useEffect(() => {
    if (!initialData && open) {
      const nomor = generateNomor(watchJenis, existingAnimals)
      form.setValue('nomor', nomor)
    }
  }, [watchJenis, initialData, open, existingAnimals, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleSubmit = async (values: AnimalFormValues) => {
    const payload = {
      event_id: eventId,
      jenis: values.jenis,
      sumber_hewan: values.sumber_hewan,
      nomor: values.nomor,
      berat_kg: values.berat_kg ?? null,
      harga: values.sumber_hewan === 'beli' ? (values.harga ?? 0) : 0,
      biaya_perawatan: values.sumber_hewan === 'titipan' ? (values.biaya_perawatan ?? null) : null,
      catatan: values.catatan || undefined,
      foto: selectedFile ?? null,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Tambah'} Hewan Qurban
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Jenis Hewan */}
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
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beli" id="sumber-beli" />
                        <Label htmlFor="sumber-beli">Beli (Panitia)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="titipan" id="sumber-titipan" />
                        <Label htmlFor="sumber-titipan">Titipan (Bawa Sendiri)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="al_fajar" id="sumber-al-fajar" />
                        <Label htmlFor="sumber-al-fajar">Al Fajar</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nomor Hewan */}
            <FormField
              control={form.control}
              name="nomor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Hewan *</FormLabel>
                  <FormControl>
                    <Input placeholder="SAP-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Berat Estimasi */}
            <FormField
              control={form.control}
              name="berat_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Berat Estimasi (kg){' '}
                    <span className="text-muted-foreground font-normal">(opsional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Harga Total — only shown for 'beli' */}
            {watchSumberHewan === 'beli' && (
              <FormField
                control={form.control}
                name="harga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Total Hewan (Rp) *</FormLabel>
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
            )}

            {/* Biaya Perawatan — only shown for 'titipan' */}
            {watchSumberHewan === 'titipan' && (
              <FormField
                control={form.control}
                name="biaya_perawatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Biaya Perawatan (Rp){' '}
                      <span className="text-muted-foreground font-normal">(opsional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Jumlah Hewan — only shown for 'al_fajar' */}
            {watchSumberHewan === 'al_fajar' && (
              <FormField
                control={form.control}
                name="jumlah_hewan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Hewan *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="1"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                      placeholder="Catatan tambahan (opsional)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Foto Hewan */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Foto Hewan{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </p>
              <div className="flex items-start gap-3">
                <div className="h-24 w-24 shrink-0 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview foto hewan"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {previewUrl ? 'Ganti Foto' : 'Upload Foto'}
                  </Button>
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Hapus Foto
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — maks. 5MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

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
