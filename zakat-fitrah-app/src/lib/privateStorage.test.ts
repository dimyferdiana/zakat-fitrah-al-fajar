import { describe, expect, it } from 'vitest';
import { privateStoragePath } from './privateStorage';

describe('private programme files', () => {
  it('retains legacy object references while discarding public URLs and query tokens', () => {
    expect(privateStoragePath('https://old.supabase.co/storage/v1/object/public/qurban-photos/a/foto%20sapi.jpg', 'qurban-photos')).toBe('a/foto sapi.jpg');
    expect(privateStoragePath('https://old.supabase.co/storage/v1/object/sign/qurban-photos/a.jpg?token=secret', 'qurban-photos')).toBe('a.jpg');
    expect(privateStoragePath('storage://qurban-photos/a/new.jpg', 'qurban-photos')).toBe('a/new.jpg');
  });
  it('rejects another bucket, traversal and unrecognized remote images', () => {
    expect(privateStoragePath('storage://qurban-photos/../secret', 'qurban-photos')).toBeNull();
    expect(privateStoragePath('https://example.test/image.jpg', 'qurban-photos')).toBeNull();
    expect(privateStoragePath('https://old.supabase.co/storage/v1/object/public/other/image.jpg', 'qurban-photos')).toBeNull();
  });
});
