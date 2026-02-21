import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Ban, RotateCcw } from 'lucide-react';
import {
  useInvitationsList,
  useRevokeInvitation,
  useReInvite,
  getInvitationStatus,
} from '@/hooks/useInvitations';
import type { InvitationStatus } from '@/types/database.types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const statusColors: Record<InvitationStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  used: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  revoked: 'bg-red-100 text-red-800',
};

const statusLabels: Record<InvitationStatus, string> = {
  pending: 'Pending',
  used: 'Used',
  expired: 'Expired',
  revoked: 'Revoked',
};

export function InvitationTable() {
  const { data: invitations = [], isLoading } = useInvitationsList();
  const revokeInvitationMutation = useRevokeInvitation();
  const reInviteMutation = useReInvite();
  
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [reInviteData, setReInviteData] = useState<{ email: string; role: 'admin' | 'petugas' } | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invitations found. Create your first invitation to get started.
      </div>
    );
  }

  const handleRevoke = async () => {
    if (revokeId) {
      await revokeInvitationMutation.mutateAsync(revokeId);
      setRevokeId(null);
    }
  };

  const handleReInvite = async () => {
    if (reInviteData) {
      await reInviteMutation.mutateAsync(reInviteData);
      setReInviteData(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const status = getInvitationStatus(invitation);
              const canRevoke = status === 'pending';
              const canReInvite = status === 'expired' || status === 'revoked';

              return (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invitation.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[status]}>
                      {statusLabels[status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(invitation.expires_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canRevoke && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRevokeId(invitation.id)}
                          disabled={revokeInvitationMutation.isPending}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                      {canReInvite && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReInviteData({ email: invitation.email, role: invitation.role as 'admin' | 'petugas' })}
                          disabled={reInviteMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Re-invite
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the invitation link from being used. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Re-invite Confirmation Dialog */}
      <AlertDialog open={!!reInviteData} onOpenChange={() => setReInviteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new invitation for {reInviteData?.email} with a fresh 24-hour expiration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReInvite}>Create New Invitation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
