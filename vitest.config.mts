/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // jsdom matches browser/Capacitor WebView behavior; DOMPurify + marked need a full DOM (happy-dom drops ul/blockquote).
    environment: 'jsdom',
    // Forks avoid Vitest worker teardown flakes (onUserConsoleLog) on full-suite CI runs.
    pool: 'forks',
    sequence: { concurrent: false },
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/main.ts',
        'src/test-setup.ts',
        'src/environments/**',
        '**/*.config.{js,ts,mts}',
        '**/dist/**',
      ],
    },
  },
});
