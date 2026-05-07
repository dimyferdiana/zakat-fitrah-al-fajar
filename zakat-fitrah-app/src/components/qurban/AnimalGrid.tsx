import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimalCard } from '@/components/qurban/AnimalCard'
import type { QurbanAnimal } from '@/types/qurban'
import { useQurbanAnimalList } from '@/hooks/useQurbanAnimals'

interface AnimalGridProps {
  eventId: string | null
  onSelectAnimal: (animal: QurbanAnimal) => void
  onEditAnimal: (animal: QurbanAnimal) => void
  onDeleteAnimal: (animal: QurbanAnimal) => void
  onAddAnimal: () => void
  canWrite: boolean
  // TODO: wire real share counts once useQurbanShares is available
  shareCounts?: Record<string, { total: number; paid: number }>
}

export function AnimalGrid({
  eventId,
  onSelectAnimal,
  onEditAnimal,
  onDeleteAnimal,
  onAddAnimal,
  canWrite,
  shareCounts = {},
}: AnimalGridProps) {
  const { data: animals = [], isLoading } = useQurbanAnimalList(eventId)

  if (isLoading) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {animals.map((animal) => (
        <AnimalCard
          key={animal.id}
          animal={animal}
          shareCount={shareCounts[animal.id]?.total ?? 0}
          paidCount={shareCounts[animal.id]?.paid ?? 0}
          onSelect={() => onSelectAnimal(animal)}
          onEdit={() => onEditAnimal(animal)}
          onDelete={() => onDeleteAnimal(animal)}
          canWrite={canWrite}
        />
      ))}
    </div>
  )
}
