import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  test: {
    include: ['**/*.test.ts'],
    // .claude/ môže obsahovať zabudnuté worktree kópie repa — ich testy by sa
    // inak počítali (a padali) dvakrát.
    exclude: ['**/node_modules/**', '.claude/**'],
  },
});
