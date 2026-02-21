/**
 * Bulk Pembayaran Transaksi — Data Contract
 *
 * Locked in Wave 0. Do not change without PM approval and agent re-sync.
 */

/**
 * One row in the bulk input table.
 * Each field represents beras (kg) or uang (Rp) for a given zakat/infak category.
 * null = not filled / not applicable for this muzakki.
 */
export interface BulkRow {
  /** Existing muzakki ID from the `muzakki` table. null if newly created inline. */
  muzakkiId: string | null;
  /** Display name — always required, used as label when muzakkiId is null mid-creation. */
  muzakkiNama: string;

  // Zakat Fitrah
  zakatFitrahBeras: number | null;
  zakatFitrahUang: number | null;

  // Zakat Maal
  zakatMaalBeras: number | null;
  zakatMaalUang: number | null;

  // Infak / Sedekah
  infakBeras: number | null;
  infakUang: number | null;
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
  /**
   * Human-readable error messages for any rows that failed.
   * Empty array when success === true.
   */
  errors: string[];
}
