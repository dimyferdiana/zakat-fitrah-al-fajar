import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import {
  useAssignQurbanShare,
  useUpdateSharePayment,
  useAvailableAnimalSlots,
  useMuzakkiSearch,
  type MuzakkiMaster,
} from '@/hooks/useQurbanShares'

const schema = z.object({
  warga_id: z.string().uuid('Pilih muzakki'),
  animal_id: z.string().uuid('Pilih slot hewan'),
  status_pembayaran: z.enum(['belum_bayar', 'lunas']),
  nominal: z.number().min(0, 'Nominal tidak boleh negatif'),
})

type FormValues = z.infer<typeof schema>

export interface AddPesertaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  eventId?: string
}

export function AddPesertaDialog({
  open,
  onOpenChange,
  onSuccess,
  eventId,
}: AddPesertaDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuzakki, setSelectedMuzakki] = useState<MuzakkiMaster | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: searchResults = [], isLoading: isSearching } = useMuzakkiSearch(
    searchQuery.length >= 2 ? searchQuery : ''
  )

  const { data: availableSlots = [], isLoading: isSlotsLoading } = useAvailableAnimalSlots(eventId)

  const assignShare = useAssignQurbanShare()
  const updatePayment = useUpdateSharePayment()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      warga_id: '',
      animal_id: '',
      status_pembayaran: 'belum_bayar',
      nominal: 0,
    },
  })

  const resetForm = () => {
    form.reset()
    setSearchQuery('')
    setSelectedMuzakki(null)
    setIsSubmitting(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // Find the selected slot to determine the next urutan
      const slot = availableSlots.find((s) => s.id === values.animal_id)
      const maxSlots = slot?.jenis === 'sapi' ? 7 : 1
      const nextUrutan = maxSlots - (slot?.sisa_slot ?? 1) + 1

      const newShare = await assignShare.mutateAsync({
        animal_id: values.animal_id,
        muzakki_id: values.warga_id,
        urutan: nextUrutan,
        nominal: values.nominal,
      })

      // If user selected "lunas", update payment status after creation
      if (values.status_pembayaran === 'lunas' && newShare) {
        await updatePayment.mutateAsync({
          id: newShare.id,
          animal_id: values.animal_id,
          status_pembayaran: 'lunas',
        })
      }

      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      console.error('AddPesertaDialog: failed to add peserta', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const noSlotsAvailable = !isSlotsLoading && availableSlots.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Qurban</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">

            {/* Muzakki search */}
            <div className="space-y-2">
              <Label>
                Nama Muzakki <span className="text-destructive">*</span>
              </Label>

              {selectedMuzakki ? (
                <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-green-800">{selectedMuzakki.nama_kk}</p>
                    {selectedMuzakki.no_telp && (
                      <p className="text-green-600 text-xs">{selectedMuzakki.no_telp}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-600 hover:text-destructive"
                    onClick={() => {
                      setSelectedMuzakki(null)
                      setSearchQuery('')
                      form.setValue('warga_id', '')
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Cari nama muzakki (min. 2 karakter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery.length >= 2 && (
                    <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Mencari...</p>
                      ) : searchResults.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Muzakki tidak ditemukan.
                        </p>
                      ) : (
                        searchResults.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                            onClick={() => {
                              setSelectedMuzakki(m)
                              setSearchQuery('')
                              form.setValue('warga_id', m.id, { shouldValidate: true })
                            }}
                          >
                            <p className="text-sm font-medium">{m.nama_kk}</p>
                            {m.no_telp && (
                              <p className="text-xs text-muted-foreground">{m.no_telp}</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {form.formState.errors.warga_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.warga_id.message}
                </p>
              )}
            </div>

            {/* Slot Hewan */}
            <FormField
              control={form.control}
              name="animal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Slot Hewan <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    {noSlotsAvailable ? (
                      <p className="text-sm text-muted-foreground rounded-md border px-3 py-2">
                        Tidak ada slot tersedia saat ini.
                      </p>
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val)
                          const slot = availableSlots.find((s) => s.id === val)
                          if (slot && slot.harga_per_peserta > 0) {
                            form.setValue('nominal', slot.harga_per_peserta, { shouldValidate: true })
                          }
                        }}
                        disabled={isSlotsLoading || noSlotsAvailable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih slot hewan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map((slot) => (
                            <SelectItem key={slot.id} value={slot.id}>
                              {slot.nomor} — {slot.jenis === 'sapi' ? 'Sapi' : 'Kambing'} ({slot.sisa_slot} slot tersisa)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nominal */}
            <FormField
              control={form.control}
              name="nominal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nominal (Rp) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Pembayaran */}
            <FormField
              control={form.control}
              name="status_pembayaran"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Pembayaran</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                        <SelectItem value="lunas">Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || noSlotsAvailable}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddPesertaDialog
