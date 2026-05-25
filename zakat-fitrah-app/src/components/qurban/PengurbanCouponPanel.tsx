import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  type MuzakkiDistributionStatus,
} from '@/hooks/useQurbanCoupons'

interface PengurbanCouponPanelProps {
  eventId: string
  eventName: string
}

type StatusFilter = 'all' | 'complete' | 'missing'

export function PengurbanCouponPanel({ eventId, eventName }: PengurbanCouponPanelProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    // Default expiry: 29 May 2026
    new Date('2026-05-29T23:59:59+07:00')
  )
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { data: muzakkiList = [], isLoading } = useQurbanMuzakkiDistributionStatus(eventId)
  const generateMutation = useGeneratePengurbanDistributionCoupons()

  const filteredList = useMemo(() => {
    return muzakkiList.filter((m) => {
      if (search && !m.nama_kk.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === 'complete' && m.deficit > 0) return false
      if (statusFilter === 'missing' && m.deficit === 0) return false
      return true
    })
  }, [muzakkiList, search, statusFilter])

  const totalPengurban = muzakkiList.length
  const completePengurban = muzakkiList.filter((m) => m.deficit === 0).length
  const totalDeficit = muzakkiList.reduce((sum, m) => sum + m.deficit, 0)
  const progressPercent = totalPengurban > 0 ? Math.round((completePengurban / totalPengurban) * 100) : 0

  const missingList = muzakkiList.filter((m) => m.deficit > 0)

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

  const animalBadge = (m: MuzakkiDistributionStatus) => {
    if (m.hasSapi && m.hasKambing) return <Badge variant="outline">Sapi + Kambing</Badge>
    if (m.hasSapi) return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Sapi</Badge>
    return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Kambing</Badge>
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress Kupon Pengurban — {eventName}</span>
          <span className="text-muted-foreground">
            {completePengurban} dari {totalPengurban} pengurban sudah lengkap
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        {totalDeficit > 0 && (
          <p className="text-xs text-muted-foreground">
            Masih kurang <span className="font-semibold text-foreground">{totalDeficit} kupon</span> untuk {missingList.length} pengurban
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[220px]"
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pengurban</SelectItem>
            <SelectItem value="missing">Kupon Kurang</SelectItem>
            <SelectItem value="complete">Sudah Lengkap</SelectItem>
          </SelectContent>
        </Select>

        {/* Expiry date */}
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

        {/* Generate all missing */}
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
              <TableHead>Nama Pengurban</TableHead>
              <TableHead>Jenis Hewan</TableHead>
              <TableHead className="text-center">Target</TableHead>
              <TableHead className="text-center">Sudah Ada</TableHead>
              <TableHead className="text-center">Kurang</TableHead>
              <TableHead className="w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {muzakkiList.length === 0 ? 'Belum ada peserta qurban' : 'Tidak ada data sesuai filter'}
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((m) => (
                <TableRow key={m.muzakki_id}>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Target: Pengurban sapi = 5 kupon &middot; Pengurban kambing = 3 kupon
      </p>
    </div>
  )
}
