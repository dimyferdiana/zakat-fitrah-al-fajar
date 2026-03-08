import { supabase } from '@/lib/supabase';
import {
  createHakAmilSnapshot,
  fetchBasisModeForTahun,
  mapKategoriToHakAmil,
} from '@/lib/hakAmilSnapshot';
import { validateBulkRow } from '@/lib/bulkValidation';
import { BULK_BERAS_KG_PER_LITER } from '@/types/bulk';
import type {
  BulkRow,
  BulkSubmissionMeta,
  BulkResult,
  BulkTransactionType,
} from '@/types/bulk';
import { format } from 'date-fns';

// ─── Internal type helpers ────────────────────────────────────────────────────

type UangKategori =
  | 'zakat_fitrah_uang'
  | 'fidyah_uang'
  | 'maal_penghasilan_uang'
  | 'infak_sedekah_uang';

type BerasKategori =
  | 'fidyah_beras'
  | 'infak_sedekah_beras'
  | 'zakat_fitrah_beras'
  | 'maal_beras';

interface UangEntry {
  kategori: UangKategori;
  jumlah: number;
}

interface BerasEntry {
  kategori: BerasKategori;
  jumlahKg: number;
}

// ─── Row-to-entry mapping ─────────────────────────────────────────────────────

function mapUangKategori(type: BulkTransactionType): UangKategori {
  if (type === 'zakat_fitrah') return 'zakat_fitrah_uang';
  if (type === 'maal') return 'maal_penghasilan_uang';
  if (type === 'infak') return 'infak_sedekah_uang';
  return 'fidyah_uang';
}

function mapBerasKategori(type: BulkTransactionType): BerasKategori {
  if (type === 'zakat_fitrah') return 'zakat_fitrah_beras';
  return 'infak_sedekah_beras';
}

function buildRowCatatan(catatanRef: string, row: BulkRow): string {
  const notes = row.notes.trim();
  const parts = [catatanRef];

  if (row.paymentMedium === 'beras_liter') {
    parts.push('media:beras_liter');
  }
  if (notes.length > 0) {
    parts.push(notes);
  }

  return parts.join(' | ');
}

function mapRowToEntries(
  row: BulkRow
): { uangEntry: UangEntry | null; berasEntry: BerasEntry | null; error: string | null } {
  const validation = validateBulkRow({ ...row, muzakkiId: row.muzakkiId ?? '' });
  if (!validation.ok) {
    return {
      uangEntry: null,
      berasEntry: null,
      error: validation.message,
    };
  }

  const transactionType = row.transactionType;
  const paymentMedium = row.paymentMedium;
  const amount = row.amount;
  if (!transactionType || !paymentMedium || amount === null) {
    return {
      uangEntry: null,
      berasEntry: null,
      error: 'Baris bulk belum lengkap.',
    };
  }

  if (paymentMedium === 'uang') {
    return {
      uangEntry: { kategori: mapUangKategori(transactionType), jumlah: amount },
      berasEntry: null,
      error: null,
    };
  }

  if (transactionType === 'maal' || transactionType === 'fidyah') {
    return {
      uangEntry: null,
      berasEntry: null,
      error: 'Maal/Fidyah tidak dapat menggunakan media beras.',
    };
  }

  const jumlahKg =
    paymentMedium === 'beras_liter'
      ? Number((amount * BULK_BERAS_KG_PER_LITER).toFixed(2))
      : amount;

  return {
    uangEntry: null,
    berasEntry: { kategori: mapBerasKategori(transactionType), jumlahKg },
    error: null,
  };
}

// ─── Core submit function (plain async, no React dependency) ─────────────────

/**
 * Submit a bulk transaction: inserts individual pemasukan rows per muzakki
 * and triggers hak amil auto-split for each. Logs the submission to
 * bulk_submission_logs on completion.
 *
 * @returns BulkResult — success:true only if all rows persisted without error.
 *          Partial saves are kept; errors are listed per-row.
 */
