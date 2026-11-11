import { defineConfig } from '@playwright/test';
import { localStatus } from './tests/local-supabase.mjs';

const status = localStatus();
export default defineConfig({
  testDir: './tests/browser', testMatch: '**/*.spec.mjs', workers: 1, timeout: 180000,
  reporter: 'list', use: { baseURL: 'http://127.0.0.1:5174', channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'), headless: true, actionTimeout: 15000, trace: 'off', screenshot: 'off', video: 'off' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174/login', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: status.API_URL, VITE_SUPABASE_ANON_KEY: status.ANON_KEY, VITE_OFFLINE_MODE: 'false' } },
});
