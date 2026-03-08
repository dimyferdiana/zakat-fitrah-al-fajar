import { Fragment, useCallback, useId, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ChevronsUpDown, Loader2, Plus, Receipt, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { offlineStore } from '@/lib/offlineStore';
import { submitBulk } from '@/hooks/useBulkPembayaran';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BulkTandaTerima } from './BulkTandaTerima';
import {
  BULK_BERAS_KG_PER_LITER,
  type BulkPaymentMedium,
  type BulkResult,
  type BulkRow,
  type BulkTransactionType,
  type BulkUnit,
} from '@/types/bulk';
import {
  allowedMediaForType,
  unitForMedium,
  validateBulkRow,
} from '@/lib/bulkValidation';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

type FieldErrorKey = 'muzakkiId' | 'transactionType' | 'paymentMedium' | 'amount';

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
  catatan: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
}

interface BulkBerasRecord {
  muzakki_id: string | null;
  kategori: string;
  jumlah_beras_kg: number;
  catatan: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
}

interface BulkPemasukanFormProps {
  tahunZakatId: string;
  rowLimit?: number;
}

const transactionTypeOptions: Array<{ value: BulkTransactionType; label: string }> = [
  { value: 'zakat_fitrah', label: 'Zakat Fitrah' },
  { value: 'maal', label: 'Maal' },
  { value: 'infak', label: 'Infak' },
  { value: 'fidyah', label: 'Fidyah' },
];

const paymentMediumOptions: Array<{ value: BulkPaymentMedium; label: string }> = [
  { value: 'uang', label: 'Uang (Rp)' },
  { value: 'beras_kg', label: 'Beras (kg)' },
  { value: 'beras_liter', label: 'Beras (liter)' },
];

function makeEmptyRow(muzakkiId: string | null, muzakkiNama: string): BulkRow {
  return {
    muzakkiId,
    muzakkiNama,
    transactionType: null,
    paymentMedium: null,
    amount: null,
    unit: null,
    notes: '',
  };
}

function parsePosFloat(raw: string): number | null {
  const v = parseFloat(raw.replace(',', '.'));
  if (Number.isNaN(v) || v < 0) return null;
  return v > 0 ? v : null;
}

function generateReceiptNo(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BULK-${date}-${rand}`;
}

function getUnitForMediumNullable(medium: BulkPaymentMedium | null): BulkUnit | null {
  if (!medium) return null;
  return unitForMedium(medium);
}

function unitLabel(unit: BulkUnit | null): string {
  if (unit === 'rp') return 'Rp';
  if (unit === 'kg') return 'kg';
  if (unit === 'liter') return 'liter';
  return '-';
}

function mapUangRecordToRow(record: BulkUangRecord): Omit<BulkRow, 'muzakkiId' | 'muzakkiNama' | 'notes'> | null {
  const amount = Number(record.jumlah_uang_rp ?? 0);
  if (amount <= 0) return null;

  if (record.kategori === 'zakat_fitrah_uang') {
    return { transactionType: 'zakat_fitrah', paymentMedium: 'uang', amount, unit: 'rp' };
  }
  if (record.kategori === 'maal_penghasilan_uang') {
    return { transactionType: 'maal', paymentMedium: 'uang', amount, unit: 'rp' };
  }
  if (record.kategori === 'infak_sedekah_uang') {
    return { transactionType: 'infak', paymentMedium: 'uang', amount, unit: 'rp' };
  }
  if (record.kategori === 'fidyah_uang') {
    return { transactionType: 'fidyah', paymentMedium: 'uang', amount, unit: 'rp' };
  }

  return null;
}

function mapBerasRecordToRow(record: BulkBerasRecord): Omit<BulkRow, 'muzakkiId' | 'muzakkiNama' | 'notes'> | null {
  const jumlahKg = Number(record.jumlah_beras_kg ?? 0);
  if (jumlahKg <= 0) return null;

  const isLiter = record.catatan?.includes('media:beras_liter') ?? false;
  const amount = isLiter
    ? Number((jumlahKg / BULK_BERAS_KG_PER_LITER).toFixed(2))
    : jumlahKg;

  if (record.kategori === 'zakat_fitrah_beras') {
    return {
      transactionType: 'zakat_fitrah',
      paymentMedium: isLiter ? 'beras_liter' : 'beras_kg',
      amount,
      unit: isLiter ? 'liter' : 'kg',
    };
  }

  // Legacy compatibility: historical rows may contain maal_beras/fidyah_beras.
  if (record.kategori === 'maal_beras') {
    return {
      transactionType: 'maal',
      paymentMedium: isLiter ? 'beras_liter' : 'beras_kg',
      amount,
      unit: isLiter ? 'liter' : 'kg',
    };
  }

  if (record.kategori === 'fidyah_beras') {
    return {
      transactionType: 'fidyah',
      paymentMedium: isLiter ? 'beras_liter' : 'beras_kg',
      amount,
      unit: isLiter ? 'liter' : 'kg',
    };
  }

  if (record.kategori === 'infak_sedekah_beras') {
    return {
      transactionType: 'infak',
      paymentMedium: isLiter ? 'beras_liter' : 'beras_kg',
      amount,
      unit: isLiter ? 'liter' : 'kg',
    };
  }

  return null;
}

function extractNotes(catatan: string | null, receiptNo: string): string {
  if (!catatan) return '';

  const prefix = `Bulk #${receiptNo}`;
  let notes = catatan.startsWith(prefix) ? catatan.slice(prefix.length).trim() : catatan.trim();

  if (notes.startsWith('|')) notes = notes.slice(1).trim();
  if (notes.startsWith('media:beras_liter')) {
    notes = notes.slice('media:beras_liter'.length).trim();
    if (notes.startsWith('|')) notes = notes.slice(1).trim();
  }

  return notes;
}

