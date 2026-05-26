import { useState, useMemo, useEffect } from 'react'
import { Plus, CalendarDays, ArrowUpDown, X, LayoutGrid, List } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { AnimalForm } from '@/components/qurban/AnimalForm'
import { AnimalGrid, type AnimalView } from '@/components/qurban/AnimalGrid'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { AnimalDetailDialog } from '@/components/qurban/AnimalDetailDialog'
import type { QurbanAnimal } from '@/types/qurban'
import { getMaxSlots } from '@/types/qurban'
import { useQurbanEventList } from '@/hooks/useQurbanEvents'
import {
  useQurbanAnimalList,
  useQurbanAnimalShareCounts,
  useDeleteQurbanAnimal,
} from '@/hooks/useQurbanAnimals'
import { useAuth } from '@/lib/auth'

// -----------------------------------------------------------------------
// Filter / sort types
// -----------------------------------------------------------------------

type FilterJenis = 'all' | 'sapi' | 'kambing'
type FilterSumber = 'all' | 'beli' | 'titipan'
type FilterPeserta = 'all' | 'full' | 'partial' | 'empty'
type FilterPembayaran = 'all' | 'lunas' | 'belum'
type SortKey = 'terbaru' | 'terlama' | 'harga_asc' | 'harga_desc'

const SORT_LABELS: Record<SortKey, string> = {
  terbaru: 'Terbaru',
  terlama: 'Terlama',
  harga_asc: 'Harga ↑',
  harga_desc: 'Harga ↓',
}

function effectivePrice(animal: QurbanAnimal): number {
  return animal.sumber_hewan === 'beli' ? animal.harga : (animal.biaya_perawatan ?? 0)
}

// -----------------------------------------------------------------------

