import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './test/setup.js',
    include: ['test/**/*.test.ts', 'test/**/*.test.js'],
    server: { deps: { inline: ['node:sqlite', 'node:crypto', 'node:path', 'node:fs', 'node:url'] } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.js', 'api/**/*.js', 'api/**/*.ts'],
      exclude: ['api/app.js'],
    },
  },
});
