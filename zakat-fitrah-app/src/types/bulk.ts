/**
 * Bulk Pembayaran Transaksi — Data Contract
 *
 * Locked in Wave 0. Do not change without PM approval and agent re-sync.
 */

export type BulkTransactionType = 'zakat_fitrah' | 'maal' | 'infak' | 'fidyah';

export type BulkPaymentMedium = 'uang' | 'beras_kg' | 'beras_liter';

export type BulkUnit = 'rp' | 'kg' | 'liter';

export const BULK_BERAS_KG_PER_LITER = 0.8;

/**
 * One row in the bulk input table.
 * Each row represents exactly one transaction for one muzakki.
 */
export interface BulkRow {
  /** Existing muzakki ID from the `muzakki` table. null if newly created inline. */
  muzakkiId: string | null;
  /** Display name — always required, used as label when muzakkiId is null mid-creation. */
  muzakkiNama: string;

  /** Tipe transaksi: zakat fitrah, maal, infak, atau fidyah. */
  transactionType: BulkTransactionType | null;
  /** Media pembayaran: uang, beras kg, atau beras liter. */
  paymentMedium: BulkPaymentMedium | null;
  /** Nominal/kuantitas sesuai media yang dipilih. */
  amount: number | null;
  /** Satuan yang mengikuti media pembayaran. */
  unit: BulkUnit | null;
  /** Catatan per transaksi (opsional). */
  notes: string;
  /** Rekening sumber untuk transaksi uang (opsional untuk transaksi beras). */
  accountId?: string | null;
  /** Nama rekening untuk kebutuhan receipt. */
  accountName?: string | null;
  /** Channel rekening untuk kebutuhan receipt. */
  accountChannel?: 'kas' | 'bank' | 'qris' | null;
}

/**
 * Metadata passed to submitBulk() alongside the rows.
 */
export interface BulkSubmissionMeta {
  /** UUID of the logged-in user performing the submission. */
  operatorId: string;
  /** Active tahun_zakat.id for this submission. */
  tahunZakatId: string;
  /**
   * Document-level receipt number shared by all rows in this submission.
   * Format follows existing receipt numbering convention.
   */
  receiptNo: string;
  /** Max rows allowed per receipt (admin-configurable; default 10). */
  rowLimit: number;
  /** Rekening uang yang dipakai untuk seluruh transaksi uang dalam satu batch. */
  moneyAccountId?: string;
  moneyAccountName?: string;
  moneyAccountChannel?: 'kas' | 'bank' | 'qris';
}

/**
 * Return value from submitBulk().
 */
export interface BulkResult {
  /** true if all rows were persisted without error. */
  success: boolean;
  /** The receipt number for this submission (matches BulkSubmissionMeta.receiptNo). */
  receiptNo: string;
  /** The rows that were attempted (for receipt rendering). */
  rows: BulkRow[];
  /** Rekap hasil proses per baris transaksi. */
  rowOutcomes: BulkRowOutcome[];
  /**
   * Human-readable error messages for any rows that failed.
   * Empty array when success === true.
   */
  errors: string[];
}

export interface BulkRowOutcome {
  rowIndex: number;
  muzakkiNama: string;
  success: boolean;
  message: string;
}
