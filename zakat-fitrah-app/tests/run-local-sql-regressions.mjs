// Execute the existing transaction fixtures through CLI's single-statement API.
import { readFileSync } from 'node:fs';
import { localSql } from './local-supabase.mjs';

function statements(sql) {
  const result = []; let start = 0, dollar = null, quote = null, line = false, block = false;
  for (let i = 0; i < sql.length; i++) {
    if (line) { if (sql[i] === '\n') line = false; continue; }
    if (block) { if (sql.startsWith('*/',i)) { block = false; i++; } continue; }
    if (dollar) { if (sql.startsWith(dollar,i)) { i += dollar.length-1; dollar = null; } continue; }
    if (quote) { if (sql[i] === quote) { if (sql[i+1] === quote) i++; else quote = null; } continue; }
    if (sql.startsWith('--',i)) { line = true; i++; continue; }
    if (sql.startsWith('/*',i)) { block = true; i++; continue; }
    if (sql[i] === "'" || sql[i] === '"') { quote = sql[i]; continue; }
    if (sql[i] === '$') { const tag = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/)?.[0]; if (tag) { dollar=tag; i+=tag.length-1; continue; } }
    if (sql[i] === ';') { result.push(sql.slice(start,i+1)); start=i+1; }
  }
  return result;
}
const files = ['customer-account-identity-local.sql','loan-auth-cli-local.sql','loan-account-recovery-local.sql',
  'loan-customer-projection-local.sql','loan-viewer-access-local.sql','loan-legacy-guard-local.sql',
  'people-foundation-local.sql','loan-contract-local.sql','loan-claim-queue-local.sql','loan-policy-local.sql',
  'loan-draft-schedule-local.sql','loan-audit-local.sql','loan-migration-payment-guard-local.sql','task9-acceptance-local.sql'];
for (const file of files) {
  const commands = statements(readFileSync(`tests/${file}`,'utf8')).filter(s => !/^\s*(BEGIN|ROLLBACK)\s*;\s*$/i.test(s.replace(/^\s*--.*$/gm,'')));
  const execute = commands.map((command,i) => `EXECUTE $command_${i}$${command}$command_${i}$;`).join('\n');
  localSql(`DO $outer$ BEGIN BEGIN ${execute} RAISE SQLSTATE 'P9002' USING MESSAGE='rollback test fixture'; EXCEPTION WHEN SQLSTATE 'P9002' THEN NULL; END; END $outer$;`);
  console.log(`PASS: ${file}`);
}
