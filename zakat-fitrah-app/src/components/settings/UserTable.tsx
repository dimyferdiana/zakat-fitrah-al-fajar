import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Power } from 'lucide-react';

interface User {
  id: string;
  email: string;
  nama_lengkap: string;
  role: 'admin' | 'petugas';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserTableProps {
  data: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

export function UserTable({ data, isLoading, onEdit, onToggleActive }: UserTableProps) {
  const getRoleBadge = (role: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      admin: { className: 'bg-red-600', label: 'Admin' },
      petugas: { className: 'bg-blue-600', label: 'Petugas' },
    };

    const variant = variants[role] || variants.petugas;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Lengkap</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Memuat data...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Belum ada data user.
              </TableCell>
            </TableRow>
          ) : (
            data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nama_lengkap}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  {user.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Non-Aktif</Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActive(user.id, user.is_active)}
                      title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      <Power
                        className={`h-4 w-4 ${user.is_active ? 'text-red-600' : 'text-green-600'}`}
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
