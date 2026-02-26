import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8');
}

describe('transaction account linkage regression', () => {
  it('persists account_id for pemasukan uang inserts and updates', () => {
    const source = read('src/hooks/usePemasukanUang.ts');

    expect(source).toContain('account_id: input.account_id');
    expect(source).toContain('account_id: updateData.account_id');
  });

  it('persists account_id for pemasukan beras inserts and updates', () => {
    const source = read('src/hooks/usePemasukanBeras.ts');

    expect(source).toContain('const accountId = await resolveKASAccountId();');
    expect(source).toContain('account_id: accountId');
  });

  it('persists account_id for rekonsiliasi inserts', () => {
    const source = read('src/hooks/useRekonsiliasi.ts');

    expect(source).toContain('const accountId = await resolveRekonsiliasiAccountId(input.jenis, input.akun);');
    expect(source).toContain('account_id: accountId');
  });
});
