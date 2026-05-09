import { Beef, MoreVertical, ImageOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { QurbanAnimal } from '@/types/qurban'
import { getMaxSlots } from '@/types/qurban'
import { useQurbanShareList } from '@/hooks/useQurbanShares'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

interface AnimalCardProps {
  animal: QurbanAnimal
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  canWrite: boolean
}

export function AnimalCard({
  animal,
  onSelect,
  onEdit,
  onDelete,
  canWrite,
}: AnimalCardProps) {
  const maxSlots = getMaxSlots(animal.jenis)
  const { data: shares = [] } = useQurbanShareList(animal.id)
  const shareCount = shares.length
  const paidCount = shares.filter((s) => s.status_pembayaran === 'lunas').length
  const isFull = shareCount === maxSlots
  const isSelesai = isFull && paidCount === shareCount
  const progressPercent = maxSlots > 0 ? Math.round((shareCount / maxSlots) * 100) : 0

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo area */}
      <div
        className="relative h-40 bg-muted cursor-pointer flex items-center justify-center"
        onClick={onSelect}
      >
        {animal.foto_url ? (
          <img
            src={animal.foto_url}
            alt={`Foto hewan ${animal.nomor}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {animal.jenis === 'sapi' ? (
              <Beef className="h-12 w-12" />
            ) : (
              <span className="text-4xl">🐐</span>
            )}
            <ImageOff className="h-4 w-4 absolute top-2 right-2 opacity-50" />
          </div>
        )}

        {/* Selesai badge overlay */}
        {isSelesai && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white border-0">Selesai</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header row: nomor + kebab menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="font-mono font-semibold text-sm">
              {animal.nomor}
            </Badge>
            <Badge variant="secondary">
              {animal.jenis === 'sapi' ? 'Sapi' : 'Kambing'}
            </Badge>
            <Badge variant={animal.sumber_hewan === 'titipan' ? 'default' : 'outline'} className="text-xs">
              {animal.sumber_hewan === 'beli' ? 'Beli' : animal.sumber_hewan === 'titipan' ? 'Titipan' : 'Al Fajar'}
            </Badge>
          </div>

          {canWrite && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu hewan</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Weight + price */}
        <div className="space-y-0.5">
          {animal.berat_kg != null && (
            <p className="text-sm text-muted-foreground">±{animal.berat_kg} kg</p>
          )}
          <p className="text-sm font-semibold">{formatCurrency(animal.harga)}</p>
        </div>

        {/* Slot progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {shareCount} / {maxSlots} peserta
            </span>
            <span>{paidCount} lunas</span>
          </div>
          {/* Manual progress bar since Progress component may not be available */}
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isSelesai ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Clickable area hint */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={onSelect}
        >
          Lihat Detail Peserta
        </Button>
      </CardContent>
    </Card>
  )
}
