// Separate from vite.config.js on purpose: the app config starts the dev middleware and the
// skill-shard generator, neither of which a unit test run needs.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,mjs}'],
  },
});
