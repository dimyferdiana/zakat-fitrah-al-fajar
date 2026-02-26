import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/029_accounts_and_account_ledger_rls.sql'
);

function getSql(): string {
  return readFileSync(migrationPath, 'utf-8');
}

describe('accounts and ledger RLS policy regression', () => {
  it('defines all CRUD policies for accounts and account_ledger_entries', () => {
    const sql = getSql();

    const requiredPolicies = [
      'accounts_select_admin_bendahara_petugas_active',
      'accounts_insert_admin_bendahara_active',
      'accounts_update_admin_bendahara_active',
      'accounts_delete_admin_bendahara_active',
      'account_ledger_entries_select_admin_bendahara_petugas_active',
      'account_ledger_entries_insert_admin_bendahara_active',
      'account_ledger_entries_update_admin_bendahara_active',
      'account_ledger_entries_delete_admin_bendahara_active',
    ];

    for (const policy of requiredPolicies) {
      expect(sql).toContain(`CREATE POLICY "${policy}"`);
    }
  });

  it('keeps read role for petugas and write roles limited to admin/bendahara', () => {
    const sql = getSql();

    expect(sql).toContain("IN ('admin', 'bendahara', 'petugas')");

    const writeRoleMatchCount = (sql.match(/IN \('admin', 'bendahara'\)/g) || []).length;
    expect(writeRoleMatchCount).toBeGreaterThanOrEqual(6);
  });
});
