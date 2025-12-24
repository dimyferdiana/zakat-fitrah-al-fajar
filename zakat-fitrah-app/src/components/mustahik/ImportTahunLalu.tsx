import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Users } from 'lucide-react';
import type { Mustahik } from '@/hooks/useMustahik';

interface ImportTahunLaluProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousYearData: Mustahik[];
  isLoading: boolean;
  onImport: (selectedIds: string[]) => void;
  isImporting: boolean;
}

export function ImportTahunLalu({
  open,
  onOpenChange,
  previousYearData,
  isLoading,
  onImport,
  isImporting,
}: ImportTahunLaluProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(previousYearData.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleImport = () => {
    onImport(selectedIds);
    setSelectedIds([]);
    onOpenChange(false);
  };

  const allSelected = previousYearData.length > 0 && selectedIds.length === previousYearData.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Data Mustahik Tahun Lalu
          </DialogTitle>
          <DialogDescription>
            Pilih mustahik yang ingin diimpor ke tahun ini. Data akan ditandai sebagai "Data Lama".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              Pilih Semua ({previousYearData.length} mustahik)
            </label>
            <Badge variant="secondary">{selectedIds.length} dipilih</Badge>
          </div>

          {/* List */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : previousYearData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Tidak ada data mustahik tahun lalu
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {previousYearData.map((mustahik) => (
                  <div
                    key={mustahik.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(mustahik.id)}
                      onCheckedChange={(checked: boolean) =>
                        handleSelectOne(mustahik.id, checked)
                      }
                      id={`mustahik-${mustahik.id}`}
                    />
                    <label
                      htmlFor={`mustahik-${mustahik.id}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{mustahik.nama}</p>
                        <Badge variant="outline" className="text-xs">
                          {mustahik.kategori_mustahik?.nama}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{mustahik.alamat}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{mustahik.jumlah_anggota} anggota</span>
                        {mustahik.no_telp && <span>• {mustahik.no_telp}</span>}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.length === 0 || isImporting}
          >
            {isImporting ? 'Mengimpor...' : `Import ${selectedIds.length} Mustahik`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
