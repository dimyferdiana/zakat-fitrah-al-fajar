import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useMustahikList, useKategoriMustahik } from '@/hooks/useMustahik'
import { useGenerateMustahikCoupons } from '@/hooks/useQurbanCoupons'

interface MustahikCouponPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventName: string
  /** ISO date string from the event — used to default expiry to event date + 1 day */
  eventTanggal?: string
}

export function MustahikCouponPicker({
  open,
  onOpenChange,
  eventId,
  eventName,
  eventTanggal,
}: MustahikCouponPickerProps) {
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(() => {
    if (eventTanggal) return addDays(new Date(eventTanggal), 1)
    return undefined
  })
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { data: kategoriData } = useKategoriMustahik()
  const { data: mustahikData, isLoading } = useMustahikList({
    status: 'aktif',
    limit: 200,
    search: search || undefined,
    kategori_id: kategoriFilter !== 'all' ? kategoriFilter : undefined,
  })

  const generateMutation = useGenerateMustahikCoupons()

  const mustahikList = mustahikData?.data ?? []

  // Filter only is_active
  const activeMustahik = useMemo(() => mustahikList.filter((m) => m.is_active), [mustahikList])

  const allSelected = activeMustahik.length > 0 && activeMustahik.every((m) => selectedIds.has(m.id))
  const someSelected = activeMustahik.some((m) => selectedIds.has(m.id))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(activeMustahik.map((m) => m.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleGenerate = async () => {
    if (!expiryDate) {
      toast.error('Pilih tanggal berlaku terlebih dahulu')
      return
    }
    if (selectedIds.size === 0) {
      toast.error('Pilih minimal satu mustahik')
      return
    }

    try {
      await generateMutation.mutateAsync({
        eventId,
        mustahikIds: Array.from(selectedIds),
        expiresAt: expiryDate.toISOString(),
      })
      onOpenChange(false)
      setSelectedIds(new Set())
    } catch {
      // Error toast handled in hook
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedIds(new Set())
    setSearch('')
    setKategoriFilter('all')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Distribusi — {eventName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Filter row */}
          <div className="flex gap-3">
            <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {(kategoriData || []).map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama mustahik..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Select all + count */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => handleSelectAll(checked === true)}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
              Pilih Semua
            </label>
            <span className="text-sm text-muted-foreground ml-auto">
              {selectedIds.size} dipilih dari {activeMustahik.length}
            </span>
          </div>

          {/* Mustahik list */}
          <div className="overflow-y-auto border rounded-md" style={{ maxHeight: '40vh' }}>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Memuat data...</div>
            ) : activeMustahik.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Tidak ada mustahik aktif</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="w-10 p-3"></th>
                    <th className="p-3 text-left font-medium">Nama</th>
                    <th className="p-3 text-left font-medium">Kategori</th>
                    <th className="p-3 text-right font-medium">Anggota</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMustahik.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(m.id)}
                          onCheckedChange={(checked) => handleToggle(m.id, checked === true)}
                        />
                      </td>
                      <td className="p-3">{m.nama}</td>
                      <td className="p-3 text-muted-foreground">
                        {m.kategori_mustahik?.nama ?? '-'}
                      </td>
                      <td className="p-3 text-right">{m.jumlah_anggota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Expiry date picker */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium min-w-[120px]">Berlaku Hingga *</span>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[220px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate
                    ? format(expiryDate, 'dd MMMM yyyy', { locale: id })
                    : 'Pilih tanggal...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={(date) => {
                    setExpiryDate(date)
                    setCalendarOpen(false)
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={generateMutation.isPending}>
            Batalkan
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedIds.size === 0 || !expiryDate || generateMutation.isPending}
          >
            {generateMutation.isPending
              ? 'Membuat...'
              : `Generate ${selectedIds.size > 0 ? selectedIds.size : ''} Kupon`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MustahikCouponPicker
