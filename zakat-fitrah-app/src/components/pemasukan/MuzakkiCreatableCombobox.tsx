import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, Plus, X, Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MuzakkiOption {
  id: string;
  nama_kk: string;
}

interface MuzakkiCreatableComboboxProps {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}

export function MuzakkiCreatableCombobox({
  value,
  onChange,
  disabled,
}: MuzakkiCreatableComboboxProps) {
  const queryClient = useQueryClient();

  // Popover + search state
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Inline creation state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTelp, setNewTelp] = useState('');
  const [nameError, setNameError] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all muzakki options
  const { data: muzakkiOptions = [], isLoading } = useQuery({
    queryKey: ['muzakki-options'],
    queryFn: async (): Promise<MuzakkiOption[]> => {
      const { data, error } = await supabase
        .from('muzakki')
        .select('id, nama_kk')
        .order('nama_kk', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // The currently selected muzakki object (for display)
  const selectedMuzakki = muzakkiOptions.find((m) => m.id === value);

  // Filtered list based on search text
  const filtered = search.trim()
    ? muzakkiOptions.filter((m) =>
        m.nama_kk.toLowerCase().includes(search.trim().toLowerCase())
      )
    : muzakkiOptions;

  // Whether there's an exact match (to decide whether to show "Tambah baru")
  const hasExactMatch = muzakkiOptions.some(
    (m) => m.nama_kk.toLowerCase() === search.trim().toLowerCase()
  );
  const showAddNew = search.trim().length > 0 && !hasExactMatch;

  // Focus search input when popover opens
  useEffect(() => {
    if (open && !creating) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open, creating]);

  const handleSelect = (muzakkiId: string) => {
    onChange(muzakkiId);
    setOpen(false);
    setSearch('');
    setCreating(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearch('');
  };

  const handleAddNewClick = () => {
    setNewName(search.trim());
    setNewTelp('');
    setNameError('');
    setCreateError('');
    setCreating(true);
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setNameError('');
    setCreateError('');
  };

  const handleSaveAndSelect = async () => {
    if (!newName.trim()) {
      setNameError('Nama muzakki tidak boleh kosong.');
      return;
    }
    setNameError('');
    setCreateError('');
    setIsCreating(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('muzakki').insert as any)({
        nama_kk: newName.trim(),
        alamat: '-',
        no_telp: newTelp.trim() || null,
      })
        .select('id, nama_kk')
        .single();

      if (error) throw error;

      // Invalidate so the list refreshes in future opens
      await queryClient.invalidateQueries({ queryKey: ['muzakki-options'] });

      // Auto-select the newly created muzakki
      onChange(data.id);
      setOpen(false);
      setSearch('');
      setCreating(false);
      setNewName('');
      setNewTelp('');
    } catch {
      setCreateError('Gagal menyimpan muzakki baru. Coba lagi.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) {
        setSearch('');
        setCreating(false);
        setNameError('');
        setCreateError('');
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {isLoading
              ? 'Memuat...'
              : selectedMuzakki
              ? selectedMuzakki.nama_kk
              : 'Pilih atau ketik nama muzakki...'}
          </span>
          <span className="flex items-center gap-1 ml-2 shrink-0">
            {value && !disabled && (
              <X
                className="h-3.5 w-3.5 opacity-60 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
      >
        {!creating ? (
          <div className="flex flex-col">
            {/* Search input */}
            <div className="p-2 border-b">
              <Input
                ref={searchInputRef}
                placeholder="Cari nama muzakki..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* List */}
            <div className="max-h-52 overflow-y-auto py-1">
              {/* "Tambah baru" option */}
              {showAddNew && (
                <button
                  type="button"
                  onClick={handleAddNewClick}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Tambah baru: &quot;{search.trim()}&quot;</span>
                </button>
              )}

              {/* Separator when both "Tambah baru" and existing items are shown */}
              {showAddNew && filtered.length > 0 && (
                <Separator className="my-1" />
              )}

              {/* "clear" option when something is selected */}
              {value && !search && (
                <>
                  <button
                    type="button"
                    onClick={() => { onChange(undefined); setOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-3.5 w-3.5 shrink-0" />
                    Tanpa muzakki
                  </button>
                  <Separator className="my-1" />
                </>
              )}

              {/* Existing muzakki list */}
              {filtered.length === 0 && !showAddNew && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {search.trim() ? 'Tidak ditemukan.' : 'Belum ada muzakki.'}
                </p>
              )}
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelect(m.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    m.id === value && 'bg-accent/50 font-medium'
                  )}
                >
                  {m.nama_kk}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Inline creation mini-form ── */
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold">Daftarkan Muzakki Baru</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-muzakki-name" className="text-xs">
                Nama Muzakki <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-muzakki-name"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
                placeholder="Nama Kepala Keluarga"
                className="h-8 text-sm"
                autoFocus
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-muzakki-telp" className="text-xs">
                No. Telp <span className="text-muted-foreground">(Opsional)</span>
              </Label>
              <Input
                id="new-muzakki-telp"
                value={newTelp}
                onChange={(e) => setNewTelp(e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="h-8 text-sm"
              />
            </div>

            {createError && (
              <p className="text-xs text-destructive">{createError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAndSelect}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan & Pilih'
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCancelCreate}
                disabled={isCreating}
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
