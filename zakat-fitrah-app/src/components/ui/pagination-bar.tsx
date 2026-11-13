import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  /** Extra text appended inside the item-count parenthesis, e.g. "· 446 kupon" */
  suffix?: string
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const visible = new Set<number>()
  visible.add(1)
  visible.add(2)
  visible.add(total - 1)
  visible.add(total)
  for (let i = Math.max(1, current - 1); i <= Math.min(total, current + 1); i++) {
    visible.add(i)
  }

  const sorted = Array.from(visible).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis')
    result.push(sorted[i])
  }
  return result
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
  suffix,
}: PaginationBarProps) {
  if (totalPages <= 0) return null

  const pages = getPageNumbers(currentPage, totalPages)
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      {/* Left: info + page size */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground whitespace-nowrap">
          Halaman <span className="font-medium text-foreground">{currentPage}</span> dari{' '}
          <span className="font-medium text-foreground">{totalPages}</span>{' '}
          <span className="text-muted-foreground">
              ({start}–{end} dari {totalCount} item{suffix ? ` · ${suffix}` : ''})
            </span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground whitespace-nowrap">Per halaman:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger aria-label="Jumlah item per halaman" className="h-8 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: page buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Sebelumnya
        </Button>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? 'default' : 'outline'}
              size="sm"
              aria-current={p === currentPage ? 'page' : undefined}
              aria-label={`Halaman ${p}`}
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
