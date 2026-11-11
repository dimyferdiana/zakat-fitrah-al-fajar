import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatReceiptNumber, generateSedekahReceiptPDF } from './sedekahReceipt';

afterEach(() => { vi.restoreAllMocks(); });

describe('bukti sedekah legacy', () => {
  it('keeps the saved donor snapshot and produces a readable PDF without optional images', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pdf = await generateSedekahReceiptPDF({
      receiptNumber:'INF/000123', donorName:'Donor Sintetis Lama', donorAddress:'Alamat Sintetis Lama',
      category:'Infak', amount:250000, date:new Date('2026-01-15T00:00:00Z'),
    });
    const bytes = new Uint8Array(pdf.output('arraybuffer'));
    const content = new TextDecoder('latin1').decode(bytes);
    expect(content.startsWith('%PDF-')).toBe(true);
    expect(content).toContain('Donor Sintetis Lama');
    expect(content).toContain('Alamat Sintetis Lama');
    expect(content).toContain('INF/000123');
    expect(formatReceiptNumber('Infak','123')).toBe('INF/000123');
  });
});
