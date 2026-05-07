import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Printer, Trash2 } from 'lucide-react'
import type { QurbanAnimal, QurbanEvent, QurbanShareWithMuzakki } from '@/types/qurban'
import { getMaxSlots } from '@/types/qurban'
import {
  useQurbanShareList,
  useUpdateSharePayment,
  useRemoveQurbanShare,
} from '@/hooks/useQurbanShares'
import { useAuth } from '@/lib/auth'
import { SlotAssignDialog } from '@/components/qurban/SlotAssignDialog'
import { downloadQurbanShareReceipt } from '@/components/qurban/BuktiQurban'

export interface AnimalDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  animal: QurbanAnimal
  event: QurbanEvent
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function AnimalDetailDialog({
  open,
  onOpenChange,
  animal,
  event,
}: AnimalDetailDialogProps) {
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const canWrite = user?.role === 'admin' || user?.role === 'petugas'

  const maxSlots = getMaxSlots(animal.jenis)
  const suggestedNominal = Math.round(animal.harga / maxSlots)

  const { data: shares = [], isLoading: sharesLoading } = useQurbanShareList(
    open ? animal.id : null
  )

  const updatePayment = useUpdateSharePayment()
  const removeShare = useRemoveQurbanShare()

  // Slot assign dialog state
  const [assignSlot, setAssignSlot] = useState<number | null>(null)

  // Confirmation for delete
  const [deleteTarget, setDeleteTarget] = useState<QurbanShareWithMuzakki | null>(null)

  // Build a map urutan → share
  const sharesByUrutan: Record<number, QurbanShareWithMuzakki> = {}
  for (const s of shares) {
    sharesByUrutan[s.urutan] = s
  }

  const allSlotsFilled = shares.length >= maxSlots

  // Payment summary
  const lunasList = shares.filter((s) => s.status_pembayaran === 'lunas')
  const totalTerkumpul = lunasList.reduce((sum, s) => sum + s.nominal, 0)
  const totalHarus = shares.reduce((sum, s) => sum + s.nominal, 0)

  const handleTogglePayment = (share: QurbanShareWithMuzakki) => {
    const newStatus =
      share.status_pembayaran === 'lunas' ? 'belum_bayar' : 'lunas'
    updatePayment.mutate({ id: share.id, animal_id: share.animal_id, status_pembayaran: newStatus })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    removeShare.mutate(
      { id: deleteTarget.id, animal_id: deleteTarget.animal_id },
      { onSettled: () => setDeleteTarget(null) }
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Hewan Qurban</DialogTitle>
          </DialogHeader>

          {/* Animal info header */}
          <div className="flex gap-4 items-start">
            {animal.foto_url ? (
              <img
                src={animal.foto_url}
                alt={animal.nomor}
                className="h-20 w-20 rounded-md object-cover flex-shrink-0 border"
              />
            ) : (
              <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center text-2xl flex-shrink-0 border">
                {animal.jenis === 'sapi' ? '🐄' : '🐐'}
              </div>
            )}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap gap-1 items-center">
                <span className="font-semibold text-base">{animal.nomor}</span>
                <Badge variant="outline">
                  {animal.jenis === 'sapi' ? 'Sapi' : 'Kambing'}
                </Badge>
                <Badge variant="secondary">
                  {animal.sumber_hewan === 'beli' ? 'Beli' : 'Titipan'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Harga: <span className="font-medium text-foreground">{formatCurrency(animal.harga)}</span>
              </p>
              {animal.berat_kg != null && (
                <p className="text-sm text-muted-foreground">
                  Berat: <span className="font-medium text-foreground">{animal.berat_kg} kg</span>
                </p>
              )}
              {animal.catatan && (
                <p className="text-xs text-muted-foreground italic">{animal.catatan}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Slot list */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Peserta ({shares.length}/{maxSlots} slot terisi)
            </p>

            {sharesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: maxSlots }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y rounded-md border">
                {Array.from({ length: maxSlots }).map((_, idx) => {
                  const urutan = idx + 1
                  const share = sharesByUrutan[urutan]

                  if (share) {
                    return (
                      <div
                        key={urutan}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm"
                      >
                        {/* Slot number */}
                        <span className="w-5 text-muted-foreground font-mono shrink-0">
                          {urutan}.
                        </span>

                        {/* Name */}
                        <span className="flex-1 font-medium truncate">
                          {isViewer ? '—' : share.muzakki.nama_kk}
                        </span>

                        {/* Nominal */}
                        <span className="text-muted-foreground text-xs shrink-0">
                          {isViewer ? '—' : formatCurrency(share.nominal)}
                        </span>

                        {/* Status badge */}
                        <Badge
                          variant={share.status_pembayaran === 'lunas' ? 'default' : 'outline'}
                          className={
                            share.status_pembayaran === 'lunas'
                              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                              : 'text-amber-700 border-amber-300 bg-amber-50'
                          }
                        >
                          {share.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                        </Badge>

                        {/* Action buttons — hidden for viewer */}
                        {canWrite && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Payment toggle */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              disabled={updatePayment.isPending}
                              onClick={() => handleTogglePayment(share)}
                            >
                              {share.status_pembayaran === 'lunas'
                                ? 'Batal Lunas'
                                : 'Tandai Lunas'}
                            </Button>

                            {/* Print receipt */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Cetak bukti"
                              onClick={() =>
                                downloadQurbanShareReceipt({ event, animal, share })
                              }
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Hapus peserta"
                              onClick={() => setDeleteTarget(share)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Empty slot
                  return (
                    <div
                      key={urutan}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground"
                    >
                      <span className="w-5 font-mono shrink-0">{urutan}.</span>
                      <span className="flex-1 italic">Slot kosong</span>
                      {canWrite && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={allSlotsFilled}
                          title={allSlotsFilled ? 'Semua slot terisi' : undefined}
                          onClick={() => setAssignSlot(urutan)}
                        >
                          Tambah Peserta
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Payment summary footer */}
          <Separator />
          {sharesLoading ? (
            <Skeleton className="h-5 w-3/4" />
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {lunasList.length} dari {shares.length} peserta
              </span>{' '}
              sudah lunas —{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(totalTerkumpul)}
              </span>{' '}
              terkumpul dari{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(totalHarus)}
              </span>{' '}
              total
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* SlotAssignDialog */}
      {assignSlot != null && (
        <SlotAssignDialog
          open={assignSlot != null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setAssignSlot(null)
          }}
          animal={animal}
          urutan={assignSlot}
          suggestedNominal={suggestedNominal}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peserta?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus{' '}
              <span className="font-semibold">{deleteTarget?.muzakki.nama_kk}</span>{' '}
              dari slot {deleteTarget?.urutan}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeShare.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={removeShare.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeShare.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
