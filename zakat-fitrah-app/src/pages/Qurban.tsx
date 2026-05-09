import { useState } from 'react'
import { Plus, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { AnimalGrid } from '@/components/qurban/AnimalGrid'
import { AnimalDetailDialog } from '@/components/qurban/AnimalDetailDialog'
import type { QurbanAnimal } from '@/types/qurban'
import { useQurbanEventList } from '@/hooks/useQurbanEvents'
import { useQurbanAnimalList, useDeleteQurbanAnimal } from '@/hooks/useQurbanAnimals'
import { useAuth } from '@/lib/auth'

export default function Qurban() {
  const { user } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'petugas'

  // --- Events ---
  const { data: events = [], isLoading: eventsLoading } = useQurbanEventList()

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Resolve selected event: use first event if selectedEventId is null/unset
  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ?? events[0] ?? null

  // --- Animals ---
  const { data: existingAnimals = [] } = useQurbanAnimalList(
    selectedEvent?.id ?? null
  )
  const deleteAnimalMutation = useDeleteQurbanAnimal()

  const [animalFormOpen, setAnimalFormOpen] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<QurbanAnimal | null>(null)
  const [deleteAnimalOpen, setDeleteAnimalOpen] = useState(false)
  const [deletingAnimal, setDeletingAnimal] = useState<QurbanAnimal | null>(null)

  // --- Selected animal (for detail dialog) ---
  const [selectedAnimal, setSelectedAnimal] = useState<QurbanAnimal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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

      {/* Event selector */}
      {events.length === 0 ? (
        /* Empty state — no events */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Belum Ada Event Qurban</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Tambahkan event qurban terlebih dahulu melalui halaman Event sebelum menambahkan hewan dan peserta.
          </p>
        </div>
      ) : (
        <>
          {/* Event selector bar */}
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

            {/* Add animal button — right side */}
            {canWrite && selectedEvent && (
              <Button onClick={handleAddAnimal} className="ml-auto">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Hewan
              </Button>
            )}
          </div>

          {/* Animal grid */}
          {selectedEvent && (
            <AnimalGrid
              eventId={selectedEvent.id}
              onSelectAnimal={handleSelectAnimal}
              onEditAnimal={handleEditAnimal}
              onDeleteAnimal={handleDeleteAnimalClick}
              onAddAnimal={handleAddAnimal}
              canWrite={canWrite}
            />
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

      {/* --- Dialogs --- */}

      {/* Animal create/edit form */}
      {selectedEvent && (
        <AnimalForm
          open={animalFormOpen}
          onOpenChange={setAnimalFormOpen}
          eventId={selectedEvent.id}
          initialData={editingAnimal}
          existingAnimals={existingAnimals}
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
