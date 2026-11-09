import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.mjs', fullyParallel: false, workers: 1,
  reporter: 'list', timeout: 20000, use: { trace: 'retain-on-failure' }
});
