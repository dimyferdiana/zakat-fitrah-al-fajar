import { expect, it, vi } from 'vitest'
import { generateQurbanShareReceiptPDF, type QurbanShareReceiptData } from './qurbanReceipt'

it('preserves participant and animal details even when images are unavailable', () => {
  const now = '2026-06-01T00:00:00Z'
  const data: QurbanShareReceiptData = {
    event: { id: 'event', nama: 'Qurban Sintetis', tanggal: '2026-06-01', catatan: null, created_by: null, created_at: now, updated_at: now },
    animal: { id: 'animal', event_id: 'event', jenis: 'sapi', sumber_hewan: 'beli', nomor: 'SAP-001', berat_kg: null, harga: 7000000, biaya_perawatan: null, foto_url: null, catatan: null, created_by: null, created_at: now, updated_at: now },
    share: { id: 'share', animal_id: 'animal', muzakki_id: 'person', urutan: 1, nominal: 1000000, status_pembayaran: 'lunas', catatan: null, created_by: null, created_at: now, updated_at: now, muzakki: { id: 'person', nama_kk: 'Peserta Sintetis', no_telp: null } },
  }

  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    const pdf = generateQurbanShareReceiptPDF(data).output()
    expect(pdf.startsWith('%PDF-')).toBe(true)
    expect(pdf).toContain('Qurban Sintetis')
    expect(pdf).toContain('SAP-001')
    expect(pdf).toContain('Peserta Sintetis')
    expect(warnings).toHaveBeenCalled()
  } finally {
    warnings.mockRestore()
  }
})
