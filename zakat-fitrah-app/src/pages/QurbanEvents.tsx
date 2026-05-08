import { useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Plus, MoreVertical, Edit, Trash2, CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { QurbanEventDialog } from '@/components/qurban/QurbanEventDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useQurbanEventList, useDeleteQurbanEvent } from '@/hooks/useQurbanEvents'
import type { QurbanEvent } from '@/types/qurban'

// Fetch animal and share counts for all events in a single query
function useQurbanEventCounts() {
  return useQuery({
    queryKey: ['qurban-event-counts'],
    queryFn: async () => {
      const [animalsRes, sharesRes] = await Promise.all([
        supabase.from('qurban_animals').select('id, event_id'),
        supabase
          .from('qurban_shares')
          .select('id, qurban_animals!inner(event_id)'),
      ])

      if (animalsRes.error) throw animalsRes.error
      if (sharesRes.error) throw sharesRes.error

      const animalCountMap: Record<string, number> = {}
      for (const row of animalsRes.data || []) {
        animalCountMap[row.event_id] = (animalCountMap[row.event_id] ?? 0) + 1
      }

      const shareCountMap: Record<string, number> = {}
      for (const row of (sharesRes.data || []) as any[]) {
        const eventId = row.qurban_animals?.event_id
        if (eventId) {
          shareCountMap[eventId] = (shareCountMap[eventId] ?? 0) + 1
        }
      }

      return { animalCountMap, shareCountMap }
    },
  })
}

export function QurbanEvents() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])

  const { data: events, isLoading } = useQurbanEventList()
  const { data: counts } = useQurbanEventCounts()
  const deleteEvent = useDeleteQurbanEvent()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<QurbanEvent | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<QurbanEvent | null>(null)

  const handleAddClick = () => {
    setEditingEvent(null)
    setDialogOpen(true)
  }

  const handleEditClick = (event: QurbanEvent) => {
    setEditingEvent(event)
    setDialogOpen(true)
  }

  const handleDeleteClick = (event: QurbanEvent) => {
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return
    await deleteEvent.mutateAsync(eventToDelete.id)
    setDeleteDialogOpen(false)
    setEventToDelete(null)
  }

  const formatTanggal = (tanggal: string) => {
    try {
      return format(new Date(tanggal), 'dd MMMM yyyy', { locale: idLocale })
    } catch {
      return tanggal
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Event Qurban"
        description="Kelola event qurban dan lihat statistik per event"
        action={
          isAdmin
            ? {
                label: 'Tambah Event',
                onClick: handleAddClick,
                icon: <Plus className="h-4 w-4" />,
              }
            : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading && <LoadingSpinner text="Memuat data event..." />}

          {!isLoading && (!events || events.length === 0) && (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada event qurban"
              description="Buat event qurban pertama untuk memulai pendataan hewan dan peserta"
              action={
                isAdmin
                  ? { label: 'Tambah Event', onClick: handleAddClick }
                  : undefined
              }
            />
          )}

          {!isLoading && events && events.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Event</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Jumlah Hewan</TableHead>
                    <TableHead className="text-right">Jumlah Peserta</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{event.nama}</TableCell>
                      <TableCell>{formatTanggal(event.tanggal)}</TableCell>
                      <TableCell className="text-right">
                        {counts?.animalCountMap[event.id] ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {counts?.shareCountMap[event.id] ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Aksi</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(event)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(event)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <QurbanEventDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingEvent(null)
        }}
        initialData={editingEvent}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Event Qurban?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus event{' '}
              <span className="font-semibold">{eventToDelete?.nama}</span>?{' '}
              Event tidak dapat dihapus jika masih memiliki hewan qurban yang terdaftar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default QurbanEvents
