import { z } from 'zod';
import type { BulkPaymentMedium, BulkRow, BulkTransactionType } from '@/types/bulk';

export const bulkTransactionTypeSchema = z.enum(['zakat_fitrah', 'maal', 'infak', 'fidyah']);
export const bulkPaymentMediumSchema = z.enum(['uang', 'beras_kg', 'beras_liter']);
export const bulkUnitSchema = z.enum(['rp', 'kg', 'liter']);

export const bulkRowSchema = z.object({
  muzakkiId: z.string().min(1, 'Muzakki wajib dipilih.'),
  muzakkiNama: z.string().min(1, 'Nama muzakki wajib ada.'),
  transactionType: bulkTransactionTypeSchema,
  paymentMedium: bulkPaymentMediumSchema,
  amount: z.number().positive('Nilai harus lebih dari 0.'),
  unit: bulkUnitSchema,
  notes: z.string().max(255, 'Catatan maksimal 255 karakter.').optional().default(''),
});

export function allowedMediaForType(type: BulkTransactionType): BulkPaymentMedium[] {
  if (type === 'maal' || type === 'fidyah') return ['uang'];
  return ['uang', 'beras_kg', 'beras_liter'];
}

export function unitForMedium(medium: BulkPaymentMedium) {
  if (medium === 'uang') return 'rp' as const;
  if (medium === 'beras_kg') return 'kg' as const;
  return 'liter' as const;
}

export function validateBulkBusinessRules(row: BulkRow | z.infer<typeof bulkRowSchema>) {
  if (!row.transactionType || !row.paymentMedium || !row.unit || row.amount === null) {
    return {
      ok: false as const,
      message: 'Baris bulk belum lengkap.',
    };
  }

  const allowedMedia = allowedMediaForType(row.transactionType);
  if (!allowedMedia.includes(row.paymentMedium)) {
    return {
      ok: false as const,
      message:
        row.transactionType === 'maal' || row.transactionType === 'fidyah'
          ? 'Maal/Fidyah hanya dapat dibayar dengan uang (Rp).'
          : 'Media pembayaran tidak valid untuk tipe transaksi ini.',
    };
  }

  const expectedUnit = unitForMedium(row.paymentMedium);
  if (row.unit !== expectedUnit) {
    return {
      ok: false as const,
      message: 'Satuan tidak sesuai dengan media pembayaran yang dipilih.',
    };
  }

  return { ok: true as const, message: null };
}

export function validateBulkRow(row: BulkRow) {
  const parsed = bulkRowSchema.safeParse(row);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? 'Data baris bulk tidak valid.',
    };
  }

  return validateBulkBusinessRules(parsed.data);
}
