import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'threads',
    env: {
      // Fake values so modules that validate env vars at import time don't throw
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      SESSION_SECRET: 'test-secret-for-vitest',
      ODDS_API_KEY: 'test-key',
      RAPIDAPI_KEY: 'test-key',
      OPENAI_API_KEY: 'test-key',
      TANK01_API_KEY: 'test-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['server/**/*.ts'],
      exclude: ['server/vite.ts', 'server/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
});
