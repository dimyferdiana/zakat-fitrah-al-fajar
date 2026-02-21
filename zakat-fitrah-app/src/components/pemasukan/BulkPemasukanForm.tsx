import { useState, useCallback, useId } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ChevronsUpDown, UserPlus, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { submitBulk } from '@/hooks/useBulkPembayaran';
import { BulkTandaTerima } from './BulkTandaTerima';
import type { BulkRow, BulkResult } from '@/types/bulk';

interface MuzakkiOption {
  id: string;
  nama_kk: string;
}

interface BulkHistoryItem {
  id: string;
  receipt_no: string;
  row_count: number;
  created_at: string;
}

interface BulkUangRecord {
  muzakki_id: string | null;
  kategori: string;
  jumlah_uang_rp: number;
  muzakki?: { id: string; nama_kk: string } | null;
}

interface BulkBerasRecord {
  muzakki_id: string | null;
  kategori: string;
  jumlah_beras_kg: number;
  muzakki?: { id: string; nama_kk: string } | null;
}

interface BulkPemasukanFormProps {
  tahunZakatId: string;
  /** Max rows per submission. Reads from admin settings; default 10. */
  rowLimit?: number;
}

function makeEmptyRow(muzakkiId: string | null, muzakkiNama: string): BulkRow {
  return {
    muzakkiId,
    muzakkiNama,
    zakatFitrahBeras: null,
    zakatFitrahUang: null,
    zakatMaalBeras: null,
    zakatMaalUang: null,
    infakBeras: null,
    infakUang: null,
  };
}

