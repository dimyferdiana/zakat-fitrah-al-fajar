import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Search, CheckCircle2, AlertCircle, Eye, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useQurbanMuzakkiDistributionStatus,
  useGeneratePengurbanDistributionCoupons,
  useMuzakkiDistributionCoupons,
  fetchMuzakkiDistributionCouponsForIds,
  useQurbanCouponCounts,
  type MuzakkiDistributionStatus,
} from '@/hooks/useQurbanCoupons'
import { CouponDetailDialog } from '@/components/qurban/CouponDetailDialog'
import { BulkCouponDownloader, type BulkDownloadItem } from '@/components/qurban/BulkCouponDownloader'
import { PaginationBar } from '@/components/ui/pagination-bar'
import type { QurbanCoupon } from '@/types/qurban'

interface PengurbanCouponPanelProps {
  eventId: string
  eventName: string
}

type StatusFilter = 'all' | 'complete' | 'missing'

export function PengurbanCouponPanel({ eventId, eventName }: PengurbanCouponPanelProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    new Date('2026-05-29T23:59:59+07:00')
  )
  const [packagesPerCoupon, setPackagesPerCoupon] = useState(1)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewCouponsFor, setViewCouponsFor] = useState<MuzakkiDistributionStatus | null>(null)
  const [viewCoupon, setViewCoupon] = useState<QurbanCoupon | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Checkbox selection
  const [selectedMuzakkiIds, setSelectedMuzakkiIds] = useState<Set<string>>(new Set())

  // Bulk download
  const [bulkItems, setBulkItems] = useState<BulkDownloadItem[]>([])
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

  const { data: muzakkiList = [], isLoading } = useQurbanMuzakkiDistributionStatus(eventId)
  const generateMutation = useGeneratePengurbanDistributionCoupons()
  const { data: selectedMuzakkiCoupons = [], isLoading: couponsLoading } = useMuzakkiDistributionCoupons(
    eventId,
    viewCouponsFor?.muzakki_id ?? null
  )
  const { data: pengurbanCounts } = useQurbanCouponCounts(eventId, 'muzakki')

  const filteredList = useMemo(() => {
    return muzakkiList.filter((m) => {
      if (search && !m.nama_kk.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === 'complete' && m.deficit > 0) return false
      if (statusFilter === 'missing' && m.deficit === 0) return false
      return true
    })
  }, [muzakkiList, search, statusFilter])

  const totalFiltered = filteredList.length
  const totalFilteredCoupons = filteredList.reduce((sum, m) => sum + m.currentCount, 0)
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedList = filteredList.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totalPengurban = muzakkiList.length
  const completePengurban = muzakkiList.filter((m) => m.deficit === 0).length
  const totalDeficit = muzakkiList.reduce((sum, m) => sum + m.deficit, 0)
  const totalCouponsGenerated = muzakkiList.reduce((sum, m) => sum + m.currentCount, 0)
  const distribusiProgressPercent = totalPengurban > 0 ? Math.round((completePengurban / totalPengurban) * 100) : 0
  const missingList = muzakkiList.filter((m) => m.deficit > 0)

  const totalCouponsRedeemed = pengurbanCounts?.redeemed ?? 0
  const totalCouponsAll = pengurbanCounts?.total ?? 0
  const kuponProgressPercent = totalCouponsAll > 0 ? Math.round((totalCouponsRedeemed / totalCouponsAll) * 100) : 0

  const handleGenerateAll = async () => {
    if (!expiryDate || missingList.length === 0) return
    await generateMutation.mutateAsync({
      eventId,
      items: missingList.map((m) => ({ muzakkiId: m.muzakki_id, count: m.deficit })),
      expiresAt: expiryDate.toISOString(),
      packagesPerCoupon,
    })
  }

  const handleGenerateSingle = async (m: MuzakkiDistributionStatus) => {
    if (!expiryDate || m.deficit === 0) return
    await generateMutation.mutateAsync({
      eventId,
      items: [{ muzakkiId: m.muzakki_id, count: m.deficit }],
      expiresAt: expiryDate.toISOString(),
      packagesPerCoupon,
    })
  }

  const selectedCouponCount = useMemo(
    () => muzakkiList
      .filter((m) => selectedMuzakkiIds.has(m.muzakki_id))
      .reduce((sum, m) => sum + m.currentCount, 0),
    [muzakkiList, selectedMuzakkiIds]
  )

  const pagedIds = pagedList.map((m) => m.muzakki_id)
  const allOnPageSelected = pagedIds.length > 0 && pagedIds.every((i) => selectedMuzakkiIds.has(i))
  const someOnPageSelected = pagedIds.some((i) => selectedMuzakkiIds.has(i)) && !allOnPageSelected

  const toggleSelectAll = () => {
    setSelectedMuzakkiIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pagedIds.forEach((i) => next.delete(i))
      else pagedIds.forEach((i) => next.add(i))
      return next
    })
  }
  const toggleSelectOne = (id: string) => {
    setSelectedMuzakkiIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDownload = async () => {
    const ids = Array.from(selectedMuzakkiIds)
    setBulkDownloading(true)
    try {
      const coupons = await fetchMuzakkiDistributionCouponsForIds(eventId, ids)
      const items: BulkDownloadItem[] = coupons.map((c) => {
        const muzakki = muzakkiList.find((m) => m.muzakki_id === c.recipient_id)
        return { coupon: c, recipientName: muzakki?.nama_kk ?? '—', eventName }
      })
      if (items.length === 0) {
        toast.info('Tidak ada kupon aktif untuk pengurban yang dipilih')
        setBulkDownloading(false)
        return
      }
      setBulkItems(items)
      setBulkProgress({ done: 0, total: items.length })
    } catch {
      toast.error('Gagal memuat kupon untuk diunduh')
      setBulkDownloading(false)
    }
  }

  const animalBadge = (m: MuzakkiDistributionStatus) => {
    if (m.hasSapi && m.hasKambing) return <Badge variant="outline">Sapi + Kambing</Badge>
    if (m.hasSapi) return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Sapi</Badge>
    return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Kambing</Badge>
  }

  return (
    <div className="space-y-5">
      {/* Progress: distribusi + kupon side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Distribusi progress */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress Distribusi Kupon</span>
            <span className="text-muted-foreground text-right">
              {completePengurban} dari {totalPengurban} ({totalCouponsGenerated} kupon) pengurban sudah lengkap
            </span>
          </div>
          <Progress value={distribusiProgressPercent} className="h-2" />
          {totalDeficit > 0 && (
            <p className="text-xs text-muted-foreground">
              Masih kurang{' '}
              <span className="font-semibold text-foreground">{totalDeficit} kupon</span>{' '}
              untuk {missingList.length} pengurban
            </p>
          )}
        </div>

        {/* Kupon progress */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress Kupon Ditebus</span>
            <span className="text-muted-foreground text-right">
              {totalCouponsRedeemed} dari {totalCouponsAll} kupon sudah ditebus ({kuponProgressPercent}%)
            </span>
          </div>
          <Progress value={kuponProgressPercent} className="h-2" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="pl-9 w-[220px]"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pengurban</SelectItem>
            <SelectItem value="missing">Kupon Kurang</SelectItem>
            <SelectItem value="complete">Sudah Lengkap</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal min-w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiryDate ? format(expiryDate, 'dd MMM yyyy', { locale: id }) : 'Tgl berlaku...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiryDate}
              onSelect={(d) => { setExpiryDate(d); setCalendarOpen(false) }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Label htmlFor="packages-per-coupon" className="text-sm whitespace-nowrap">
            Paket/Kupon
          </Label>
          <Input
            id="packages-per-coupon"
            type="number"
            min={1}
            value={packagesPerCoupon}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val >= 1) setPackagesPerCoupon(val)
            }}
            className="w-[72px]"
          />
        </div>

        {missingList.length > 0 && (
          <Button
            onClick={handleGenerateAll}
            disabled={!expiryDate || generateMutation.isPending}
            className="ml-auto"
          >
            {generateMutation.isPending
              ? 'Membuat...'
              : `Generate Semua (${totalDeficit} kupon untuk ${missingList.length} pengurban)`}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[48px]">
                <Checkbox
                  checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua di halaman ini"
                />
              </TableHead>
              <TableHead>Nama Pengurban</TableHead>
              <TableHead>Jenis Hewan</TableHead>
              <TableHead className="text-center">Target</TableHead>
              <TableHead className="text-center">Sudah Ada</TableHead>
              <TableHead className="text-center">Kurang</TableHead>
              <TableHead className="w-[200px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {muzakkiList.length === 0 ? 'Belum ada peserta qurban' : 'Tidak ada data sesuai filter'}
                </TableCell>
              </TableRow>
            ) : (
              pagedList.map((m) => (
                <TableRow key={m.muzakki_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMuzakkiIds.has(m.muzakki_id)}
                      onCheckedChange={() => toggleSelectOne(m.muzakki_id)}
                      aria-label={`Pilih ${m.nama_kk}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{m.nama_kk}</TableCell>
                  <TableCell>{animalBadge(m)}</TableCell>
                  <TableCell className="text-center">{m.targetCount}</TableCell>
                  <TableCell className="text-center">{m.currentCount}</TableCell>
                  <TableCell className="text-center">
                    {m.deficit === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-red-600 font-semibold">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {m.deficit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {m.currentCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewCouponsFor(m)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Lihat Kupon
                        </Button>
                      )}
                      {m.deficit > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateSingle(m)}
                          disabled={!expiryDate || generateMutation.isPending}
                        >
                          +{m.deficit} Kupon
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Lengkap</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={totalFiltered}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        suffix={`${totalFilteredCoupons} kupon`}
      />

      <p className="text-xs text-muted-foreground">
        Target: Pengurban sapi = 5 kupon &middot; Pengurban kambing = 3 kupon
      </p>

      {/* Coupon list dialog for a muzakki */}
      <Dialog open={!!viewCouponsFor} onOpenChange={(open) => !open && setViewCouponsFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kupon — {viewCouponsFor?.nama_kk}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {couponsLoading ? (
              <p className="text-center text-muted-foreground py-6">Memuat kupon...</p>
            ) : selectedMuzakkiCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Belum ada kupon</p>
            ) : (
              selectedMuzakkiCoupons.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Kupon {i + 1}</p>
                    <p className="font-mono text-sm font-medium">{c.coupon_number}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                    {c.packages_per_coupon > 1 && (
                      <p className="text-xs text-amber-600 font-medium">{c.packages_per_coupon} paket</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setViewCoupon(c)}>
                    Lihat Kupon
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CouponDetailDialog
        open={!!viewCoupon}
        onOpenChange={(open) => !open && setViewCoupon(null)}
        coupon={viewCoupon}
        recipientName={viewCouponsFor?.nama_kk ?? ''}
        eventName={eventName}
      />

      {/* Floating selection action bar */}
      {selectedMuzakkiIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-lg text-sm">
          <span className="font-medium">
            {selectedMuzakkiIds.size} pengurban · {selectedCouponCount} kupon
          </span>
          <Button size="sm" onClick={handleBulkDownload} disabled={bulkDownloading}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {bulkDownloading
              ? bulkItems.length > 0
                ? `${bulkProgress.done}/${bulkProgress.total}`
                : 'Memuat...'
              : 'Download Kupon'}
          </Button>
          <button
            onClick={() => setSelectedMuzakkiIds(new Set())}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Batal pilih"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {bulkDownloading && bulkItems.length > 0 && (
        <BulkCouponDownloader
          items={bulkItems}
          onProgress={(done, total) => setBulkProgress({ done, total })}
          onDone={() => {
            setBulkDownloading(false)
            setBulkItems([])
            setSelectedMuzakkiIds(new Set())
            toast.success(`${bulkProgress.total} kupon berhasil diunduh`)
          }}
        />
      )}
    </div>
  )
}
