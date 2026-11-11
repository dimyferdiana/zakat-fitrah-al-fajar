import { useState, useCallback } from 'react'
import { Plus, Upload, Pencil, History, Search, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { WargaForm } from '@/components/data-master/WargaForm'
import { WargaHistorySheet } from '@/components/data-master/WargaHistorySheet'
import { WargaImportDialog } from '@/components/data-master/WargaImportDialog'
import { PersonIdentityDialog } from '@/components/data-master/PersonIdentityDialog'
import { useMuzakkiList, useSetPersonActive } from '@/hooks/useMuzakki'
import type { MuzakkiMaster } from '@/hooks/useMuzakki'
import { useAuth } from '@/lib/auth'

const PAGE_SIZE = 20

export function DataMasterWarga() {
  const { hasRole } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingWarga, setEditingWarga] = useState<MuzakkiMaster | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MuzakkiMaster | null>(null)
  const [historyWarga, setHistoryWarga] = useState<MuzakkiMaster | null>(null)
  const [identityWarga, setIdentityWarga] = useState<MuzakkiMaster | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const setPersonActive = useSetPersonActive()

  const { data, isLoading } = useMuzakkiList({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'nama_kk',
    sortOrder: 'asc',
  })

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    setPage(1)
    // Simple debounce via setTimeout
    const timer = setTimeout(() => setDebouncedSearch(val), 300)
    return () => clearTimeout(timer)
  }, [])

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))

  const handleEdit = (warga: MuzakkiMaster) => {
    setEditingWarga(warga)
    setFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingWarga(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await setPersonActive.mutateAsync({ id: deleteTarget.id, active: deleteTarget.aktif === false })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Jamaah / Data Orang</h2>
        <div className="flex gap-2 flex-wrap">
          {hasRole(['admin']) && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV/Excel
            </Button>
          )}
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Orang
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Cari nama, alamat, atau telepon..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Nama / identitas</TableHead>
                  <TableHead className="hidden lg:table-cell">NIK</TableHead>
                  <TableHead className="hidden sm:table-cell">Alamat</TableHead>
                  <TableHead className="hidden md:table-cell">No. Telp</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.data.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {debouncedSearch ? 'Tidak ada hasil yang cocok.' : 'Belum ada data orang.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((warga, idx) => (
                    <TableRow key={warga.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{warga.nama_lengkap || warga.nama_kk}<div className="text-xs text-muted-foreground">{(warga.jenis_identitas || 'belum_diverifikasi').replaceAll('_', ' ')} · {warga.aktif === false ? 'nonaktif' : 'aktif'}</div></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground font-mono">{warga.nik ?? '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{warga.alamat}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{warga.no_telp ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryWarga(warga)} title="Riwayat">
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(warga)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {hasRole(['admin', 'petugas']) && <><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIdentityWarga(warga)} title="Verifikasi identitas"><UserCheck className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDeleteTarget(warga)}>{warga.aktif === false ? 'Aktifkan' : 'Nonaktifkan'}</Button></>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.count ?? 0} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
            <span className="flex items-center px-2">Hal. {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <WargaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingWarga(null)
        }}
        initialData={editingWarga}
      />

      {/* History Sheet */}
      <WargaHistorySheet
        warga={historyWarga}
        onClose={() => setHistoryWarga(null)}
      />
      {identityWarga && <PersonIdentityDialog person={identityWarga} onClose={() => setIdentityWarga(null)} />}

      {/* Import Dialog */}
      <WargaImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.aktif === false ? 'Aktifkan Data Orang' : 'Nonaktifkan Data Orang'}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.aktif === false ? 'Aktifkan kembali' : 'Nonaktifkan'} data <strong>{deleteTarget?.nama_lengkap || deleteTarget?.nama_kk}</strong>? Riwayat dan kewajiban tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTarget?.aktif === false ? 'Aktifkan' : 'Nonaktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
