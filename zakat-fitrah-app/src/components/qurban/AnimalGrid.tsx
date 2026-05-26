import { Plus, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AnimalCard } from '@/components/qurban/AnimalCard'
import type { QurbanAnimal } from '@/types/qurban'
import { getMaxSlots } from '@/types/qurban'

export type AnimalView = 'card' | 'list'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

interface AnimalGridProps {
  animals: QurbanAnimal[]
  isLoading: boolean
  view: AnimalView
  shareCounts: Map<string, { shareCount: number; paidCount: number }>
  onSelectAnimal: (animal: QurbanAnimal) => void
  onEditAnimal: (animal: QurbanAnimal) => void
  onDeleteAnimal: (animal: QurbanAnimal) => void
  onAddAnimal: () => void
  canWrite: boolean
}

export function AnimalGrid({
  animals,
  isLoading,
  view,
  shareCounts,
  onSelectAnimal,
  onEditAnimal,
  onDeleteAnimal,
  onAddAnimal,
  canWrite,
}: AnimalGridProps) {
  // ---- Loading skeleton ----
  if (isLoading) {
    if (view === 'list') {
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {['Foto', 'Nomor', 'Jenis', 'Sumber', 'Harga / Biaya', 'Berat', 'Peserta', 'Lunas', ''].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ---- Empty state ----
  if (animals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Belum ada hewan qurban untuk event ini.
        </p>
        {canWrite && (
          <Button onClick={onAddAnimal}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Hewan
          </Button>
        )}
      </div>
    )
  }

  // ---- List view ----
  if (view === 'list') {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[52px]">Foto</TableHead>
              <TableHead className="w-[110px]">Nomor</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Harga / Biaya Perawatan</TableHead>
              <TableHead>Berat</TableHead>
              <TableHead className="text-center">Peserta</TableHead>
              <TableHead className="text-center">Lunas</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {animals.map((animal) => {
              const counts = shareCounts.get(animal.id) ?? { shareCount: 0, paidCount: 0 }
              const maxSlots = getMaxSlots(animal.jenis)
              const isFull = counts.shareCount >= maxSlots
              const isAllPaid = counts.shareCount > 0 && counts.paidCount === counts.shareCount

              return (
                <TableRow
                  key={animal.id}
                  className="cursor-pointer"
                  onClick={() => onSelectAnimal(animal)}
                >
                  <TableCell className="p-1.5">
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {animal.foto_url ? (
                        <img
                          src={animal.foto_url}
                          alt={animal.nomor}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg leading-none">
                          {animal.jenis === 'sapi' ? '🐄' : '🐐'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-semibold text-sm">{animal.nomor}</span>
                    {isAllPaid && (
                      <Badge className="ml-1.5 bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                        Selesai
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {animal.jenis === 'sapi' ? 'Sapi' : 'Kambing'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={animal.sumber_hewan === 'titipan' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {animal.sumber_hewan === 'beli' ? 'Beli' : 'Titipan'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {animal.sumber_hewan === 'beli'
                      ? formatCurrency(animal.harga)
                      : animal.biaya_perawatan != null
                        ? formatCurrency(animal.biaya_perawatan)
                        : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {animal.berat_kg != null ? `${animal.berat_kg} kg` : '—'}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <span className={isFull ? 'text-green-700 font-medium' : ''}>
                      {counts.shareCount}/{maxSlots}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <span className={isAllPaid && counts.shareCount > 0 ? 'text-green-700 font-medium' : ''}>
                      {counts.paidCount}/{counts.shareCount}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canWrite && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectAnimal(animal)}>
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditAnimal(animal)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteAnimal(animal)}
                          >
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // ---- Card view ----
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {animals.map((animal) => (
        <AnimalCard
          key={animal.id}
          animal={animal}
          onSelect={() => onSelectAnimal(animal)}
          onEdit={() => onEditAnimal(animal)}
          onDelete={() => onDeleteAnimal(animal)}
          canWrite={canWrite}
        />
      ))}
    </div>
  )
}
