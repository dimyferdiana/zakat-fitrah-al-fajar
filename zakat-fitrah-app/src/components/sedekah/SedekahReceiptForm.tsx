import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSearchDonor, useUpsertDonor, type DonorProfile } from '@/hooks/useDonor';
import { useUpdateSedekahReceipt, type SedekahReceiptRow } from '@/hooks/useSedekahReceipts';
import { getTerbilangText, formatRupiah } from '@/lib/terbilang';
import { supabase } from '@/lib/supabase';
import { downloadSedekahReceipt, normalizeCategory } from '@/utils/sedekahReceipt';
import { toast } from 'sonner';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const SEDEKAH_CATEGORIES = [
  'Zakat',
  'Infak',
  'Sahabat Quran',
  'Bank Infak',
  'Santunan Yatim & Dhuafa',
  'Lainnya',
];

const sedekahReceiptFormSchema = z.object({
  receiptNumber: z.string().optional(),
  searchQuery: z.string().optional(),
  donorId: z.string().optional(),
  donorName: z.string().min(1, 'Nama donor diperlukan'),
  donorAddress: z.string().min(1, 'Alamat diperlukan'),
  donorPhone: z.string().optional(),
  category: z.string().min(1, 'Kategori pembayaran diperlukan'),
  categoryCustom: z.string().optional(),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  date: z.string(),
  notes: z.string().optional(),
});

type SedekahReceiptFormValues = z.infer<typeof sedekahReceiptFormSchema>;

/** Returns the display category + custom value from a raw category string */
function parseCategoryForDisplay(category: string): {
  displayCategory: string;
  customValue: string;
} {
  if (SEDEKAH_CATEGORIES.includes(category)) {
    return { displayCategory: category, customValue: '' };
  }
  return { displayCategory: 'Lainnya', customValue: category };
}

interface SedekahReceiptFormProps {
  /** When provided the form runs in edit mode */
  editData?: SedekahReceiptRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SedekahReceiptForm({ editData, onSuccess, onCancel }: SedekahReceiptFormProps) {
  const isEditMode = Boolean(editData);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<DonorProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: searchResults = [], isLoading: isSearching } = useSearchDonor({
    query: searchQuery,
  });

  const upsertDonor = useUpsertDonor();
  const updateReceipt = useUpdateSedekahReceipt();

