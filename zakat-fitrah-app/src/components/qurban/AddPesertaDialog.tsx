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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { createMuzakkiRecord } from '@/hooks/useMuzakki'

const schema = z.object({
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
  const [activeTab, setActiveTab] = useState<'pilih' | 'baru'>('pilih')

  // Tab: pilih dari data
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuzakki, setSelectedMuzakki] = useState<MuzakkiMaster | null>(null)
  const [muzakkiError, setMuzakkiError] = useState('')

  // Tab: peserta baru
  const [namaKk, setNamaKk] = useState('')
  const [alamat, setAlamat] = useState('')
  const [noHp, setNoHp] = useState('')
  const [namaError, setNamaError] = useState('')
  const [alamatError, setAlamatError] = useState('')

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
      animal_id: '',
      status_pembayaran: 'belum_bayar',
      nominal: 0,
    },
  })

  const resetForm = () => {
    form.reset()
    setActiveTab('pilih')
    setSearchQuery('')
    setSelectedMuzakki(null)
    setMuzakkiError('')
    setNamaKk('')
    setAlamat('')
    setNoHp('')
    setNamaError('')
    setAlamatError('')
    setIsSubmitting(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      let muzakkiId: string

      if (activeTab === 'pilih') {
        if (!selectedMuzakki) {
          setMuzakkiError('Pilih muzakki terlebih dahulu')
          setIsSubmitting(false)
          return
        }
        muzakkiId = selectedMuzakki.id
      } else {
        let hasError = false
        if (!namaKk.trim()) {
          setNamaError('Nama wajib diisi')
          hasError = true
        } else {
          setNamaError('')
        }
        if (!alamat.trim()) {
          setAlamatError('Alamat wajib diisi')
          hasError = true
        } else {
          setAlamatError('')
        }
        if (hasError) {
          setIsSubmitting(false)
          return
        }
        const created = await createMuzakkiRecord({
          nama_kk: namaKk.trim(),
          alamat: alamat.trim(),
          no_telp: noHp.trim() || undefined,
        })
        muzakkiId = created.id
      }

      const slot = availableSlots.find((s) => s.id === values.animal_id)
      const maxSlots = slot?.jenis === 'sapi' ? 7 : 1
      const nextUrutan = maxSlots - (slot?.sisa_slot ?? 1) + 1

      const newShare = await assignShare.mutateAsync({
        animal_id: values.animal_id,
        muzakki_id: muzakkiId,
        urutan: nextUrutan,
        nominal: values.nominal,
      })

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

            {/* Muzakki selection — tabs */}
            <div className="space-y-2">
              <Label>
                Muzakki <span className="text-destructive">*</span>
              </Label>

              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as 'pilih' | 'baru')
                  setMuzakkiError('')
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="pilih" className="flex-1">
                    Pilih dari data
                  </TabsTrigger>
                  <TabsTrigger value="baru" className="flex-1">
                    Peserta Baru
                  </TabsTrigger>
                </TabsList>

                {/* Tab: pilih dari data */}
                <TabsContent value="pilih" className="space-y-2 mt-2">
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
                          setMuzakkiError('')
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
                              Tidak ditemukan. Gunakan tab &quot;Peserta Baru&quot;.
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
                                  setMuzakkiError('')
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
                </TabsContent>

                {/* Tab: peserta baru */}
                <TabsContent value="baru" className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="add-nama-kk">
                      Nama <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="add-nama-kk"
                      placeholder="Nama lengkap"
                      value={namaKk}
                      onChange={(e) => {
                        setNamaKk(e.target.value)
                        if (namaError) setNamaError('')
                      }}
                    />
                    {namaError && <p className="text-xs text-destructive">{namaError}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="add-alamat">
                      Alamat <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="add-alamat"
                      placeholder="Alamat lengkap"
                      value={alamat}
                      onChange={(e) => {
                        setAlamat(e.target.value)
                        if (alamatError) setAlamatError('')
                      }}
                    />
                    {alamatError && <p className="text-xs text-destructive">{alamatError}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="add-no-hp">
                      No HP{' '}
                      <span className="text-muted-foreground font-normal">(opsional)</span>
                    </Label>
                    <Input
                      id="add-no-hp"
                      type="tel"
                      placeholder="08123456789"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {muzakkiError && (
                <p className="text-xs text-destructive">{muzakkiError}</p>
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
