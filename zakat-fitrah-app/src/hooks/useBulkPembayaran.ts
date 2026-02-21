import { supabase } from '@/lib/supabase';
import {
  createHakAmilSnapshot,
  fetchBasisModeForTahun,
  mapKategoriToHakAmil,
} from '@/lib/hakAmilSnapshot';
import type { BulkRow, BulkSubmissionMeta, BulkResult } from '@/types/bulk';
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
  jumlah: number;
}

// ─── Row-to-entry mapping ─────────────────────────────────────────────────────

function getUangEntries(row: BulkRow): UangEntry[] {
  const entries: UangEntry[] = [];
  if (row.zakatFitrahUang && row.zakatFitrahUang > 0)
    entries.push({ kategori: 'zakat_fitrah_uang', jumlah: row.zakatFitrahUang });
  if (row.zakatMaalUang && row.zakatMaalUang > 0)
    entries.push({ kategori: 'maal_penghasilan_uang', jumlah: row.zakatMaalUang });
  if (row.infakUang && row.infakUang > 0)
    entries.push({ kategori: 'infak_sedekah_uang', jumlah: row.infakUang });
  return entries;
}

function getBerasEntries(row: BulkRow): BerasEntry[] {
  const entries: BerasEntry[] = [];
  if (row.zakatFitrahBeras && row.zakatFitrahBeras > 0)
    entries.push({ kategori: 'zakat_fitrah_beras', jumlah: row.zakatFitrahBeras });
  if (row.zakatMaalBeras && row.zakatMaalBeras > 0)
    entries.push({ kategori: 'maal_beras', jumlah: row.zakatMaalBeras });
  if (row.infakBeras && row.infakBeras > 0)
    entries.push({ kategori: 'infak_sedekah_beras', jumlah: row.infakBeras });
  return entries;
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

  // Fetch basis mode once for the whole batch (same tahun_zakat for all rows)
  const basisMode = await fetchBasisModeForTahun(meta.tahunZakatId);
  const catatanRef = `Bulk #${meta.receiptNo}`;

  for (const row of rows) {
    if (!row.muzakkiId) {
      errors.push(
        `Muzakki "${row.muzakkiNama}" belum memiliki ID — baris dilewati.`
      );
      continue;
    }

    const uangEntries = getUangEntries(row);
    const berasEntries = getBerasEntries(row);

    if (uangEntries.length === 0 && berasEntries.length === 0) {
      errors.push(
        `Muzakki "${row.muzakkiNama}" tidak memiliki transaksi — baris dilewati.`
      );
      continue;
    }

    // ── Insert pemasukan_uang rows ──────────────────────────────────────────
    for (const entry of uangEntries) {
      try {
        const payload = {
          tahun_zakat_id: meta.tahunZakatId,
          muzakki_id: row.muzakkiId,
          kategori: entry.kategori,
          akun: 'kas' as const,
          jumlah_uang_rp: entry.jumlah,
          tanggal: today,
          catatan: catatanRef,
          created_by: userId,
          updated_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('pemasukan_uang').insert as any)(
          payload
        )
          .select('id')
          .single();

        if (error) throw error;

        // Hak amil snapshot (non-blocking)
        const hakAmilKategori = mapKategoriToHakAmil(entry.kategori);
        if (hakAmilKategori && data?.id) {
          await createHakAmilSnapshot({
            tahunZakatId: meta.tahunZakatId,
            kategori: hakAmilKategori,
            tanggal: today,
            grossAmount: entry.jumlah,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_uang',
            sourceId: data.id,
            catatan: catatanRef,
            createdBy: userId,
          });
        }
      } catch (err) {
        errors.push(
          `Muzakki "${row.muzakkiNama}" — ${entry.kategori}: ${(err as Error).message}`
        );
      }
    }

    // ── Insert pemasukan_beras rows ─────────────────────────────────────────
    for (const entry of berasEntries) {
      try {
        const payload = {
          tahun_zakat_id: meta.tahunZakatId,
          muzakki_id: row.muzakkiId,
          kategori: entry.kategori,
          jumlah_beras_kg: entry.jumlah,
          tanggal: today,
          catatan: catatanRef,
          created_by: userId,
          updated_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('pemasukan_beras').insert as any)(
          payload
        )
          .select('id')
          .single();

        if (error) throw error;

        const hakAmilKategori = mapKategoriToHakAmil(entry.kategori);
        if (hakAmilKategori && data?.id) {
          await createHakAmilSnapshot({
            tahunZakatId: meta.tahunZakatId,
            kategori: hakAmilKategori,
            tanggal: today,
            grossAmount: entry.jumlah,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_beras',
            sourceId: data.id,
            catatan: catatanRef,
            createdBy: userId,
          });
        }
      } catch (err) {
        errors.push(
          `Muzakki "${row.muzakkiNama}" — ${entry.kategori}: ${(err as Error).message}`
        );
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
    errors,
  };
}
