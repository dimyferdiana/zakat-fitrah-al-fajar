import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  CalendarIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  X,
  MoreHorizontal,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  useQurbanCouponsByEvent,
  useQurbanCouponCounts,
  useRedeemCouponManually,
  useCancelCoupon,
  useUpdateCouponExpiry,
  type MuzakkiDistributionStatus,
} from '@/hooks/useQurbanCoupons'
import { CouponDetailDialog } from '@/components/qurban/CouponDetailDialog'
import { BulkCouponDownloader, type BulkDownloadItem } from '@/components/qurban/BulkCouponDownloader'
import { PaginationBar } from '@/components/ui/pagination-bar'
import type { QurbanCoupon, QurbanCouponWithRecipient } from '@/types/qurban'

// -----------------------------------------------------------------------
// Shared helpers (mirrors QurbanDistribusi)
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

function UpdateExpiryPopover({ couponId, eventId }: { couponId: string; eventId: string }) {
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
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true) }}>
          <Clock className="h-4 w-4 mr-2" />
          Update Expiry
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        <div className="p-2 flex justify-end gap-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
          <Button size="sm" onClick={handleSave} disabled={!date || updateExpiry.isPending}>
            {updateExpiry.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// -----------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------

interface PengurbanCouponPanelProps {
  eventId: string
  eventName: string
}

type DistribusiStatusFilter = 'all' | 'complete' | 'missing'

export function PengurbanCouponPanel({ eventId, eventName }: PengurbanCouponPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'distribusi' | 'kupon'>('distribusi')

  // ---- Distribusi sub-tab state ----
  const [search, setSearch] = useState('')
  const [distribusiStatusFilter, setDistribusiStatusFilter] = useState<DistribusiStatusFilter>('all')
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    new Date('2026-05-29T23:59:59+07:00')
  )
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewCouponsFor, setViewCouponsFor] = useState<MuzakkiDistributionStatus | null>(null)
  const [viewCoupon, setViewCoupon] = useState<QurbanCoupon | null>(null)
  const [distribusiPage, setDistribusiPage] = useState(1)
  const [distribusiPageSize, setDistribusiPageSize] = useState(20)

  // Checkbox + bulk download (distribusi tab)
  const [selectedMuzakkiIds, setSelectedMuzakkiIds] = useState<Set<string>>(new Set())
  const [bulkItems, setBulkItems] = useState<BulkDownloadItem[]>([])
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

  // ---- Kupon sub-tab state ----
  const [couponStatusFilter, setCouponStatusFilter] = useState('all')
  const [couponSearch, setCouponSearch] = useState('')
  const [couponPage, setCouponPage] = useState(1)
  const [couponPageSize, setCouponPageSize] = useState(20)
  const [redeemTarget, setRedeemTarget] = useState<QurbanCouponWithRecipient | null>(null)
  const [cancelTarget, setCancelTarget] = useState<QurbanCouponWithRecipient | null>(null)
  const [detailCoupon, setDetailCoupon] = useState<QurbanCouponWithRecipient | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // ---- Distribusi data ----
  const { data: muzakkiList = [], isLoading: distribusiLoading } = useQurbanMuzakkiDistributionStatus(eventId)
  const generateMutation = useGeneratePengurbanDistributionCoupons()
  const { data: selectedMuzakkiCoupons = [], isLoading: couponsLoading } = useMuzakkiDistributionCoupons(
    eventId,
    viewCouponsFor?.muzakki_id ?? null
  )

  // ---- Kupon list data ----
  const { data: couponData, isLoading: couponListLoading } = useQurbanCouponsByEvent(
    eventId,
    {
      recipientType: 'muzakki',
      status:
        couponStatusFilter !== 'all' && couponStatusFilter !== 'expired'
          ? (couponStatusFilter as 'active' | 'redeemed' | 'cancelled')
          : undefined,
      page: couponPage,
      pageSize: couponPageSize,
    }
  )
  const { data: pengurbanCounts } = useQurbanCouponCounts(eventId, 'muzakki')
  const redeemMutation = useRedeemCouponManually()
  const cancelMutation = useCancelCoupon()

  const couponList = couponData?.data ?? []
  const couponTotalCount = couponData?.count ?? 0
  const couponTotalPages = Math.max(1, Math.ceil(couponTotalCount / couponPageSize))
  const totalCouponsRedeemed = pengurbanCounts?.redeemed ?? 0
  const totalCouponsAll = pengurbanCounts?.total ?? 0
  const couponProgressPercent = totalCouponsAll > 0 ? Math.round((totalCouponsRedeemed / totalCouponsAll) * 100) : 0

  // Muzakki name map for coupon tab
  const muzakkiNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of muzakkiList) map.set(m.muzakki_id, m.nama_kk)
    return map
  }, [muzakkiList])

  // Client-side expired + search filter for kupon tab
  const filteredCouponList = useMemo(() => {
    return couponList.filter((c) => {
      if (couponStatusFilter === 'expired') {
        if (!(c.status === 'active' && new Date(c.expires_at) < new Date())) return false
      }
      if (couponSearch) {
        const name = muzakkiNameMap.get(c.recipient_id) ?? ''
        if (!name.toLowerCase().includes(couponSearch.toLowerCase())) return false
      }
      return true
    })
  }, [couponList, couponStatusFilter, couponSearch, muzakkiNameMap])

  // ---- Distribusi derived values ----
  const filteredDistribusiList = useMemo(() => {
    return muzakkiList.filter((m) => {
      if (search && !m.nama_kk.toLowerCase().includes(search.toLowerCase())) return false
      if (distribusiStatusFilter === 'complete' && m.deficit > 0) return false
      if (distribusiStatusFilter === 'missing' && m.deficit === 0) return false
      return true
    })
  }, [muzakkiList, search, distribusiStatusFilter])

  const totalFiltered = filteredDistribusiList.length
  const totalFilteredCoupons = filteredDistribusiList.reduce((sum, m) => sum + m.currentCount, 0)
  const totalDistribusiPages = Math.max(1, Math.ceil(totalFiltered / distribusiPageSize))
  const safeDistribusiPage = Math.min(distribusiPage, totalDistribusiPages)
  const pagedDistribusiList = filteredDistribusiList.slice(
    (safeDistribusiPage - 1) * distribusiPageSize,
    safeDistribusiPage * distribusiPageSize
  )

  const totalPengurban = muzakkiList.length
  const completePengurban = muzakkiList.filter((m) => m.deficit === 0).length
  const totalDeficit = muzakkiList.reduce((sum, m) => sum + m.deficit, 0)
  const totalCouponsGenerated = muzakkiList.reduce((sum, m) => sum + m.currentCount, 0)
  const distribusiProgressPercent = totalPengurban > 0 ? Math.round((completePengurban / totalPengurban) * 100) : 0
  const missingList = muzakkiList.filter((m) => m.deficit > 0)

  // ---- Distribusi checkbox helpers ----
  const pagedIds = pagedDistribusiList.map((m) => m.muzakki_id)
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

  const selectedCouponCount = useMemo(
    () => muzakkiList.filter((m) => selectedMuzakkiIds.has(m.muzakki_id)).reduce((sum, m) => sum + m.currentCount, 0),
    [muzakkiList, selectedMuzakkiIds]
  )

  // ---- Distribusi handlers ----
  const handleGenerateAll = async () => {
    if (!expiryDate || missingList.length === 0) return
    await generateMutation.mutateAsync({
      eventId,
      items: missingList.map((m) => ({ muzakkiId: m.muzakki_id, count: m.deficit })),
      expiresAt: expiryDate.toISOString(),
    })
  }
  const handleGenerateSingle = async (m: MuzakkiDistributionStatus) => {
    if (!expiryDate || m.deficit === 0) return
    await generateMutation.mutateAsync({
      eventId,
      items: [{ muzakkiId: m.muzakki_id, count: m.deficit }],
      expiresAt: expiryDate.toISOString(),
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

  // ---- Kupon tab handlers ----
  const handleConfirmRedeem = async () => {
    if (!redeemTarget) return
    await redeemMutation.mutateAsync({ couponId: redeemTarget.id, eventId })
    setRedeemTarget(null)
  }
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    await cancelMutation.mutateAsync({ couponId: cancelTarget.id, eventId })
    setCancelTarget(null)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: id })
  }

  const animalBadge = (m: MuzakkiDistributionStatus) => {
    if (m.hasSapi && m.hasKambing) return <Badge variant="outline">Sapi + Kambing</Badge>
    if (m.hasSapi) return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Sapi</Badge>
    return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Kambing</Badge>
  }

  return (
    <div className="space-y-5">
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'distribusi' | 'kupon')}>
        <TabsList>
          <TabsTrigger value="distribusi">Progress Distribusi</TabsTrigger>
          <TabsTrigger value="kupon">Kupon Pengurban</TabsTrigger>
        </TabsList>

        {/* ================================================================
            Sub-tab 1: Progress Distribusi
        ================================================================ */}
        <TabsContent value="distribusi" className="space-y-5 mt-4">
          {/* Progress summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress Distribusi Kupon Pengurban</span>
              <span className="text-muted-foreground">
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

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setDistribusiPage(1) }}
                className="pl-9 w-[220px]"
              />
            </div>

            <Select
              value={distribusiStatusFilter}
              onValueChange={(v) => { setDistribusiStatusFilter(v as DistribusiStatusFilter); setDistribusiPage(1) }}
            >
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
                {distribusiLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredDistribusiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {muzakkiList.length === 0 ? 'Belum ada peserta qurban' : 'Tidak ada data sesuai filter'}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedDistribusiList.map((m) => (
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
            currentPage={safeDistribusiPage}
            totalPages={totalDistribusiPages}
            totalCount={totalFiltered}
            pageSize={distribusiPageSize}
            onPageChange={setDistribusiPage}
            onPageSizeChange={(size) => { setDistribusiPageSize(size); setDistribusiPage(1) }}
            suffix={`${totalFilteredCoupons} kupon`}
          />

          <p className="text-xs text-muted-foreground">
            Target: Pengurban sapi = 5 kupon &middot; Pengurban kambing = 3 kupon
          </p>
        </TabsContent>

        {/* ================================================================
            Sub-tab 2: Kupon Pengurban
        ================================================================ */}
        <TabsContent value="kupon" className="space-y-5 mt-4">
          {/* Progress */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress Kupon Pengurban</span>
              <span className="text-muted-foreground">
                {totalCouponsRedeemed} dari {totalCouponsAll} kupon sudah ditebus ({couponProgressPercent}%)
              </span>
            </div>
            <Progress value={couponProgressPercent} className="h-2" />
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={couponStatusFilter}
              onValueChange={(v) => { setCouponStatusFilter(v); setCouponPage(1) }}
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

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama pengurban..."
                value={couponSearch}
                onChange={(e) => { setCouponSearch(e.target.value); setCouponPage(1) }}
                className="pl-9 w-[220px]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">No. Kupon</TableHead>
                  <TableHead>Nama Pengurban</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Redemption</TableHead>
                  <TableHead>Berlaku Hingga</TableHead>
                  <TableHead className="w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponListLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredCouponList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada kupon ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCouponList.map((coupon) => {
                    const name = muzakkiNameMap.get(coupon.recipient_id) ?? '—'
                    const ds = getDisplayStatus(coupon)
                    const isActive = ds === 'active'
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <span className="font-mono text-xs">{coupon.coupon_number}</span>
                        </TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
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
                              <DropdownMenuItem onClick={() => { setDetailCoupon(coupon); setDetailOpen(true) }}>
                                Lihat Kupon
                              </DropdownMenuItem>
                              {isActive && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setRedeemTarget(coupon)}>
                                    Tandai Redeemed
                                  </DropdownMenuItem>
                                </>
                              )}
                              <UpdateExpiryPopover couponId={coupon.id} eventId={eventId} />
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

          <PaginationBar
            currentPage={couponPage}
            totalPages={couponTotalPages}
            totalCount={couponTotalCount}
            pageSize={couponPageSize}
            onPageChange={setCouponPage}
            onPageSizeChange={(size) => { setCouponPageSize(size); setCouponPage(1) }}
            suffix="kupon"
          />
        </TabsContent>
      </Tabs>

      {/* ---- Shared dialogs ---- */}

      {/* View coupons for a muzakki (distribusi tab) */}
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

      {/* Individual coupon detail (from distribusi tab "Lihat Kupon" list) */}
      <CouponDetailDialog
        open={!!viewCoupon}
        onOpenChange={(open) => !open && setViewCoupon(null)}
        coupon={viewCoupon}
        recipientName={viewCouponsFor?.nama_kk ?? ''}
        eventName={eventName}
      />

      {/* Individual coupon detail (from kupon tab) */}
      <CouponDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        coupon={detailCoupon}
        recipientName={detailCoupon ? (muzakkiNameMap.get(detailCoupon.recipient_id) ?? '—') : ''}
        eventName={eventName}
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
            <AlertDialogAction onClick={handleConfirmRedeem} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
            </AlertDialogAction>
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
              Pengurban tidak akan bisa menebus kupon ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Kupon'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating selection action bar (distribusi tab bulk download) */}
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

      {/* Bulk downloader */}
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
