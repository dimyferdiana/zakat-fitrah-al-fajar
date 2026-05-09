import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Plus, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useUsersList, useUpdateUser } from '@/hooks/useUsers'
import { useInvitationsList, useCreateInvitation, useRevokeInvitation, getInvitationStatus } from '@/hooks/useInvitations'
import { useAuth } from '@/lib/auth'

const inviteSchema = z.object({
  email: z.string().email('Email tidak valid'),
  role: z.enum(['admin', 'petugas']),
})

const editRoleSchema = z.object({
  role: z.enum(['admin', 'petugas']),
})

type InviteFormValues = z.infer<typeof inviteSchema>
type EditRoleFormValues = z.infer<typeof editRoleSchema>

interface UserRow {
  id: string
  email: string
  nama_lengkap: string
  role: 'admin' | 'petugas'
  is_active: boolean
  created_at: string
  updated_at: string
}

export function DataMasterPengguna() {
  const { user: currentUser } = useAuth()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editRoleTarget, setEditRoleTarget] = useState<UserRow | null>(null)

  const { data: users = [], isLoading: isUsersLoading } = useUsersList()
  const { data: invitations = [], isLoading: isInvitationsLoading } = useInvitationsList()
  const updateUser = useUpdateUser()
  const createInvitation = useCreateInvitation()
  const revokeInvitation = useRevokeInvitation()

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'petugas' },
  })

  const editRoleForm = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { role: 'petugas' },
  })

  const handleInvite = async (values: InviteFormValues) => {
    await createInvitation.mutateAsync(values)
    setInviteOpen(false)
    inviteForm.reset()
  }

  const handleEditRole = async (values: EditRoleFormValues) => {
    if (!editRoleTarget) return
    await updateUser.mutateAsync({
      id: editRoleTarget.id,
      nama_lengkap: editRoleTarget.nama_lengkap,
      role: values.role,
      is_active: editRoleTarget.is_active,
    })
    setEditRoleTarget(null)
  }

  const handleToggleActive = async (u: UserRow) => {
    await updateUser.mutateAsync({
      id: u.id,
      nama_lengkap: u.nama_lengkap,
      role: u.role,
      is_active: !u.is_active,
    })
  }

  const openEditRole = (u: UserRow) => {
    setEditRoleTarget(u)
    editRoleForm.reset({ role: u.role })
  }

  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (status) {
      case 'pending': return 'default'
      case 'used': return 'secondary'
      case 'expired': return 'outline'
      case 'revoked': return 'destructive'
      default: return 'outline'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Menunggu'
      case 'used': return 'Digunakan'
      case 'expired': return 'Kedaluwarsa'
      case 'revoked': return 'Dicabut'
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Pengguna</h2>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Undang Pengguna
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Pengguna Aktif</TabsTrigger>
          <TabsTrigger value="invitations">Undangan</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isUsersLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!(users as UserRow[]).length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Belum ada pengguna terdaftar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (users as UserRow[]).map((u, idx) => {
                        const isSelf = currentUser?.id === u.id
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-medium">{u.nama_lengkap}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={u.is_active ? 'default' : 'outline'} className="text-xs">
                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditRole(u)}>
                                  Edit Role
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={isSelf || updateUser.isPending}
                                  title={isSelf ? 'Tidak dapat menonaktifkan akun sendiri.' : undefined}
                                  onClick={() => handleToggleActive(u)}
                                >
                                  {u.is_active
                                    ? <UserX className="h-3.5 w-3.5 text-destructive" />
                                    : <UserCheck className="h-3.5 w-3.5 text-green-600" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isInvitationsLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Dikirim</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!(invitations ?? []).length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Belum ada undangan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (invitations ?? []).map((inv) => {
                        const status = getInvitationStatus(inv)
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                            <TableCell>
                              <Badge variant={inv.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">
                                {inv.role as string}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
                                {getStatusLabel(status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                              {inv.created_at
                                ? formatDistanceToNow(new Date(inv.created_at), { locale: idLocale, addSuffix: true })
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                {status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                    onClick={() => revokeInvitation.mutate(inv.id)}
                                  >
                                    Cabut
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) inviteForm.reset() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Undang Pengguna</DialogTitle>
          </DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4 mt-2">
              <FormField control={inviteForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input type="email" {...field} placeholder="email@example.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={inviteForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="petugas">Petugas</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} disabled={createInvitation.isPending}>Batal</Button>
                <Button type="submit" disabled={createInvitation.isPending}>
                  {createInvitation.isPending ? 'Mengirim...' : 'Kirim Undangan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleTarget} onOpenChange={(open) => { if (!open) setEditRoleTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah Role — {editRoleTarget?.nama_lengkap}</DialogTitle>
          </DialogHeader>
          <Form {...editRoleForm}>
            <form onSubmit={editRoleForm.handleSubmit(handleEditRole)} className="space-y-4 mt-2">
              <FormField control={editRoleForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="petugas">Petugas</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditRoleTarget(null)} disabled={updateUser.isPending}>Batal</Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
