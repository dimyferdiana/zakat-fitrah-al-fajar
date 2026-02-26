import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAccountLedger,
  useAccountsList,
  useCreateAccount,
  useCreateManualLedgerEntry,
  useDeleteAccount,
  useUpdateAccount,
} from '@/hooks/useAccountsLedger';
import type { Account as DbAccount, AccountLedgerEntryType } from '@/types/database.types';
import { AccountFormDialog, type AccountFormValues } from '@/components/accounts/AccountFormDialog';
import { AccountLedgerTable } from '@/components/accounts/AccountLedgerTable';

interface Account extends DbAccount {
  account_number?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export function AccountsManagement() {
  const accountsQuery = useAccountsList();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createManualLedgerEntry = useCreateManualLedgerEntry();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [ledgerEntryType, setLedgerEntryType] = useState<AccountLedgerEntryType>('IN');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerNote, setLedgerNote] = useState('');

  const ledgerQuery = useAccountLedger(selectedAccountId || undefined, {
    page: 1,
    pageSize: 100,
  });

  const accounts: Account[] = useMemo(() => {
    const rawAccounts = accountsQuery.data || [];
    return rawAccounts.map((account) => {
      const metadata = (account.metadata || {}) as Record<string, unknown>;
      return {
        ...account,
        account_number:
          typeof metadata.account_number === 'string' ? metadata.account_number : undefined,
      };
    });
  }, [accountsQuery.data]);

  const isLoadingAccounts = accountsQuery.isLoading;
  const isLoadingLedger = ledgerQuery.isLoading;

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const filteredLedger = ledgerQuery.data?.data || [];

  const latestBalance = useMemo(() => {
    if (!filteredLedger.length) return 0;
    return Number(filteredLedger[0].running_balance_after_rp || 0);
  }, [filteredLedger]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          account_name: values.name,
          account_channel: values.type,
          metadata: {
            account_number: values.accountNumber || null,
          },
        });
      } else {
        await createAccount.mutateAsync({
          account_name: values.name,
          account_channel: values.type,
          metadata: {
            account_number: values.accountNumber || null,
          },
        });
      }

      await accountsQuery.refetch();
      setDialogOpen(false);
      setEditingAccount(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan rekening');
    }
  };

  const handleDelete = async (account: Account) => {
    const accountName = account.account_name || 'rekening ini';
    if (!window.confirm(`Hapus ${accountName}?`)) {
      return;
    }

    try {
      await deleteAccount.mutateAsync(account.id);
      await accountsQuery.refetch();

      if (selectedAccountId === account.id) {
        setSelectedAccountId('');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus rekening');
    }
  };

  const handleCreateManualEntry = async () => {
    if (!selectedAccountId) {
      toast.error('Pilih rekening terlebih dahulu');
      return;
    }

    const amount = Number(ledgerAmount);
    if (!amount || amount <= 0) {
      toast.error('Nominal harus lebih dari 0');
      return;
    }

    try {
      await createManualLedgerEntry.mutateAsync({
        account_id: selectedAccountId,
        entry_type: ledgerEntryType,
        amount_rp: amount,
        notes: ledgerNote || undefined,
      });

      setLedgerAmount('');
      setLedgerNote('');
      await ledgerQuery.refetch();
      await accountsQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambah entri ledger manual');
    }
  };

  if (isLoadingAccounts && accounts.length === 0) {
    return <LoadingSpinner text="Memuat rekening..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Rekening"
        description="Kelola rekening kas/bank dan lihat ledger transaksi per rekening."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Rekening</CardTitle>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Rekening
          </Button>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Belum ada rekening"
              description="Tambah rekening pertama untuk memulai pencatatan ledger."
              action={{ label: 'Tambah Rekening', onClick: handleOpenCreate }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Rekening</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nomor Rekening</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const accountType = account.account_channel || '-';
                  const accountName = account.account_name || '-';
                  const accountNumber = account.account_number || '-';
                  const isSelected = selectedAccountId === account.id;

                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{accountName}</TableCell>
                      <TableCell className="capitalize">{accountType}</TableCell>
                      <TableCell>{accountNumber}</TableCell>
                      <TableCell className="text-right">
                        {isSelected ? formatCurrency(latestBalance) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAccountId(account.id)}
                          >
                            Ledger
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleOpenEdit(account)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(account)}>
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Detail Ledger</CardTitle>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Pilih rekening" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name || account.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-0">
          {!selectedAccount ? (
            <p className="text-sm text-muted-foreground">Pilih rekening untuk melihat ledger.</p>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Input Manual Ledger</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Select
                      value={ledgerEntryType}
                      onValueChange={(value) => setLedgerEntryType(value as AccountLedgerEntryType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipe Mutasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">IN</SelectItem>
                        <SelectItem value="OUT">OUT</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={1}
                      placeholder="Nominal (Rp)"
                      value={ledgerAmount}
                      onChange={(event) => setLedgerAmount(event.target.value)}
                    />

                    <Button
                      onClick={handleCreateManualEntry}
                      disabled={createManualLedgerEntry.isPending || !ledgerAmount}
                    >
                      {createManualLedgerEntry.isPending ? 'Menyimpan...' : 'Tambah Entri'}
                    </Button>
                  </div>
                  <Input
                    placeholder="Catatan (opsional)"
                    value={ledgerNote}
                    onChange={(event) => setLedgerNote(event.target.value)}
                  />
                </CardContent>
              </Card>

              <AccountLedgerTable entries={filteredLedger} isLoading={isLoadingLedger} />
            </div>
          )}
        </CardContent>
      </Card>

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingAccount(null);
          }
        }}
        mode={editingAccount ? 'edit' : 'create'}
        initialData={editingAccount}
        onSubmit={handleSubmit}
        isSubmitting={createAccount.isPending || updateAccount.isPending}
      />
    </div>
  );
}

export default AccountsManagement;
