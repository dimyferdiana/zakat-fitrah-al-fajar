import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useMustahikList, useKategoriMustahik, useCreateMustahik,
  useUpdateMustahik, useToggleMustahikActive, useDeleteMustahik,
} from '@/hooks/useMustahik'
import type { Mustahik, CreateMustahikInput } from '@/hooks/useMustahik'

const PAGE_SIZE = 20

const schema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  kategori_id: z.string().min(1, 'Kategori wajib dipilih'),
  jumlah_anggota: z.number().min(1, 'Jumlah anggota minimal 1'),
  no_telp: z.string().optional(),
  catatan: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function DataMasterMustahik() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'non-aktif'>('semua')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMustahik, setEditingMustahik] = useState<Mustahik | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Mustahik | null>(null)

  const { data: listData, isLoading } = useMustahikList({
    search: debouncedSearch,
    status: statusFilter,
    page,
    limit: PAGE_SIZE,
  })

  const { data: kategoriList = [] } = useKategoriMustahik()
  const createMustahik = useCreateMustahik()
  const updateMustahik = useUpdateMustahik()
  const toggleActive = useToggleMustahikActive()
  const deleteMustahik = useDeleteMustahik()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama: '', alamat: '', kategori_id: '', jumlah_anggota: 1,
      no_telp: '', catatan: '', is_active: true,
    },
  })

  const totalPages = Math.max(1, Math.ceil((listData?.totalCount ?? 0) / PAGE_SIZE))

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    setTimeout(() => setDebouncedSearch(val), 300)
  }

  const handleOpenCreate = () => {
    setEditingMustahik(null)
    form.reset({ nama: '', alamat: '', kategori_id: '', jumlah_anggota: 1, no_telp: '', catatan: '', is_active: true })
    setFormOpen(true)
  }

  const handleOpenEdit = (m: Mustahik) => {
    setEditingMustahik(m)
    form.reset({
      nama: m.nama,
      alamat: m.alamat,
      kategori_id: m.kategori_id,
      jumlah_anggota: m.jumlah_anggota,
      no_telp: m.no_telp ?? '',
      catatan: m.catatan ?? '',
      is_active: m.is_active,
    })
    setFormOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    const input: CreateMustahikInput = {
      ...values,
      no_telp: values.no_telp || undefined,
      catatan: values.catatan || undefined,
    }
    if (editingMustahik) {
      await updateMustahik.mutateAsync({ ...input, id: editingMustahik.id })
    } else {
      await createMustahik.mutateAsync(input)
    }
    setFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMustahik.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const isPending = createMustahik.isPending || updateMustahik.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Mustahik</h2>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Mustahik
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama atau alamat..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as 'semua' | 'aktif' | 'non-aktif'); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="non-aktif">Non-aktif</SelectItem>
          </SelectContent>
        </Select>
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
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Alamat</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Anggota</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!listData?.data.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {debouncedSearch ? 'Tidak ada hasil yang cocok.' : 'Belum ada data mustahik.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  listData.data.map((m, idx) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="font-medium">{m.nama}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{m.alamat}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {m.kategori_mustahik && (
                          <Badge variant="outline" className="text-xs">{m.kategori_mustahik.nama}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center text-sm">{m.jumlah_anggota}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={m.is_active ? 'default' : 'secondary'} className="text-xs">
                          {m.is_active ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleActive.mutate({ id: m.id, is_active: !m.is_active })}
                          >
                            {m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(m as Mustahik)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(m as Mustahik)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
          <span>{listData?.totalCount ?? 0} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
            <span className="flex items-center px-2">Hal. {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingMustahik(null) }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMustahik ? 'Edit Mustahik' : 'Tambah Mustahik'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <FormField control={form.control} name="nama" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Nama mustahik" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="alamat" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Alamat lengkap" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="kategori_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                      <SelectContent>
                        {kategoriList.map((k) => (
                          <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="jumlah_anggota" render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Anggota <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="no_telp" render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Telp</FormLabel>
                  <FormControl><Input {...field} placeholder="08xxxxxxxxxx" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="catatan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Catatan tambahan..." rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="mb-0">Aktif</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>Batal</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mustahik</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus data mustahik <strong>{deleteTarget?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
