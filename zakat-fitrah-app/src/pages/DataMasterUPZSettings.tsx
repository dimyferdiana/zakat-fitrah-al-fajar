import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UPZUnitForm } from '@/components/data-master/UPZUnitForm'
import {
  useOrgSettings, useUpdateOrgSettings, useUPZUnitList, useDeleteUPZUnit,
} from '@/hooks/useOrgSettings'
import type { UPZUnit } from '@/hooks/useOrgSettings'

const orgSchema = z.object({
  nama_lembaga: z.string().min(1, 'Nama lembaga wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  no_telp: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
})

type OrgFormValues = z.infer<typeof orgSchema>

export function DataMasterUPZSettings() {
  const { data: orgSettings, isLoading: isOrgLoading } = useOrgSettings()
  const { data: upzUnits = [], isLoading: isUnitsLoading } = useUPZUnitList()
  const updateOrgSettings = useUpdateOrgSettings()
  const deleteUPZUnit = useDeleteUPZUnit()

  const [unitFormOpen, setUnitFormOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UPZUnit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UPZUnit | null>(null)

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { nama_lembaga: '', alamat: '', no_telp: '', email: '' },
  })

  useEffect(() => {
    if (orgSettings) {
      form.reset({
        nama_lembaga: orgSettings.nama_lembaga,
        alamat: orgSettings.alamat,
        no_telp: orgSettings.no_telp ?? '',
        email: orgSettings.email ?? '',
      })
    }
  }, [orgSettings, form])

  const onSaveOrg = async (values: OrgFormValues) => {
    await updateOrgSettings.mutateAsync({
      nama_lembaga: values.nama_lembaga,
      alamat: values.alamat,
      no_telp: values.no_telp || undefined,
      email: values.email || undefined,
      logo_url: orgSettings?.logo_url || undefined,
    })
  }

  const handleAddUnit = () => {
    setEditingUnit(null)
    setUnitFormOpen(true)
  }

  const handleEditUnit = (unit: UPZUnit) => {
    setEditingUnit(unit)
    setUnitFormOpen(true)
  }

  const handleDeleteUnit = async () => {
    if (!deleteTarget) return
    await deleteUPZUnit.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isOrgLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Org Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Organisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveOrg)} className="space-y-4">
              <FormField control={form.control} name="nama_lembaga" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Masjid / Lembaga <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Nama organisasi" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="alamat" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Alamat lengkap organisasi" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="no_telp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Telp / WhatsApp</FormLabel>
                    <FormControl><Input {...field} placeholder="08xxxxxxxxxx" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="email@organisasi.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateOrgSettings.isPending}>
                  {updateOrgSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Section 2: UPZ Units */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Unit UPZ / Amil</CardTitle>
            <Button size="sm" onClick={handleAddUnit}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isUnitsLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead className="hidden sm:table-cell">Petugas Amil</TableHead>
                  <TableHead className="hidden md:table-cell">Lokasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!upzUnits.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada unit UPZ. Klik "Tambah Unit" untuk menambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  upzUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.nama_unit}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{unit.petugas_amil ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{unit.lokasi ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditUnit(unit)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(unit)}>
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

      {/* UPZ Unit Form Dialog */}
      <UPZUnitForm
        open={unitFormOpen}
        onOpenChange={(open) => { setUnitFormOpen(open); if (!open) setEditingUnit(null) }}
        initialData={editingUnit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Unit UPZ</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus unit <strong>{deleteTarget?.nama_unit}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
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