function generateReceiptNo(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BULK-${date}-${rand}`;
}

function parsePosFloat(raw: string): number | null {
  const v = parseFloat(raw.replace(',', '.'));
  if (isNaN(v) || v < 0) return null;
  return v > 0 ? v : null;
}

const NUM_COLS = [
  { key: 'zakatFitrahBeras', label: 'ZF Beras (kg)', short: 'ZF Beras' },
  { key: 'zakatFitrahUang', label: 'ZF Uang (Rp)', short: 'ZF Uang' },
  { key: 'zakatMaalBeras', label: 'ZM Beras (kg)', short: 'ZM Beras' },
  { key: 'zakatMaalUang', label: 'ZM Uang (Rp)', short: 'ZM Uang' },
  { key: 'infakBeras', label: 'Infak Beras (kg)', short: 'Inf Beras' },
  { key: 'infakUang', label: 'Infak Uang (Rp)', short: 'Inf Uang' },
] as const;

type NumColKey = (typeof NUM_COLS)[number]['key'];

export function BulkPemasukanForm({ tahunZakatId, rowLimit = 10 }: BulkPemasukanFormProps) {
  const formId = useId();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [result, setResult] = useState<BulkResult | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Muzakki search combobox state
  const [comboOpen, setComboOpen] = useState(false);
  const [muzakkiSearch, setMuzakkiSearch] = useState('');

  // Inline new muzakki popover state
  const [newMuzakkiOpen, setNewMuzakkiOpen] = useState(false);
  const [newMuzakkiNama, setNewMuzakkiNama] = useState('');
  const [isCreatingMuzakki, setIsCreatingMuzakki] = useState(false);
  const [reprintLoadingReceiptNo, setReprintLoadingReceiptNo] = useState<string | null>(null);

  const { data: muzakkiOptions = [] } = useQuery<MuzakkiOption[]>({
    queryKey: ['muzakki-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('muzakki')
        .select('id, nama_kk')
        .order('nama_kk');
      if (error) throw error;
      return (data ?? []) as MuzakkiOption[];
    },
    staleTime: 30_000,
  });

  const { data: bulkHistory = [], isLoading: historyLoading } = useQuery<BulkHistoryItem[]>({
    queryKey: ['bulk-submission-history', tahunZakatId],
    enabled: Boolean(tahunZakatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_submission_logs')
        .select('id, receipt_no, row_count, created_at')
        .eq('tahun_zakat_id', tahunZakatId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as BulkHistoryItem[];
    },
    staleTime: 10_000,
  });

  const alreadyAddedIds = new Set(rows.map((r) => r.muzakkiId).filter(Boolean));

  const filteredMuzakki = muzakkiOptions.filter(
    (m) =>
      !alreadyAddedIds.has(m.id) &&
      m.nama_kk.toLowerCase().includes(muzakkiSearch.toLowerCase())
  );

  // ── Row mutations ─────────────────────────────────────────────────────────

  const addRow = useCallback((muzakkiId: string, muzakkiNama: string) => {
    setRows((prev) => [...prev, makeEmptyRow(muzakkiId, muzakkiNama)]);
    setComboOpen(false);
    setMuzakkiSearch('');
  }, []);

  const removeRow = useCallback((idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }, []);

  const updateCell = useCallback((idx: number, key: NumColKey, raw: string) => {
    const value = raw === '' ? null : parsePosFloat(raw);
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row))
    );
    // Clear error for this row when user edits
    setRowErrors((prev) => {
      if (!prev[idx]) return prev;
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }, []);

  const createAndAddMuzakki = async () => {
    const nama = newMuzakkiNama.trim();
    if (!nama) return;
    setIsCreatingMuzakki(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('muzakki').insert as any)({
        nama_kk: nama,
        alamat: '',
        no_telp: null,
      })
        .select('id')
        .single();
      if (error) throw error;
      const newId: string = data.id;
      addRow(newId, nama);
      queryClient.invalidateQueries({ queryKey: ['muzakki-options'] });
      setNewMuzakkiNama('');
      setNewMuzakkiOpen(false);
      toast.success(`Muzakki "${nama}" berhasil ditambahkan`);
    } catch (err) {
      toast.error('Gagal membuat muzakki: ' + (err as Error).message);
    } finally {
      setIsCreatingMuzakki(false);
    }
  };

  const handleReprintFromHistory = async (receiptNo: string) => {
    setReprintLoadingReceiptNo(receiptNo);
    try {
      const catatanRef = `Bulk #${receiptNo}`;

      const [uangRes, berasRes] = await Promise.all([
        supabase
          .from('pemasukan_uang')
          .select('muzakki_id, kategori, jumlah_uang_rp, muzakki:muzakki_id(id, nama_kk)')
          .eq('tahun_zakat_id', tahunZakatId)
          .eq('catatan', catatanRef),
        supabase
          .from('pemasukan_beras')
          .select('muzakki_id, kategori, jumlah_beras_kg, muzakki:muzakki_id(id, nama_kk)')
          .eq('tahun_zakat_id', tahunZakatId)
          .eq('catatan', catatanRef),
      ]);

      if (uangRes.error) throw uangRes.error;
      if (berasRes.error) throw berasRes.error;

      const uangRows = (uangRes.data ?? []) as BulkUangRecord[];
      const berasRows = (berasRes.data ?? []) as BulkBerasRecord[];

      const grouped = new Map<string, BulkRow>();

      const ensureRow = (muzakkiId: string | null, muzakkiNama: string): BulkRow => {
        const key = muzakkiId ?? `unknown-${muzakkiNama}`;
        const existing = grouped.get(key);
        if (existing) return existing;
        const created = makeEmptyRow(muzakkiId, muzakkiNama || 'Tanpa Nama');
        grouped.set(key, created);
        return created;
      };

      for (const r of uangRows) {
        const row = ensureRow(r.muzakki_id, r.muzakki?.nama_kk ?? 'Tanpa Nama');
        const nominal = Number(r.jumlah_uang_rp ?? 0);
        if (r.kategori === 'zakat_fitrah_uang') row.zakatFitrahUang = (row.zakatFitrahUang ?? 0) + nominal;
        else if (r.kategori === 'maal_penghasilan_uang') row.zakatMaalUang = (row.zakatMaalUang ?? 0) + nominal;
        else if (r.kategori === 'infak_sedekah_uang' || r.kategori === 'fidyah_uang') {
          row.infakUang = (row.infakUang ?? 0) + nominal;
        }
      }

      for (const r of berasRows) {
        const row = ensureRow(r.muzakki_id, r.muzakki?.nama_kk ?? 'Tanpa Nama');
        const jumlah = Number(r.jumlah_beras_kg ?? 0);
        if (r.kategori === 'zakat_fitrah_beras') row.zakatFitrahBeras = (row.zakatFitrahBeras ?? 0) + jumlah;
        else if (r.kategori === 'maal_beras') row.zakatMaalBeras = (row.zakatMaalBeras ?? 0) + jumlah;
        else if (r.kategori === 'infak_sedekah_beras' || r.kategori === 'fidyah_beras') {
          row.infakBeras = (row.infakBeras ?? 0) + jumlah;
        }
      }

      const rebuiltRows = Array.from(grouped.values());
      if (rebuiltRows.length === 0) {
        toast.error('Data transaksi untuk receipt ini tidak ditemukan');
        return;
      }

      setResult({
        success: true,
        receiptNo,
        rows: rebuiltRows,
        errors: [],
      });
      setReceiptOpen(true);
      toast.success(`Receipt ${receiptNo} berhasil dibuka kembali`);
    } catch (err) {
      toast.error('Gagal membuka receipt: ' + (err as Error).message);
    } finally {
      setReprintLoadingReceiptNo(null);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: Record<number, string> = {};
    rows.forEach((row, idx) => {
      const vals = NUM_COLS.map((c) => row[c.key]);
      const allEmpty = vals.every((v) => v === null || v === 0);
      if (allEmpty) {
        errors[idx] = 'Minimal satu kolom harus diisi';
      }
    });
    setRowErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (rows.length === 0) {
      toast.error('Tambahkan minimal satu muzakki');
      return;
    }
    if (!validate()) {
      toast.error('Ada baris yang belum diisi — silakan periksa kembali');
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      toast.error('Sesi tidak valid, silakan login ulang');
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNo = generateReceiptNo();
      const bulkResult = await submitBulk(rows, {
        operatorId: userId,
        tahunZakatId,
        receiptNo,
        rowLimit,
      });

      setResult(bulkResult);

      if (bulkResult.success) {
        toast.success(`Berhasil menyimpan ${rows.length} muzakki — No. ${receiptNo}`);
        setReceiptOpen(true);
        setRows([]);
        setRowErrors({});
      } else {
        toast.warning(
          `Tersimpan dengan ${bulkResult.errors.length} error — cek detail di bawah`
        );
        setReceiptOpen(true);
      }
    } catch (err) {
      toast.error('Gagal submit: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Summary calculations ──────────────────────────────────────────────────

  const totalUang = rows.reduce(
    (sum, r) =>
      sum +
      (r.zakatFitrahUang ?? 0) +
      (r.zakatMaalUang ?? 0) +
      (r.infakUang ?? 0),
    0
  );
  const totalBeras = rows.reduce(
    (sum, r) =>
      sum +
      (r.zakatFitrahBeras ?? 0) +
      (r.zakatMaalBeras ?? 0) +
      (r.infakBeras ?? 0),
    0
  );

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(v);

  const atLimit = rows.length >= rowLimit;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4" id={formId}>
      {/* Responsive notice for small screens */}
      <div className="block sm:hidden rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        Mode bulk lebih nyaman digunakan pada layar yang lebih besar.
      </div>

      {/* Toolbar: muzakki search + add new */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Existing muzakki combobox */}
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={atLimit}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Muzakki
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Cari nama muzakki..."
                value={muzakkiSearch}
                onChange={(e) => setMuzakkiSearch(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filteredMuzakki.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground text-center">
                  Muzakki tidak ditemukan
                </p>
              ) : (
                filteredMuzakki.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                    onClick={() => { addRow(m.id, m.nama_kk); }}
                  >
                    {m.nama_kk}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Create new muzakki inline */}
        <Popover open={newMuzakkiOpen} onOpenChange={setNewMuzakkiOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={atLimit}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Muzakki Baru
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-3" align="start">
            <p className="text-xs font-medium">Tambah Muzakki Baru</p>
            <div className="space-y-1">
              <Label htmlFor={`${formId}-new-nama`} className="text-xs">
                Nama KK
              </Label>
              <Input
                id={`${formId}-new-nama`}
                placeholder="Masukkan nama..."
                value={newMuzakkiNama}
                onChange={(e) => setNewMuzakkiNama(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createAndAddMuzakki();
                }}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewMuzakkiOpen(false);
                  setNewMuzakkiNama('');
                }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={createAndAddMuzakki}
                disabled={!newMuzakkiNama.trim() || isCreatingMuzakki}
              >
                {isCreatingMuzakki && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Simpan
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {atLimit && (
          <span className="text-xs text-muted-foreground">
            Batas {rowLimit} muzakki per resi tercapai
          </span>
        )}
      </div>

      {/* Spreadsheet table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-2 py-2 text-left font-medium w-8">No</th>
                <th className="px-2 py-2 text-left font-medium w-40">Nama Muzakki</th>
                {NUM_COLS.map((col) => (
                  <th key={col.key} className="px-2 py-2 text-right font-medium min-w-[90px]">
                    {col.short}
                  </th>
                ))}
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <>
                  <tr
                    key={`${row.muzakkiId ?? row.muzakkiNama}-${idx}`}
                    className={`border-b last:border-0 ${rowErrors[idx] ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-2 py-1 text-muted-foreground">{idx + 1}</td>
                    <td className="px-2 py-1 font-medium">{row.muzakkiNama}</td>
                    {NUM_COLS.map((col) => (
                      <td key={col.key} className="px-1 py-1">
                        <Input
                          type="number"
                          min="0"
                          step={col.key.endsWith('Beras') ? '0.01' : '1000'}
                          className="h-7 text-right text-xs w-full font-mono"
                          placeholder="—"
                          value={row[col.key] ?? ''}
                          onChange={(e) => updateCell(idx, col.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        onClick={() => removeRow(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                  {rowErrors[idx] && (
                    <tr key={`err-${idx}`} className="bg-red-50">
                      <td />
                      <td colSpan={NUM_COLS.length + 2} className="px-2 pb-1 text-[10px] text-red-600">
                        {rowErrors[idx]}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && (
        <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          Belum ada muzakki — klik "Tambah Muzakki" untuk mulai
        </div>
      )}

      {/* Summary bar */}
      {rows.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Jumlah Muzakki: </span>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Total Uang: </span>
              <span className="font-semibold">{formatRp(totalUang)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Beras: </span>
              <span className="font-semibold">{totalBeras.toFixed(2)} kg</span>
            </div>
          </div>
        </>
      )}

      {/* Submit + re-open receipt */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {result && (
          <Button
            variant="outline"
            onClick={() => setReceiptOpen(true)}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Lihat Tanda Terima ({result.receiptNo})
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rows.length === 0}
          className="min-w-[140px]"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Cetak Resi'}
        </Button>
      </div>

      {/* Bulk receipt history */}
      <div className="rounded-md border p-3 space-y-2">
        <p className="text-sm font-medium">Riwayat Bulk Receipt</p>
        {historyLoading && (
          <p className="text-xs text-muted-foreground">Memuat riwayat...</p>
        )}
        {!historyLoading && bulkHistory.length === 0 && (
          <p className="text-xs text-muted-foreground">Belum ada riwayat bulk untuk tahun ini.</p>
        )}
        {!historyLoading && bulkHistory.length > 0 && (
          <div className="space-y-2">
            {bulkHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
              >
                <div className="text-xs">
                  <p className="font-medium">{item.receipt_no}</p>
                  <p className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('id-ID')} • {item.row_count} muzakki
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReprintFromHistory(item.receipt_no)}
                  disabled={reprintLoadingReceiptNo === item.receipt_no}
                >
                  {reprintLoadingReceiptNo === item.receipt_no && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Reprint
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission errors */}
      {result && result.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs space-y-1">
          <p className="font-semibold text-red-700">Beberapa baris gagal disimpan:</p>
          {result.errors.map((e, i) => (
            <p key={i} className="text-red-600">{e}</p>
          ))}
        </div>
      )}

      {/* Receipt dialog */}
      {result && (
        <BulkTandaTerima
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          result={result}
        />
      )}
    </div>
  );
}