  const form = useForm<SedekahReceiptFormValues>({
    resolver: zodResolver(sedekahReceiptFormSchema),
    defaultValues: {
      receiptNumber: '',
      donorName: '',
      donorAddress: '',
      donorPhone: '',
      category: '',
      categoryCustom: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  // ── Populate form when editData changes ──────────────────────
  useEffect(() => {
    if (!editData) return;

    const { displayCategory, customValue } = parseCategoryForDisplay(editData.category);

    form.reset({
      receiptNumber: editData.receipt_number,
      donorId: editData.donor_id ?? undefined,
      donorName: editData.donor_name,
      donorAddress: editData.donor_address,
      donorPhone: editData.donor_phone ?? '',
      category: displayCategory,
      categoryCustom: customValue,
      amount: editData.amount,
      date: editData.tanggal,
      notes: editData.notes ?? '',
    });
  }, [editData, form]);

  const amount = form.watch('amount') || 0;
  const category = form.watch('category');
  const categoryCustom = form.watch('categoryCustom');
  const terbilangText = amount > 0 ? getTerbilangText(amount) : '';
  const formattedAmount = amount > 0 ? formatRupiah(amount) : 'Rp 0';

  const getReceiptNumberWithRetry = async (
    categoryKey: string,
    mode: 'peek' | 'next',
    attempts = 2,
  ) => {
    const rpc = supabase.rpc as unknown as (
      fn: 'peek_bukti_sedekah_number' | 'next_bukti_sedekah_number',
      args: { p_category_key: string },
    ) => Promise<{ data: string | null; error: PostgrestError | null }>;

    let lastError: Error | null = null;
    for (let i = 0; i < attempts; i += 1) {
      const rpcFn = mode === 'peek'
        ? 'peek_bukti_sedekah_number'
        : 'next_bukti_sedekah_number';
      const { data, error } = await rpc.call(supabase, rpcFn, { p_category_key: categoryKey });
      if (!error && data) {
        return data;
      }
      lastError = error as Error | null;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw lastError || new Error('Gagal membuat nomor bukti otomatis');
  };

  useEffect(() => {
    // Skip auto-preview in edit mode — number is already assigned
    if (isEditMode) return;

    let isActive = true;

    const loadReceiptNumber = async () => {
      const finalCategory =
        category === 'Lainnya' ? categoryCustom || '' : category;

      if (!finalCategory) {
        form.setValue('receiptNumber', '');
        return;
      }

      const categoryKey = normalizeCategory(finalCategory);
      try {
        const previewNumber = await getReceiptNumberWithRetry(categoryKey, 'peek');
        if (!isActive) return;
        form.setValue('receiptNumber', previewNumber, { shouldValidate: true });
      } catch (error) {
        console.warn('Failed to preview receipt number:', error);
      }
    };

    loadReceiptNumber();

    return () => {
      isActive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, categoryCustom, isEditMode]);

  const handleDonorSelect = (donor: DonorProfile) => {
    setSelectedDonor(donor);
    setSearchQuery('');
    form.setValue('donorId', donor.id);
    form.setValue('donorName', donor.nama);
    form.setValue('donorAddress', donor.alamat);
    form.setValue('donorPhone', donor.no_telp || '');
  };

  const onSubmit = async (values: SedekahReceiptFormValues) => {
    try {
      setIsGenerating(true);

      const finalCategory =
        category === 'Lainnya' ? values.categoryCustom || 'Lainnya' : category;

      if (!finalCategory) {
        toast.error('Kategori pembayaran diperlukan');
        return;
      }

      const donor = await upsertDonor.mutateAsync({
        nama: values.donorName,
        alamat: values.donorAddress,
        no_telp: values.donorPhone,
      });

      const categoryKey = normalizeCategory(finalCategory);

      if (isEditMode && editData) {
        // ── UPDATE path ─────────────────────────────────────
        await updateReceipt.mutateAsync({
          id: editData.id,
          payload: {
            category: finalCategory,
            category_key: categoryKey,
            donor_id: donor?.id ?? editData.donor_id,
            donor_name: values.donorName,
            donor_address: values.donorAddress,
            donor_phone: values.donorPhone || null,
            amount: values.amount,
            tanggal: values.date,
            notes: values.notes || null,
          },
        });

        toast.success('Bukti sedekah berhasil diperbarui');
        onSuccess?.();
      } else {
        // ── CREATE path ─────────────────────────────────────
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const formattedReceiptNumber = await getReceiptNumberWithRetry(categoryKey, 'next', 3);

        const receiptPayload: Database['public']['Tables']['bukti_sedekah']['Insert'] = {
          receipt_number: formattedReceiptNumber,
          category: finalCategory,
          category_key: categoryKey,
          donor_id: donor?.id ?? null,
          donor_name: values.donorName,
          donor_address: values.donorAddress,
          donor_phone: values.donorPhone || null,
          amount: values.amount,
          tanggal: values.date,
          notes: values.notes || null,
          created_by: user.id,
        };

        const receiptTable = supabase.from('bukti_sedekah') as unknown as {
          insert: (
            values: Database['public']['Tables']['bukti_sedekah']['Insert'],
          ) => Promise<{ error: PostgrestError | null }>;
        };

        const { error: receiptError } = await receiptTable.insert(receiptPayload);

        if (receiptError) {
          if (receiptError.code === '23505') {
            toast.error('Nomor bukti sudah digunakan untuk kategori ini.');
            return;
          }
          throw receiptError;
        }

        form.setValue('receiptNumber', formattedReceiptNumber);

        await downloadSedekahReceipt({
          receiptNumber: formattedReceiptNumber,
          donorName: values.donorName,
          donorAddress: values.donorAddress,
          donorPhone: values.donorPhone,
          category: finalCategory,
          amount: values.amount,
          date: new Date(values.date),
          notes: values.notes,
        });

        toast.success('Bukti sedekah berhasil dibuat dan diunduh');
        form.reset();
        setSelectedDonor(null);
        onSuccess?.();
      }
    } catch (error: Error | unknown) {
      console.error('Error generating receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        isEditMode
          ? 'Gagal memperbarui bukti sedekah: ' + errorMessage
          : 'Gagal membuat bukti sedekah: ' + errorMessage,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="receiptNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Bukti {isEditMode ? '' : '(Otomatis)'}</FormLabel>
                <FormControl>
                <Input placeholder="Otomatis" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold mb-3">Pencarian Donor</h3>

          <div className="relative mb-3">
            <Input
              placeholder="Cari berdasarkan nama atau nomor handphone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />

            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {searchResults.map((donor) => (
                  <button
                    key={donor.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 border-b last:border-b-0"
                    onClick={() => handleDonorSelect(donor)}
                  >
                    <div className="font-medium">{donor.nama}</div>
                    <div className="text-sm text-slate-600">{donor.no_telp}</div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-2 text-sm text-slate-600">
                Tidak ada hasil pencarian. Silakan isi form di bawah.
              </div>
            )}
          </div>

          {selectedDonor && (
            <div className="text-sm text-slate-700 bg-green-50 p-2 rounded mb-3">
              ✓ Donor terpilih: <strong>{selectedDonor.nama}</strong>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Data Donor</h3>

          <FormField
            control={form.control}
            name="donorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Donor *</FormLabel>
                <FormControl>
                  <Input placeholder="Nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="donorAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat *</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Alamat lengkap"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="donorPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Handphone</FormLabel>
                <FormControl>
                  <Input placeholder="08xxxxxxxxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Detail Pembayaran</h3>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori Pembayaran *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEDEKAH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {category === 'Lainnya' && (
            <FormField
              control={form.control}
              name="categoryCustom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spesifikasi Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="Ketik kategori kustom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah (Rp) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {amount > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-slate-600">Jumlah:</div>
              <div className="font-bold text-lg">{formattedAmount}</div>
              <div className="text-sm text-slate-600 mt-2">Terbilang:</div>
              <div className="font-semibold text-slate-800">{terbilangText}</div>
            </div>
          )}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan (Opsional)</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Catatan tambahan jika ada"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isGenerating} className="flex-1">
            {isGenerating
              ? isEditMode ? 'Menyimpan...' : 'Membuat Bukti...'
              : isEditMode ? 'Simpan Perubahan' : 'Buat dan Unduh Bukti'}
          </Button>

          {isEditMode && onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
            >
              Batal
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isGenerating}
            >
              Reset
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
