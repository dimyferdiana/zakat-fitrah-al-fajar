import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Users, MoreVertical, ChevronLeft, ChevronRight, FileText, Trash2, CreditCard, Ticket, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addDays } from 'date-fns'

import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useQurbanEventList } from '@/hooks/useQurbanEvents'
import { useQurbanShareListFlat, useUpdateSharePayment, useRemoveQurbanShare } from '@/hooks/useQurbanShares'
import { useGenerateMuzakkiCoupon } from '@/hooks/useQurbanCoupons'
import { downloadQurbanShareReceipt } from '@/components/qurban/BuktiQurban'
import { AddPesertaDialog } from '@/components/qurban/AddPesertaDialog'
import type { QurbanShareFlat } from '@/types/qurban'
import type { QurbanAnimal, QurbanEvent } from '@/types/qurban'

const PAGE_SIZE = 20

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Fetch a single animal for receipt generation
async function fetchAnimalAndEvent(animalId: string): Promise<{ animal: QurbanAnimal; event: QurbanEvent } | null> {
  const { data, error } = await supabase
    .from('qurban_animals')
    .select('*, qurban_events!inner(*)')
    .eq('id', animalId)
    .single()

  if (error || !data) return null

  const row = data as any
  const animal: QurbanAnimal = {
    id: row.id,
    event_id: row.event_id,
    jenis: row.jenis,
    sumber_hewan: row.sumber_hewan,
    nomor: row.nomor,
    berat_kg: row.berat_kg,
    harga: row.harga,
    biaya_perawatan: row.biaya_perawatan,
    foto_url: row.foto_url,
    catatan: row.catatan,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
  const event: QurbanEvent = {
    id: row.qurban_events.id,
    nama: row.qurban_events.nama,
    tanggal: row.qurban_events.tanggal,
    catatan: row.qurban_events.catatan,
    created_by: row.qurban_events.created_by,
    created_at: row.qurban_events.created_at,
    updated_at: row.qurban_events.updated_at,
  }
  return { animal, event }
}

export function QurbanPeserta() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])
  const canWrite = hasRole(['admin', 'petugas'])
  const queryClient = useQueryClient()

  const { data: events } = useQurbanEventList()

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Dialogs state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareToDelete, setShareToDelete] = useState<QurbanShareFlat | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [shareToTogglePayment, setShareToTogglePayment] = useState<QurbanShareFlat | null>(null)
  const [showAddPeserta, setShowAddPeserta] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [selectedEventId, selectedStatus])

  const queryParams = {
    eventId: selectedEventId !== 'all' ? selectedEventId : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as 'belum_bayar' | 'lunas') : undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data: sharesResult, isLoading } = useQurbanShareListFlat(queryParams)

  const updatePayment = useUpdateSharePayment()
  const removeShare = useRemoveQurbanShare()
  const generateCoupon = useGenerateMuzakkiCoupon()

  const shares = sharesResult?.data ?? []
  const totalCount = sharesResult?.count ?? 0

  // Payment toggle
  const handleTogglePayment = useCallback(async (share: QurbanShareFlat) => {
    const newStatus = share.status_pembayaran === 'lunas' ? 'belum_bayar' : 'lunas'
    await updatePayment.mutateAsync({
      id: share.id,
      animal_id: share.animal_id,
      status_pembayaran: newStatus,
    })
    setPaymentDialogOpen(false)
    setShareToTogglePayment(null)
  }, [updatePayment])

  const handleDeleteConfirm = async () => {
    if (!shareToDelete) return
    await removeShare.mutateAsync({ id: shareToDelete.id, animal_id: shareToDelete.animal_id })
    setDeleteDialogOpen(false)
    setShareToDelete(null)
  }

  const handleViewBukti = async (share: QurbanShareFlat) => {
    const result = await fetchAnimalAndEvent(share.animal_id)
    if (!result) {
      toast.error('Gagal memuat data hewan')
      return
    }
    const receiptData = {
      event: result.event,
      animal: result.animal,
      share: {
        id: share.id,
        animal_id: share.animal_id,
        muzakki_id: share.muzakki_id,
        urutan: share.urutan,
        nominal: share.nominal,
        status_pembayaran: share.status_pembayaran,
        catatan: share.catatan,
        created_by: null,
        created_at: share.created_at,
        updated_at: share.created_at,
        muzakki: {
          id: share.muzakki_id,
          nama_kk: share.muzakki_nama,
          no_telp: share.muzakki_no_telp,
        },
      },
    }
    downloadQurbanShareReceipt(receiptData)
  }

  const handleGenerateCoupon = async (share: QurbanShareFlat) => {
    const expiresAt = addDays(new Date(), 30).toISOString()
    await generateCoupon.mutateAsync({
      shareId: share.id,
      eventId: share.event_id,
      muzakkiId: share.muzakki_id,
      expiresAt,
    })
  }

  const handleViewCoupon = (share: QurbanShareFlat) => {
    if (share.coupon) {
      toast.info(`Kupon: ${share.coupon.coupon_number}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Peserta Qurban"
        description="Lihat dan kelola seluruh peserta qurban dari semua event"
      />

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
            <Select
              value={selectedEventId}
              onValueChange={(val) => setSelectedEventId(val)}
            >
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Semua Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Event</SelectItem>
                {(events ?? []).map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Cari nama muzakki..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full md:w-[240px]"
            />

            {canWrite && (
              <Button
                onClick={() => setShowAddPeserta(true)}
                className="w-full md:w-auto md:ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Peserta
              </Button>
            )}
          </div>

          {isLoading && <LoadingSpinner text="Memuat peserta..." />}

          {!isLoading && shares.length === 0 && (
            <EmptyState
              icon={Users}
              title="Peserta belum ada"
              description="Belum ada peserta yang terdaftar dengan filter ini"
            />
          )}

          {!isLoading && shares.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Nama Muzakki</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-center">Slot ke-</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead className="text-center">Status Bayar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map((share, index) => (
                      <TableRow key={share.id}>
                        <TableCell className="text-muted-foreground">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{share.muzakki_nama}</div>
                          {share.muzakki_no_telp && (
                            <div className="text-xs text-muted-foreground">{share.muzakki_no_telp}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{share.animal_nomor}</span>
                            <Badge
                              className={
                                share.animal_jenis === 'sapi'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                  : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                              }
                            >
                              {share.animal_jenis === 'sapi' ? 'Sapi' : 'Kambing'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{share.event_nama}</div>
                        </TableCell>
                        <TableCell className="text-center">{share.urutan}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(share.nominal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              share.status_pembayaran === 'lunas'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                            }
                          >
                            {share.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Aksi</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Edit status bayar */}
                              {canWrite && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setShareToTogglePayment(share)
                                    setPaymentDialogOpen(true)
                                  }}
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Edit Status Bayar
                                </DropdownMenuItem>
                              )}

                              {/* Lihat Bukti Qurban */}
                              <DropdownMenuItem onClick={() => handleViewBukti(share)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Lihat Bukti Qurban
                              </DropdownMenuItem>

                              {/* Generate Kupon — only if lunas and no coupon */}
                              {canWrite && share.status_pembayaran === 'lunas' && !share.coupon && (
                                <DropdownMenuItem
                                  onClick={() => handleGenerateCoupon(share)}
                                  disabled={generateCoupon.isPending}
                                >
                                  <Ticket className="mr-2 h-4 w-4" />
                                  Generate Kupon
                                </DropdownMenuItem>
                              )}

                              {/* Lihat Kupon — only if coupon exists */}
                              {share.coupon && (
                                <DropdownMenuItem onClick={() => handleViewCoupon(share)}>
                                  <Ticket className="mr-2 h-4 w-4" />
                                  Lihat Kupon
                                </DropdownMenuItem>
                              )}

                              {/* Hapus */}
                              {isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setShareToDelete(share)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination + total count */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold">{totalCount}</span> peserta
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={shares.length < PAGE_SIZE}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Toggle payment confirmation */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              {shareToTogglePayment && (
                <>
                  Ubah status pembayaran{' '}
                  <span className="font-semibold">{shareToTogglePayment.muzakki_nama}</span>{' '}
                  dari{' '}
                  <span className="font-semibold">
                    {shareToTogglePayment.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                  </span>{' '}
                  menjadi{' '}
                  <span className="font-semibold">
                    {shareToTogglePayment.status_pembayaran === 'lunas' ? 'Belum Bayar' : 'Lunas'}
                  </span>
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => shareToTogglePayment && handleTogglePayment(shareToTogglePayment)}
              disabled={updatePayment.isPending}
            >
              {updatePayment.isPending ? 'Memperbarui...' : 'Konfirmasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peserta Qurban?</AlertDialogTitle>
            <AlertDialogDescription>
              {shareToDelete && (
                <>
                  Apakah Anda yakin ingin menghapus peserta{' '}
                  <span className="font-semibold">{shareToDelete.muzakki_nama}</span>{' '}
                  dari hewan {shareToDelete.animal_nomor}? Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeShare.isPending}
            >
              {removeShare.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Peserta Dialog */}
      <AddPesertaDialog
        open={showAddPeserta}
        onOpenChange={setShowAddPeserta}
        eventId={selectedEventId !== 'all' ? selectedEventId : undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['qurban-shares-flat'] })
        }}
      />
    </div>
  )
}

export default QurbanPeserta
