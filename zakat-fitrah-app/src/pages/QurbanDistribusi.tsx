import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { MoreHorizontal, QrCode, UserPlus, Clock, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useQurbanEventList } from '@/hooks/useQurbanEvents'
import {
  useQurbanCouponsByEvent,
  useQurbanCouponCounts,
  useRedeemCouponManually,
  useCancelCoupon,
  useUpdateCouponExpiry,
} from '@/hooks/useQurbanCoupons'
import { useMustahikList, useKategoriMustahik } from '@/hooks/useMustahik'
import { CouponDetailDialog } from '@/components/qurban/CouponDetailDialog'
import { MustahikCouponPicker } from '@/components/qurban/MustahikCouponPicker'
import { PengurbanCouponPanel } from '@/components/qurban/PengurbanCouponPanel'
import { BulkCouponDownloader, type BulkDownloadItem } from '@/components/qurban/BulkCouponDownloader'
import { PaginationBar } from '@/components/ui/pagination-bar'
import type { QurbanCouponWithRecipient } from '@/types/qurban'

// -----------------------------------------------------------------------
// Status helpers
// -----------------------------------------------------------------------

type DisplayStatus = 'active' | 'redeemed' | 'cancelled' | 'expired'

function getDisplayStatus(coupon: QurbanCouponWithRecipient): DisplayStatus {
  if (coupon.status === 'redeemed') return 'redeemed'
  if (coupon.status === 'cancelled') return 'cancelled'
  if (coupon.status === 'active' && new Date(coupon.expires_at) < new Date()) return 'expired'
  return 'active'
}

function StatusBadge({ coupon }: { coupon: QurbanCouponWithRecipient }) {
  const ds = getDisplayStatus(coupon)
  switch (ds) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
    case 'redeemed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sudah Ditebus</Badge>
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dibatalkan</Badge>
    case 'expired':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Kedaluwarsa</Badge>
  }
}

// -----------------------------------------------------------------------
// Inline update-expiry popover cell
// -----------------------------------------------------------------------