export default function Qurban() {
  const { user } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'petugas'

  // --- Events ---
  const { data: events = [], isLoading: eventsLoading } = useQurbanEventList()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0] ?? null

  // --- Animals + share counts ---
  const { data: allAnimals = [], isLoading: animalsLoading } = useQurbanAnimalList(
    selectedEvent?.id ?? null
  )
  const { data: shareCounts = new Map() } = useQurbanAnimalShareCounts(
    selectedEvent?.id ?? null
  )
  const deleteAnimalMutation = useDeleteQurbanAnimal()

  // --- Dialogs ---
  const [animalFormOpen, setAnimalFormOpen] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<QurbanAnimal | null>(null)
  const [deleteAnimalOpen, setDeleteAnimalOpen] = useState(false)
  const [deletingAnimal, setDeletingAnimal] = useState<QurbanAnimal | null>(null)
  const [selectedAnimal, setSelectedAnimal] = useState<QurbanAnimal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // --- View mode ---
  const [view, setView] = useState<AnimalView>('card')

  // --- Filter / sort state ---
  const [filterJenis, setFilterJenis] = useState<FilterJenis>('all')
  const [filterSumber, setFilterSumber] = useState<FilterSumber>('all')
  const [filterPeserta, setFilterPeserta] = useState<FilterPeserta>('all')
  const [filterPembayaran, setFilterPembayaran] = useState<FilterPembayaran>('all')
  const [sortKey, setSortKey] = useState<SortKey>('terbaru')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const hasActiveFilter =
    filterJenis !== 'all' ||
    filterSumber !== 'all' ||
    filterPeserta !== 'all' ||
    filterPembayaran !== 'all' ||
    sortKey !== 'terbaru'

  const resetFilters = () => {
    setFilterJenis('all')
    setFilterSumber('all')
    setFilterPeserta('all')
    setFilterPembayaran('all')
    setSortKey('terbaru')
  }

  // Reset to page 1 when filters, sort, or event change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterJenis, filterSumber, filterPeserta, filterPembayaran, sortKey, selectedEvent?.id])

  // --- Filtered + sorted animals ---
  const filteredAnimals = useMemo(() => {
    const filtered = allAnimals.filter((animal) => {
      if (filterJenis !== 'all' && animal.jenis !== filterJenis) return false
      if (filterSumber !== 'all' && animal.sumber_hewan !== filterSumber) return false

      const counts = shareCounts.get(animal.id) ?? { shareCount: 0, paidCount: 0 }
      const maxSlots = getMaxSlots(animal.jenis)

      if (filterPeserta === 'full' && counts.shareCount < maxSlots) return false
      if (filterPeserta === 'partial' && (counts.shareCount === 0 || counts.shareCount >= maxSlots)) return false
      if (filterPeserta === 'empty' && counts.shareCount > 0) return false

      if (filterPembayaran === 'lunas') {
        const allPaid = counts.shareCount > 0 && counts.paidCount === counts.shareCount
        if (!allPaid) return false
      }
      if (filterPembayaran === 'belum') {
        const allPaid = counts.shareCount > 0 && counts.paidCount === counts.shareCount
        if (allPaid) return false
      }

      return true
    })

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case 'harga_asc':  return effectivePrice(a) - effectivePrice(b)
        case 'harga_desc': return effectivePrice(b) - effectivePrice(a)
        case 'terlama':    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'terbaru':
        default:           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [allAnimals, shareCounts, filterJenis, filterSumber, filterPeserta, filterPembayaran, sortKey])

  const totalPages = Math.max(1, Math.ceil(filteredAnimals.length / pageSize))
  const pagedAnimals = filteredAnimals.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // --- Animal handlers ---
  const handleAddAnimal = () => {
    setEditingAnimal(null)
    setAnimalFormOpen(true)
  }

  const handleEditAnimal = (animal: QurbanAnimal) => {
    setEditingAnimal(animal)
    setAnimalFormOpen(true)
  }

  const handleDeleteAnimalClick = (animal: QurbanAnimal) => {
    setDeletingAnimal(animal)
    setDeleteAnimalOpen(true)
  }

  const handleDeleteAnimalConfirm = async () => {
    if (!deletingAnimal || !selectedEvent) return
    try {
      await deleteAnimalMutation.mutateAsync({
        id: deletingAnimal.id,
        event_id: selectedEvent.id,
      })
      toast.success('Hewan berhasil dihapus')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Tidak bisa menghapus hewan yang sudah memiliki peserta.'
      )
    } finally {
      setDeleteAnimalOpen(false)
      setDeletingAnimal(null)
    }
  }

  const handleSelectAnimal = (animal: QurbanAnimal) => {
    setSelectedAnimal(animal)
    setDetailOpen(true)
  }

  // --- Loading state ---
  if (eventsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Qurban</h1>
            <p className="text-muted-foreground text-sm">Memuat data event...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Qurban</h1>
          <p className="text-muted-foreground text-sm">
            Kelola event, hewan, dan peserta qurban.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Belum Ada Event Qurban</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Tambahkan event qurban terlebih dahulu melalui halaman Event sebelum menambahkan hewan dan peserta.
          </p>
        </div>
      ) : (
        <>
          {/* Event selector + add button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] max-w-sm">
              <Select
                value={selectedEvent?.id ?? ''}
                onValueChange={(value) => setSelectedEventId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canWrite && selectedEvent && (
              <Button onClick={handleAddAnimal} className="ml-auto">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Hewan
              </Button>
            )}
          </div>

          {/* Filter + sort bar */}
          {selectedEvent && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Jenis */}
              <Select value={filterJenis} onValueChange={(v) => setFilterJenis(v as FilterJenis)}>
                <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="sapi">Sapi</SelectItem>
                  <SelectItem value="kambing">Kambing</SelectItem>
                </SelectContent>
              </Select>

              {/* Sumber */}
              <Select value={filterSumber} onValueChange={(v) => setFilterSumber(v as FilterSumber)}>
                <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sumber</SelectItem>
                  <SelectItem value="beli">Beli (Panitia)</SelectItem>
                  <SelectItem value="titipan">Titipan</SelectItem>
                </SelectContent>
              </Select>

              {/* Peserta */}
              <Select value={filterPeserta} onValueChange={(v) => setFilterPeserta(v as FilterPeserta)}>
                <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Peserta</SelectItem>
                  <SelectItem value="full">Penuh</SelectItem>
                  <SelectItem value="partial">Sebagian</SelectItem>
                  <SelectItem value="empty">Kosong</SelectItem>
                </SelectContent>
              </Select>

              {/* Pembayaran */}
              <Select value={filterPembayaran} onValueChange={(v) => setFilterPembayaran(v as FilterPembayaran)}>
                <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pembayaran</SelectItem>
                  <SelectItem value="lunas">Semua Lunas</SelectItem>
                  <SelectItem value="belum">Belum Lunas</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terbaru">{SORT_LABELS.terbaru}</SelectItem>
                  <SelectItem value="terlama">{SORT_LABELS.terlama}</SelectItem>
                  <SelectItem value="harga_asc">{SORT_LABELS.harga_asc}</SelectItem>
                  <SelectItem value="harga_desc">{SORT_LABELS.harga_desc}</SelectItem>
                </SelectContent>
              </Select>

              {/* Active filter count + reset */}
              {hasActiveFilter && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs h-6 px-2">
                    {[filterJenis, filterSumber, filterPeserta, filterPembayaran].filter(f => f !== 'all').length} filter aktif
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs text-muted-foreground"
                    onClick={resetFilters}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-muted-foreground mr-2">
                  {filteredAnimals.length} dari {allAnimals.length} hewan
                </span>
                {/* View toggle */}
                <div className="flex rounded-md border overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 rounded-none p-0 ${view === 'card' ? 'bg-muted' : ''}`}
                    onClick={() => setView('card')}
                    title="Tampilan kartu"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 rounded-none p-0 border-l ${view === 'list' ? 'bg-muted' : ''}`}
                    onClick={() => setView('list')}
                    title="Tampilan daftar"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Animal grid */}
          {selectedEvent && (
            <>
              <AnimalGrid
                animals={pagedAnimals}
                isLoading={animalsLoading}
                view={view}
                shareCounts={shareCounts}
                onSelectAnimal={handleSelectAnimal}
                onEditAnimal={handleEditAnimal}
                onDeleteAnimal={handleDeleteAnimalClick}
                onAddAnimal={handleAddAnimal}
                canWrite={canWrite}
              />
              {!animalsLoading && filteredAnimals.length > 0 && (
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={filteredAnimals.length}
                  pageSize={pageSize}
                  pageSizeOptions={[10, 20, 50]}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                  suffix="hewan"
                />
              )}
            </>
          )}
        </>
      )}

      {/* Animal detail dialog */}
      {selectedAnimal && selectedEvent && (
        <AnimalDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          animal={selectedAnimal}
          event={selectedEvent}
        />
      )}

      {/* Animal create/edit form */}
      {selectedEvent && (
        <AnimalForm
          open={animalFormOpen}
          onOpenChange={setAnimalFormOpen}
          eventId={selectedEvent.id}
          initialData={editingAnimal}
          existingAnimals={allAnimals}
        />
      )}

      {/* Delete animal confirmation */}
      <AlertDialog open={deleteAnimalOpen} onOpenChange={setDeleteAnimalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hewan?</AlertDialogTitle>
            <AlertDialogDescription>
              Hewan <strong>{deletingAnimal?.nomor}</strong> ({deletingAnimal?.jenis}) akan
              dihapus permanen. Tindakan ini tidak dapat dibatalkan jika tidak ada peserta
              yang terdaftar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnimalConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