export function BulkPemasukanForm({ tahunZakatId, rowLimit = 10 }: BulkPemasukanFormProps) {
  const formId = useId();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BulkResult | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [comboOpen, setComboOpen] = useState(false);
  const [muzakkiSearch, setMuzakkiSearch] = useState('');

  const [newMuzakkiOpen, setNewMuzakkiOpen] = useState(false);
  const [newMuzakkiNama, setNewMuzakkiNama] = useState('');
  const [isCreatingMuzakki, setIsCreatingMuzakki] = useState(false);
  const [reprintLoadingReceiptNo, setReprintLoadingReceiptNo] = useState<string | null>(null);

  const { data: muzakkiOptions = [] } = useQuery<MuzakkiOption[]>({
    queryKey: ['muzakki-options'],
    queryFn: async () => {
      if (OFFLINE_MODE) {
        return offlineStore
          .getMuzakkiAll()
          .map((item) => ({ id: item.id, nama_kk: item.nama_kk }))
          .sort((a, b) => a.nama_kk.localeCompare(b.nama_kk));
      }

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
    (m) => !alreadyAddedIds.has(m.id) && m.nama_kk.toLowerCase().includes(muzakkiSearch.toLowerCase())
  );

  const errKey = (idx: number, field: FieldErrorKey) => `${idx}.${field}`;

  const clearRowErrors = useCallback((idx: number) => {
    setFieldErrors((prev) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!key.startsWith(`${idx}.`)) next[key] = value;
      }
      return next;
    });
  }, []);

  const addRow = useCallback((muzakkiId: string, muzakkiNama: string) => {
    setRows((prev) => [...prev, makeEmptyRow(muzakkiId, muzakkiNama)]);
    setComboOpen(false);
    setMuzakkiSearch('');
  }, []);

  const removeRow = useCallback((idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setFieldErrors((prev) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        const [rawIndex, field] = key.split('.');
        const currentIndex = Number(rawIndex);
        if (currentIndex === idx) continue;
        if (currentIndex > idx) next[`${currentIndex - 1}.${field}`] = value;
        else next[key] = value;
      }
      return next;
    });
  }, []);

  const updateRow = useCallback((idx: number, patch: Partial<BulkRow>) => {
    setRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    clearRowErrors(idx);
  }, [clearRowErrors]);

  const createAndAddMuzakki = async () => {
    const nama = newMuzakkiNama.trim();
    if (!nama) return;

    setIsCreatingMuzakki(true);
    try {
      if (OFFLINE_MODE) {
        const created = offlineStore.addMuzakki({ nama_kk: nama, alamat: '', no_telp: null });
        addRow(created.id, nama);
        queryClient.invalidateQueries({ queryKey: ['muzakki-options'] });
        setNewMuzakkiNama('');
        setNewMuzakkiOpen(false);
        toast.success(`Muzakki "${nama}" berhasil ditambahkan`);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('muzakki').insert as any)({
        nama_kk: nama,
        alamat: '',
        no_telp: null,
      })
        .select('id')
        .single();

      if (error) throw error;

      addRow(data.id as string, nama);
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
          .select('muzakki_id, kategori, jumlah_uang_rp, catatan, muzakki:muzakki_id(id, nama_kk)')
          .eq('tahun_zakat_id', tahunZakatId)
          .ilike('catatan', `${catatanRef}%`),
        supabase
          .from('pemasukan_beras')
          .select('muzakki_id, kategori, jumlah_beras_kg, catatan, muzakki:muzakki_id(id, nama_kk)')
          .eq('tahun_zakat_id', tahunZakatId)
          .ilike('catatan', `${catatanRef}%`),
      ]);

      if (uangRes.error) throw uangRes.error;
      if (berasRes.error) throw berasRes.error;

      const rebuiltRows: BulkRow[] = [];

      for (const record of (uangRes.data ?? []) as BulkUangRecord[]) {
        const mapped = mapUangRecordToRow(record);
        if (!mapped) continue;
        rebuiltRows.push({
          muzakkiId: record.muzakki_id,
          muzakkiNama: record.muzakki?.nama_kk ?? 'Tanpa Nama',
          transactionType: mapped.transactionType,
          paymentMedium: mapped.paymentMedium,
          amount: mapped.amount,
          unit: mapped.unit,
          notes: extractNotes(record.catatan, receiptNo),
        });
      }

      for (const record of (berasRes.data ?? []) as BulkBerasRecord[]) {
        const mapped = mapBerasRecordToRow(record);
        if (!mapped) continue;
        rebuiltRows.push({
          muzakkiId: record.muzakki_id,
          muzakkiNama: record.muzakki?.nama_kk ?? 'Tanpa Nama',
          transactionType: mapped.transactionType,
          paymentMedium: mapped.paymentMedium,
          amount: mapped.amount,
          unit: mapped.unit,
          notes: extractNotes(record.catatan, receiptNo),
        });
      }

      if (rebuiltRows.length === 0) {
        toast.error('Data transaksi untuk receipt ini tidak ditemukan');
        return;
      }

      setResult({
        success: true,
        receiptNo,
        rows: rebuiltRows,
        rowOutcomes: rebuiltRows.map((row, index) => ({
          rowIndex: index,
          muzakkiNama: row.muzakkiNama,
          success: true,
          message: `Baris #${index + 1} dimuat dari riwayat.`,
        })),
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

  function validate(): boolean {
    const errors: Record<string, string> = {};

    rows.forEach((row, idx) => {
      if (!row.muzakkiId) errors[errKey(idx, 'muzakkiId')] = 'Muzakki belum valid.';
      if (!row.transactionType) errors[errKey(idx, 'transactionType')] = 'Pilih tipe transaksi.';
      if (!row.paymentMedium) errors[errKey(idx, 'paymentMedium')] = 'Pilih media pembayaran.';
      if (row.amount === null || row.amount <= 0) errors[errKey(idx, 'amount')] = 'Nilai harus lebih dari 0.';

      if (row.transactionType && row.paymentMedium && row.amount !== null && row.unit) {
        const businessRule = validateBulkRow({ ...row, muzakkiId: row.muzakkiId ?? '' });
        if (!businessRule.ok) {
          errors[errKey(idx, 'paymentMedium')] = businessRule.message;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async () => {
    if (rows.length === 0) {
      toast.error('Tambahkan minimal satu transaksi');
      return;
    }

    if (!validate()) {
      toast.error('Ada baris yang belum valid. Periksa error di tabel.');
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
        toast.success(`Berhasil menyimpan ${rows.length} transaksi — No. ${receiptNo}`);
        setReceiptOpen(true);
        setRows([]);
        setFieldErrors({});
      } else {
        toast.warning(`Tersimpan dengan ${bulkResult.errors.length} error — cek rekap per baris`);
        setReceiptOpen(true);
      }
    } catch (err) {
      toast.error('Gagal submit: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = rows.reduce(
    (acc, row) => {
      if (!row.amount || !row.paymentMedium) return acc;
      if (row.paymentMedium === 'uang') acc.totalUang += row.amount;
      if (row.paymentMedium === 'beras_kg') acc.totalBerasKg += row.amount;
      if (row.paymentMedium === 'beras_liter') acc.totalBerasLiter += row.amount;
      return acc;
    },
    { totalUang: 0, totalBerasKg: 0, totalBerasLiter: 0 }
  );

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(v);

  const atLimit = rows.length >= rowLimit;

  return (
    <div className="space-y-4" id={formId}>
      <div className="block sm:hidden rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        Mode bulk lebih nyaman digunakan pada layar yang lebih besar.
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={atLimit} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Baris Transaksi
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
                <p className="p-3 text-xs text-muted-foreground text-center">Muzakki tidak ditemukan</p>
              ) : (
                filteredMuzakki.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                    onClick={() => addRow(m.id, m.nama_kk)}
                  >
                    {m.nama_kk}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={newMuzakkiOpen} onOpenChange={setNewMuzakkiOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={atLimit} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Muzakki Baru
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-3" align="start">
            <p className="text-xs font-medium">Tambah Muzakki Baru</p>
            <div className="space-y-1">
              <Label htmlFor={`${formId}-new-nama`} className="text-xs">Nama KK</Label>
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
              <Button size="sm" onClick={createAndAddMuzakki} disabled={!newMuzakkiNama.trim() || isCreatingMuzakki}>
                {isCreatingMuzakki && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Simpan
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {atLimit && <span className="text-xs text-muted-foreground">Batas {rowLimit} baris per resi tercapai</span>}
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-2 py-2 text-left font-medium w-8">No</th>
                <th className="px-2 py-2 text-left font-medium min-w-[180px]">Nama Muzakki</th>
                <th className="px-2 py-2 text-left font-medium min-w-[160px]">Tipe</th>
                <th className="px-2 py-2 text-left font-medium min-w-[160px]">Media</th>
                <th className="px-2 py-2 text-right font-medium min-w-[130px]">Nilai</th>
                <th className="px-2 py-2 text-left font-medium min-w-[90px]">Satuan</th>
                <th className="px-2 py-2 text-left font-medium min-w-[170px]">Catatan</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const rowErrorMessages = Object.entries(fieldErrors)
                  .filter(([key]) => key.startsWith(`${idx}.`))
                  .map(([, value]) => value);
                const allowedMedia = row.transactionType
                  ? allowedMediaForType(row.transactionType)
                  : [];

                return (
                  <Fragment key={`${row.muzakkiId ?? row.muzakkiNama}-${idx}`}>
                    <tr className={`border-b last:border-0 ${rowErrorMessages.length > 0 ? 'bg-red-50/40' : ''}`}>
                      <td className="px-2 py-1 text-muted-foreground">{idx + 1}</td>
                      <td className="px-2 py-1 font-medium">{row.muzakkiNama}</td>
                      <td className="px-2 py-1">
                        <Select
                          value={row.transactionType ?? undefined}
                          onValueChange={(value) => {
                            const transactionType = value as BulkTransactionType;
                            const nextAllowed = allowedMediaForType(transactionType);
                            const isCurrentMediaValid = row.paymentMedium !== null && nextAllowed.includes(row.paymentMedium);
                            const nextMedium = isCurrentMediaValid ? row.paymentMedium : null;
                            updateRow(idx, {
                              transactionType,
                              paymentMedium: nextMedium,
                              unit: getUnitForMediumNullable(nextMedium),
                            });
                          }}
                        >
                          <SelectTrigger className={`h-8 ${fieldErrors[errKey(idx, 'transactionType')] ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            {transactionTypeOptions.map((item) => (
                              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1">
                        <Select
                          value={row.paymentMedium ?? undefined}
                          onValueChange={(value) => {
                            const paymentMedium = value as BulkPaymentMedium;
                            updateRow(idx, { paymentMedium, unit: getUnitForMediumNullable(paymentMedium) });
                          }}
                        >
                          <SelectTrigger className={`h-8 ${fieldErrors[errKey(idx, 'paymentMedium')] ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Pilih media" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMediumOptions.map((item) => (
                              <SelectItem
                                key={item.value}
                                value={item.value}
                                disabled={row.transactionType !== null && !allowedMedia.includes(item.value)}
                              >
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          min="0"
                          step={row.paymentMedium === 'uang' ? '1000' : '0.01'}
                          className={`h-8 text-right text-xs w-full font-mono ${fieldErrors[errKey(idx, 'amount')] ? 'border-red-500' : ''}`}
                          placeholder="0"
                          value={row.amount ?? ''}
                          onChange={(e) => updateRow(idx, { amount: e.target.value === '' ? null : parsePosFloat(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1"><Badge variant="outline">{unitLabel(row.unit)}</Badge></td>
                      <td className="px-2 py-1">
                        <Input
                          className="h-8 text-xs"
                          maxLength={255}
                          placeholder="Catatan (opsional)"
                          value={row.notes}
                          onChange={(e) => updateRow(idx, { notes: e.target.value })}
                        />
                      </td>
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
                    {rowErrorMessages.length > 0 && (
                      <tr className="bg-red-50">
                        <td />
                        <td colSpan={7} className="px-2 pb-1 text-[10px] text-red-600">
                          {Array.from(new Set(rowErrorMessages)).join(' ')}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && (
        <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          Belum ada transaksi. Klik "Tambah Baris Transaksi" untuk mulai.
        </div>
      )}

      {rows.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Jumlah Baris: </span>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Total Uang: </span>
              <span className="font-semibold">{formatRp(totals.totalUang)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Beras (kg): </span>
              <span className="font-semibold">{totals.totalBerasKg.toFixed(2)} kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Beras (liter): </span>
              <span className="font-semibold">{totals.totalBerasLiter.toFixed(2)} liter</span>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {result && (
          <Button variant="outline" onClick={() => setReceiptOpen(true)} className="gap-2">
            <Receipt className="h-4 w-4" />
            Lihat Tanda Terima ({result.receiptNo})
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting || rows.length === 0} className="min-w-[140px]">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Cetak Resi'}
        </Button>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <p className="text-sm font-medium">Riwayat Bulk Receipt</p>
        {historyLoading && <p className="text-xs text-muted-foreground">Memuat riwayat...</p>}
        {!historyLoading && bulkHistory.length === 0 && (
          <p className="text-xs text-muted-foreground">Belum ada riwayat bulk untuk tahun ini.</p>
        )}
        {!historyLoading && bulkHistory.length > 0 && (
          <div className="space-y-2">
            {bulkHistory.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2">
                <div className="text-xs">
                  <p className="font-medium">{item.receipt_no}</p>
                  <p className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('id-ID')} • {item.row_count} baris
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReprintFromHistory(item.receipt_no)}
                  disabled={reprintLoadingReceiptNo === item.receipt_no}
                >
                  {reprintLoadingReceiptNo === item.receipt_no && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Reprint
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {result && result.rowOutcomes.length > 0 && (
        <div className="rounded-md border p-3 text-xs space-y-2">
          <p className="font-semibold">Rekap Hasil Per Baris</p>
          <div className="space-y-1">
            {result.rowOutcomes.map((item) => (
              <div
                key={`${item.rowIndex}-${item.message}`}
                className={`rounded px-2 py-1 ${item.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
              >
                {item.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && result.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs space-y-1">
          <p className="font-semibold text-red-700">Ringkasan Error:</p>
          {result.errors.map((e, i) => (
            <p key={i} className="text-red-600">{e}</p>
          ))}
        </div>
      )}

      {result && <BulkTandaTerima open={receiptOpen} onOpenChange={setReceiptOpen} result={result} />}
    </div>
  );
}
