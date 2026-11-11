import { readFileSync } from 'node:fs';
import { localSql } from './local-supabase.mjs';
localSql(readFileSync('tests/loan-collectibility-local.sql','utf8'));
console.log('PASS: kolektabilitas PostgreSQL lokal, status pembayaran, batas DPD, dan otorisasi (rollback)');
