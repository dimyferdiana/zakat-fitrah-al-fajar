import { describe, expect, it } from 'vitest';
import { PAYMENT_PROOF_MAX_SIZE_BYTES, validatePaymentProofFile } from './paymentProof';

describe('validatePaymentProofFile', () => {
  it('accepts valid jpg/png/webp under 1 MB', () => {
    const jpg = new File([new Uint8Array([1, 2, 3])], 'ok.jpg', { type: 'image/jpeg' });
    const png = new File([new Uint8Array([1, 2, 3])], 'ok.png', { type: 'image/png' });
    const webp = new File([new Uint8Array([1, 2, 3])], 'ok.webp', { type: 'image/webp' });

    expect(validatePaymentProofFile(jpg)).toBeNull();
    expect(validatePaymentProofFile(png)).toBeNull();
    expect(validatePaymentProofFile(webp)).toBeNull();
  });

  it('rejects unsupported type with clear message', () => {
    const pdf = new File([new Uint8Array([1, 2, 3])], 'invalid.pdf', { type: 'application/pdf' });
    expect(validatePaymentProofFile(pdf)).toContain('JPG, PNG, atau WEBP');
  });

  it('rejects file size greater than 1 MB', () => {
    const tooLarge = new File([
      new Uint8Array(PAYMENT_PROOF_MAX_SIZE_BYTES + 1),
    ], 'large.jpg', { type: 'image/jpeg' });

    expect(validatePaymentProofFile(tooLarge)).toContain('maksimal 1 MB');
  });
});
