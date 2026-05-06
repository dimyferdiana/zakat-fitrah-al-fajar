import { useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
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
import {
  Search,
  Pencil,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import type { QurbanRegistrationWithParticipants, QurbanListParams } from '@/types/qurban'
import { useQurbanList, useDeleteQurban } from '@/hooks/useQurban'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface QurbanTableProps {
  onEdit: (data: QurbanRegistrationWithParticipants) => void
  onDownloadPdf: (data: QurbanRegistrationWithParticipants) => void
}

export function QurbanTable({ onEdit, onDownloadPdf }: QurbanTableProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [jenis, setJenis] = useState<QurbanListParams['jenis']>('all')
  const [status, setStatus] = useState<QurbanListParams['status']>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const pageSize = 20

  const params: QurbanListParams = {
    search,
    jenis,
    status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: currentPage,
    pageSize,
  }

  const { data: queryData, isLoading } = useQurbanList(params)
  const deleteMutation = useDeleteQurban()

  const data = queryData?.data || []
  const totalCount = queryData?.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handleSearchSubmit = () => {
    setSearch(searchInput)
    setCurrentPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const getParticipantSummary = (reg: QurbanRegistrationWithParticipants): string => {
    const participants = reg.qurban_participants || []
    if (participants.length === 0) return '-'
    if (participants.length === 1) return participants[0].nama
    return `${participants[0].nama} (+${participants.length - 1})`
  }

  const getJenisLabel = (jenis: string): string => {
    if (jenis === 'sapi') return 'Qurban Sapi'
    if (jenis === 'kambing') return 'Qurban Kambing/Domba'
    return jenis
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau no HP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                title="Hapus pencarian"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSearchSubmit} variant="outline">
            Cari
          </Button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={jenis || 'all'}
            onValueChange={(val) => {
              setJenis(val as QurbanListParams['jenis'])
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Jenis Hewan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="sapi">Sapi</SelectItem>
              <SelectItem value="kambing">Kambing/Domba</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status || 'all'}
            onValueChange={(val) => {
              setStatus(val as QurbanListParams['status'])
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="terdaftar">Terdaftar</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setCurrentPage(1)
              }}
              className="w-[160px]"
              placeholder="Dari tanggal"
            />
            <span className="text-sm text-muted-foreground">s/d</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setCurrentPage(1)
              }}
              className="w-[160px]"
              placeholder="Sampai tanggal"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setCurrentPage(1)
                }}
                title="Hapus filter tanggal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>No. Qurban</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>No HP</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Qurban a/n</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Tidak ada data pendaftaran qurban.
                </TableCell>
              </TableRow>
            ) : (
              data.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(reg.tanggal), 'dd MMM yyyy', { locale: idLocale })}
                  </TableCell>
                  <TableCell className="font-mono whitespace-nowrap">
                    {reg.no_qurban || '-'}
                  </TableCell>
                  <TableCell className="font-medium">{reg.nama}</TableCell>
                  <TableCell>{reg.no_hp}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {getJenisLabel(reg.jenis)}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {getParticipantSummary(reg)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(reg.nominal)}
                  </TableCell>
                  <TableCell className="text-center">
                    {reg.status === 'lunas' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        Lunas
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                        Terdaftar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(reg)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(reg.id)}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownloadPdf(reg)}
                        title="Unduh Kuitansi (segera hadir)"
                        disabled
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {data.length} dari {totalCount} data
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Halaman {currentPage} dari {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pendaftaran Qurban?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data pendaftaran dan semua peserta qurban akan
              dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