function UpdateExpiryPopover({
  couponId,
  eventId,
}: {
  couponId: string
  eventId: string
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>()
  const updateExpiry = useUpdateCouponExpiry()

  const handleSave = async () => {
    if (!date) return
    await updateExpiry.mutateAsync({ couponIds: [couponId], eventId, expiresAt: date.toISOString() })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            setOpen(true)
          }}
        >
          <Clock className="h-4 w-4 mr-2" />
          Update Expiry
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
        <div className="p-2 flex justify-end gap-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!date || updateExpiry.isPending}>
            {updateExpiry.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// -----------------------------------------------------------------------
// Update all expiry dialog
// -----------------------------------------------------------------------

function UpdateAllExpiryButton({
  activeCouponIds,
  eventId,
}: {
  activeCouponIds: string[]
  eventId: string
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>()
  const updateExpiry = useUpdateCouponExpiry()

  const handleSave = async () => {
    if (!date || activeCouponIds.length === 0) return
    await updateExpiry.mutateAsync({ couponIds: activeCouponIds, eventId, expiresAt: date.toISOString() })
    setOpen(false)
    toast.success(`Expiry ${activeCouponIds.length} kupon diperbarui`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={activeCouponIds.length === 0}>
          <Clock className="h-4 w-4 mr-2" />
          Update Expiry Semua
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
        <div className="p-2 flex justify-end gap-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!date || updateExpiry.isPending}>
            {updateExpiry.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// -----------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [20, 50, 100]

export function QurbanDistribusi() {
  const navigate = useNavigate()

  // ---- UI state ----
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [kategoriFilter, setKategoriFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk download
  const [bulkItems, setBulkItems] = useState<BulkDownloadItem[]>([])
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

  // Dialogs
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailCoupon, setDetailCoupon] = useState<QurbanCouponWithRecipient | null>(null)

  // AlertDialog: redeem confirmation
  const [redeemTarget, setRedeemTarget] = useState<QurbanCouponWithRecipient | null>(null)
  // AlertDialog: cancel confirmation
  const [cancelTarget, setCancelTarget] = useState<QurbanCouponWithRecipient | null>(null)

  // ---- Data ----
  const { data: events = [] } = useQurbanEventList()
  const { data: kategoriData } = useKategoriMustahik()
  const { data: mustahikAll } = useMustahikList({ status: 'aktif', limit: 500 })

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  // Build mustahik lookup map
  const mustahikMap = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>()
    for (const m of mustahikAll?.data ?? []) {
      map.set(m.id, m.nama)
    }
    return map
  }, [mustahikAll])

  // Coupon list query
  const { data: couponData, isLoading: couponsLoading } = useQurbanCouponsByEvent(
    selectedEventId || null,
    {
      recipientType: 'mustahik',
      status: statusFilter !== 'all' && statusFilter !== 'expired' ? (statusFilter as 'active' | 'redeemed' | 'cancelled') : undefined,
      page: currentPage,
      pageSize,
    }
  )

  const allCoupons = useMemo(() => couponData?.data ?? [], [couponData])
  const totalCount = couponData?.count ?? 0

  // True totals (all pages, no filter) for progress bar
  const { data: mustahikCounts } = useQurbanCouponCounts(selectedEventId || null, 'mustahik')
  const trueRedeemedCount = mustahikCounts?.redeemed ?? 0
  const trueTotalCount = mustahikCounts?.total ?? 0
  const progressPercent = trueTotalCount > 0 ? Math.round((trueRedeemedCount / trueTotalCount) * 100) : 0

  // Client-side filter for expired (since DB doesn't have 'expired' as a status)
  // and for kategori / search
  const filteredCoupons = useMemo(() => {
    return allCoupons.filter((c) => {
      // Expired filter: active coupons where expires_at < now
      if (statusFilter === 'expired') {
        if (!(c.status === 'active' && new Date(c.expires_at) < new Date())) return false
      }

      // Kategori filter (we need to look up mustahik kategori — approximate via mustahikAll)
      if (kategoriFilter !== 'all') {
        const fullMustahik = mustahikAll?.data?.find((m) => m.id === c.recipient_id)
        if (fullMustahik?.kategori_id !== kategoriFilter) return false
      }

      // Search by mustahik name
      if (searchQuery) {
        const name = mustahikMap.get(c.recipient_id) ?? ''
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      }

      return true
    })
  }, [allCoupons, statusFilter, kategoriFilter, searchQuery, mustahikMap, mustahikAll])

  // Checkbox helpers
  const currentPageIds = filteredCoupons.map((c) => c.id)
  const allOnPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id))
  const someOnPageSelected = currentPageIds.some((id) => selectedIds.has(id)) && !allOnPageSelected

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        currentPageIds.forEach((id) => next.delete(id))
      } else {
        currentPageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDownload = () => {
    const selected = filteredCoupons.filter((c) => selectedIds.has(c.id))
    const items: BulkDownloadItem[] = selected.map((c) => ({
      coupon: c,
      recipientName: mustahikMap.get(c.recipient_id) ?? '—',
      eventName: selectedEvent?.nama ?? '',
    }))
    setBulkItems(items)
    setBulkProgress({ done: 0, total: items.length })
    setBulkDownloading(true)
  }

  // Active coupon IDs for "Update Expiry Semua"
  const activeCouponIds = useMemo(
    () => allCoupons.filter((c) => c.status === 'active').map((c) => c.id),
    [allCoupons]
  )

  // Mutations
  const redeemMutation = useRedeemCouponManually()
  const cancelMutation = useCancelCoupon()

  // ---- Handlers ----

  const handleViewDetail = (coupon: QurbanCouponWithRecipient) => {
    setDetailCoupon(coupon)
    setDetailOpen(true)
  }

  const handleConfirmRedeem = async () => {
    if (!redeemTarget) return
    await redeemMutation.mutateAsync({ couponId: redeemTarget.id, eventId: selectedEventId })
    setRedeemTarget(null)
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    await cancelMutation.mutateAsync({ couponId: cancelTarget.id, eventId: selectedEventId })
    setCancelTarget(null)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: id })
  }

  // ---- Detail dialog helpers ----
  const detailRecipientName = detailCoupon
    ? (mustahikMap.get(detailCoupon.recipient_id) ?? '—')
    : ''

  const detailEventName = selectedEvent?.nama ?? ''

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Distribusi Qurban</h2>
            <p className="text-sm text-muted-foreground">Kelola distribusi kupon qurban untuk mustahik</p>
          </div>
          {selectedEventId && (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Peserta Distribusi
              </Button>
              <UpdateAllExpiryButton activeCouponIds={activeCouponIds} eventId={selectedEventId} />
              <Button
                size="sm"
                onClick={() => navigate(`/qurban/scan?eventId=${selectedEventId}`)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Mulai Scan
              </Button>
            </div>
          )}
        </div>
        <div className="border-b" />
      </div>

      {/* Event selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Pilih Event:</span>
        <Select
          value={selectedEventId}
          onValueChange={(val) => {
            setSelectedEventId(val)
            setCurrentPage(1)
            setSelectedIds(new Set())
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Pilih event qurban..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nama} ({format(new Date(e.tanggal), 'dd MMM yyyy', { locale: id })})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* No event selected */}
      {!selectedEventId && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Pilih event untuk melihat data distribusi</p>
        </div>
      )}

      {selectedEventId && (
        <Tabs defaultValue="mustahik">
          <TabsList>
            <TabsTrigger value="mustahik">Warga / Mustahik</TabsTrigger>
            <TabsTrigger value="pengurban">Pengurban</TabsTrigger>
          </TabsList>

          {/* ---- Mustahik tab ---- */}
          <TabsContent value="mustahik" className="space-y-5 mt-4">
            {/* Progress summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress Distribusi Mustahik</span>
                <span className="text-muted-foreground">
                  {trueRedeemedCount} dari {trueTotalCount} kupon sudah ditebus ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status kupon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="redeemed">Sudah Ditebus</SelectItem>
                  <SelectItem value="expired">Kedaluwarsa</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={kategoriFilter}
                onValueChange={(val) => {
                  setKategoriFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori mustahik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {(kategoriData ?? []).map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Cari nama mustahik..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-[220px]"
              />
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
                    <TableHead className="w-[160px]">No. Kupon</TableHead>
                    <TableHead>Nama Mustahik</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu Redemption</TableHead>
                    <TableHead>Berlaku Hingga</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data kupon
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const mustahikName = mustahikMap.get(coupon.recipient_id) ?? '—'
                      const fullMustahik = mustahikAll?.data?.find((m) => m.id === coupon.recipient_id)
                      const kategoriNama = fullMustahik?.kategori_mustahik?.nama ?? '—'
                      const ds = getDisplayStatus(coupon)
                      const isActive = ds === 'active'

                      return (
                        <TableRow key={coupon.id} data-selected={selectedIds.has(coupon.id) ? 'true' : undefined}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(coupon.id)}
                              onCheckedChange={() => toggleSelectOne(coupon.id)}
                              aria-label={`Pilih kupon ${coupon.coupon_number}`}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">{coupon.coupon_number}</span>
                          </TableCell>
                          <TableCell>{mustahikName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{kategoriNama}</TableCell>
                          <TableCell>
                            <StatusBadge coupon={coupon} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(coupon.redeemed_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={new Date(coupon.expires_at) < new Date() ? 'text-red-600' : ''}>
                              {formatDate(coupon.expires_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(coupon)}>
                                  Lihat Kupon
                                </DropdownMenuItem>
                                {isActive && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setRedeemTarget(coupon)}
                                    >
                                      Tandai Redeemed
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <UpdateExpiryPopover couponId={coupon.id} eventId={selectedEventId} />
                                {isActive && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => setCancelTarget(coupon)}
                                    >
                                      Batalkan Kupon
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
            />
          </TabsContent>

          {/* ---- Pengurban tab ---- */}
          <TabsContent value="pengurban" className="mt-4">
            {selectedEvent && (
              <PengurbanCouponPanel
                eventId={selectedEventId}
                eventName={selectedEvent.nama}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Mustahik Coupon Picker */}
      {pickerOpen && selectedEvent && (
        <MustahikCouponPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          eventId={selectedEventId}
          eventName={selectedEvent.nama}
          eventTanggal={selectedEvent.tanggal}
        />
      )}

      {/* Coupon Detail Dialog */}
      <CouponDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        coupon={detailCoupon}
        recipientName={detailRecipientName}
        eventName={detailEventName}
        distribusiDate={selectedEvent?.tanggal}
      />

      {/* Redeem confirmation */}
      <AlertDialog open={!!redeemTarget} onOpenChange={(open) => !open && setRedeemTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Kupon sebagai Redeemed?</AlertDialogTitle>
            <AlertDialogDescription>
              Kupon <span className="font-mono">{redeemTarget?.coupon_number}</span> akan ditandai
              sebagai sudah ditebus. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRedeem}>Konfirmasi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Kupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Kupon <span className="font-mono">{cancelTarget?.coupon_number}</span> akan dibatalkan.
              Mustahik tidak akan bisa menebus kupon ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmCancel}
            >
              Batalkan Kupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating selection action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-lg text-sm">
          <span className="font-medium">{selectedIds.size} kupon dipilih</span>
          <Button
            size="sm"
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {bulkDownloading
              ? `${bulkProgress.done}/${bulkProgress.total}`
              : 'Download'}
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Batal pilih"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bulk downloader (renders off-screen coupon cards then downloads) */}
      {bulkDownloading && bulkItems.length > 0 && (
        <BulkCouponDownloader
          items={bulkItems}
          onProgress={(done, total) => setBulkProgress({ done, total })}
          onDone={() => {
            setBulkDownloading(false)
            setBulkItems([])
            setSelectedIds(new Set())
            toast.success(`${bulkProgress.total} kupon berhasil diunduh`)
          }}
        />
      )}
    </div>
  )
}

export default QurbanDistribusi