export async function submitBulk(
  rows: BulkRow[],
  meta: BulkSubmissionMeta
): Promise<BulkResult> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    throw new Error('User tidak terautentikasi');
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const errors: string[] = [];
  const rowOutcomes: BulkResult['rowOutcomes'] = [];

  // Fetch basis mode once for the whole batch (same tahun_zakat for all rows)
  const basisMode = await fetchBasisModeForTahun(meta.tahunZakatId);
  const catatanRef = `Bulk #${meta.receiptNo}`;

  const hasMoneyRows = rows.some((row) => row.paymentMedium === 'uang' && (row.amount ?? 0) > 0);
  if (hasMoneyRows && (!meta.moneyAccountId || !meta.moneyAccountChannel)) {
    throw new Error('Transaksi uang bulk wajib memilih rekening kas/bank yang valid.');
  }

  for (const [rowIndex, row] of rows.entries()) {
    if (!row.muzakkiId) {
      const message = `Muzakki "${row.muzakkiNama}" belum memiliki ID — baris dilewati.`;
      errors.push(message);
      rowOutcomes.push({ rowIndex, muzakkiNama: row.muzakkiNama, success: false, message });
      continue;
    }

    const { uangEntry, berasEntry, error } = mapRowToEntries(row);
    if (error) {
      const message = `Baris #${rowIndex + 1} (${row.muzakkiNama}): ${error}`;
      errors.push(message);
      rowOutcomes.push({ rowIndex, muzakkiNama: row.muzakkiNama, success: false, message });
      continue;
    }

    const rowCatatan = buildRowCatatan(catatanRef, row);

    if (uangEntry) {
      try {
        const akunForInsert: 'kas' | 'bank' =
          meta.moneyAccountChannel === 'kas' ? 'kas' : 'bank';

        const payload = {
          tahun_zakat_id: meta.tahunZakatId,
          muzakki_id: row.muzakkiId,
          kategori: uangEntry.kategori,
          akun: akunForInsert,
          account_id: meta.moneyAccountId,
          jumlah_uang_rp: uangEntry.jumlah,
          tanggal: today,
          catatan: rowCatatan,
          created_by: userId,
          updated_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: insertError } = await (supabase.from('pemasukan_uang').insert as any)(
          payload
        )
          .select('id')
          .single();

        if (insertError) throw insertError;

        const hakAmilKategori = mapKategoriToHakAmil(uangEntry.kategori);
        if (hakAmilKategori && data?.id) {
          await createHakAmilSnapshot({
            tahunZakatId: meta.tahunZakatId,
            kategori: hakAmilKategori,
            tanggal: today,
            grossAmount: uangEntry.jumlah,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_uang',
            sourceId: data.id,
            catatan: rowCatatan,
            createdBy: userId,
          });
        }

        rowOutcomes.push({
          rowIndex,
          muzakkiNama: row.muzakkiNama,
          success: true,
          message: `Baris #${rowIndex + 1} berhasil disimpan (${uangEntry.kategori}).`,
        });
      } catch (err) {
        const message = `Baris #${rowIndex + 1} (${row.muzakkiNama}) gagal: ${(err as Error).message}`;
        errors.push(message);
        rowOutcomes.push({ rowIndex, muzakkiNama: row.muzakkiNama, success: false, message });
      }
      continue;
    }

    if (berasEntry) {
      try {
        const payload = {
          tahun_zakat_id: meta.tahunZakatId,
          muzakki_id: row.muzakkiId,
          kategori: berasEntry.kategori,
          jumlah_beras_kg: berasEntry.jumlahKg,
          tanggal: today,
          catatan: rowCatatan,
          created_by: userId,
          updated_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: insertError } = await (supabase.from('pemasukan_beras').insert as any)(
          payload
        )
          .select('id')
          .single();

        if (insertError) throw insertError;

        const hakAmilKategori = mapKategoriToHakAmil(berasEntry.kategori);
        if (hakAmilKategori && data?.id) {
          await createHakAmilSnapshot({
            tahunZakatId: meta.tahunZakatId,
            kategori: hakAmilKategori,
            tanggal: today,
            grossAmount: berasEntry.jumlahKg,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_beras',
            sourceId: data.id,
            catatan: rowCatatan,
            createdBy: userId,
          });
        }

        rowOutcomes.push({
          rowIndex,
          muzakkiNama: row.muzakkiNama,
          success: true,
          message: `Baris #${rowIndex + 1} berhasil disimpan (${berasEntry.kategori}).`,
        });
      } catch (err) {
        const message = `Baris #${rowIndex + 1} (${row.muzakkiNama}) gagal: ${(err as Error).message}`;
        errors.push(message);
        rowOutcomes.push({ rowIndex, muzakkiNama: row.muzakkiNama, success: false, message });
      }
    }
  }

  // ── Log bulk submission (non-blocking) ─────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('bulk_submission_logs').insert as any)({
      operator_id: userId,
      tahun_zakat_id: meta.tahunZakatId,
      receipt_no: meta.receiptNo,
      row_count: rows.length,
    });
  } catch (logErr) {
    console.error('[bulk] Failed to log submission:', logErr);
  }

  return {
    success: errors.length === 0,
    receiptNo: meta.receiptNo,
    rows,
    rowOutcomes,
    errors,
  };
}
